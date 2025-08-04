import { Hono } from "hono";
import { Session } from "hono-sessions";
import ky from "ky";
import { env } from "../../env";
import { prisma } from "../../lib/prisma";

type SessionDataTypes = {
  oauthState: string;
  userId: string;
};

const router = new Hono<{
  Variables: {
    session: Session<SessionDataTypes>;
    session_key_rotation: boolean;
  };
}>();

const DISCORD_BASE_URL = "https://discord.com";
const discordKy = ky.create({ prefixUrl: `${DISCORD_BASE_URL}/api` });
const scopes = "identify+guilds.join+email";

router.get("/", (c) => {
  const session = c.get("session");
  const randomState = crypto.randomUUID();
  session.set("oauthState", randomState);

  const discordUrl = `${DISCORD_BASE_URL}/oauth2/authorize?client_id=${
    env.AUTH_CLIENT_ID
  }&response_type=code&state=${randomState}&redirect_uri=${encodeURIComponent(
    env.AUTH_REDIRECT_URI
  )}&scope=${scopes}`;
  return c.redirect(discordUrl);
});

router.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code || !state) {
    return c.json({ error: `Unauthorized` }, 401);
  }

  const session = c.get("session");
  const storedState = session.get("oauthState");

  if (storedState !== state) {
    return c.json({ error: `Unauthorized` }, 401);
  }

  session.forget("oauthState");

  try {
    const { access_token, token_type } = await discordKy
      .post(`oauth2/token`, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: env.AUTH_CLIENT_ID,
          client_secret: env.AUTH_CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code.toString(),
          redirect_uri: env.AUTH_REDIRECT_URI,
        }),
      })
      .json<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        scope: string;
      }>();

    const discordUser = await discordKy
      .get(`users/@me`, {
        headers: {
          Authorization: `${token_type} ${access_token}`,
        },
      })
      .json<{
        avatar?: string;
        username: string;
        email?: string;
        id: string;
      }>();

    const user = await prisma.user.upsert({
      where: { discordId: discordUser.id },
      create: {
        discordId: discordUser.id,
        email: discordUser.email,
        username: discordUser.username,
        avatar: discordUser.avatar,
      },
      update: {
        email: discordUser.email,
        username: discordUser.username,
        avatar: discordUser.avatar,
      },
    });

    session.set("userId", user.id);
    
    return c.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error(error);
    return c.json({ error: `There was an internal server error` }, 500);
  }
});

export default router;
