import { zValidator } from "@hono/zod-validator";
import {
  cancelCenterAppointmentSchema,
  completeAppointmentSchema,
  deleteResultFileSchema,
  getCenterAppointmentByIdSchema,
  getCenterAppointmentsSchema,
  rescheduleCenterAppointmentSchema,
  restoreResultFileSchema,
  uploadResultsSchema,
  verifyCheckInCodeSchema,
} from "@zerocancer/shared";
import type {
  TCancelCenterAppointmentResponse,
  TCompleteAppointmentResponse,
  TDataResponse,
  TDeleteResultFileResponse,
  TErrorResponse,
  TGetCenterAppointmentByIdResponse,
  TGetCenterAppointmentsResponse,
  TRestoreResultFileResponse,
  TUploadResultsResponse,
  TVerifyCheckInCodeResponse,
} from "@zerocancer/shared/types";
import { stat } from "fs";
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

// GET /api/appointment/center - List appointments (paginated, filterable)
centerAppointmentApp.get(
  "/",
  zValidator("query", getCenterAppointmentsSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const {
      page = 1,
      pageSize = 20,
      screeningType,
      status,
    } = c.req.valid("query");
    const where: any = {};
    if (screeningType) where.screeningTypeId = screeningType;
    // Optionally, filter by centerId from JWT
    const payload = c.get("jwtPayload");
    const centerId = payload?.id!; // Use centerId or id from JWT
    if (centerId) where.centerId = centerId;
    if (status) where.status = status; // Use exact match for status
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

    // Transform the appointments to match the expected type
    const transformedAppointments = appointments.map((appointment) => ({
      ...appointment,
      appointmentDate: appointment.appointmentDate.toISOString(),
      appointmentTime: appointment.appointmentTime.toISOString(),
      createdAt: appointment.createdAt.toISOString(),
      cancellationDate: appointment.cancellationDate?.toISOString() || null,
      checkInCodeExpiresAt:
        appointment.checkInCodeExpiresAt?.toISOString() || null,
    }));

    return c.json<TGetCenterAppointmentsResponse>({
      ok: true,
      data: {
        appointments: transformedAppointments,
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  }
);

// GET /api/appointment/center/:id - Get appointment details
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

    // Transform the appointment to match the expected type
    const transformedAppointment = {
      ...appointment,
      appointmentDate: appointment.appointmentDate.toISOString(),
      appointmentTime: appointment.appointmentTime.toISOString(),
      createdAt: appointment.createdAt.toISOString(),
      cancellationDate: appointment.cancellationDate?.toISOString() || null,
      checkInCodeExpiresAt:
        appointment.checkInCodeExpiresAt?.toISOString() || null,
    };

    return c.json<TGetCenterAppointmentByIdResponse>({
      ok: true,
      data: transformedAppointment,
    });
  }
);

// POST /api/appointment/center/:id/cancel - Cancel appointment
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
    return c.json<TCancelCenterAppointmentResponse>({
      ok: true,
      data: { id: id! },
    });
  }
);

// POST /api/appointment/center/:id/reschedule - Reschedule appointment
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

