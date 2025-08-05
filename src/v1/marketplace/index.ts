import { Hono } from "hono";
import userRouter from "./routes/user";
import requiresAuth from "../middleware/auth";
import projectRouter from './routes/project';

const router = new Hono();
router.use("*", requiresAuth);
router.route("/users", userRouter);
router.route("/projects", projectRouter)

export default router;
