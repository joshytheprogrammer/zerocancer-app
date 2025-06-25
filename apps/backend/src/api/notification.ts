import {
  notificationRecipientResponseSchema,
  notificationResponseSchema,
  notificationSchema,
} from "@zerocancer/shared/schemas/notification.schema";
import type {
  TCreateNotificationResponse,
  TGetNotificationsResponse,
  TMarkNotificationReadResponse,
} from "@zerocancer/shared/types";
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
  // Strictly shape each notification recipient and nested notification
  const safeNotifications = notifications.map((n) => {
    // Ensure data is an object or null
    let safeData: Record<string, any> | null = null;
    if (n.notification.data && typeof n.notification.data === "object" && !Array.isArray(n.notification.data)) {
      safeData = n.notification.data;
    }
    return {
      id: n.id,
      userId: n.userId,
      notificationId: n.notificationId,
      read: n.read,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      notification: {
        id: n.notification.id,
        type: n.notification.type,
        title: n.notification.title,
        message: n.notification.message,
        data: safeData,
        createdAt: n.notification.createdAt.toISOString(),
        updatedAt: n.notification.createdAt.toISOString(), // fallback if updatedAt not present
      },
    };
  });
  return c.json<TGetNotificationsResponse>({ ok: true, data: safeNotifications });
});

// POST /api/notifications/:id/read - mark notification as read
notificationApp.post(":id/read", async (c) => {
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const id = c.req.param("id");
  const db = getDB();
  await db.notificationRecipient.updateMany({
    where: { id, userId },
    data: { read: true, readAt: new Date() },
  });
  return c.json<TMarkNotificationReadResponse>({
    ok: true,
    data: { id, read: true, readAt: new Date().toISOString() },
  });
});

// POST /api/notifications - create notification (admin or system use)
notificationApp.post("/", async (c) => {
  // TODO: Add admin check if needed
  const db = getDB();
  const body = notificationSchema.parse(await c.req.json());
  const { type, title, message, data, userIds } = body;
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
  // Strictly shape the notification object
  let safeData: Record<string, any> | null = null;
  if (notification.data && typeof notification.data === "object" && !Array.isArray(notification.data)) {
    safeData = notification.data;
  }
  const safeNotification = {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: safeData,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.createdAt.toISOString(), // fallback if updatedAt not present
  };
  return c.json<TCreateNotificationResponse>({ ok: true, data: safeNotification });
});
