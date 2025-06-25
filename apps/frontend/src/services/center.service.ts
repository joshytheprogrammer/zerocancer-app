import request from '@/lib/request'
import { inviteStaffSchema } from '@zerocancer/shared/schemas/center.schema'
import {
  centerStaffForgotPasswordSchema,
  centerStaffResetPasswordSchema,
  createCenterStaffPasswordSchema,
} from '@zerocancer/shared/schemas/centerStaff.schema'
import type {
  TCenterStaffForgotPasswordResponse,
  TCenterStaffResetPasswordResponse,
  TCreateCenterStaffPasswordResponse,
  TInviteStaffResponse,
} from '@zerocancer/shared/types'
import type { z } from 'zod'
import * as endpoints from './endpoints'

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
