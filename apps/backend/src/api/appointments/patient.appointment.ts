import { zValidator } from "@hono/zod-validator";
import {
  bookSelfPayAppointmentSchema,
  getPatientAppointmentsSchema,
  getPatientReceiptsSchema,
  getPatientResultByIdSchema,
  getPatientResultsSchema,
  selectCenterSchema,
} from "@zerocancer/shared";
import type {
  TBookSelfPayAppointmentResponse,
  TErrorResponse,
  TGetCheckInCodeResponse,
  TGetEligibleCentersResponse,
  TGetPatientAppointmentsResponse,
  TGetPatientReceiptResponse,
  TGetPatientReceiptsResponse,
  TGetPatientResultByIdResponse,
  TGetPatientResultsResponse,
  TSelectCenterResponse,
} from "@zerocancer/shared/types";
import crypto from "crypto";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { authMiddleware } from "src/middleware/auth.middleware";
import { z } from "zod";

export const patientAppointmentApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// Middleware to ensure user is authenticated
patientAppointmentApp.use(authMiddleware(["patient"]));

// POST /api/appointment/patient/book
patientAppointmentApp.post(
  "/book",
  zValidator("json", bookSelfPayAppointmentSchema, (result, c) => {
    if (!result.success) return c.json({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const {
      screeningTypeId,
      centerId,
      appointmentDate,
      appointmentTime,
      paymentReference,
    } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    if (!payload) {
      return c.json({ ok: false, message: "Unauthorized" }, 401);
    }
    const userId = payload.id!;
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
        status: "COMPLETED",
        amount: 30, // TODO: set actual amount
        paymentReference, // store actual paystack payment reference
        paymentChannel: "PAYSTACK",
      },
    });
    const appointment = await db.appointment.create({
      data: {
        patientId: userId!,
        centerId: centerId!,
        screeningTypeId: screeningTypeId!,
        appointmentDate: new Date(appointmentDate!),
        appointmentTime: new Date(appointmentTime!),
        isDonation: false,
        status: "SCHEDULED",
        transactionId: transaction.id!, // Link appointment to transaction
        // create helper function to generate check-in code
        checkInCode: crypto.randomBytes(6).toString("hex").toUpperCase(),
        checkInCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: {
        transaction: true,
        center: true,
        screeningType: true,
        result: true,
      },
    });
    // Strictly shape the appointment object to TPatientAppointment
    const safeAppointment = {
      id: appointment.id!,
      patientId: appointment.patientId!,
      centerId: appointment.centerId!,
      screeningTypeId: appointment.screeningTypeId!,
      appointmentDate: appointment.appointmentDate.toISOString(),
      appointmentTime: appointment.appointmentTime.toISOString(),
      isDonation: appointment.isDonation!,
      status: appointment.status!,
      transactionId:
        appointment.transactionId === null
          ? undefined
          : appointment.transactionId,
      checkInCode: appointment.checkInCode!,
      checkInCodeExpiresAt: appointment.checkInCodeExpiresAt
        ? appointment.checkInCodeExpiresAt.toISOString()
        : null,
      donationId:
        appointment.donationId === null ? undefined : appointment.donationId,
      center: appointment.center!
        ? {
            id: appointment.center.id!,
            centerName: appointment.center.centerName!,
            address: appointment.center.address!,
            state: appointment.center.state!,
            lga: appointment.center.lga!,
          }
        : undefined,
      screeningType: appointment.screeningType!
        ? {
            id: appointment.screeningType.id!,
            name: appointment.screeningType.name!,
          }
        : undefined,
      transaction: appointment.transaction!
        ? {
            id: appointment.transaction.id!,
            type: appointment.transaction.type!,
            status: appointment.transaction.status!,
            amount: appointment.transaction.amount!,
            paymentReference: appointment.transaction.paymentReference!,
            paymentChannel: appointment.transaction.paymentChannel!,
            createdAt: appointment.transaction.createdAt.toISOString(),
          }
        : undefined,
      result: appointment.result ? { id: appointment.result.id! } : undefined, // Add more fields if needed
    };
    return c.json<TBookSelfPayAppointmentResponse>({
      ok: true,
      data: { appointment: safeAppointment },
    });
  }
);

// GET /api/appointment/patient/matches/eligible-centers/:allocationId
patientAppointmentApp.get(
  "/matches/eligible-centers/:allocationId",
  async (c) => {
    const db = getDB();
    const payload = c.get("jwtPayload");
    if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
    const userId = payload.id!;
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
    const screeningTypeId = allocation.waitlist.screeningTypeId!;
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

    return c.json<TGetEligibleCentersResponse>({
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

// POST /api/appointment/patient/matches/select-center
patientAppointmentApp.post(
  "/matches/select-center",
  zValidator("json", selectCenterSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const payload = c.get("jwtPayload");
    if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
    const userId = payload.id!;
    const { allocationId, centerId, appointmentDate, appointmentTime } =
      c.req.valid("json");
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
        centerId: centerId!,
        screeningTypeId: allocation.waitlist.screeningTypeId!,
        isDonation: true,
        status: "SCHEDULED",
        appointmentDate: new Date(appointmentDate!),
        appointmentTime: new Date(appointmentTime!),
        donationId: allocation.campaignId!,
        checkInCode: crypto.randomBytes(6).toString("hex").toUpperCase(),
        checkInCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        center: true,
        screeningType: true,
        transaction: true,
        result: true,
      },
    });
    await db.donationAllocation.update({
      where: { id: allocationId! },
      data: { appointmentId: appointment.id! },
    });
    const safeAppointment = {
      id: appointment.id!,
      patientId: appointment.patientId!,
      centerId: appointment.centerId!,
      screeningTypeId: appointment.screeningTypeId!,
      appointmentDate: appointment.appointmentDate.toISOString(),
      appointmentTime: appointment.appointmentTime.toISOString(),
      isDonation: appointment.isDonation!,
      status: appointment.status!,
      transactionId:
        appointment.transactionId === null
          ? undefined
          : appointment.transactionId,
      checkInCode: appointment.checkInCode!,
      checkInCodeExpiresAt: appointment.checkInCodeExpiresAt
        ? appointment.checkInCodeExpiresAt.toISOString()
        : null,
      donationId:
        appointment.donationId === null ? undefined : appointment.donationId,
      center: appointment.center
        ? {
            id: appointment.center.id!,
            centerName: appointment.center.centerName!,
            address: appointment.center.address!,
            state: appointment.center.state!,
            lga: appointment.center.lga!,
          }
        : undefined,
      screeningType: appointment.screeningType
        ? {
            id: appointment.screeningType.id!,
            name: appointment.screeningType.name!,
          }
        : undefined,
      transaction: appointment.transaction
        ? {
            id: appointment.transaction.id!,
            type: appointment.transaction.type!,
            status: appointment.transaction.status!,
            amount: appointment.transaction.amount!,
            paymentReference: appointment.transaction.paymentReference!,
            paymentChannel: appointment.transaction.paymentChannel!,
            createdAt: appointment.transaction.createdAt.toISOString(),
          }
        : undefined,
      result: appointment.result ? { id: appointment.result.id! } : undefined, // Add more fields if needed
    };
    return c.json<TSelectCenterResponse>({
      ok: true,
      data: { appointment: safeAppointment },
    });
  }
);

// GET /api/appointment/patient - List patient appointments
patientAppointmentApp.get(
  "/",
  zValidator("query", getPatientAppointmentsSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const payload = c.get("jwtPayload");
    if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
    const userId = payload.id!;
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
    const safeAppointments = appointments.map((a) => ({
      id: a.id!,
      patientId: a.patientId!,
      centerId: a.centerId!,
      screeningTypeId: a.screeningTypeId!,
      appointmentDate: a.appointmentDate.toISOString(),
      appointmentTime: a.appointmentTime.toISOString(),
      isDonation: a.isDonation!,
      status: a.status!,
      transactionId: a.transactionId === null ? undefined : a.transactionId,
      checkInCode: a.checkInCode!,
      checkInCodeExpiresAt: a.checkInCodeExpiresAt
        ? a.checkInCodeExpiresAt.toISOString()
        : null,
      donationId: a.donationId === null ? undefined : a.donationId,
      center: a.center
        ? {
            id: a.center.id!,
            centerName: a.center.centerName!,
            address: a.center.address!,
            state: a.center.state!,
            lga: a.center.lga!,
          }
        : undefined,
      screeningType: a.screeningType
        ? { id: a.screeningType.id!, name: a.screeningType.name! }
        : undefined,
      transaction: a.transaction
        ? {
            id: a.transaction.id!,
            type: a.transaction.type!,
            status: a.transaction.status!,
            amount: a.transaction.amount!,
            paymentReference: a.transaction.paymentReference!,
            paymentChannel: a.transaction.paymentChannel!,
            createdAt: a.transaction.createdAt.toISOString(),
          }
        : undefined,
      result: a.result ? { id: a.result.id! } : undefined, // Add more fields if needed
    }));
    return c.json<TGetPatientAppointmentsResponse>({
      ok: true,
      data: {
        appointments: safeAppointments,
        page,
        pageSize: size,
        total,
        totalPages: Math.ceil(total / size),
      },
    });
  }
);

// GET /api/appointment/patient/results - List patient results
// patientAppointmentApp.get(
//   "/results",
//   zValidator("query", getPatientResultsSchema, (result, c) => {
//     if (!result.success)
//       return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
//   }),
//   async (c) => {
//     const db = getDB();
//     const payload = c.get("jwtPayload");
//     const patientId = payload?.id!;
//     const { page = 1, pageSize = 20 } = c.req.valid("query");

//     const [results, total] = await Promise.all([
//       db.screeningResult.findMany({
//         where: {
//           appointment: { patientId },
//         },
//         skip: (Number(page) - 1) * Number(pageSize),
//         take: Number(pageSize),
//         orderBy: { uploadedAt: "desc" },
//         include: {
//           appointment: {
//             select: {
//               id: true,
//               appointmentDate: true,
//               appointmentTime: true,
//               screeningType: { select: { id: true, name: true } },
//               center: { select: { id: true, centerName: true } },
//             },
//           },
//           files: {
//             orderBy: { filePath: "asc" },
//           },
//         },
//       }),
//       db.screeningResult.count({
//         where: {
//           appointment: { patientId },
//         },
//       }),
//     ]);

//     // Helper function to group files by folder
//     const groupFilesByFolder = (files: any[]): Record<string, any[]> => {
//       return files.reduce((acc, file) => {
//         const folderName = file.filePath.includes("/")
//           ? file.filePath.split("/")[0]
//           : "root";

//         if (!acc[folderName]) {
//           acc[folderName] = [];
//         }
//         acc[folderName].push(file);
//         return acc;
//       }, {});
//     };

//     // Format the response
//     const processedResults = results.map((result) => ({
//       id: result.id,
//       notes: result.notes,
//       uploadedAt: result.uploadedAt.toISOString(),
//       appointment: {
//         id: result.appointment.id,
//         appointmentDate: result.appointment.appointmentDate.toISOString(),
//         appointmentTime: result.appointment.appointmentTime?.toISOString(),
//         screeningType: result.appointment.screeningType,
//         center: result.appointment.center,
//       },
//       files: result.files.map((file) => ({
//         id: file.id,
//         fileName: file.fileName,
//         filePath: file.filePath,
//         fileType: file.fileType,
//         fileSize: file.fileSize,
//         url: file.cloudinaryUrl,
//         uploadedAt: file.uploadedAt.toISOString(),
//         isDeleted: file.isDeleted,
//       })),
//       folders: groupFilesByFolder(result.files),
//     }));

//     return c.json<TGetPatientResultsResponse>({
//       ok: true,
//       data: {
//         results: processedResults,
//         page: Number(page),
//         pageSize: Number(pageSize),
//         total,
//         totalPages: Math.ceil(total / Number(pageSize)),
//       },
//     });
//   }
// );

// GET /api/appointment/patient/results/:id - Get specific patient result
patientAppointmentApp.get(
  "/results/:id",
  zValidator("param", getPatientResultByIdSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const payload = c.get("jwtPayload");
    const patientId = payload?.id!;
    const { id } = c.req.valid("param");

    const result = await db.screeningResult.findFirst({
      where: {
        id,
        appointment: { patientId },
      },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            screeningType: { select: { id: true, name: true } },
            center: { select: { id: true, centerName: true, address: true } },
          },
        },
        files: {
          orderBy: { filePath: "asc" },
        },
      },
    });

    if (!result) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Result not found" },
        404
      );
    }

    // Helper function to group files by folder
    const groupFilesByFolder = (files: any[]): Record<string, any[]> => {
      return files.reduce((acc, file) => {
        const folderName = file.filePath.includes("/")
          ? file.filePath.split("/")[0]
          : "root";

        if (!acc[folderName]) {
          acc[folderName] = [];
        }
        acc[folderName].push(file);
        return acc;
      }, {});
    };

    return c.json<TGetPatientResultByIdResponse>({
      ok: true,
      data: {
        id: result.id,
        notes: result.notes,
        uploadedAt: result.uploadedAt.toISOString(),
        appointment: {
          id: result.appointment.id,
          appointmentDate: result.appointment.appointmentDate.toISOString(),
          appointmentTime: result.appointment.appointmentTime?.toISOString(),
          screeningType: result.appointment.screeningType,
          center: result.appointment.center,
        },
        files: result.files.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          filePath: file.filePath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          url: file.cloudinaryUrl,
          uploadedAt: file.uploadedAt.toISOString(),
          isDeleted: file.isDeleted,
        })),
        folders: groupFilesByFolder(result.files),
      },
    });
  }
);

