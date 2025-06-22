import { Hono } from "hono";
import { getDB } from "src/lib/db";

export const appointmentApp = new Hono();

appointmentApp.get("/users", async (c) => {
  const db = getDB();
  const users = await db.user.findMany();
  return c.json(users);
});
// To run this app, create an entry file (e.g., server.ts) that imports and starts the server.
