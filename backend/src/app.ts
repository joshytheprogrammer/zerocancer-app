import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();
const prisma = new PrismaClient();

app.use("*", cors());

app.get("/", (c) => c.text("Hello from Hono.js + Prisma + CORS!"));

app.get("/users", async (c) => {
  const users = await prisma.user.findMany();
  return c.json(users);
});

export default app;

// To run this app, create an entry file (e.g., server.ts) that imports and starts the server.
