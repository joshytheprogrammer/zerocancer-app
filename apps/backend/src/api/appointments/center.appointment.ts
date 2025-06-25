import { zValidator } from "@hono/zod-validator";
import {
  cancelCenterAppointmentSchema,
  getCenterAppointmentByIdSchema,
  getCenterAppointmentsSchema,
  rescheduleCenterAppointmentSchema,
  verifyCheckInCodeSchema,
} from "@zerocancer/shared";
import type {
  TDataResponse,
  TErrorResponse,
  TVerifyCheckInCodeResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { createNotificationForUsers } from "src/lib/utils";
import { authMiddleware } from "src/middleware/auth.middleware";

export const centerAppointmentApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// Middleware to ensure user is authenticated
centerAppointmentApp.use(authMiddleware(["center", "center_staff"]));

// GET /api/center/appointments - List appointments (paginated, filterable)
centerAppointmentApp.get(
  "/",
  zValidator("query", getCenterAppointmentsSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { page = 1, pageSize = 20, screeningType } = c.req.valid("query");
    const where: any = {};
    if (screeningType) where.screeningTypeId = screeningType;
    // Optionally, filter by centerId from JWT
    const payload = c.get("jwtPayload");
    const centerId = payload?.id!; // Use centerId or id from JWT
    if (centerId) where.centerId = centerId;
    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { id: true, fullName: true } },
          screeningType: { select: { id: true, name: true } },
        },
      }),
      db.appointment.count({ where }),
    ]);
    return c.json<TDataResponse<any>>({
      ok: true,
      data: {
        appointments,
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  }
);

// GET /api/center/appointments/:id - Get appointment details
centerAppointmentApp.get(
  "/:id",
  zValidator("param", getCenterAppointmentByIdSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { id } = c.req.valid("param");
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, fullName: true } },
        center: { select: { id: true, centerName: true } },
        screeningType: { select: { id: true, name: true } },
        verification: { select: { id: true } },
      },
    });
    if (!appointment) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found." },
        404
      );
    }
    return c.json<TDataResponse<any>>({ ok: true, data: appointment });
  }
);

// POST /api/center/appointments/:id/cancel - Cancel appointment
centerAppointmentApp.post(
  "/:id/cancel",
  zValidator("json", cancelCenterAppointmentSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const id = c.req.param("id");
    const { reason } = c.req.valid("json");
    const appointment = await db.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found." },
        404
      );
    }
    if (appointment.status! === "CANCELLED") {
      return c.json<TErrorResponse>(
        { ok: false, error: "Already cancelled." },
        400
      );
    }
    await db.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancellationReason: reason || null,
        cancellationDate: new Date(),
      },
    });
    // Optionally, notify patient
    // ...
    return c.json<TDataResponse<{ id: string }>>({
      ok: true,
      data: { id: id! },
    });
  }
);

// POST /api/center/appointments/:id/reschedule - Reschedule appointment
// NOTE TO SELF: Make a more robust rescheduling system later
// This is a simple version that just updates the date/time & resets status
centerAppointmentApp.post(
  "/:id/reschedule",
  zValidator("json", rescheduleCenterAppointmentSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const id = c.req.param("id");
    const { newDate, newTime, reason } = c.req.valid("json");
    const appointment = await db.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found." },
        404
      );
    }
    if (appointment.status! === "CANCELLED") {
      return c.json<TErrorResponse>(
        { ok: false, error: "Cannot reschedule a cancelled appointment." },
        400
      );
    }
    const updated = await db.appointment.update({
      where: { id },
      data: {
        appointmentDate: new Date(newDate!),
        appointmentTime: new Date(newTime!),
        status: "SCHEDULED",
      },
    });
    // Optionally, notify patient
    // ...
    return c.json<
      TDataResponse<{
        id: string;
        appointmentDate: string;
        appointmentTime: string;
      }>
    >({
      ok: true,
      data: {
        id: updated.id!,
        appointmentDate: updated.appointmentDate.toISOString(),
        appointmentTime: updated.appointmentTime.toISOString(),
      },
    });
  }
);

// POST /api/center/appointments/verify - Verify check-in code
centerAppointmentApp.post(
  "/verify",
  zValidator("json", verifyCheckInCodeSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { checkInCode } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    if (!payload) {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    }

    // Find appointment by check-in code
    const appointment = await db.appointment.findUnique({
      where: { checkInCode },
      include: {
        patient: { select: { id: true, fullName: true } },
        center: { select: { id: true, centerName: true } },
        screeningType: { select: { id: true, name: true } },
        verification: { select: { id: true, verifiedAt: true } },
      },
    });

    if (!appointment) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          message: "Invalid check-in code",
        },
      });
    }

    // Check if the code has expired
    if (
      appointment.checkInCodeExpiresAt &&
      new Date() > appointment.checkInCodeExpiresAt
    ) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          message: "Check-in code has expired",
        },
      });
    }

    // Check if appointment is already verified
    if (appointment.verification) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          appointmentId: appointment.id,
          message: "Appointment already checked in",
        },
      });
    }

    // Check if appointment is scheduled for today (within reasonable time window)
    const today = new Date();
    const appointmentDate = new Date(appointment.appointmentDate);
    const isToday =
      appointmentDate.getDate() === today.getDate() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getFullYear() === today.getFullYear();

    if (!isToday) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          appointmentId: appointment.id,
          message: "Appointment is not scheduled for today",
        },
      });
    }

    // Verify that the center staff belongs to the same center as the appointment
    const centerId = payload.id; // Center or staff ID from JWT
    if (appointment.centerId !== centerId) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          message: "Check-in code does not belong to your center",
        },
      });
    }

    // Create verification record and update appointment status
    const staffId = payload.id; // Center staff ID from JWT
    await db.$transaction(async (tx) => {
      // Create verification record
      await tx.appointmentVerification.create({
        data: {
          id: appointment.id, // Link to appointment ID
          verifiedBy: staffId!,
          verifiedAt: new Date(),
        },
      });

      // Update appointment status to IN_PROGRESS
      await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: "IN_PROGRESS" },
      });
    });

    // Send notification to patient
    try {
      await createNotificationForUsers({
        type: "CHECK_IN_CONFIRMED",
        title: "Check-in Confirmed",
        message: `Your appointment at ${appointment.center.centerName} has been confirmed. Please proceed with your screening.`,
        userIds: [appointment.patientId],
        data: { appointmentId: appointment.id },
      });
    } catch (error) {
      // Log the error but don't fail the request
      console.error("Failed to send notification:", error);
    }

    return c.json<TVerifyCheckInCodeResponse>({
      ok: true,
      data: {
        valid: true,
        appointmentId: appointment.id,
        message: "Check-in successful",
      },
    });
  }
);
