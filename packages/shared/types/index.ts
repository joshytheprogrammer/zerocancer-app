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
    // fullName: string;
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

export type TPatientResult = {
  id: string;
  appointment: {
    id: string;
    appointmentDate: string;
    screeningType: { name: string };
  };
  uploader: { id: string; centerId: string };
  uploadedAt?: string;
  // add more fields as needed
};

export type TPatientReceipt = {
  id: string;
  appointments: Array<{
    id: string;
    appointmentDate: string;
    screeningType: { id: string; name: string };
    patientId?: string;
  }>;
  createdAt?: string;
  // add more fields as needed
};

export type TBookSelfPayAppointmentResponse = TDataResponse<{
  appointment: TPatientAppointment;
}>;
export type TJoinWaitlistResponse = TDataResponse<{ waitlist: TWaitlist }>;
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
export type TGetPatientResultResponse = TDataResponse<TPatientResult>;
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
