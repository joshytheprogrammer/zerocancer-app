import { QueryKeys } from '@/services/keys'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { getAllWaitlistsSchema } from '@zerocancer/shared/schemas/waitlist.schema'
import type { z } from 'zod'
import * as waitlistService from '../waitlist.service'

// --- General Waitlist Query Providers ---

export const allWaitlists = (params: z.infer<typeof getAllWaitlistsSchema>) =>
  queryOptions({
    queryKey: [QueryKeys.allWaitlists, params],
    queryFn: () => waitlistService.getAllWaitlists(params),
  })

// Get all waitlists with infinite loading (paginated, sortable)
export const allWaitlistsInfinite = (params: {
  pageSize?: number
  demandOrder?: 'asc' | 'desc'
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.allWaitlists, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return waitlistService.getAllWaitlists({
        ...params,
        page: pageParam,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data
      return page < totalPages ? page + 1 : undefined
    },
  })

// --- Patient Waitlist Query Providers ---

// export const patientWaitlists = (
//   params: z.infer<typeof getPatientWaitlistsSchema>,
// ) =>
//   queryOptions({
//     queryKey: [QueryKeys.patientWaitlists, params],
//     queryFn: () => waitlistService.getPatientWaitlists(params),
//   })
