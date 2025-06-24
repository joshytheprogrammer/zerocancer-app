import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { authMiddleware } from "src/middleware/auth.middleware";

export const centerAppointmentApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// Middleware to ensure user is authenticated
centerAppointmentApp.use(authMiddleware());

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
    },
  });
  if (!appointment) {
    return c.json({ ok: false, message: "Invalid code" }, 404);
  }
  // Optionally, check if code is expired
  if (
    appointment.checkInCodeExpiresAt &&
    new Date() > appointment.checkInCodeExpiresAt
  ) {
    return c.json({ ok: false, message: "Check-in code expired" }, 410);
  }
  return c.json({ ok: true, data: appointment });
});

// To run this app, create an entry file (e.g., server.ts) that imports and starts the server.
