import request from '@/lib/request'
import { getAllWaitlistsSchema } from '@zerocancer/shared/schemas/waitlist.schema'
import type { TGetAllWaitlistsResponse } from '@zerocancer/shared/types'
import type { z } from 'zod'
import * as endpoints from './endpoints'

// --- General/Admin Waitlist Management ---

export const getAllWaitlists = async (
  params: z.infer<typeof getAllWaitlistsSchema>,
): Promise<TGetAllWaitlistsResponse> => {
  // Validate params using shared Zod schema
  const parsed = getAllWaitlistsSchema.safeParse(params)
  if (!parsed.success) {
    throw new Error('Invalid params for getAllWaitlists')
  }
  const res = await request.get(endpoints.getAllWaitlists(parsed.data))
  return res as TGetAllWaitlistsResponse
}
