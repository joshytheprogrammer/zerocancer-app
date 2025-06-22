import { zValidator } from "@hono/zod-validator";
import {
  centerSchema,
  donorSchema,
  patientSchema,
} from "@shared/schemas/register";
import type {
  TDonorRegisterResponse,
  TErrorResponse,
  TPatientRegisterResponse,
  TScreeningCenterRegisterResponse,
} from "@shared/types";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getDB } from "src/lib/db";

export const registerApp = new Hono();

// Patient Registration
registerApp.post(
  "/register/patient",
  zValidator("json", patientSchema, (result, c) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const db = getDB();
    const data = c.req.valid("json");
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "patient_already_registered",
          error: "Email already registered",
        },
        409
      );
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const patient = await db.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
        profile: "PATIENT",
        patientProfile: {
          create: {
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            city: data.localGovernment,
            state: data.state,
          },
        },
      },
    });
    return c.json<TPatientRegisterResponse>(
      {
        ok: true,
        message: "Patient registered successfully",
        data: { patientId: patient.id },
      },
      201
    );
  }
);

// Donor Registration
registerApp.post(
  "/register/donor",
  zValidator("json", donorSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "invalid_donor_data",
          error: result.error,
        },
        400
      );
  }),
  async (c) => {
    const db = getDB();
    const data = c.req.valid("json");
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "donor_already_registered",
          error: "Email already registered",
        },
        409
      );
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const donor = await db.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: hashedPassword,
        phone: data.phone,
        profile: "DONOR",
        donorProfile: {
          create: {
            organizationName: data.organization || "",
          },
        },
      },
    });
    return c.json<TDonorRegisterResponse>(
      {
        ok: true,
        message: "Donor registered successfully",
        data: { donorId: donor.id },
      },
      201
    );
  }
);

// Center Registration
registerApp.post(
  "/register/center",
  zValidator("json", centerSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "invalid_center_data",
          error: result.error,
        },
        400
      );
  }),
  async (c) => {
    const db = getDB();
    const data = c.req.valid("json");
    const existing = await db.serviceCenter.findUnique({
      where: { email: data.email },
    });
    if (existing)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "center_already_registered",
          error: "Email already registered",
        },
        409
      );
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const center = await db.serviceCenter.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        centerName: data.centerName,
        phone: data.phoneNumber,
        address: data.address,
        state: data.state,
        lga: data.localGovernment,
        // services: data.services,
        bankAccount: "", //data?.bankAccount,
      },
    });
    return c.json<TScreeningCenterRegisterResponse>(
      {
        ok: true,
        message: "Center registered successfully",
        data: { centerId: center.id },
      },
      201
    );
  }
);
