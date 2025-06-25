import { zValidator } from "@hono/zod-validator";
import { inviteStaffSchema } from "@zerocancer/shared";
import {
  centerStaffForgotPasswordSchema,
  centerStaffLoginSchema,
  centerStaffResetPasswordSchema,
  createCenterStaffPasswordSchema,
} from "@zerocancer/shared";
import type {
  TCenterStaffForgotPasswordResponse,
  TCenterStaffLoginResponse,
  TCenterStaffResetPasswordResponse,
  TCreateCenterStaffPasswordResponse,
  TErrorResponse,
  TInviteStaffResponse,
} from "@zerocancer/shared/types";
import crypto from "crypto";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { getDB } from "src/lib/db";
import { sendEmail } from "src/lib/email";
import { comparePassword, hashPassword } from "src/lib/utils";
import { authMiddleware } from "src/middleware/auth.middleware";

export const centerApp = new Hono();

// POST /invite-staff - Invite staff by email
centerApp.post(
  "/staff/invite",
  authMiddleware(["center"]),
  zValidator("json", inviteStaffSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const { centerId, emails } = c.req.valid("json");
    const invites = [];
    for (const email of emails!) {
      // Generate a unique token
      const token = crypto.randomBytes(32).toString("hex");
      // Store invite in DB (pseudo-code, adjust to your schema)
      await db.centerStaffInvite.create({
        data: {
          centerId: centerId!,
          email,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });
      // Send invite email
      const inviteUrl = `${process.env.FRONTEND_URL}/center/create-new-password?token=${token}`;
      await sendEmail({
        to: email!,
        subject: "You're invited to join a center on Zerocancer",
        html: `<p>You have been invited to join a center. <a href="${inviteUrl}">Click here to set your password and join.</a></p>`,
      });
      invites.push({ email: email!, token: token! });
    }
    return c.json<TInviteStaffResponse>({ ok: true, data: { invites } });
  }
);

// POST /create-new-password - Center staff sets password using invite token
centerApp.post(
  "/staff/create-new-password",
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
    const passwordHash = await hashPassword(password!);

    // Create staff
    const staff = await db.centerStaff.create({
      data: {
        centerId: invite.centerId!,
        email: invite.email!,
        passwordHash,
        createdAt: new Date(),
      },
    });

    // Mark invite as accepted
    await db.centerStaffInvite.update({
      where: { token: token! },
      data: { acceptedAt: new Date() },
    });

    return c.json<TCreateCenterStaffPasswordResponse>({
      ok: true,
      data: { staffId: staff.id! },
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
      where: { centerId: centerId!, email: email! },
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
        staffId: staff.id!,
        token: token!,
        expiresAt: expiresAt!,
      },
    });
    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/center/reset-password?token=${token}`;
    await sendEmail({
      to: email!,
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
      where: { token: token! },
    });
    if (!reset || reset.expiresAt! < new Date()) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid or expired reset token" },
        400
      );
    }
    // Hash password
    const passwordHash = await hashPassword(password!);
    // Update staff password
    await db.centerStaff.update({
      where: { id: reset.staffId! },
      data: { passwordHash },
    });
    // Invalidate token
    await db.centerStaffResetToken.delete({ where: { token: token! } });
    return c.json<TCenterStaffResetPasswordResponse>({
      ok: true,
      data: { message: "Password reset successful" },
    });
  }
);

// POST /staff/login - Center staff login
centerApp.post(
  "/staff/login",
  zValidator("json", centerStaffLoginSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const { JWT_TOKEN_SECRET } = env<{ JWT_TOKEN_SECRET: string }>(c, "node");

    const db = getDB();
    const { centerId, email, password } = c.req.valid("json");
    // Find staff
    const staff = await db.centerStaff.findFirst({
      where: { centerId: centerId!, email: email! },
    });
    if (!staff || !staff.passwordHash) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid credentials" },
        401
      );
    }
    // Compare password
    const valid = await comparePassword(password!, staff.passwordHash!);
    if (!valid) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid credentials" },
        401
      );
    }

    const payload = {
      id: centerId!,
      email: email!,
      profile: "CENTER_STAFF",
    };
    const token = await sign(
      { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 5 },
      JWT_TOKEN_SECRET
    );
    const refreshToken = await sign(
      { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      JWT_TOKEN_SECRET
    ); // 7 days

    // Set refresh token as httpOnly, secure cookie using Hono's setCookie
    setCookie(c, "refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

    return c.json<TCenterStaffLoginResponse>({
      ok: true,
      data: {
        token,
        user: {
          userId: staff.id!,
          email: staff.email!,
          profile: "CENTER_STAFF",
          centerId: staff.centerId!,
        },
      },
    });
  }
);
