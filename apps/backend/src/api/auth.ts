import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { z } from "zod";

export const authApp = new Hono();

authApp.get("/users", async (c) => {
  const db = getDB();
  const users = await db.user.findMany();
  return c.json(
    { users: users as typeof users, hc: "this is actually useless" },
    201
  );
});

authApp.post(
  "/posts",
  zValidator(
    "form",
    z.object({
      title: z.string(),
      body: z.string(),
    })
  ),
  (c) => {
    // ...
    return c.json(
      {
        ok: true,
        message: "Created!",
      },
      201
    );
  }
);
// To run this app, create an entry file (e.g., server.ts) that imports and starts the server.
