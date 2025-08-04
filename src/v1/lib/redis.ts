import { createClient } from "redis";
import { env } from "@/env";

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error(`Failed to connect to redis`, error);
  }
})();

export { redisClient };
