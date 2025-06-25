import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import { loginSchema } from '@zerocancer/shared/schemas/auth.schema'
import type {
  TActors,
  TAuthMeResponse,
  TCheckProfilesResponse,
  TLoginResponse,
} from '@zerocancer/shared/types'
import type { z } from 'zod'

// Login service
export const loginUser = async (
  params: z.infer<typeof loginSchema>,
  actor: TActors,
) => {
  return (await request.post(
    endpoints.loginUser(actor),
    params,
  )) as TLoginResponse
}

// Authenticated user service
export const authUser = async () => {
  try {
    // Attempt to get the authenticated user
    return await request.get<TAuthMeResponse>(endpoints.authUser())
  } catch (error) {
    // If the request fails, return null
    console.error('Error fetching authenticated user:', error)
    return null
  }
  // return await request.get<TAuthMeResponse>(endpoints.authUser())
}

// logout
export const logout = async () => {
  return await request.post(endpoints.logoutUser())
}

// Check profiles
export const checkProfiles = async (email: string) => {
  return await request.post(endpoints.checkProfiles(), { email })
}

// Forgot password
export const forgotPassword = async (email: string) => {
  return await request.post(endpoints.forgotPassword(), { email })
}

// Reset password
export const resetPassword = async (token: string, password: string) => {
  return await request.post(endpoints.resetPassword(), { token, password })
}

// Verify email
export const verifyEmail = async (token: string) => {
  return await request.post(endpoints.verifyEmail(), { token })
}

// Resend verification email
export const resendVerification = async (
  email: string,
  profileType: string,
) => {
  return await request.post(endpoints.resendVerification(), {
    email,
    profileType,
  })
}

// // request password reest
// export const requestPasswordReset = (params: t.TRequestPasswordResetParams) => {
//   return request.post(endpoints.requestPasswordReset(), params)
// }

// // reset password
// export const resetPassword = ({
//   uidb64,
//   token,
//   ...params
// }: t.TResetPasswordParams) => {
//   return request.post(endpoints.resetPassword(uidb64, token), {
//     uidb64,
//     token,
//     ...params,
//   })
// }

// // confirm email
// export const confirmEmail = (params: t.TConfirmEmailParams) => {
//   return request.post(endpoints.verifyEmail(), params)
// }

// // resend confirmation email
// export const resendConfirmEmail = (params: t.TResendConfirmEmailParams) => {
//   return request.post(endpoints.resendVerifyEmail(), params)
// }

// // 2fa setup

// // password reset

// // confirm email

// // 2fa setup
// // 2fa verify
