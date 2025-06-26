import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import {
  bookSelfPayAppointmentSchema,
  getPatientAppointmentsSchema,
  getPatientReceiptsSchema,
  getPatientResultsSchema,
  selectCenterSchema,
} from '@zerocancer/shared/schemas/register.schema'
import { getPatientWaitlistsSchema, joinWaitlistSchema } from '@zerocancer/shared/schemas/waitlist.schema'
import type {
  TBookSelfPayAppointmentResponse,
  TGetCheckInCodeResponse,
  TGetEligibleCentersResponse,
  TGetPatientAppointmentsResponse,
  TGetPatientReceiptResponse,
  TGetPatientReceiptsResponse,
  TGetPatientResultResponse,
  TGetPatientResultsResponse,
  TGetPatientWaitlistsResponse,
  TJoinWaitlistResponse,
  TSelectCenterResponse,
  TVerifyCheckInCodeResponse,
} from '@zerocancer/shared/types'
import { z } from 'zod'

// Book self-pay appointment
export const bookSelfPayAppointment = async (
  data: z.infer<typeof bookSelfPayAppointmentSchema>,
): Promise<TBookSelfPayAppointmentResponse> => {
  const res = await request.post(endpoints.createSelfPayAppointment(), data)
  return res as TBookSelfPayAppointmentResponse
}

// Join donation-based waitlist
export const joinWaitlist = async (
  data: z.infer<typeof joinWaitlistSchema>,
): Promise<TJoinWaitlistResponse> => {
  const res = await request.post(endpoints.joinWaitlist(), data)
  return res as TJoinWaitlistResponse
}

// Get patient waitlists (paginated, filterable)
export const getPatientWaitlists = async (
  params: z.infer<typeof getPatientWaitlistsSchema>,
): Promise<TGetPatientWaitlistsResponse> => {
  // Validate params using shared Zod schema
  const parsed = getPatientWaitlistsSchema.safeParse(params)
  if (!parsed.success) {
    throw new Error('Invalid params for getPatientWaitlists')
  }
  const res = await request.get(endpoints.getWaitlists(parsed.data))
  return res as TGetPatientWaitlistsResponse
}

// Get eligible centers for a matched allocation
export const getEligibleCenters = async (
  allocationId: string,
  page = 1,
  size = 20,
  state: string | undefined,
  lga: string | undefined,
): Promise<TGetEligibleCentersResponse> => {
  const res = await request.get(
    endpoints.getEligibleCenters(allocationId, page, size, state, lga),
  )
  return res as TGetEligibleCentersResponse
}

// Select center for a matched allocation
export const selectCenter = async (
  data: z.infer<typeof selectCenterSchema>,
): Promise<TSelectCenterResponse> => {
  const res = await request.post(endpoints.selectCenter(), data)
  return res as TSelectCenterResponse
}

// Get patient appointments (paginated, filterable)
export const getPatientAppointments = async (
  params: z.infer<typeof getPatientAppointmentsSchema>,
): Promise<TGetPatientAppointmentsResponse> => {
  const res = await request.get(endpoints.getPatientAppointments(params))
  return res as TGetPatientAppointmentsResponse
}

// Get check-in code for an appointment
export const getCheckInCode = async (
  appointmentId: string,
): Promise<TGetCheckInCodeResponse> => {
  const res = await request.get(endpoints.getCheckInCode(appointmentId))
  return res as TGetCheckInCodeResponse
}

// Center verifies a check-in code
export const verifyCheckInCode = async (
  code: string,
): Promise<TVerifyCheckInCodeResponse> => {
  const res = await request.post(endpoints.verifyCheckInCode(), { code })
  return res as TVerifyCheckInCodeResponse
}

// Get patient screening results (paginated)
export const getPatientResults = async (
  params: z.infer<typeof getPatientResultsSchema>,
): Promise<TGetPatientResultsResponse> => {
  const res = await request.get(endpoints.getPatientResults(params))
  return res as TGetPatientResultsResponse
}

// Get a specific screening result
export const getPatientResult = async (
  id: string,
): Promise<TGetPatientResultResponse> => {
  const res = await request.get(endpoints.getPatientResult(id))
  return res as TGetPatientResultResponse
}

// Get patient receipts (paginated)
export const getPatientReceipts = async (
  params: z.infer<typeof getPatientReceiptsSchema>,
): Promise<TGetPatientReceiptsResponse> => {
  const res = await request.get(endpoints.getPatientReceipts(params))
  return res as TGetPatientReceiptsResponse
}

// Get a specific receipt
export const getPatientReceipt = async (
  id: string,
): Promise<TGetPatientReceiptResponse> => {
  const res = await request.get(endpoints.getPatientReceipt(id))
  return res as TGetPatientReceiptResponse
}
