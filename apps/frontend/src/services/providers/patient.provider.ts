import * as patientService from '@/services/patient.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MutationKeys, QueryKeys } from '../keys'

export const useBookSelfPayAppointment = () => {
  return useMutation({
    mutationKey: ['bookSelfPayAppointment'],
    mutationFn: patientService.bookSelfPayAppointment,
  })
}

// Get eligible centers for a matched allocation
export function useEligibleCenters(allocationId: string) {
  return useQuery({
    queryKey: [QueryKeys.authUser, 'eligibleCenters', allocationId],
    queryFn: () => patientService.getEligibleCenters(allocationId),
    enabled: !!allocationId,
  })
}

// Select center for a matched allocation
export function useSelectCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.selectCenter],
    mutationFn: patientService.selectCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.authUser, 'patientAppointments'],
      })
    },
  })
}
