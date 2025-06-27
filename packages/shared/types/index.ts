export type TPaginationParams = {
  page?: number;
  limit?: number;
};

export type TDataResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

export type TErrorResponse = {
  ok: false;
  error: any;
  err_code?: string;
  cause?: string;
};

export type TPaginatedResponse<T> = {
  ok: boolean;
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TScreeningCenterRegisterResponse = TDataResponse<{
  centerId: string;
  centerName: string;
  email: string;
  phoneNumber: string;
  address: string;
  state: string;
  localGovernment: string;
  services: string[];
}>;

export type TPatientRegisterResponse = TDataResponse<{
  patientId: string;
  email: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female";
  state: string;
  localGovernment: string;
}>;

export type TDonorRegisterResponse = TDataResponse<{
  donorId: string;
  email: string;
  fullName: string;
  phone: string;
  organization?: string;
}>;

export type TLoginResponse = TDataResponse<{
  // tokens: {
  //   accessToken: string;
  //   refreshToken: string;
  // };
  token: string;
  user: {
    userId: string;
    fullName: string;
    email: string;
    profile: "PATIENT" | "DONOR" | "CENTER";
  };
}>;

export type TAuthMeResponse = TDataResponse<{
  user: {
    id: string;
    fullName: string;
    email: string;
    profile: "PATIENT" | "DONOR" | "CENTER";
  };
}>;

export type TRefreshTokenResponse = TDataResponse<{
  token: string;
  // newRefreshToken: string;
}>;

export type TCheckProfilesResponse = TDataResponse<{
  profiles: ("PATIENT" | "DONOR")[];
}>;

export type TActors = "patient" | "donor" | "center";

export type TNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

export type TNotificationRecipient = {
  id: string;
  userId: string;
  notificationId: string;
  read: boolean;
  readAt: string | null;
  notification: TNotification;
};

export type TGetNotificationsResponse = TDataResponse<TNotificationRecipient[]>;
export type TMarkNotificationReadResponse = TDataResponse<{
  id: string;
  read: boolean;
  readAt: string | null;
}>;
export type TCreateNotificationResponse = TDataResponse<TNotification>;

export type TForgotPasswordResponse = TDataResponse<{}>;
export type TResetPasswordResponse = TDataResponse<{}>;
export type TVerifyEmailResponse = TDataResponse<{}>;
export type TResendVerificationResponse = TDataResponse<{ message?: string }>;
export type TLogoutResponse = TDataResponse<{ message: string }>;

// Patient appointment/flow types
export type TPatientAppointment = {
  id: string;
  patientId: string;
  centerId: string;
  screeningTypeId: string;
  appointmentDate: string;
  appointmentTime: string;
  isDonation: boolean;
  status: string;
  transactionId?: string;
  checkInCode?: string;
  checkInCodeExpiresAt?: string | null;
  donationId?: string;
  center?: {
    id: string;
    centerName: string;
    address: string;
    state: string;
    lga: string;
  };
  screeningType?: { id: string; name: string };
  transaction?: any;
  result?: any;
};

export type TWaitlist = {
  id: string;
  screeningTypeId: string;
  patientId: string;
  status: string;
};

export type TCenterSummary = {
  id: string;
  centerName: string;
  address: string;
  state: string;
  lga: string;
};

export type TCenter = {
  id: string;
  email: string;
  centerName: string;
  address: string;
  state: string;
  lga: string;
  phone: string | null;
  bankAccount: string | null;
  bankName: string | null;
  status: string;
  createdAt: string;
  services: Array<{
    id: string;
    name: string;
  }>;
  staff: Array<{
    id: string;
    email: string;
  }>;
};

export type TGetCentersResponse = TDataResponse<{
  centers: TCenter[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export type TGetCenterByIdResponse = TDataResponse<TCenter>;

export type TResultFile = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: string;
  // Soft delete fields
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
};

export type TPatientResult = {
  id: string;
  notes: string | null;
  uploadedAt: string;
  appointment: {
    id: string;
    appointmentDate: string;
    appointmentTime?: string;
    screeningType: {
      id: string;
      name: string;
    };
    center: {
      id: string;
      centerName: string;
      address?: string;
    };
  };
  files: TResultFile[];
  folders: Record<string, TResultFile[]>;
};

export type TUploadResultsResponse = TDataResponse<{
  resultId: string;
  filesCount: number;
}>;

export type TGetPatientResultByIdResponse = TDataResponse<TPatientResult>;

// Soft delete and completion response types
export type TDeleteResultFileResponse = TDataResponse<{
  fileId: string;
  deletedAt: string;
}>;

export type TRestoreResultFileResponse = TDataResponse<{
  fileId: string;
  restoredAt: string;
}>;

export type TCompleteAppointmentResponse = TDataResponse<{
  appointmentId: string;
  completedAt: string;
  status: 'COMPLETED';
}>;

// For admin (post-MVP)
export type TGetDeletedFilesResponse = TDataResponse<{
  files: Array<TResultFile & {
    appointmentId: string;
    patientName: string;
    centerName: string;
    deletedByStaffName: string;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

// Enhanced appointment type with completion info
export type TAppointmentDetails = {
  id: string;
  status: string;
  // ... other existing appointment fields would be here
  completedAt?: string;
  completionNotes?: string;
  canBeCompleted: boolean; // Computed field indicating if results exist
};

// ...existing types continue...

export type TBookSelfPayAppointmentResponse = TDataResponse<{
  appointment: TPatientAppointment;
}>;
export type TJoinWaitlistResponse = TDataResponse<{ waitlist: TWaitlist }>;
export type TGetPatientWaitlistsResponse = TDataResponse<{
  waitlists: Array<{
    id: string;
    screeningTypeId: string;
    patientId: string;
    status: string;
    joinedAt: string;
    claimedAt: string | null;
    screeningType: {
      id: string;
      name: string;
    };
    allocation?: {
      id: string;
      campaign: {
        id: string;
        purpose: string;
      };
    } | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export type TGetAllWaitlistsResponse = TDataResponse<{
  waitlists: Array<{
    screeningTypeId: string;
    screeningType: {
      id: string;
      name: string;
    };
    pendingCount: number;
    totalCount: number;
    demand: number; // Same as pendingCount, for clarity
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export type TGetEligibleCentersResponse = TDataResponse<{
  centers: TCenterSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;
export type TSelectCenterResponse = TDataResponse<{
  appointment: TPatientAppointment;
}>;
export type TGetPatientAppointmentsResponse = TDataResponse<{
  appointments: TPatientAppointment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;
export type TGetCheckInCodeResponse = TDataResponse<{
  checkInCode: string;
  expiresAt: string | null;
}>;
export type TVerifyCheckInCodeResponse = TDataResponse<{
  valid: boolean;
  appointmentId?: string;
  message?: string;
}>;
export type TGetPatientResultsResponse = TDataResponse<{
  results: TPatientResult[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

// Placeholder for receipt types (to be implemented later)
export type TPatientReceipt = {
  id: string;
  // Add receipt properties later
};

export type TGetPatientReceiptsResponse = TDataResponse<{
  receipts: TPatientReceipt[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;
export type TGetPatientReceiptResponse = TDataResponse<TPatientReceipt>;

export type TScreeningType = {
  id: string;
  name: string;
  description?: string | null;
  screeningTypeCategoryId: string;
  active: boolean;
};

export type TScreeningTypeCategory = {
  id: string;
  name: string;
};

export type TGetScreeningTypesResponse = {
  ok: boolean;
  data: TScreeningType[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

export type TGetScreeningTypeCategoriesResponse = {
  ok: boolean;
  data: TScreeningTypeCategory[];
};

export type TGetScreeningTypeResponse = {
  ok: boolean;
  data: TScreeningType;
};

export type TInviteStaffResponse = TDataResponse<{
  invites: Array<{ email: string; token: string }>;
}>;

export type TCreateCenterStaffPasswordResponse = TDataResponse<{
  staffId: string;
}>;

export type TCenterStaffForgotPasswordResponse = TDataResponse<{
  message: string;
}>;
export type TCenterStaffResetPasswordResponse = TDataResponse<{
  message: string;
}>;

export type TCenterStaffLoginResponse = TDataResponse<{
  token: string;
  user: {
    userId: string;
    email: string;
    profile: "CENTER_STAFF";
    centerId: string;
  };
}>;

export type TCenterAppointment = {
  id: string;
  patient: { id: string; fullName: string };
  screeningType: { id: string; name: string };
  status: string;
  [key: string]: any;
};

export type TGetCenterAppointmentsResponse = {
  ok: boolean;
  data: {
    appointments: TCenterAppointment[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type TGetCenterAppointmentByIdResponse = {
  ok: boolean;
  data: TCenterAppointment;
};

export type TCancelCenterAppointmentResponse = {
  ok: boolean;
  data: { id: string };
};

// ========================================
// DONATION & CAMPAIGN TYPES
// ========================================

export type TDonationCampaign = {
  id: string;
  donorId: string;
  title: string;
  description: string;
  targetAmount: number;
  initialAmount: number;
  availableAmount: number;
  reservedAmount: number;
  usedAmount: number;
  purpose?: string;
  targetGender?: 'MALE' | 'FEMALE' | 'ALL';
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetStates?: string[];
  targetLgas?: string[];
  status: 'ACTIVE' | 'COMPLETED' | 'DELETED';
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  donor: {
    id: string;
    fullName: string;
    email: string;
    organizationName?: string;
  };
  screeningTypes: Array<{
    id: string;
    name: string;
  }>;
  patientsHelped: number;
  allocationsCount: number;
};

export type TDonationTransaction = {
  id: string;
  type: 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  paymentReference: string;
  paymentChannel: string;
  createdAt: string;
  
  // For donations
  donationData?: {
    message?: string;
    isAnonymous: boolean;
    campaignId?: string;
  };
};

export type TCampaignAnalytics = {
  overview: {
    totalFunded: number;
    totalUsed: number;
    totalReserved: number;
    availableAmount: number;
    patientsHelped: number;
    averagePerPatient: number;
    completionPercentage: number;
  };
  timeline: Array<{
    date: string;
    allocations: number;
    amountUsed: number;
    patientsHelped: number;
  }>;
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    stateDistribution: Record<string, number>;
    lgaDistribution: Record<string, number>;
  };
  screeningTypes: Array<{
    id: string;
    name: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  centers: Array<{
    id: string;
    name: string;
    patientCount: number;
    totalAmount: number;
  }>;
};

// ========================================
// DONATION API RESPONSE TYPES
// ========================================

export type TAnonymousDonationResponse = TDataResponse<{
  transactionId: string;
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}>;

export type TCreateCampaignResponse = TDataResponse<{
  campaign: TDonationCampaign;
  payment: {
    transactionId: string;
    reference: string;
    authorizationUrl: string;
    accessCode: string;
  };
}>;

export type TFundCampaignResponse = TDataResponse<{
  campaignId: string;
  transactionId: string;
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}>;

export type TGetCampaignsResponse = TDataResponse<{
  campaigns: TDonationCampaign[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export type TGetCampaignResponse = TDataResponse<TDonationCampaign>;

export type TGetCampaignAnalyticsResponse = TDataResponse<TCampaignAnalytics>;

export type TUpdateCampaignResponse = TDataResponse<{
  campaign: TDonationCampaign;
}>;

export type TDeleteCampaignResponse = TDataResponse<{
  campaignId: string;
  action: 'recycle_to_general' | 'transfer_to_campaign' | 'request_refund';
  amountProcessed: number;
  message: string;
}>;

export type TPaymentInitializationResponse = TDataResponse<{
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}>;

export type TPaymentVerificationResponse = TDataResponse<{
  reference: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  paidAt?: string;
  channel?: string;
  paymentType: 'anonymous_donation' | 'campaign_creation' | 'campaign_funding';
  relatedData?: {
    campaignId?: string;
    transactionId?: string;
  };
}>;

export type TGetDonationHistoryResponse = TDataResponse<{
  donations: Array<{
    id: string;
    type: 'anonymous_donation' | 'campaign_creation' | 'campaign_funding';
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    reference: string;
    createdAt: string;
    campaign?: {
      id: string;
      title: string;
    };
    receipt?: {
      id: string;
      downloadUrl: string;
    };
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;
