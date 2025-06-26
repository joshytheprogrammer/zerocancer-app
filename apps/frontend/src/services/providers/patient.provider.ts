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

export const useJoinWaitlist = () => {
  return useMutation({
    mutationKey: ['joinWaitlist'],
    mutationFn: patientService.joinWaitlist,
  })
}

// Get patient waitlists (paginated, filterable)
export const usePatientWaitlists = (params: {
  page?: number
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'EXPIRED'
}) =>
  queryOptions({
    queryKey: [QueryKeys.patientWaitlists, params],
    queryFn: () => patientService.getPatientWaitlists(params),
  })

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

// Get patient appointments (paginated, filterable)
export function usePatientAppointments(params: {
  page?: number
  size?: number
  status?: string
}) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, QueryKeys.patientAppointments, params],
    queryFn: () => patientService.getPatientAppointments(params),
  })
}

// Get check-in code for an appointment
export function useCheckInCode(appointmentId: string) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, 'checkInCode', appointmentId],
    queryFn: () => patientService.getCheckInCode(appointmentId),
    enabled: !!appointmentId,
  })
}

// Center verifies a check-in code
export function useVerifyCheckInCode(code: string) {
  return queryOptions({
    queryKey: ['verifyCheckInCode', code],
    queryFn: () => patientService.verifyCheckInCode(code),
    enabled: !!code,
  })
}

// Get patient screening results (paginated)
export function usePatientResults(params: { page?: number; size?: number }) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, 'patientResults', params],
    queryFn: () => patientService.getPatientResults(params),
  })
}

// Get a specific screening result
export function usePatientResult(id: string) {
  return queryOptions({
    queryKey: [QueryKeys.authUser, 'patientResult', id],
    queryFn: () => patientService.getPatientResult(id),
    enabled: !!id,
  })
}

// // Get patient receipts (paginated)
// export function usePatientReceipts(params: { page?: number; size?: number }) {
//   return queryOptions({
//     queryKey: [QueryKeys.authUser, 'patientReceipts', params],
//     queryFn: () => patientService.getPatientReceipts(params),
//   })
// }

// // Get a specific receipt
// export function usePatientReceipt(id: string) {
//   return queryOptions({
//     queryKey: [QueryKeys.authUser, 'patientReceipt', id],
//     queryFn: () => patientService.getPatientReceipt(id),
//     enabled: !!id,
//   })
// }
