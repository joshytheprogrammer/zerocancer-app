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

// POST /api/patient/waitlists/join
appointmentApp.post("/waitlists/join", async (c) => {
  const db = getDB();
  const { screeningTypeId } = await c.req.json();

  const payload = c.get("jwtPayload");
  if (!payload) {
    return c.json({ ok: false, message: "Unauthorized" }, 401);
  }

  const patientId = payload.id; // Assuming JWT payload contains userId
  if (!patientId) {
    return c.json({ ok: false, message: "User ID not found in token" }, 401);
  }
  // Create waitlist entry
  const waitlist = await db.waitlist.create({
    data: {
      screeningTypeId,
      patientId,
      status: "PENDING",
    },
  });

  return c.json({ ok: true, data: { waitlist } });
});

// GET /api/patient/matches/eligible-centers/:allocationId
appointmentApp.get("/matches/eligible-centers/:allocationId", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const allocationId = c.req.param("allocationId");
  const page = parseInt(c.req.query("page") || "1", 10);
  const size = parseInt(c.req.query("size") || "20", 10);
  const state = c.req.query("state");
  const lga = c.req.query("lga");
  // Ensure allocation belongs to this patient and is not yet assigned to an appointment
  const allocation = await db.donationAllocation.findUnique({
    where: { id: allocationId },
    include: { waitlist: true },
  });
  if (
    !allocation ||
    allocation.patientId !== userId ||
    allocation.appointmentId
  ) {
    return c.json(
      { ok: false, message: "Invalid or already assigned allocation" },
      400
    );
  }
  // Find all active centers offering this screening type
  const screeningTypeId = allocation.waitlist.screeningTypeId;
  const [centers, total] = await Promise.all([
    db.serviceCenter.findMany({
      skip: (page - 1) * size,
      take: size,
      where: {
        services: { some: { id: screeningTypeId } },
        state: state || undefined,
        lga: lga || undefined,
        status: "ACTIVE",
      },
      select: {
        id: true,
        centerName: true,
        address: true,
        state: true,
        lga: true,
      },
    }),
    db.serviceCenter.count({
      where: {
        services: { some: { id: screeningTypeId } },
        state: state || undefined,
        lga: lga || undefined,
        status: "ACTIVE",
      },
    }),
  ]);

  return c.json({
    ok: true,
    data: {
      centers,
      page,
      pageSize: size,
      total,
      totalPages: Math.ceil(centers.length / size),
    },
  });
});

// POST /api/patient/matches/select-center
appointmentApp.post("/matches/select-center", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const { allocationId, centerId, appointmentDate, appointmentTime } =
    await c.req.json();
  // Validate allocation
  const allocation = await db.donationAllocation.findUnique({
    where: { id: allocationId },
    include: { waitlist: true },
  });
  if (
    !allocation ||
    allocation.patientId !== userId ||
    allocation.appointmentId
  ) {
    return c.json(
      { ok: false, message: "Invalid or already assigned allocation" },
      400
    );
  }
  // Create appointment and link to allocation
  const appointment = await db.appointment.create({
    data: {
      patientId: userId,
      centerId,
      screeningTypeId: allocation.waitlist.screeningTypeId,
      isDonation: true,
      status: "SCHEDULED",
      appointmentDate: new Date(appointmentDate),
      appointmentTime: new Date(appointmentTime),
      donationId: allocation.campaignId,
    },
  });
  await db.donationAllocation.update({
    where: { id: allocationId },
    data: { appointmentId: appointment.id },
  });
  return c.json({ ok: true, data: { appointment } });
});

// To run this app, create an entry file (e.g., server.ts) that imports and starts the server.
