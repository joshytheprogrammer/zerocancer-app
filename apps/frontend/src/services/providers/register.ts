import * as service from '@/services'
import { MutationKeys } from '@/services/keys'
import {
  centerSchema,
  donorSchema,
  patientSchema,
} from '@shared/schemas/register'
import type {
  TErrorResponse,
  TScreeningCenterRegisterResponse,
} from '@shared/types'
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { z } from 'zod'

// export const usePatientRegistrationOptions = queryOptions({
//   queryKey: [QueryKeys.r],
//   queryFn: () => dataService.getConversations(),
//   refetchOnMount: false,
//   refetchOnWindowFocus: false,
//   refetchOnReconnect: false,
//   retry: false,
// });

export const usePatientRegistration = () =>
  useMutation({
    mutationKey: [MutationKeys.registerPatient],
    mutationFn: (params: z.infer<typeof patientSchema>) => {
      return service.registerPatient(params)
    },
  })

export const useDonorRegistration = () =>
  useMutation({
    mutationKey: [MutationKeys.registerDonor],
    mutationFn: (params: z.infer<typeof donorSchema>) => {
      return service.registerDonor(params)
    },
  })

export const useCenterRegistration = () =>
  useMutation<
    TScreeningCenterRegisterResponse,
    AxiosError<TErrorResponse>,
    z.infer<typeof centerSchema>
  >({
    mutationKey: [MutationKeys.registerCenter],
    mutationFn: (params: z.infer<typeof centerSchema>) => {
      return service.registerCenter(params)
    },
  })
