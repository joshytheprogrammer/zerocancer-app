import * as patientService from '@/services/patient.service'
import { useMutation } from '@tanstack/react-query'

export const useBookSelfPayAppointment = () => {
  return useMutation({
    mutationKey: ['bookSelfPayAppointment'],
    mutationFn: patientService.bookSelfPayAppointment,
  })
}

export const useJoinWaitlist = () => {
  return useMutation({
    mutationKey: ['joinWaitlist'],
    mutationFn: patientService.joinWaitlist,
  })
}
