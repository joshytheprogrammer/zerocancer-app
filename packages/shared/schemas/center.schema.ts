import { z } from "zod";

export const inviteStaffSchema = z.object({
  centerId: z.string().min(1),
  emails: z.array(z.string().email()).min(1),
});
