import { Hono } from "hono";
import { cors } from "hono/cors";
import { getDB } from "./lib/db";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => c.text("Hello from Hono.js + Prisma + CORS! and more..."));

app.get("/users", async (c) => {
  const db = getDB();
  const users = await db.user.findMany();
  return c.json(users);
});

export default app;

// To run this app, create an entry file (e.g., server.ts) that imports and starts the server.
