import * as adminService from '@/services/admin.service'
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { MutationKeys, QueryKeys } from '../keys'

// ========================================
// CENTER MANAGEMENT
// ========================================

// Get admin centers query
export const useAdminCenters = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  state?: string
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminCenters, params],
    queryFn: () => adminService.getAdminCenters(params),
  })

// Get admin centers with infinite loading
export const useAdminCentersInfinite = (params: {
  pageSize?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  state?: string
  search?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.adminCenters, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return adminService.getAdminCenters({
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

// Update center status mutation
export const useUpdateCenterStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateCenterStatus],
    mutationFn: ({
      centerId,
      ...data
    }: {
      centerId: string
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
      reason?: string
    }) => adminService.updateCenterStatus(centerId, data),
    onSuccess: () => {
      // Invalidate centers list when status is updated
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.adminCenters],
      })
    },
  })
}

// ========================================
// USER MANAGEMENT
// ========================================

// Get admin users query
export const useAdminUsers = (params: {
  page?: number
  pageSize?: number
  profileType?: 'PATIENT' | 'DONOR'
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminUsers, params],
    queryFn: () => adminService.getAdminUsers(params),
  })

// Get admin users with infinite loading
export const useAdminUsersInfinite = (params: {
  pageSize?: number
  profileType?: 'PATIENT' | 'DONOR'
  search?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.adminUsers, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return adminService.getAdminUsers({
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

// ========================================
// CAMPAIGN MANAGEMENT
// ========================================

// Get admin campaigns query
export const useAdminCampaigns = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminCampaigns, params],
    queryFn: () => adminService.getAdminCampaigns(params),
  })

// Get admin campaigns with infinite loading
export const useAdminCampaignsInfinite = (params: {
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.adminCampaigns, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return adminService.getAdminCampaigns({
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

// Update admin campaign status mutation
export const useUpdateAdminCampaignStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateAdminCampaignStatus],
    mutationFn: ({
      campaignId,
      ...data
    }: {
      campaignId: string
      status: 'ACTIVE' | 'COMPLETED' | 'DELETED'
      reason?: string
    }) => adminService.updateAdminCampaignStatus(campaignId, data),
    onSuccess: () => {
      // Invalidate campaigns list when status is updated
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.adminCampaigns],
      })
    },
  })
}

// ========================================
// APPOINTMENT MONITORING
// ========================================

// Get admin appointments query
export const useAdminAppointments = (params: {
  page?: number
  pageSize?: number
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  centerId?: string
  isDonation?: boolean
  dateFrom?: string
  dateTo?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminAppointments, params],
    queryFn: () => adminService.getAdminAppointments(params),
  })

// Get admin appointments with infinite loading
export const useAdminAppointmentsInfinite = (params: {
  pageSize?: number
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  centerId?: string
  isDonation?: boolean
  dateFrom?: string
  dateTo?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.adminAppointments, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return adminService.getAdminAppointments({
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

// ========================================
// TRANSACTION MONITORING
// ========================================

// Get admin transactions query
export const useAdminTransactions = (params: {
  page?: number
  pageSize?: number
  type?: 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND'
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'
  dateFrom?: string
  dateTo?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminTransactions, params],
    queryFn: () => adminService.getAdminTransactions(params),
  })

// Get admin transactions with infinite loading
export const useAdminTransactionsInfinite = (params: {
  pageSize?: number
  type?: 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND'
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'
  dateFrom?: string
  dateTo?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.adminTransactions, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return adminService.getAdminTransactions({
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

// ========================================
// WAITLIST ANALYTICS
// ========================================

// Get admin waitlist query
export const useAdminWaitlist = (params: {
  page?: number
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'CLAIMED' | 'EXPIRED'
  screeningTypeId?: string
  state?: string
  groupBy?: 'state' | 'screening_type' | 'status'
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminWaitlist, params],
    queryFn: () => adminService.getAdminWaitlist(params),
  })

// Get admin waitlist with infinite loading (for non-aggregated data)
export const useAdminWaitlistInfinite = (params: {
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'CLAIMED' | 'EXPIRED'
  screeningTypeId?: string
  state?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.adminWaitlist, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return adminService.getAdminWaitlist({
        ...params,
        page: pageParam,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Check if this is paginated data (has totalPages)
      if ('totalPages' in lastPage.data) {
        const { page, totalPages } = lastPage.data
        return page < totalPages ? page + 1 : undefined
      }
      return undefined
    },
  })

// ========================================
// STORE MANAGEMENT
// ========================================

// Get admin store products query
export const useAdminStoreProducts = (params: {
  page?: number
  pageSize?: number
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminStoreProducts, params],
    queryFn: () => adminService.getAdminStoreProducts(params),
  })

// Get admin store products with infinite loading
export const useAdminStoreProductsInfinite = (params: {
  pageSize?: number
  search?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.adminStoreProducts, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return adminService.getAdminStoreProducts({
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

// Create store product mutation
export const useCreateStoreProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.createStoreProduct],
    mutationFn: (data: {
      name: string
      description?: string
      price: number
      stock: number
    }) => adminService.createStoreProduct(data),
    onSuccess: () => {
      // Invalidate store products list when a new product is created
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.adminStoreProducts],
      })
    },
  })
}

// Update store product mutation
export const useUpdateStoreProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateStoreProduct],
    mutationFn: ({
      productId,
      ...data
    }: {
      productId: string
      name?: string
      description?: string
      price?: number
      stock?: number
    }) => adminService.updateStoreProduct(productId, data),
    onSuccess: () => {
      // Invalidate store products list when a product is updated
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.adminStoreProducts],
      })
    },
  })
}

// ========================================
// EXPORT ALL HOOKS FOR CONVENIENCE
// ========================================

export const adminProviders = {
  // Centers
  useAdminCenters,
  useAdminCentersInfinite,
  useUpdateCenterStatus,

  // Users
  useAdminUsers,
  useAdminUsersInfinite,

  // Campaigns
  useAdminCampaigns,
  useAdminCampaignsInfinite,
  useUpdateAdminCampaignStatus,

  // Appointments
  useAdminAppointments,
  useAdminAppointmentsInfinite,

  // Transactions
  useAdminTransactions,
  useAdminTransactionsInfinite,

  // Waitlist
  useAdminWaitlist,
  useAdminWaitlistInfinite,

  // Store
  useAdminStoreProducts,
  useAdminStoreProductsInfinite,
  useCreateStoreProduct,
  useUpdateStoreProduct,
}
