import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { canJoinWaitlist } from "src/lib/utils";
import { authMiddleware } from "src/middleware/auth.middleware";

export const patientAppointmentApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// Middleware to ensure user is authenticated
patientAppointmentApp.use(authMiddleware("patient"));

// POST /api/patient/appointments/book
patientAppointmentApp.post("/book", async (c) => {
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
      checkInCode: crypto.randomBytes(10).toString("hex").toUpperCase(),
      checkInCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days

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
patientAppointmentApp.post("/waitlists/join", async (c) => {
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

  // Check eligibility to join waitlist
  const canJoin = await canJoinWaitlist(db, patientId, screeningTypeId);
  if (!canJoin) {
    return c.json(
      {
        ok: false,
        message:
          "You already have an active waitlist entry for this screening type.",
      },
      400
    );
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
patientAppointmentApp.get(
  "/matches/eligible-centers/:allocationId",
  async (c) => {
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
  }
);

// POST /api/patient/matches/select-center
patientAppointmentApp.post("/matches/select-center", async (c) => {
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
      checkInCode: crypto.randomBytes(10).toString("hex").toUpperCase(),
      checkInCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
  await db.donationAllocation.update({
    where: { id: allocationId },
    data: { appointmentId: appointment.id },
  });
  return c.json({ ok: true, data: { appointment } });
});

// GET /api/patient/appointments
patientAppointmentApp.get("/", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const page = parseInt(c.req.query("page") || "1", 10);
  const size = parseInt(c.req.query("size") || "20", 10);
  const status = c.req.query("status");
  const where: any = {
    patientId: userId,
  };
  if (status) where.status = status;
  const [appointments, total] = await Promise.all([
    db.appointment.findMany({
      skip: (page - 1) * size,
      take: size,
      where,
      orderBy: { appointmentDate: "desc" },
      include: {
        center: {
          select: {
            id: true,
            centerName: true,
            address: true,
            state: true,
            lga: true,
          },
        },
        screeningType: { select: { id: true, name: true } },
        transaction: true,
        result: true,
      },
    }),
    db.appointment.count({ where }),
  ]);
  return c.json({
    ok: true,
    data: {
      appointments,
      page,
      pageSize: size,
      total,
      totalPages: Math.ceil(total / size),
    },
  });
});

// GET /api/patient/results
patientAppointmentApp.get("/patient/results", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const page = parseInt(c.req.query("page") || "1", 10);
  const size = parseInt(c.req.query("size") || "20", 10);
  const [results, total] = await Promise.all([
    db.screeningResult.findMany({
      where: { appointment: { patientId: userId } },
      skip: (page - 1) * size,
      take: size,
      orderBy: { uploadedAt: "desc" },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            screeningType: { select: { name: true } },
          },
        },
        uploader: { select: { id: true, centerId: true } },
      },
    }),
    db.screeningResult.count({ where: { appointment: { patientId: userId } } }),
  ]);
  return c.json({
    ok: true,
    data: {
      results,
      page,
      pageSize: size,
      total,
      totalPages: Math.ceil(total / size),
    },
  });
});

// GET /api/patient/results/:id
patientAppointmentApp.get("/patient/results/:id", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const id = c.req.param("id");
  const result = await db.screeningResult.findUnique({
    where: { id },
    include: {
      appointment: {
        select: {
          id: true,
          patientId: true,
          appointmentDate: true,
          screeningType: { select: { name: true } },
        },
      },
      uploader: { select: { id: true, centerId: true } },
    },
  });
  if (!result || result.appointment.patientId !== userId) {
    return c.json({ ok: false, message: "Not found or forbidden" }, 404);
  }
  // TODO: If result file is stored, add download URL here
  return c.json({ ok: true, data: result });
});

// GET /api/patient/receipts
patientAppointmentApp.get("/patient/receipts", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const page = parseInt(c.req.query("page") || "1", 10);
  const size = parseInt(c.req.query("size") || "20", 10);
  const [receipts, total] = await Promise.all([
    db.transaction.findMany({
      where: { appointments: { some: { patientId: userId } } },
      skip: (page - 1) * size,
      take: size,
      orderBy: { createdAt: "desc" },
      include: {
        appointments: {
          select: {
            id: true,
            appointmentDate: true,
            screeningType: { select: { name: true } },
          },
        },
      },
    }),
    db.transaction.count({
      where: { appointments: { some: { patientId: userId } } },
    }),
  ]);
  return c.json({
    ok: true,
    data: {
      receipts,
      page,
      pageSize: size,
      total,
      totalPages: Math.ceil(total / size),
    },
  });
});

// GET /api/patient/receipts/:id
patientAppointmentApp.get("/patient/receipts/:id", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const id = c.req.param("id");
  const receipt = await db.transaction.findUnique({
    where: { id },
    include: {
      appointments: {
        select: {
          id: true,
          patientId: true,
          appointmentDate: true,
          screeningType: { select: { name: true } },
        },
      },
    },
  });
  if (!receipt || !receipt.appointments.some((a) => a.patientId === userId)) {
    return c.json({ ok: false, message: "Not found or forbidden" }, 404);
  }
  // TODO: If receipt file is stored, add download URL here
  return c.json({ ok: true, data: receipt });
});

// GET /api/patient/appointments/:id/checkin-code
patientAppointmentApp.get("/:id/checkin-code", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id;
  const id = c.req.param("id");
  const appointment = await db.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      patientId: true,
      checkInCode: true,
      checkInCodeExpiresAt: true,
      appointmentDate: true,
      status: true,
    },
  });
  if (!appointment || appointment.patientId !== userId) {
    return c.json({ ok: false, message: "Not found or forbidden" }, 404);
  }
  // Optionally, check if code is expired
  if (
    appointment.checkInCodeExpiresAt &&
    new Date() > appointment.checkInCodeExpiresAt
  ) {
    return c.json({ ok: false, message: "Check-in code expired" }, 410);
  }
  return c.json({
    ok: true,
    data: {
      checkInCode: appointment.checkInCode,
      expiresAt: appointment.checkInCodeExpiresAt,
    },
  });
});
