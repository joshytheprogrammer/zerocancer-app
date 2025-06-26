import { MutationKeys, QueryKeys } from '@/services/keys'
import { queryOptions, useMutation } from '@tanstack/react-query'
import {
  getAllWaitlistsSchema,
  // getPatientWaitlistsSchema,
} from '@zerocancer/shared/schemas/waitlist.schema'
import type { z } from 'zod'
import * as waitlistService from '../waitlist.service'

// --- General Waitlist Query Providers ---

export const allWaitlists = (params: z.infer<typeof getAllWaitlistsSchema>) =>
  queryOptions({
    queryKey: [QueryKeys.allWaitlists, params],
    queryFn: () => waitlistService.getAllWaitlists(params),
  })

// --- Patient Waitlist Query Providers ---

// export const patientWaitlists = (
//   params: z.infer<typeof getPatientWaitlistsSchema>,
// ) =>
//   queryOptions({
//     queryKey: [QueryKeys.patientWaitlists, params],
//     queryFn: () => waitlistService.getPatientWaitlists(params),
//   })

// --- Waitlist Mutations ---

export const useJoinWaitlist = () =>
  useMutation({
    mutationKey: [MutationKeys.joinWaitlist],
    mutationFn: waitlistService.joinWaitlist,
  })
