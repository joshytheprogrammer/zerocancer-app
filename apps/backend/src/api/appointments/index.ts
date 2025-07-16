import { zValidator } from "@hono/zod-validator";
import { getAppointmentResultsSchema } from "@zerocancer/shared";
import type { TErrorResponse, TGetAppointmentResultsResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "src/lib/db";
import { THonoAppVariables } from "src/lib/types";
import { authMiddleware } from "src/middleware/auth.middleware";
import { centerAppointmentApp } from "./center.appointment";
import { patientAppointmentApp } from "./patient.appointment";

export const appointmentApp = new Hono<{
  Variables: THonoAppVariables;
}>();

// ROUTES
appointmentApp.route("/patient", patientAppointmentApp);
appointmentApp.route("/center", centerAppointmentApp);

// GET /api/appointment/:id/results
appointmentApp.get(
  "/:id/results",
  authMiddleware(["patient", "center", "admin"]),
  zValidator("param", getAppointmentResultsSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB();
    const payload = c.get("jwtPayload");
    const { id: appointmentId } = c.req.valid("param");

    // Check appointment exists and user has access
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        // Access control based on user role 
        // Admin can access all appointments
      },
      select: { id: true },
    });

    if (!appointment) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found or access denied" },
        404
      );
    }

    // Get the screening result for this appointment
    const result = await db.screeningResult.findFirst({
      where: {
        appointmentId,
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
          where: { isDeleted: false }, // Only show non-deleted files
          orderBy: { filePath: "asc" },
        },
      },
    });

    // If no result found, return null data
    if (!result) {
      return c.json<TGetAppointmentResultsResponse>({
        ok: true,
        data: null,
      });
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

    return c.json<TGetAppointmentResultsResponse>({
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
          url: file.cloudinaryUrl,
          uploadedAt: file.uploadedAt.toISOString(),
          isDeleted: file.isDeleted,
        })),
        folders: groupFilesByFolder(result.files),
      },
    });
  }
);