// POST /api/appointment/center/verify - Verify check-in code
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
      console.log(
        appointmentDate.getDate(),
        today.getDate(),
        appointmentDate.getMonth(),
        today.getMonth(),
        appointmentDate.getFullYear(),
        today.getFullYear()
      );
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
          appointmentId: appointment.id, // Link to appointment ID
          verifiedBy: staffId!, // Center staff ID from JWT or in case of admin - the id of the center is the same with the id of a n admin ceenter staff
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
      await createNotificationForUsers(
        {
          type: "CHECK_IN_CONFIRMED",
          title: "Check-in Confirmed",
          message: `Your appointment at ${appointment.center.centerName} has been confirmed. Please proceed with your screening.`,
          userIds: [appointment.patientId],
          data: { appointmentId: appointment.id },
        },
        true
      ); // Enable email notification for appointment check-in
    } catch (error) {
      // Log the error but don't fail the request
      console.error("Failed to send notification:", error);
    }

    // Send notification to donors if this is a donated appointment
    if (appointment.isDonation) {
      try {
        // Find all donors who funded this appointment
        const allocations = await db.donationAllocation.findMany({
          where: { appointmentId: appointment.id },
          include: {
            campaign: {
              select: { donorId: true },
            },
          },
        });

        const donorIds = [
          ...new Set(
            allocations.map((allocation) => allocation.campaign.donorId)
          ),
        ];

        if (donorIds.length > 0) {
          await createNotificationForUsers({
            type: "PATIENT_CHECKED_IN",
            title: "Patient Has Checked In",
            message: `A patient you funded has checked in for their ${appointment.screeningType.name} screening at ${appointment.center.centerName}. Their appointment is now in progress.`,
            userIds: donorIds,
            data: {
              appointmentId: appointment.id,
              screeningType: appointment.screeningType.name,
              centerName: appointment.center.centerName,
              patientId: appointment.patientId,
            },
          });
        }
      } catch (error) {
        // Log the error but don't fail the request
        console.error("Failed to send donor check-in notification:", error);
      }
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

// POST /api/appointment/center/:id/upload-results - Upload screening results
centerAppointmentApp.post(
  "/:id/upload-results",
  zValidator("json", uploadResultsSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { id } = c.req.param();
    const { files, notes } = c.req.valid("json");
    const payload = c.get("jwtPayload");

    if (!payload?.id) {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    }

    // Verify appointment exists and belongs to center
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        center: true,
        patient: { select: { id: true, fullName: true } },
      },
    });

    if (!appointment) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found" },
        404
      );
    }

    if (appointment.centerId !== payload.id) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment does not belong to your center" },
        403
      );
    }

    // Check if appointment is in valid state for result upload
    if (!["IN_PROGRESS", "SCHEDULED"].includes(appointment.status!)) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Appointment is not in a valid state for result upload",
        },
        400
      );
    }

    try {
      // Create or update screening result with files in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create or update screening result
        const screeningResult = await tx.screeningResult.upsert({
          where: { appointmentId: id },
          create: {
            appointmentId: id,
            notes,
            uploadedBy: payload.id!,
          },
          update: {
            notes,
            uploadedBy: payload.id!,
            uploadedAt: new Date(),
          },
        });

        // Create file records
        if (files && files.length > 0) {
          await tx.screeningResultFile.createMany({
            data: files.map((file) => ({
              resultId: screeningResult.id,
              fileName: file.fileName || "unknown",
              filePath: file.filePath || "unknown",
              fileType: file.fileType || "unknown",
              fileSize: file.fileSize || 0,
              cloudinaryUrl: file.url || "",
              cloudinaryId: file.cloudinaryId || "",
            })),
          });
        }

        // Keep appointment as IN_PROGRESS - completion is manual
        await tx.appointment.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        });

        return screeningResult;
      });

      // NOTE: No patient notification on upload - only when manually completed

      return c.json<TUploadResultsResponse>({
        ok: true,
        data: {
          resultId: result.id,
          filesCount: files?.length || 0,
        },
      });
    } catch (error) {
      console.error("Error uploading results:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to upload results" },
        500
      );
    }
  }
);

// POST /api/appointment/center/:id/complete - Mark appointment as completed
centerAppointmentApp.post(
  "/:id/complete",
  zValidator("json", completeAppointmentSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { id } = c.req.param();
    const { completionNotes } = c.req.valid("json");
    const payload = c.get("jwtPayload");

    // Verify appointment belongs to center and is in correct status
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        centerId: payload?.id,
        status: "IN_PROGRESS", // Can only complete in-progress appointments
      },
      include: {
        result: {
          include: {
            files: {
              where: { isDeleted: false },
            },
          },
        },
        patient: { select: { id: true, fullName: true } },
        center: { select: { centerName: true } },
        screeningType: { select: { name: true } },
      },
    });

    if (!appointment) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found or cannot be completed" },
        404
      );
    }

    // Check if results have been uploaded
    if (!appointment.result || appointment.result.files.length === 0) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Cannot complete appointment without uploading results",
        },
        400
      );
    }

    // Mark appointment as completed
    const completedAppointment = await db.appointment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        // Note: completedAt and completionNotes could be added to schema later
      },
    });

    // NOW send notification to patient about results availability
    try {
      await createNotificationForUsers({
        type: "RESULTS_AVAILABLE",
        title: "Screening Results Available",
        message: `Your screening results for ${appointment.screeningType.name} at ${appointment.center.centerName} are now available. You can view and download them from your appointments.`,
        userIds: [appointment.patient.id!],
        data: { appointmentId: id, resultId: appointment.result.id },
      });
    } catch (error) {
      console.error("Failed to send completion notification:", error);
    }

    // Send notification to donors if this is a donated appointment
    if (appointment.isDonation) {
      try {
        // Find all donors who funded this appointment
        const allocations = await db.donationAllocation.findMany({
          where: { appointmentId: id },
          include: {
            campaign: {
              select: { donorId: true },
            },
          },
        });

        const donorIds = [
          ...new Set(
            allocations.map((allocation) => allocation.campaign.donorId)
          ),
        ];

        if (donorIds.length > 0) {
          await createNotificationForUsers({
            type: "APPOINTMENT_COMPLETED",
            title: "Screening Completed",
            message: `A patient you funded has completed their ${appointment.screeningType.name} screening at ${appointment.center.centerName}. The screening results have been uploaded.`,
            userIds: donorIds,
            data: {
              appointmentId: id,
              screeningType: appointment.screeningType.name,
              centerName: appointment.center.centerName,
              patientId: appointment.patient.id,
              resultId: appointment.result.id,
            },
          });
        }
      } catch (error) {
        // Log the error but don't fail the request
        console.error("Failed to send donor completion notification:", error);
      }
    }

    return c.json<TCompleteAppointmentResponse>({
      ok: true,
      data: {
        appointmentId: completedAppointment.id!,
        completedAt: new Date().toISOString(),
        status: "COMPLETED",
      },
    });
  }
);

