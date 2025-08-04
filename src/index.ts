import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { env } from "./env";
import v1Router from "./v1";

const app = new Hono().use(csrf({ origin: `${env.FRONTEND_URL}` })).use(
  cors({
    origin: `${env.FRONTEND_URL}`,
    credentials: true,
  })
);

// V1 API
app.route("/v1", v1Router);

export default {
  fetch: app.fetch,
  port: env.PORT,
};
