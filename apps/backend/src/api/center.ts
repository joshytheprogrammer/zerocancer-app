import { zValidator } from "@hono/zod-validator";
import { inviteStaffSchema } from "@zerocancer/shared/schemas/center.schema";
import {
  centerStaffForgotPasswordSchema,
  centerStaffResetPasswordSchema,
  createCenterStaffPasswordSchema,
} from "@zerocancer/shared/schemas/centerStaff.schema";
import type {
  TCenterStaffForgotPasswordResponse,
  TCenterStaffResetPasswordResponse,
  TCreateCenterStaffPasswordResponse,
  TErrorResponse,
  TInviteStaffResponse,
} from "@zerocancer/shared/types";
import crypto from "crypto";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { sendEmail } from "src/lib/email";
import { hashPassword } from "src/lib/utils";

export const centerApp = new Hono();

centerApp.get("/", (c) => {
  return c.json({ ok: true, message: "Welcome to the Center API" });
});

// POST /invite-staff - Invite staff by email
centerApp.post(
  "/invite-staff",
  zValidator("json", inviteStaffSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const { centerId, emails } = c.req.valid("json");
    const invites = [];
    for (const email of emails) {
      // Generate a unique token
      const token = crypto.randomBytes(32).toString("hex");
      // Store invite in DB (pseudo-code, adjust to your schema)
      await db.centerStaffInvite.create({
        data: {
          centerId,
          email,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });
      // Send invite email
      const inviteUrl = `${process.env.FRONTEND_URL}/center/create-new-password?token=${token}`;
      await sendEmail({
        to: email,
        subject: "You're invited to join a center on Zerocancer",
        html: `<p>You have been invited to join a center. <a href="${inviteUrl}">Click here to set your password and join.</a></p>`,
      });
      invites.push({ email, token });
    }
    return c.json<TInviteStaffResponse>({ ok: true, data: { invites } });
  }
);

// POST /create-new-password - Center staff sets password using invite token
centerApp.post(
  "/create-new-password",
  zValidator("json", createCenterStaffPasswordSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const { token, password } = c.req.valid("json");

    // Find invite
    const invite = await db.centerStaffInvite.findUnique({ where: { token } });
    if (
      !invite ||
      !!invite.acceptedAt ||
      (invite.expiresAt && new Date(invite.expiresAt) < new Date())
    ) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid or expired invite token" },
        400
      );
    }
    // Hash password
    const passwordHash = await hashPassword(password);

    // Create staff
    const staff = await db.centerStaff.create({
      data: {
        centerId: invite.centerId,
        email: invite.email,
        passwordHash,
        createdAt: new Date(),
      },
    });

    // Mark invite as accepted
    await db.centerStaffInvite.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });

    return c.json<TCreateCenterStaffPasswordResponse>({
      ok: true,
      data: { staffId: staff.id },
    });
  }
);

// POST /forgot-password - Center staff requests password reset
centerApp.post(
  "/staff/forgot-password",
  zValidator("json", centerStaffForgotPasswordSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const { centerId, email } = c.req.valid("json");
    // Find staff
    const staff = await db.centerStaff.findFirst({
      where: { centerId, email },
    });
    if (!staff) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Staff not found" },
        404
      );
    }
    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    // Store token (assume a CenterStaffResetToken model or similar)
    await db.centerStaffResetToken.create({
      data: {
        staffId: staff.id,
        token,
        expiresAt,
      },
    });
    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/center/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Reset your Zerocancer Center Staff password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
    return c.json<TCenterStaffForgotPasswordResponse>({
      ok: true,
      data: { message: "Reset email sent" },
    });
  }
);

// POST /reset-password - Center staff resets password using token
centerApp.post(
  "/staff/reset-password",
  zValidator("json", centerStaffResetPasswordSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const { token, password } = c.req.valid("json");
    // Find reset token
    const reset = await db.centerStaffResetToken.findUnique({
      where: { token },
    });
    if (!reset || reset.expiresAt < new Date()) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid or expired reset token" },
        400
      );
    }
    // Hash password
    const passwordHash = await hashPassword(password);
    // Update staff password
    await db.centerStaff.update({
      where: { id: reset.staffId },
      data: { passwordHash },
    });
    // Invalidate token
    await db.centerStaffResetToken.delete({ where: { token } });
    return c.json<TCenterStaffResetPasswordResponse>({
      ok: true,
      data: { message: "Password reset successful" },
    });
  }
);