// DELETE /api/appointment/center/files/:fileId - Soft delete a file
centerAppointmentApp.delete(
  "/files/:fileId",
  zValidator("json", deleteResultFileSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { fileId } = c.req.param();
    const { reason, notifyPatient = true } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const staffId = payload?.id!;

    // Verify file exists and belongs to center's appointment
    const file = await db.screeningResultFile.findFirst({
      where: {
        id: fileId,
        isDeleted: false, // Can't delete already deleted files
        result: {
          appointment: {
            centerId: payload?.id, // Use the center ID from auth payload
          },
        },
      },
      include: {
        result: {
          include: {
            appointment: {
              select: {
                id: true,
                status: true,
                patientId: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      return c.json<TErrorResponse>(
        { ok: false, error: "File not found or already deleted" },
        404
      );
    }

    // Soft delete the file
    const deletedFile = await db.screeningResultFile.update({
      where: { id: fileId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: staffId,
        deletionReason: reason || null,
      },
    });

    // Only notify patient if appointment is COMPLETED and notification is not disabled
    const shouldNotifyPatient =
      file.result.appointment.status === "COMPLETED" && notifyPatient;

    if (shouldNotifyPatient) {
      try {
        await createNotificationForUsers({
          type: "RESULT_UPDATED",
          title: "Result File Removed",
          message: `A result file "${file.fileName}" has been removed from your screening results.`,
          userIds: [file.result.appointment.patientId!],
          data: { appointmentId: file.result.appointment.id },
        });
      } catch (error) {
        console.error("Failed to send deletion notification:", error);
      }
    }

    return c.json<TDeleteResultFileResponse>({
      ok: true,
      data: {
        fileId: deletedFile.id!,
        deletedAt: deletedFile.deletedAt!.toISOString(),
      },
    });
  }
);

// POST /api/appointment/center/files/:fileId/restore - Restore a soft-deleted file
centerAppointmentApp.post(
  "/files/:fileId/restore",
  zValidator("json", restoreResultFileSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB();
    const { fileId } = c.req.param();
    const payload = c.get("jwtPayload");

    // Verify file exists and is deleted
    const file = await db.screeningResultFile.findFirst({
      where: {
        id: fileId,
        isDeleted: true, // Can only restore deleted files
        result: {
          appointment: {
            centerId: payload?.id,
          },
        },
      },
      include: {
        result: {
          include: {
            appointment: {
              select: {
                id: true,
                status: true,
                patientId: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Deleted file not found" },
        404
      );
    }

    // Restore the file
    const restoredFile = await db.screeningResultFile.update({
      where: { id: fileId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
      },
    });

    // Only notify patient if appointment is COMPLETED
    if (file.result.appointment.status === "COMPLETED") {
      try {
        await createNotificationForUsers({
          type: "RESULT_UPDATED",
          title: "Result File Restored",
          message: `Result file "${file.fileName}" has been restored to your screening results.`,
          userIds: [file.result.appointment.patientId!],
          data: { appointmentId: file.result.appointment.id },
        });
      } catch (error) {
        console.error("Failed to send restore notification:", error);
      }
    }

    return c.json<TRestoreResultFileResponse>({
      ok: true,
      data: {
        fileId: restoredFile.id!,
        restoredAt: new Date().toISOString(),
      },
    });
  }
);
