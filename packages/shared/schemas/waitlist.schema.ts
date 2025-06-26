import { z } from "zod";

export const getPatientWaitlistsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z.enum(["PENDING", "MATCHED", "EXPIRED"]).optional(),
});

export const getAllWaitlistsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  demandOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const joinWaitlistSchema = z.object({
  screeningTypeId: z
    .string()
    .min(1, { message: "Screening type is required." }),
});

export type TGetPatientWaitlistsSchema = typeof getPatientWaitlistsSchema;
export type TGetPatientWaitlistsParams = z.infer<
  typeof getPatientWaitlistsSchema
>;
export type TGetAllWaitlistsSchema = typeof getAllWaitlistsSchema;
export type TGetAllWaitlistsParams = z.infer<typeof getAllWaitlistsSchema>;
export type TJoinWaitlistSchema = typeof joinWaitlistSchema;
export type TJoinWaitlistParams = z.infer<typeof joinWaitlistSchema>;
