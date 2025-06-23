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
export const getEligibleCenters = async (allocationId: string) => {
  return await request.get(endpoints.getEligibleCenters(allocationId))
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
