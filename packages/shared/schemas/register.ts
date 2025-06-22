import { z } from "zod";

export const patientSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." }),
  phone: z.string().min(7, { message: "Please enter a valid phone number." }),
  dateOfBirth: z.string({ required_error: "Date of birth is required." }),
  gender: z.enum(["male", "female"], { message: "Please select a gender." }),
  state: z.string().min(1, { message: "Please select a state." }),
  localGovernment: z
    .string()
    .min(1, { message: "Please select a local government." }),
});

export const donorSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." }),
  phone: z.string().min(7, { message: "Please enter a valid phone number." }),
  organization: z.string().optional(),
});

export const centerSchema = z.object({
  centerName: z
    .string()
    .min(2, { message: "Center name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  phoneNumber: z
    .string()
    .min(7, { message: "Please enter a valid phone number." }),
  address: z.string().min(5, { message: "Please enter a valid address." }),
  state: z.string().min(1, { message: "Please select a state." }),
  localGovernment: z
    .string()
    .min(1, { message: "Please select a local government." }),
  services: z.array(z.string(), {
    required_error: "Please select at least one service.",
  }),
  // bankAccount: z.string().min(8),
});