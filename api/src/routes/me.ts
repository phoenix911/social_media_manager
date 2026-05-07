import { Hono } from "hono";
import type { Env } from "../env.ts";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.json({ user: c.var.user }));

export default app;
