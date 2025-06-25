import { z } from "zod";

export const createCenterStaffPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const centerStaffForgotPasswordSchema = z.object({
  centerId: z.string().min(1),
  email: z.string().email(),
});

export const centerStaffResetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
