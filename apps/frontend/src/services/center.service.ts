import request from '@/lib/request'
import { inviteStaffSchema } from '@zerocancer/shared/schemas/center.schema'
import {
  centerStaffForgotPasswordSchema,
  centerStaffLoginSchema,
  centerStaffResetPasswordSchema,
  createCenterStaffPasswordSchema,
} from '@zerocancer/shared/schemas/centerStaff.schema'
import {
  getCenterAppointmentsSchema,
  // getCenterAppointmentByIdSchema,
  cancelCenterAppointmentSchema,
} from '@zerocancer/shared/schemas/appointment.schema'
import type {
  TCenterStaffForgotPasswordResponse,
  TCenterStaffLoginResponse,
  TCenterStaffResetPasswordResponse,
  TCreateCenterStaffPasswordResponse,
  TInviteStaffResponse,
  TGetCenterAppointmentsResponse,
  TGetCenterAppointmentByIdResponse,
  TCancelCenterAppointmentResponse,
} from '@zerocancer/shared/types'
import type { z } from 'zod'
import * as endpoints from './endpoints'

// --- Appointment Management ---

export const getCenterAppointments = async (
  params: z.infer<typeof getCenterAppointmentsSchema>,
): Promise<TGetCenterAppointmentsResponse> => {
  const res = await request.get(endpoints.getCenterAppointments(params))
  return res as TGetCenterAppointmentsResponse
}

export const getCenterAppointmentById = async (
  id: string,
): Promise<TGetCenterAppointmentByIdResponse> => {
  const res = await request.get(endpoints.getCenterAppointmentById(id))
  return res as TGetCenterAppointmentByIdResponse
}

export const cancelCenterAppointment = async (
  id: string,
  params: z.infer<typeof cancelCenterAppointmentSchema>,
): Promise<TCancelCenterAppointmentResponse> => {
  const res = await request.post(
    endpoints.cancelCenterAppointment(id),
    params,
  )
  return res as TCancelCenterAppointmentResponse
}

// --- Staff Management ---

export const inviteStaff = async (
  params: z.infer<typeof inviteStaffSchema>,
): Promise<TInviteStaffResponse> => {
  const res = await request.post(endpoints.inviteStaff(), params)
  return res as TInviteStaffResponse
}

export const createCenterStaffPassword = async (
  params: z.infer<typeof createCenterStaffPasswordSchema>,
): Promise<TCreateCenterStaffPasswordResponse> => {
  const res = await request.post(endpoints.createCenterStaffPassword(), params)
  return res as TCreateCenterStaffPasswordResponse
}

export const centerStaffForgotPassword = async (
  params: z.infer<typeof centerStaffForgotPasswordSchema>,
): Promise<TCenterStaffForgotPasswordResponse> => {
  const res = await request.post(endpoints.centerStaffForgotPassword(), params)
  return res as TCenterStaffForgotPasswordResponse
}

export const centerStaffResetPassword = async (
  params: z.infer<typeof centerStaffResetPasswordSchema>,
): Promise<TCenterStaffResetPasswordResponse> => {
  const res = await request.post(endpoints.centerStaffResetPassword(), params)
  return res as TCenterStaffResetPasswordResponse
}

export const centerStaffLogin = async (
  params: z.infer<typeof centerStaffLoginSchema>,
): Promise<TCenterStaffLoginResponse> => {
  const res = await request.post(endpoints.centerStaffLogin(), params)
  return res as TCenterStaffLoginResponse
}
