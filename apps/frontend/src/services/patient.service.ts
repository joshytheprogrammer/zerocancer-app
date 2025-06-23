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
