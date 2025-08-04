import { Hono } from "hono";
import userRouter from "./routes/user";
import requiresAuth from "../middleware/auth";

const router = new Hono();
router.use("*", requiresAuth);
router.route("/users", userRouter);

export default router;
