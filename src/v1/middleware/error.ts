import { createMiddleware } from "hono/factory";

const errorHandler = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error(error);
    return c.json({ error: `There was an internal server error` }, 500);
  }
});

export default errorHandler;
