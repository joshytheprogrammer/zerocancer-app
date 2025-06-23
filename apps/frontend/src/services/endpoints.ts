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
export const getAppointments = (page: number = 1, size: number = 20) =>
  `/api/patient/appointments${buildQuery({ page, size })}`
export const createSelfPayAppointment = () => '/api/patient/appointments/book'
export const getQR = () => '/api/patient/qr'
export const getResults = (page: number = 1, size: number = 20) =>
  `/api/patient/results${buildQuery({ page, size })}`
export const getWaitlists = (page: number = 1, size: number = 20) =>
  `/api/patient/waitlists${buildQuery({ page, size })}`
export const joinWaitlist = () => '/api/patient/waitlists/join'
export const selectCenter = () => '/api/patient/select-center'
export const getReceipt = (id: string) => `/api/patient/receipt/${id}`

// DONOR
export const donateAnonymous = () => '/api/donor/donations/anonymous'
export const createCampaign = () => '/api/donor/campaigns'
export const getCampaigns = (page: number = 1, size: number = 20) =>
  `/api/donor/campaigns${buildQuery({ page, size })}`
export const getCampaign = (id: string) => `/api/donor/campaigns/${id}`
export const deleteCampaign = (id: string) =>
  `/api/donor/campaigns/${id}/delete`
export const getDonorReceipts = (page: number = 1, size: number = 20) =>
  `/api/donor/receipts${buildQuery({ page, size })}`
export const getDonationImpact = () => '/api/donor/impact'

// CENTER
export const getCenterAppointments = (page: number = 1, size: number = 20) =>
  `/api/center/appointments${buildQuery({ page, size })}`
export const verifyPatientCode = () => '/api/center/verify'
export const uploadResults = (page: number = 1, size: number = 20) =>
  `/api/center/results${buildQuery({ page, size })}`
export const getResultHistory = () => '/api/center/results-history'
export const inviteStaff = () => '/api/center/staff/invite'
export const getCenterReceipts = (page: number = 1, size: number = 20) =>
  `/api/center/receipt-history${buildQuery({ page, size })}`

// ADMIN
export const getUsers = (page: number = 1, size: number = 20) =>
  `/api/admin/users${buildQuery({ page, size })}`
export const getCenters = (page: number = 1, size: number = 20) =>
  `/api/admin/centers${buildQuery({ page, size })}`
export const approveCenter = (id: string) => `/api/admin/centers/${id}/approve`
export const getAllCampaigns = (page: number = 1, size: number = 20) =>
  `/api/admin/campaigns${buildQuery({ page, size })}`
export const updateCampaignStatus = (id: number) =>
  `/api/admin/campaigns/${id}/status`
export const getAllAppointments = (page: number = 1, size: number = 20) =>
  `/api/admin/appointments${buildQuery({ page, size })}`
export const getTransactions = (page: number = 1, size: number = 20) =>
  `/api/admin/transactions${buildQuery({ page, size })}`
export const getAnalytics = (page: number = 1, size: number = 20) =>
  `/api/admin/analytics${buildQuery({ page, size })}`
export const getStoreItems = (page: number = 1, size: number = 20) =>
  `/api/admin/store${buildQuery({ page, size })}`
export const manageRoles = (page: number = 1, size: number = 20) =>
  `/api/admin/roles${buildQuery({ page, size })}`
export const resendReceipt = () => '/api/admin/receipts/resend'

// Notification endpoints
export const getNotifications = () => `/api/notifications`
export const markNotificationRead = (notificationRecipientId: string) =>
  `/api/notifications/${notificationRecipientId}/read`
export const createNotification = () => `/api/notifications`
