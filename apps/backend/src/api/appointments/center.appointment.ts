import { zValidator } from "@hono/zod-validator";
import {
  cancelCenterAppointmentSchema,
  getCenterAppointmentByIdSchema,
  getCenterAppointmentsSchema,
  rescheduleCenterAppointmentSchema,
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
    if (appointment.status === "CANCELLED") {
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
    return c.json<TDataResponse<{ id: string }>>({ ok: true, data: { id } });
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
    if (appointment.status === "CANCELLED") {
      return c.json<TErrorResponse>(
        { ok: false, error: "Cannot reschedule a cancelled appointment." },
        400
      );
    }
    const updated = await db.appointment.update({
      where: { id },
      data: {
        appointmentDate: new Date(newDate),
        appointmentTime: new Date(newTime),
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
        id: updated.id,
        appointmentDate: updated.appointmentDate.toISOString(),
        appointmentTime: updated.appointmentTime.toISOString(),
      },
    });
  }
);
