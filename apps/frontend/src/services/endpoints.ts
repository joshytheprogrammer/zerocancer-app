import * as t from '@zerocancer/shared/types'

const buildQuery = (params: Record<string, unknown>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    })
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => `${key}=${encodeURIComponent(v)}`).join('&')
      }
      return `${key}=${encodeURIComponent(String(value))}`
    })
    .join('&')
  return query ? `?${query}` : ''
}

// 🔌 Zerocancer MVP API ROUTES
export const backendHealth = () => '/api/healthz'

// USER REGISTRATION
export const registerUser = (actor: t.TActors) => `/api/register/${actor}`
export const checkProfiles = () => '/api/register/check-profiles'
// export const checkEmail = (email: string) =>
//   `/api/register/check-email?email=${encodeURIComponent(email)}`

// AUTHENTICATION
export const loginUser = (actor: t.TActors) =>
  `/api/auth/login${buildQuery({ actor })}`
export const logoutUser = () => '/api/auth/logout'
export const authUser = () => '/api/auth/me'
export const refreshToken = (retry?: boolean) =>
  `/api/auth/refresh${retry === true ? '?retry=true' : ''}`
export const forgotPassword = () => '/api/auth/forgot-password'
export const resetPassword = () => '/api/auth/reset-password'
export const verifyEmail = () => '/api/auth/verify-email'
export const resendVerification = () => '/api/auth/resend-verification'

// PATIENT
export const getAppointments = (page = 1, size = 20) =>
  `/api/patient/appointments${buildQuery({ page, size })}`
export const createSelfPayAppointment = () => '/api/patient/appointments/book'
export const getQR = () => '/api/patient/qr'
export const getResults = (page = 1, size = 20) =>
  `/api/patient/results${buildQuery({ page, size })}`
export const getWaitlists = (params: {
  page?: number
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'EXPIRED'
}) =>
  `/api/waitlist/patient${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    status: params.status ?? undefined,
  })}`

export const getAllWaitlists = (params: {
  page?: number
  pageSize?: number
  demandOrder?: 'asc' | 'desc'
}) =>
  `/api/waitlist${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    demandOrder: params.demandOrder ?? 'desc',
  })}`
export const joinWaitlist = () => '/api/waitlist/patient/join'
export const selectCenter = () => '/api/patient/select-center'
export const getReceipt = (id: string) => `/api/patient/receipt/${id}`
export const getEligibleCenters = (
  allocationId: string,
  page = 1,
  size = 20,
  state?: string,
  lga?: string,
) =>
  `/api/patient/matches/eligible-centers/${allocationId}${buildQuery({ page, size, state, lga })}`
export const selectCenterAfterMatch = () => `/api/patient/matches/select-center`
export const getPatientAppointments = (params: {
  page?: number
  size?: number
  status?: string
}) => `/api/appointment/patient${buildQuery(params)}`

export const getPatientResults = (params: {
  page?: number
  pageSize?: number
}) => `/api/appointment/patient/results${buildQuery(params)}`

export const getPatientResult = (id: string) =>
  `/api/appointment/patient/results/${id}`
// Get check-in code for an appointment
export const getCheckInCode = (appointmentId: string) =>
  `/api/patient/appointments/${appointmentId}/checkin-code`
// Center verifies a check-in code
export const verifyCheckInCode = () => `/api/center/appointments/verify`

// DONOR
export const donateAnonymous = () => '/api/donor/donations/anonymous'
export const createCampaign = () => '/api/donor/campaigns'
export const getCampaigns = (page = 1, size = 20) =>
  `/api/donor/campaigns${buildQuery({ page, size })}`
export const getCampaign = (id: string) => `/api/donor/campaigns/${id}`
export const deleteCampaign = (id: string) =>
  `/api/donor/campaigns/${id}/delete`
export const getDonorReceipts = (page = 1, size = 20) =>
  `/api/donor/receipts${buildQuery({ page, size })}`
export const getDonationImpact = () => '/api/donor/impact'

