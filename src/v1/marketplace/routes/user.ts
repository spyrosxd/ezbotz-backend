import getUserId from "@/v1/lib/getUserId";
import { prisma } from "@/v1/lib/prisma";
import { Hono } from "hono";
import { Session } from "hono-sessions";

type SessionDataTypes = {
  userId: string;
};

const router = new Hono<{
  Variables: {
    session: Session<SessionDataTypes>;
    session_key_rotation: boolean;
  };
}>();

router.get("/", async (c) => {
  const userId = getUserId(c);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true, coins: true, email: true, username: true },
    });

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json(user, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

export default router;
