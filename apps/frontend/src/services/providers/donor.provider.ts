import * as donorService from '@/services/donor.service'
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { MutationKeys, QueryKeys } from '../keys'

// Anonymous donation mutation
export const useDonateAnonymous = () => {
  return useMutation({
    mutationKey: [MutationKeys.donateAnonymous],
    mutationFn: donorService.donateAnonymous,
  })
}

// Create campaign mutation
export const useCreateCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.createCampaign],
    mutationFn: donorService.createCampaign,
    onSuccess: () => {
      // Invalidate campaigns list when a new campaign is created
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.donorCampaigns],
      })
    },
  })
}

// Get donor's campaigns (paginated, filterable)
export const useDonorCampaigns = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.donorCampaigns, params],
    queryFn: () => donorService.getCampaigns(params),
  })

// Get donor's campaigns with infinite loading (paginated, filterable)
export const useDonorCampaignsInfinite = (params: {
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.donorCampaigns, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return donorService.getCampaigns({
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

// Get specific campaign details
export const useDonorCampaign = (campaignId: string) =>
  queryOptions({
    queryKey: [QueryKeys.donorCampaign, campaignId],
    queryFn: () => donorService.getCampaign(campaignId),
    enabled: !!campaignId,
  })
