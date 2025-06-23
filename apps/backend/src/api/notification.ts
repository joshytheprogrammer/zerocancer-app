import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { authMiddleware } from "src/middleware/auth.middleware";

export const notificationApp = new Hono<{ Variables: THonoAppVariables }>();

notificationApp.use(authMiddleware());

// GET /api/notifications - get notifications for current user
notificationApp.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const db = getDB();
  const notifications = await db.notificationRecipient.findMany({
    where: { userId },
    include: { notification: true },
    orderBy: { notification: { createdAt: "desc" } },
    take: 50,
  });
  return c.json({ ok: true, data: notifications });
});

// POST /api/notifications/:id/read - mark notification as read
notificationApp.post("/:id/read", async (c) => {
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const id = c.req.param("id");
  const db = getDB();
  await db.notificationRecipient.updateMany({
    where: { id, userId },
    data: { read: true, readAt: new Date() },
  });
  return c.json({ ok: true });
});

// POST /api/notifications - create notification (admin or system use)
notificationApp.post("/", async (c) => {
  // TODO: Add admin check if needed
  const db = getDB();
  const { type, title, message, data, userIds } = await c.req.json();
  // Create notification
  const notification = await db.notification.create({
    data: {
      type,
      title,
      message,
      data,
      recipients: {
        create: userIds.map((userId: string) => ({ userId })),
      },
    },
  });
  return c.json({ ok: true, data: notification });
});
