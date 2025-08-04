import { Hono } from "hono";
import requiresAuth from "../../../middleware/auth";

const router = new Hono();
router.use("*", requiresAuth);

router.get("/", (c) => {
    return c.text("marktetplace route")
})

export default router;