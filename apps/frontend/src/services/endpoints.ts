import * as t from '@shared/types'

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
export const backendHealth = () => '/healthz/'

// USER REGISTRATION
export const registerUser = (actor: t.TActors) => `/auth/register/${actor}/`

// AUTHENTICATION
export const loginUser = (actor: t.TActors) =>
  `/auth/login/${buildQuery({ actor })}`
export const logoutUser = () => '/auth/logout/'
export const forgotPassword = () => '/auth/forgot-password/'
export const resetPassword = () => '/auth/reset-password/'
export const verifyEmail = () => '/auth/verify-email/'
export const resendVerification = () => '/auth/resend-verification/'
export const authUser = () => '/auth/user/'
export const refreshToken = (retry?: boolean) =>
  `/api/auth/refresh${retry === true ? '?retry=true' : ''}`

// PATIENT
export const getAppointments = (page: number = 1, size: number = 20) =>
  `/patient/appointments/${buildQuery({ page, size })}`
export const createSelfPayAppointment = () => '/patient/appointments/book/'
export const getQR = () => '/patient/qr/'
export const getResults = (page: number = 1, size: number = 20) =>
  `/patient/results/${buildQuery({ page, size })}`
export const getWaitlists = (page: number = 1, size: number = 20) =>
  `/patient/waitlists/${buildQuery({ page, size })}`
export const joinWaitlist = () => '/patient/waitlists/join/'
export const selectCenter = () => '/patient/select-center/'
export const getReceipt = (id: string) => `/patient/receipt/${id}/`

// DONOR
export const donateAnonymous = () => '/donor/donations/anonymous/'
export const createCampaign = () => '/donor/campaigns/'
export const getCampaigns = (page: number = 1, size: number = 20) =>
  `/donor/campaigns/${buildQuery({ page, size })}`
export const getCampaign = (id: string) => `/donor/campaigns/${id}/`
export const deleteCampaign = (id: string) => `/donor/campaigns/${id}/delete/`
export const getDonorReceipts = (page: number = 1, size: number = 20) =>
  `/donor/receipts/${buildQuery({ page, size })}`
export const getDonationImpact = () => '/donor/impact/'

// CENTER
export const getCenterAppointments = (page: number = 1, size: number = 20) =>
  `/center/appointments/${buildQuery({ page, size })}`
export const verifyPatientCode = () => '/center/verify/'
export const uploadResults = (page: number = 1, size: number = 20) =>
  `/center/results/${buildQuery({ page, size })}`
export const getResultHistory = () => '/center/results-history/'
export const inviteStaff = () => '/center/staff/invite/'
export const getCenterReceipts = (page: number = 1, size: number = 20) =>
  `/center/receipt-history/${buildQuery({ page, size })}/`

// ADMIN
export const getUsers = (page: number = 1, size: number = 20) =>
  `/admin/users/${buildQuery({ page, size })}`
export const getCenters = (page: number = 1, size: number = 20) =>
  `/admin/centers/${buildQuery({ page, size })}`
export const approveCenter = (id: string) => `/admin/centers/${id}/approve/`
export const getAllCampaigns = (page: number = 1, size: number = 20) =>
  `/admin/campaigns/${buildQuery({ page, size })}`
export const updateCampaignStatus = (id: number) =>
  `/admin/campaigns/${id}/status/`
export const getAllAppointments = (page: number = 1, size: number = 20) =>
  `/admin/appointments/${buildQuery({ page, size })}`
export const getTransactions = (page: number = 1, size: number = 20) =>
  `/admin/transactions/${buildQuery({ page, size })}`
export const getAnalytics = (page: number = 1, size: number = 20) =>
  `/admin/analytics/${buildQuery({ page, size })}`
export const getStoreItems = (page: number = 1, size: number = 20) =>
  `/admin/store/${buildQuery({ page, size })}`
export const manageRoles = (page: number = 1, size: number = 20) =>
  `/admin/roles/${buildQuery({ page, size })}`
export const resendReceipt = () => '/admin/receipts/resend/'
