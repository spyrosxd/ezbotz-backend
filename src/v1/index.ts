import { BunRedisStore } from "connect-redis-hono";
import { Hono } from "hono";
import { sessionMiddleware } from "hono-sessions";
import { logger } from "hono/logger";
import { env } from "../env";
import v1Auth from "./auth";
import { redisClient } from "./lib/redis";
import v1Marketplace from "./marketplace";
import errorHandler from "./middleware/error";

const store = new BunRedisStore({
  ttl: 3600,
  client: redisClient,
});

const v1Router = new Hono()
  .use(
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
  )
  .use("*", errorHandler);

env.NODE_ENV === "development" && v1Router.use(logger());

// Routes
v1Router.route("/auth", v1Auth);
v1Router.route("/marketplace", v1Marketplace);

export default v1Router;