// GET /api/appointment/patient/receipts - List patient receipts
patientAppointmentApp.get(
  "/patient/receipts",
  zValidator("query", getPatientReceiptsSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const payload = c.get("jwtPayload");
    if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
    const userId = payload.id!;
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
              screeningType: { select: { id: true, name: true } },
              patientId: true,
            },
          },
        },
      }),
      db.transaction.count({
        where: { appointments: { some: { patientId: userId } } },
      }),
    ]);
    const safeReceipts = receipts.map((r) => ({
      id: r.id!,
      appointments: r.appointments.map((a) => ({
        id: a.id!,
        appointmentDate: a.appointmentDate.toISOString(),
        screeningType: { id: a.screeningType.id!, name: a.screeningType.name! },
        patientId: a.patientId!,
      })),
      createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
    }));
    return c.json<TGetPatientReceiptsResponse>({
      ok: true,
      data: {
        receipts: safeReceipts,
        page,
        pageSize: size,
        total,
        totalPages: Math.ceil(total / size),
      },
    });
  }
);

// GET /api/appointment/patient/receipts/:id - Get specific patient receipt
patientAppointmentApp.get("/patient/receipts/:id", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id!;
  const id = c.req.param("id");
  const receipt = await db.transaction.findUnique({
    where: { id },
    include: {
      appointments: {
        select: {
          id: true,
          patientId: true,
          appointmentDate: true,
          screeningType: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!receipt || !receipt.appointments.some((a) => a.patientId === userId)) {
    return c.json({ ok: false, message: "Not found or forbidden" }, 404);
  }
  const safeReceipt = {
    id: receipt.id!,
    appointments: receipt.appointments.map((a) => ({
      id: a.id!,
      appointmentDate: a.appointmentDate.toISOString(),
      screeningType: { id: a.screeningType.id!, name: a.screeningType.name! },
      patientId: a.patientId!,
    })),
    createdAt: receipt.createdAt ? receipt.createdAt.toISOString() : undefined,
  };
  return c.json<TGetPatientReceiptResponse>({ ok: true, data: safeReceipt });
});

// GET /api/appointment/patient/:id/checkin-code - Get appointment check-in code
patientAppointmentApp.get("/:id/checkin-code", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload) return c.json({ ok: false, message: "Unauthorized" }, 401);
  const userId = payload.id!;
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
  return c.json<TGetCheckInCodeResponse>({
    ok: true,
    data: {
      checkInCode: appointment.checkInCode!,
      expiresAt: appointment.checkInCodeExpiresAt
        ? appointment.checkInCodeExpiresAt.toISOString()
        : null,
    },
  });
});
