import { BunRedisStore } from "connect-redis-hono";
import { Hono } from "hono";
import { sessionMiddleware } from "hono-sessions";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import v1Auth from "./auth/v1/route";
import v1Marketplace from './marketplace/v1/routes';
import { env } from "./env";
import { redisClient } from "./lib/redis";

const store = new BunRedisStore({
  ttl: 3600,
  client: redisClient,
});

const app = new Hono().use(csrf({ origin: `${env.FRONTEND_URL}` })).use(
  cors({
    origin: `${env.FRONTEND_URL}`,
  })
);

app.use(
  "*",
  sessionMiddleware({
    store,
    encryptionKey: env.SESSION_ENCRYPTION_KEY,
    expireAfterSeconds: 900,
    autoExtendExpiration: true,
    cookieOptions: {
      sameSite: "Lax",
      path: "/",
      httpOnly: true,
    },
  })
);

// V1 Routes
app.route("/v1/auth", v1Auth);
app.route("/v1/marketplace", v1Marketplace)

export default {
  fetch: app.fetch,
  port: 5000,
};
