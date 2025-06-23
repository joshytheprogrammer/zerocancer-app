import { useMutation } from '@tanstack/react-query'
import * as patientService from '@/services/patient.service'

export const useBookSelfPayAppointment = () => {
  return useMutation({
    mutationKey: ['bookSelfPayAppointment'],
    mutationFn: patientService.bookSelfPayAppointment,
  })
}
