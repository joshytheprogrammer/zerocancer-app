import { z } from "zod";

export const getCenterAppointmentsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  screeningType: z.string().optional(),
});

export const getCenterAppointmentByIdSchema = z.object({
  id: z.string().min(1),
});

export const cancelCenterAppointmentSchema = z.object({
  reason: z.string().optional(),
});

export const rescheduleCenterAppointmentSchema = z.object({
  newDate: z.string().min(1),
  newTime: z.string().min(1),
  reason: z.string().optional(),
});

export type TGetCenterAppointmentsSchema = typeof getCenterAppointmentsSchema;
export type TGetCenterAppointmentsParams = z.infer<
  typeof getCenterAppointmentsSchema
>;
