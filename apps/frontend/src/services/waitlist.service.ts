import request from '@/lib/request'
import {
  getAllWaitlistsSchema,
  getPatientWaitlistsSchema,
  joinWaitlistSchema,
} from '@zerocancer/shared/schemas/waitlist.schema'
import type {
  TGetAllWaitlistsResponse,
  TGetPatientWaitlistsResponse,
  TJoinWaitlistResponse,
} from '@zerocancer/shared/types'
import type { z } from 'zod'
import * as endpoints from './endpoints'

// --- General Waitlist Management ---

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

// --- Patient Waitlist Management ---

export const getPatientWaitlists = async (
  params: z.infer<typeof getPatientWaitlistsSchema>,
): Promise<TGetPatientWaitlistsResponse> => {
  // Validate params using shared Zod schema
  const parsed = getPatientWaitlistsSchema.safeParse(params)
  if (!parsed.success) {
    throw new Error('Invalid params for getPatientWaitlists')
  }
  const res = await request.get(endpoints.getWaitlists(parsed.data))
  return res as TGetPatientWaitlistsResponse
}

export const joinWaitlist = async (
  params: z.infer<typeof joinWaitlistSchema>,
): Promise<TJoinWaitlistResponse> => {
  // Validate params using shared Zod schema
  const parsed = joinWaitlistSchema.safeParse(params)
  if (!parsed.success) {
    throw new Error('Invalid params for joinWaitlist')
  }
  const res = await request.post(endpoints.joinWaitlist(), parsed.data)
  return res as TJoinWaitlistResponse
}
