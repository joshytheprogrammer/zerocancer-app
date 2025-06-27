import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import {
  anonymousDonationSchema,
  createCampaignSchema,
  getCampaignsSchema,
} from '@zerocancer/shared/schemas/donation.schema'
import type {
  TAnonymousDonationResponse,
  TCreateCampaignResponse,
  TGetCampaignResponse,
  TGetCampaignsResponse,
} from '@zerocancer/shared/types'
import { z } from 'zod'

// Anonymous donation
export const donateAnonymous = async (
  data: z.infer<typeof anonymousDonationSchema>,
): Promise<TAnonymousDonationResponse> => {
  const res = await request.post(endpoints.donateAnonymous(), data)
  return res as TAnonymousDonationResponse
}

// Create campaign
export const createCampaign = async (
  data: z.infer<typeof createCampaignSchema>,
): Promise<TCreateCampaignResponse> => {
  const res = await request.post(endpoints.createCampaign(), data)
  return res as TCreateCampaignResponse
}

// Get donor's campaigns (paginated, filterable)
export const getCampaigns = async (
  params: z.infer<typeof getCampaignsSchema>,
): Promise<TGetCampaignsResponse> => {
  const res = await request.get(endpoints.getCampaigns(params))
  return res as TGetCampaignsResponse
}

// Get specific campaign details
export const getCampaign = async (
  campaignId: string,
): Promise<TGetCampaignResponse> => {
  const res = await request.get(endpoints.getCampaign(campaignId))
  return res as TGetCampaignResponse
}
