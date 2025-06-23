import * as authService from '@/services/auth.service'
import { ACCESS_TOKEN_KEY, MutationKeys } from '@/services/keys'
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { loginSchema } from '@zerocancer/shared/schemas/auth.schema'
import type {
  TActors,
  TAuthMeResponse,
  TErrorResponse,
  TLoginResponse,
} from '@zerocancer/shared/types'
import type { AxiosError } from 'axios'
import type { z } from 'zod'

export const useLogin = () => {
  const queryClient = useQueryClient()
  return useMutation<
    TLoginResponse,
    AxiosError<TErrorResponse>,
    { params: z.infer<typeof loginSchema>; actor: TActors }
  >({
    mutationKey: [MutationKeys.loginUser],
    mutationFn: ({ params, actor }) => authService.loginUser(params, actor),
    onSettled: (data) => {
      if (data?.data?.token) {
        // Store access token in React Query cache
        queryClient.setQueryData([ACCESS_TOKEN_KEY], data.data.token)
      }
    },
  })
}

export const useAccessToken = () => {
  const queryClient = useQueryClient()
  return queryClient.getQueryData<string>([ACCESS_TOKEN_KEY])
}

export const useAuthUser = () =>
  queryOptions<TAuthMeResponse, AxiosError<TErrorResponse>>({
    queryKey: ['authUser'],
    queryFn: authService.authUser,
    retry: false,
  })

const useLogout = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationKey: [MutationKeys.logoutUser],
    mutationFn: authService.logout,
    onSuccess: () => {
      // Remove access token and user data from React Query cache
      queryClient.clear()
      navigate({ to: '/login', replace: true, reloadDocument: true })
    },
  })
}

export const logOut = () => {
  const { mutate: logout } = useLogout()
  logout()
}

export const useCheckProfiles = () => {
  return queryOptions({
    queryKey: ['checkProfiles'],
    queryFn: authService.checkProfiles,
    retry: false,
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutationKey: [MutationKeys.forgotPassword],
    mutationFn: (email: string) => authService.forgotPassword(email),
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationKey: [MutationKeys.resetPassword],
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
  })
}

export const useVerifyEmail = () => {
  return useMutation({
    mutationKey: [MutationKeys.verifyEmail],
    mutationFn: (token: string) => authService.verifyEmail(token),
  })
}

export const useResendVerification = () => {
  return useMutation({
    mutationKey: [MutationKeys.resendVerification],
    mutationFn: ({
      email,
      profileType,
    }: {
      email: string
      profileType: string
    }) => authService.resendVerification(email, profileType),
  })
}
