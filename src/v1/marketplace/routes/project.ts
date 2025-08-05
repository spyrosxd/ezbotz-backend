import { env } from "@/env";
import { Prisma } from "@/generated/v1/prisma";
import config from "@/v1/config";
import getUserId from "@/v1/lib/getUserId";
import { prisma } from "@/v1/lib/prisma";
import { createProjectSchema } from "@/v1/schemas/project";
import { Hono } from "hono";
import { encrypt, Session } from "hono-sessions";
import ky, { HTTPError } from "ky";

type SessionDataTypes = {
  userId: string;
};

const router = new Hono<{
  Variables: {
    session: Session<SessionDataTypes>;
    session_key_rotation: boolean;
  };
}>();

router.post("/", async (c) => {
  try {
    const userId = getUserId(c);

    const body = await c.req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid Token" }, 400);
    }

    const { token } = parsed.data;

    const discordResponse = await ky.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    const id = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: { coins: { decrement: config.projectCreationCost } },
        });

        if (user.coins < 0) {
          throw new Error("User doesnt have enough coins");
        }

        await tx.transaction.create({
          data: {
            amount: config.projectCreationCost,
            reason: "created project",
            type: "SPEND",
            userId: user.id,
          },
        });

        const {
          username,
          id: discordId,
          avatar,
        } = await discordResponse.json<{
          id: string;
          username: string;
          avatar?: string;
        }>();

        // We encrypt the token for safety!!
        const encryptedToken = await encrypt(env.TOKEN_ENCRYPTION_KEY, token);

        const project = await tx.project.create({
          data: {
            discordId,
            token: encryptedToken,
            username,
            avatar,
            userId,
          },
        });

        return project.id;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      }
    );

    return c.json(id, 201);
  } catch (error: any) {
    if (
      error instanceof HTTPError &&
      error.response.url === "https://discord.com/api/users/@me" &&
      error.response.status === 401
    ) {
      return c.json({ error: "Invalid Token" }, 400);
    }

    if (error.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
      if (error.code === "P2002") {
        return c.json(
          { error: "There is already a project with this token created" },
          400
        );
      }
    }

    if (
      error instanceof Error &&
      error.message === "User doesnt have enough coins"
    ) {
      return c.json({ error: "Not enough coins" }, 400);
    }
    console.error(error);
    return c.json({ error: "Failed to create project" }, 500);
  }
});

router
  .get("/:id", async (c) => {
    const projectId = c.req.param("id");
    const userId = getUserId(c);

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId, userId },
        omit: { token: true, updatedAt: true },
      });

      if (!project) {
        return c.json({ error: "Project not found" }, 404);
      }

      return c.json(project, 200);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to get project" }, 500);
    }
  })
  .delete(async (c) => {
    const projectId = c.req.param("id");
    const userId = getUserId(c);

    try {
      const amountToReturn = config.projectCreationCost / 2;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { coins: { increment: amountToReturn } },
        }),
        prisma.project.delete({ where: { id: projectId, userId } }),
        prisma.transaction.create({
          data: {
            amount: amountToReturn,
            reason: "deleted project",
            type: "EARN",
            userId: userId,
          },
        }),
      ]);
      return c.json({ success: true }, 200);
    } catch (error: any) {
      if (
        error.constructor.name === Prisma.PrismaClientKnownRequestError.name &&
        error.code === "P2025"
      ) {
        return c.json({ error: "Project not found" }, 404);
      }

      console.error(error);
      return c.json({ error: "Failed to delete project" }, 500);
    }
  });

export default router;
