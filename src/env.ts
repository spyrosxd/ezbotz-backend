import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce
    .number()
    .positive()
    .max(65536, `options.port should be >= 0 and < 65536`)
    .default(8787),
  NODE_ENV: z.enum(["development", "test", "production"]),
  FRONTEND_URL: z.url(),
  AUTH_CLIENT_ID: z.string(),
  AUTH_CLIENT_SECRET: z.string(),
  AUTH_REDIRECT_URI: z.string(),
  DATABASE_URL: z.url().min(3),
  SESSION_ENCRYPTION_KEY: z.string().min(32),
  TOKEN_ENCRYPTION_KEY: z.string().min(32),
  REDIS_URL: z.string(),
});

export const env = envSchema.parse(Bun.env);
