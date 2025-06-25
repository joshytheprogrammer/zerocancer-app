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
centerAppointmentApp.use(authMiddleware("center"));

// GET /api/center/appointments/verify-checkin/:code
centerAppointmentApp.get("/verify-checkin/:code", async (c) => {
  const db = getDB();
  const code = c.req.param("code");
  // Find appointment by code
  const appointment = await db.appointment.findUnique({
    where: { checkInCode: code },
    include: {
      patient: { select: { id: true, fullName: true } },
      center: { select: { id: true, centerName: true } },
      screeningType: { select: { id: true, name: true } },
      verification: { select: { id: true } },
    },
  });
  if (!appointment) {
    return c.json<TErrorResponse>({ ok: false, error: "Invalid code." }, 404);
  }
  // Optionally, check if code is expired
  if (
    appointment.checkInCodeExpiresAt &&
    new Date() > appointment.checkInCodeExpiresAt
  ) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Check-in code expired." },
      410
    );
  }

  // get the appointment verification details

  // Get the currently signed-in center staff & update the following:
  // - Mark the appointment as checked in
  // - Set the check-in time to now
  // - verify the appointment (AppointmentVerification)
  // For now, just notify the patient
  await createNotificationForUsers({
    type: "CHECKED_IN",
    title: "You have checked in for your appointment!",
    message: `You have checked in for your screening at ${appointment.center.centerName}.`,
    userIds: [appointment.patient.id],
    data: { appointmentId: appointment.id },
  });

  // Convert checkInCodeExpiresAt to string if present
  const safeAppointment = {
    ...appointment,
    checkInCodeExpiresAt: appointment.checkInCodeExpiresAt
      ? appointment.checkInCodeExpiresAt.toISOString()
      : null,
  };
  return c.json<TVerifyCheckInCodeResponse>({
    ok: true,
    data: safeAppointment,
  });
});

// To run this app, create an entry file (e.g., server.ts) that imports and starts the server.
