import { zValidator } from "@hono/zod-validator";
import { sendPlainEmailSchema } from "@zerocancer/shared";
import { Hono } from "hono";
import { THonoApp } from "src/lib/types";
import { sendEmail } from "src/services/email.service";

export const emailApp = new Hono<THonoApp>();

/**
 * Sends a simple text email
 */

emailApp.post(
  "/email/send",
  zValidator("json", sendPlainEmailSchema),
  async (c) => {
    const { to, subject, html, text, data } = c.req.valid("json");

    try {
      await sendEmail({
        to,
        subject,
        html,
        text,
      });

      return c.json({ ok: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Failed to send email:", error);
      return c.json({ ok: false, error: "Failed to send email" }, 500);
    }
  }
);
