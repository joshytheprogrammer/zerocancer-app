import { z } from "zod";

export const getPatientWaitlistsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z.enum(["PENDING", "MATCHED", "EXPIRED"]).optional(),
});
