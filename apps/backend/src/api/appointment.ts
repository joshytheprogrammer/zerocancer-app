import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { authMiddleware } from "src/middleware/auth.middleware";

export const appointmentApp = new Hono<{ Variables: THonoAppVariables }>();

// Middleware to ensure user is authenticated
appointmentApp.use(authMiddleware());

// POST /api/patient/appointments/book
appointmentApp.post("/appointments/book", async (c) => {
  const db = getDB();
  const {
    screeningTypeId,
    centerId,
    appointmentDate,
    appointmentTime,
    paymentReference,
  } = await c.req.json();

  const payload = c.get("jwtPayload");
  if (!payload) {
    return c.json({ ok: false, message: "Unauthorized" }, 401);
  }

  const userId = payload.id; // Assuming JWT payload contains userId

  if (!userId) {
    return c.json({ ok: false, message: "User ID not found in token" }, 401);
  }

  // TODO: Validate input, authenticate user, verify payment with Paystack
  // For now, assume user is authenticated and payment is valid
  // You may want to get userId from session/JWT in production

  // turn in transaction
  const transaction = await db.transaction.create({
    data: {
      type: "APPOINTMENT",
      status: "PAID",
      amount: 30, // TODO: set actual amount
      paymentReference, // store actual paystack payment reference
      paymentChannel: "PAYSTACK",
    },
  });

  const appointment = await db.appointment.create({
    data: {
      patientId: userId,
      centerId,
      screeningTypeId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: new Date(appointmentTime),
      isDonation: false,
      status: "SCHEDULED",
      transactionId: transaction.id, // Link appointment to transaction
      // Store paymentReference, generate receipt, etc.
      // transaction: {
      //   create: {
      //     type: "APPOINTMENT" as const,
      //     status: "PAID",
      //     amount: 30, // TODO: set actual amount
      //     paymentReference: "", // store actual paystack payment reference
      //     paymentChannel: "PAYSTACK",

      //   },
      // },
    },
    include: { transaction: true },
  });
  // TODO: Generate and store receipt
  return c.json({ ok: true, data: { appointment } });
});

// To run this app, create an entry file (e.g., server.ts) that imports and starts the server.
