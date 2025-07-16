import { zValidator } from "@hono/zod-validator";
import {
  bookSelfPayAppointmentSchema,
  getPatientAppointmentByIdSchema,
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
  TGetPatientAppointmentByIdResponse,
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
import { initializePaystackPayment } from "../donation";

export const patientAppointmentApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// Middleware to ensure user is authenticated
patientAppointmentApp.use(authMiddleware(["patient"]));

// POST /api/appointment/patient/book
patientAppointmentApp.post(
  "/book",
  zValidator("json", bookSelfPayAppointmentSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const {
      screeningTypeId,
      centerId,
      appointmentDateTime,
      // paymentReference,
    } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    if (!payload) {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    }
    const userId = payload.id!;
    if (!userId) {
      return c.json<TErrorResponse>(
        { ok: false, error: "User ID not found in token" },
        401
      );
    }

    const result = await db.serviceCenterScreeningType.findUnique({
      where: {
        centerId_screeningTypeId: {
          centerId: centerId!,
          screeningTypeId: screeningTypeId!,
        },
      },
    });

    if (!result) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Screening type not available at this center" },
        400
      );
    }

    // TODO: Validate input, authenticate user, verify payment with Paystack
    const paymentReference = `book-appointment-${
      payload.id
    }-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

    // turn in transaction
    const transaction = await db.transaction.create({
      data: {
        type: "APPOINTMENT",
        status: "PENDING",
        amount: result?.amount,
        paymentReference, // store actual paystack payment reference
        paymentChannel: "PAYSTACK",
      },
    });

    const appointment = await db.appointment.create({
      data: {
        patientId: userId!,
        centerId: centerId!,
        screeningTypeId: screeningTypeId!,
        appointmentDateTime: new Date(appointmentDateTime!),
        isDonation: false,
        status: "PENDING", // Set initial status to PENDING
        transactionId: transaction.id!, // Link appointment to transaction
        // create helper function to generate check-in code
        // UPDATE: write checkincode logic in paystack hook when things are recieved
        // checkInCode: crypto.randomBytes(6).toString("hex").toUpperCase(),
        // checkInCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: {
        transaction: true,
        center: true,
        screeningType: true,
        result: true,
      },
    });

    const paystackResponse = await initializePaystackPayment(c, {
      email: payload.email!,
      amount: result.amount * 100, // Use the amount from the screening type
      reference: paymentReference,
      paymentType: "appointment_booking",
      patientId: userId,
      metadata: {
        appointmentId: appointment.id,
      },
    });

    // Strictly shape the appointment object to TPatientAppointment
    const safeAppointment = {
      id: appointment.id!,
      patientId: appointment.patientId!,
      centerId: appointment.centerId!,
      screeningTypeId: appointment.screeningTypeId!,
      appointmentDateTime: appointment.appointmentDateTime.toISOString(),
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
      data: {
        appointment: safeAppointment,
        payment: {
          transactionId: paymentReference,
          reference: paymentReference,
          authorizationUrl: paystackResponse.authorization_url,
          accessCode: paystackResponse.access_code,
        },
      },
    });
  }
);

// GET /api/appointment/patient/matches/eligible-centers/:allocationId
patientAppointmentApp.get(
  "/matches/eligible-centers/:allocationId",
  async (c) => {
    const db = getDB();
    const payload = c.get("jwtPayload");
    if (!payload)
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
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
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid or already assigned allocation" },
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
    if (!payload)
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    const userId = payload.id!;
    const { allocationId, centerId, appointmentDateTime } = c.req.valid("json");
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
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid or already assigned allocation" },
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
        appointmentDateTime: new Date(appointmentDateTime!),
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
      appointmentDateTime: appointment.appointmentDateTime.toISOString(),
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
    if (!payload)
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
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
        orderBy: { appointmentDateTime: "desc" },
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
      appointmentDateTime: a.appointmentDateTime.toISOString(),
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
            appointmentDateTime: true,
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
          appointmentDateTime:
            result.appointment.appointmentDateTime.toISOString(),
          screeningType: result.appointment.screeningType,
          center: result.appointment.center,
        },
        files: result.files.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          filePath: file.filePath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          cloudinaryUrl: file.cloudinaryUrl,
          uploadedAt: file.uploadedAt.toISOString(),
          isDeleted: file.isDeleted,
        })),
        folders: groupFilesByFolder(result.files),
      },
    });
  }
);

// // GET /api/appointment/patient/receipts - List patient receipts
// patientAppointmentApp.get(
//   "/patient/receipts",
//   zValidator("query", getPatientReceiptsSchema, (result, c) => {
//     if (!result.success)
//       return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
//   }),
//   async (c) => {
//     const db = getDB();
//     const payload = c.get("jwtPayload");
//     if (!payload)
//       return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
//     const userId = payload.id!;
//     const page = parseInt(c.req.query("page") || "1", 10);
//     const size = parseInt(c.req.query("size") || "20", 10);
//     const [receipts, total] = await Promise.all([
//       db.transaction.findMany({
//         where: { appointments: { some: { patientId: userId } } },
//         skip: (page - 1) * size,
//         take: size,
//         orderBy: { createdAt: "desc" },
//         include: {
//           appointments: {
//             select: {
//               id: true,
//               appointmentDate: true,
//               screeningType: { select: { id: true, name: true } },
//               patientId: true,
//             },
//           },
//         },
//       }),
//       db.transaction.count({
//         where: { appointments: { some: { patientId: userId } } },
//       }),
//     ]);
//     const safeReceipts = receipts.map((r) => ({
//       id: r.id!,
//       appointments: r.appointments.map((a) => ({
//         id: a.id!,
//         appointmentDate: a.appointmentDate.toISOString(),
//         screeningType: { id: a.screeningType.id!, name: a.screeningType.name! },
//         patientId: a.patientId!,
//       })),
//       createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
//     }));
//     return c.json<TGetPatientReceiptsResponse>({
//       ok: true,
//       data: {
//         receipts: safeReceipts,
//         page,
//         pageSize: size,
//         total,
//         totalPages: Math.ceil(total / size),
//       },
//     });
//   }
// );

// GET /api/appointment/patient/receipts/:id - Get specific patient receipt
patientAppointmentApp.get("/patient/receipts/:id", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload)
    return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
  const userId = payload.id!;
  const id = c.req.param("id");
  const receipt = await db.transaction.findUnique({
    where: { id },
    include: {
      appointments: {
        select: {
          id: true,
          patientId: true,
          appointmentDateTime: true,
          screeningType: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!receipt || !receipt.appointments.some((a) => a.patientId === userId)) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Not found or forbidden" },
      404
    );
  }
  const safeReceipt = {
    id: receipt.id!,
    appointments: receipt.appointments.map((a) => ({
      id: a.id!,
      appointmentDateTime: a.appointmentDateTime.toISOString(),
      screeningType: { id: a.screeningType.id!, name: a.screeningType.name! },
      patientId: a.patientId!,
    })),
    createdAt: receipt.createdAt ? receipt.createdAt.toISOString() : undefined,
  };
  return c.json<TGetPatientReceiptResponse>({ ok: true, data: safeReceipt });
});

// GET /api/appointment/patient/:id - Get appointment details by ID
patientAppointmentApp.get("/:id", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload)
    return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);

  const userId = payload.id!;
  const id = c.req.param("id");

  const appointment = await db.appointment.findUnique({
    where: { id },
    include: {
      center: {
        select: {
          id: true,
          centerName: true,
          address: true,
          state: true,
          lga: true,
          phone: true,
          email: true,
        },
      },
      screeningType: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      transaction: true,
      result: {
        include: {
          files: {
            where: { deletedAt: null }, // Only get non-deleted files
            select: {
              id: true,
              fileName: true,
              fileType: true,
              cloudinaryUrl: true,
              uploadedAt: true,
            },
          },
        },
      },
      verification: {
        include: {
          verifier: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!appointment || appointment.patientId !== userId) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Appointment not found" },
      404
    );
  }

  const safeAppointment = {
    id: appointment.id!,
    patientId: appointment.patientId!,
    centerId: appointment.centerId!,
    screeningTypeId: appointment.screeningTypeId!,
    appointmentDateTime: appointment.appointmentDateTime.toISOString(),
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
    cancellationReason:
      appointment.cancellationReason === null
        ? undefined
        : appointment.cancellationReason,
    cancellationDate: appointment.cancellationDate
      ? appointment.cancellationDate.toISOString()
      : undefined,
    createdAt: appointment.createdAt.toISOString(),
    center: appointment.center
      ? {
          id: appointment.center.id!,
          centerName: appointment.center.centerName!,
          address: appointment.center.address!,
          state: appointment.center.state!,
          lga: appointment.center.lga!,
          phoneNumber: appointment.center.phone!,
          email: appointment.center.email!,
        }
      : undefined,
    screeningType: appointment.screeningType
      ? {
          id: appointment.screeningType.id!,
          name: appointment.screeningType.name!,
          description:
            appointment.screeningType.description === null
              ? undefined
              : appointment.screeningType.description,
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
    result: appointment.result
      ? {
          id: appointment.result.id!,
          notes:
            appointment.result.notes === null
              ? undefined
              : appointment.result.notes,
          uploadedAt: appointment.result.uploadedAt.toISOString(),
          files: appointment.result.files.map((file) => ({
            id: file.id!,
            fileName: file.fileName!,
            fileType: file.fileType!,
            cloudinaryUrl: file.cloudinaryUrl!,
            uploadedAt: file.uploadedAt.toISOString(),
          })),
        }
      : undefined,
    verification: appointment.verification
      ? {
          id: appointment.verification.id!,
          verifiedAt: appointment.verification.verifiedAt.toISOString(),
          verifier: appointment.verification.verifier
            ? {
                id: appointment.verification.verifier.id!,
                email: appointment.verification.verifier.email!,
              }
            : undefined,
        }
      : undefined,
  };

  return c.json<TGetPatientAppointmentByIdResponse>({
    ok: true,
    data: safeAppointment,
  });
});

// GET /api/appointment/patient/:id/checkin-code - Get appointment check-in code
patientAppointmentApp.get("/:id/checkin-code", async (c) => {
  const db = getDB();
  const payload = c.get("jwtPayload");
  if (!payload)
    return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
  const userId = payload.id!;
  const id = c.req.param("id");
  const appointment = await db.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      patientId: true,
      checkInCode: true,
      checkInCodeExpiresAt: true,
      appointmentDateTime: true,
      status: true,
    },
  });
  if (!appointment || appointment.patientId !== userId) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Not found or forbidden" },
      404
    );
  }
  // Optionally, check if code is expired
  if (
    appointment.checkInCodeExpiresAt &&
    new Date() > appointment.checkInCodeExpiresAt
  ) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Check-in code expired" },
      410
    );
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
