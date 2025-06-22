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
}>;

export type TPatientRegisterResponse = TDataResponse<{
  patientId: string;
}>;

export type TDonorRegisterResponse = TDataResponse<{
  donorId: string;
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

export type TActors = "patient" | "donor" | "center";
