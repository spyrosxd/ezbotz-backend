import { Context } from "hono";
import { assertIsDefined } from "./assertIsDefined";

// Use this only in v1 routes!!
export default function getUserId(c: Context) {
  const session = c.get("session");
  if (!session) {
    throw Error("You forgot to wrap session middleware?")
  }
  const userId = session.get("userId") as string;
  assertIsDefined(userId);

  return userId;
}
