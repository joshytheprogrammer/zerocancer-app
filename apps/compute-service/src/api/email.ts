import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { THonoApp } from "src/lib/types";
import { sendEmail, sendNotificationEmail } from "src/services/email.service";
import { z } from "zod";

const emailApp = new Hono<THonoApp>();

/**
 * Sends a simple text email
 */

const sendEmailSchema = z.object({
  to: z.string().or(z.array(z.string())),
  title: z.string(),
  type: z.string(),
  message: z.string(),
  data: z.string().optional(),
});

emailApp.post("/email/send", zValidator("json", sendEmailSchema), async (c) => {
  const { to, title, type, message, data } = c.req.valid("json");

  try {
    await sendEmail(c, {
      to,
      title,
      type,
      message,
      data: data ? JSON.parse(data) : undefined,
    });

    return c.json({ ok: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Failed to send email:", error);
    return c.json({ ok: false, error: "Failed to send email" }, 500);
  }
});

emailApp.post(
  "/email/send-notification",
  zValidator("json", sendEmailSchema),
  async (c) => {
    const { to, title, type, message, data } = c.req.valid("json");

    try {
      await sendNotificationEmail({
        to,
        title,
        type,
        message,
        data: data ? JSON.parse(data) : undefined,
      });

      return c.json({ ok: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Failed to send email:", error);
      return c.json({ ok: false, error: "Failed to send email" }, 500);
    }
  }
);
