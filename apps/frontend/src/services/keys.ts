// ⚙️ TanStack Query Keys
export enum QueryKeys {
  authUser = 'authUser',
  patientAppointments = 'patientAppointments',
  patientWaitlists = 'patientWaitlists',
  patientResults = 'patientResults',
  patientQR = 'patientQR',
  patientReceipt = 'patientReceipt',

  donorCampaigns = 'donorCampaigns',
  donorCampaign = 'donorCampaign',
  donorReceipts = 'donorReceipts',
  donorImpact = 'donorImpact',

  centerAppointments = 'centerAppointments',
  centerResults = 'centerResults',
  centerStaff = 'centerStaff',
  centerReceipts = 'centerReceipts',

  adminUsers = 'adminUsers',
  adminCenters = 'adminCenters',
  adminCampaigns = 'adminCampaigns',
  adminAppointments = 'adminAppointments',
  adminTransactions = 'adminTransactions',
  adminAnalytics = 'adminAnalytics',
  adminStore = 'adminStore',
  adminRoles = 'adminRoles',
  checkProfiles = 'checkProfiles',
}

export enum MutationKeys {
  registerPatient = 'registerPatient',
  registerDonor = 'registerDonor',
  registerCenter = 'registerCenter',
  forgotPassword = 'forgotPassword',
  resetPassword = 'resetPassword',
  verifyEmail = 'verifyEmail',
  loginUser = 'loginUser',
  authUser = 'authUser',
  logoutUser = 'logoutUser',
  joinWaitlist = 'joinWaitlist',
  bookAppointment = 'bookAppointment',
  uploadResult = 'uploadResult',
  verifyPatient = 'verifyPatient',
  createCampaign = 'createCampaign',
  deleteCampaign = 'deleteCampaign',
  approveCenter = 'approveCenter',
  updateCampaignStatus = 'updateCampaignStatus',
  resendReceipt = 'resendReceipt',
  donateAnonymous = 'donateAnonymous',
  inviteStaff = 'inviteStaff',
  resendVerification = 'resendVerification',
  // Notification mutations
  markNotificationRead = 'markNotificationRead',
  createNotification = 'createNotification',
}

export const ACCESS_TOKEN_KEY = 'accessToken'
