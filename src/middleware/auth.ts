import { createMiddleware } from "hono/factory";

const requiresAuth = createMiddleware(async (c, next) => {
  const session = c.get("session");
  const userId = session.get("userId");

  if (!session || !userId)
    return c.json({ error: "Unauthorized" }, 401);
  await next();
});

export default requiresAuth;
