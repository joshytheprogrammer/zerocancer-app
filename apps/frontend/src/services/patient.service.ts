import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'

// Book self-pay appointment
export const bookSelfPayAppointment = async (data: {
  screeningTypeId: string
  centerId: string
  appointmentDate: string
  appointmentTime: string
  paymentReference: string
}) => {
  return await request.post(endpoints.createSelfPayAppointment(), data)
}

// Join donation-based waitlist
export const joinWaitlist = async (data: { screeningTypeId: string }) => {
  return await request.post(endpoints.joinWaitlist(), data)
}

// Get eligible centers for a matched allocation
export const getEligibleCenters = async (
  allocationId: string,
  page = 1,
  size = 20,
  state: string | undefined,
  lga: string | undefined,
) => {
  return await request.get(
    endpoints.getEligibleCenters(allocationId, page, size, state, lga),
  )
}

// Select center for a matched allocation
export const selectCenter = async (data: {
  allocationId: string
  centerId: string
  appointmentDate: string
  appointmentTime: string
}) => {
  return await request.post(endpoints.selectCenter(), data)
}

// Get patient appointments (paginated, filterable)
export const getPatientAppointments = async (params: {
  page?: number
  size?: number
  status?: string
}) => {
  return await request.get(endpoints.getPatientAppointments(params))
}

// Get check-in code for an appointment
export const getCheckInCode = async (appointmentId: string) => {
  return await request.get(endpoints.getCheckInCode(appointmentId))
}

// Center verifies a check-in code
export const verifyCheckInCode = async (code: string) => {
  return await request.get(endpoints.verifyCheckInCode(code))
}

// Get patient screening results (paginated)
export const getPatientResults = async (params: {
  page?: number
  size?: number
}) => {
  return await request.get(endpoints.getPatientResults(params))
}

// Get a specific screening result
export const getPatientResult = async (id: string) => {
  return await request.get(endpoints.getPatientResult(id))
}

// Get patient receipts (paginated)
export const getPatientReceipts = async (params: {
  page?: number
  size?: number
}) => {
  return await request.get(endpoints.getPatientReceipts(params))
}

// Get a specific receipt
export const getPatientReceipt = async (id: string) => {
  return await request.get(endpoints.getPatientReceipt(id))
}