// CENTER
export const getCenters = (params: {
  page?: number
  pageSize?: number
  search?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  state?: string
  lga?: string
}) =>
  `/api/center${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    search: params.search ?? undefined,
    status: params.status ?? undefined,
    state: params.state ?? undefined,
    lga: params.lga ?? undefined,
  })}`

export const getCenterById = (id: string) => `/api/center/${id}`

export const getCenterAppointments = (params: {
  page?: number
  pageSize?: number
  screeningType?: string
}) =>
  `/api/appointment/center${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    screeningType: params.screeningType ?? undefined,
  })}`

export const getCenterAppointmentById = (id: string) =>
  `/api/appointment/center/${id}`

export const cancelCenterAppointment = (id: string) =>
  `/api/appointment/center/${id}/cancel`

export const uploadResults = (appointmentId: string) =>
  `/api/appointment/center/${appointmentId}/upload-results`

// Result file management endpoints
export const deleteResultFile = (fileId: string) =>
  `/api/appointment/center/files/${fileId}`
export const restoreResultFile = (fileId: string) =>
  `/api/appointment/center/files/${fileId}/restore`

// Appointment completion endpoint
export const completeAppointment = (appointmentId: string) =>
  `/api/appointment/center/${appointmentId}/complete`

// ADMIN
export const getUsers = (page = 1, size = 20) =>
  `/api/admin/users${buildQuery({ page, size })}`
export const getAdminCenters = (page = 1, size = 20) =>
  `/api/admin/centers${buildQuery({ page, size })}`
export const approveCenter = (id: string) => `/api/admin/centers/${id}/approve`
export const getAllCampaigns = (page = 1, size = 20) =>
  `/api/admin/campaigns${buildQuery({ page, size })}`
export const updateCampaignStatus = (id: number) =>
  `/api/admin/campaigns/${id}/status`
export const getAllAppointments = (page = 1, size = 20) =>
  `/api/admin/appointments${buildQuery({ page, size })}`
export const getTransactions = (page = 1, size = 20) =>
  `/api/admin/transactions${buildQuery({ page, size })}`
export const getAnalytics = (page = 1, size = 20) =>
  `/api/admin/analytics${buildQuery({ page, size })}`
export const getStoreItems = (page = 1, size = 20) =>
  `/api/admin/store${buildQuery({ page, size })}`
export const manageRoles = (page = 1, size = 20) =>
  `/api/admin/roles${buildQuery({ page, size })}`
export const resendReceipt = () => '/api/admin/receipts/resend'

// Notification endpoints
export const getNotifications = () => `/api/notifications`
export const markNotificationRead = (notificationRecipientId: string) =>
  `/api/notifications/${notificationRecipientId}/read`
export const createNotification = () => `/api/notifications`

export const getPatientReceipts = (params: { page?: number; size?: number }) =>
  `/api/patient/receipts${buildQuery({
    page: params.page ?? 1,
    size: params.size ?? 20,
  })}`
export const getPatientReceipt = (id: string) => `/api/patient/receipts/${id}`

// Screening types
export const getScreeningTypes = (params: {
  page?: number
  pageSize?: number
  search?: string
}) =>
  `/api/screening-types${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    search: params.search ?? undefined,
  })}`
export const getAllScreeningTypes = (search?: string) =>
  `/api/screening-types/all${buildQuery({ search })}`
export const getScreeningTypeCategories = () =>
  `/api/screening-types/categories`
export const getScreeningTypesByCategory = (
  categoryId: string,
  params: { page?: number; pageSize?: number; search?: string },
) =>
  `/api/screening-types/category/${categoryId}${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    search: params.search ?? undefined,
  })}`
export const getScreeningTypeById = (id: string) => `/api/screening-types/${id}`
export const getScreeningTypeByName = (name: string) =>
  `/api/screening-types/by-name/${encodeURIComponent(name)}`

// CENTER STAFF
export const centerStaffForgotPassword = () =>
  '/api/center/staff/forgot-password'
export const centerStaffResetPassword = () => '/api/center/staff/reset-password'
export const inviteStaff = () => '/api/center/staff/invite'
export const createCenterStaffPassword = () =>
  '/api/center/staff/create-new-password'
export const centerStaffLogin = () => '/api/center/staff/login'
