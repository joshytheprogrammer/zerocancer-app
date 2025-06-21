export type TPaginationParams = {
  page?: number;
  limit?: number;
};

export type TPaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TRefreshTokenResponse = {
  // token: {
  //   accessToken: string;
  //   refreshToken: string;
  // }
  token: string;
  // user: TUser;
};
// export type TRefreshTokenResponse = {
//   token: string;
//   user: TUser;
// };
export type TErrorResponse = {
  error: string;
  message: string;
};

export type TActors = "patient" | "donor" | "center" | "admin";
