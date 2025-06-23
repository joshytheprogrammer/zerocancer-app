import * as patientService from '@/services/patient.service'
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { MutationKeys, QueryKeys } from '../keys'

export const useBookSelfPayAppointment = () => {
  return useMutation({
    mutationKey: ['bookSelfPayAppointment'],
    mutationFn: patientService.bookSelfPayAppointment,
  })
}

// Get eligible centers for a matched allocation
export const useEligibleCenters = (
  allocationId: string,
  page = 1,
  size = 20,
  state?: string,
  lga?: string,
) =>
  queryOptions({
    queryKey: [
      QueryKeys.authUser,
      'eligibleCenters',
      allocationId,
      page,
      size,
      state,
      lga,
    ],
    queryFn: () =>
      patientService.getEligibleCenters(allocationId, page, size, state, lga),
    enabled: !!allocationId,
  })

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
