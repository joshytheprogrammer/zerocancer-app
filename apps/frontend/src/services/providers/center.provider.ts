import { MutationKeys } from '@/services/keys'
import { useMutation } from '@tanstack/react-query'
import * as centerService from '../center.service'

export const useInviteStaff = () =>
  useMutation({
    mutationKey: [MutationKeys.inviteStaff],
    mutationFn: centerService.inviteStaff,
  })

export const useCreateCenterStaffPassword = () =>
  useMutation({
    mutationKey: [MutationKeys.createCenterStaffPassword],
    mutationFn: centerService.createCenterStaffPassword,
  })

export const useCenterStaffForgotPassword = () =>
  useMutation({
    mutationKey: [MutationKeys.centerStaffForgotPassword],
    mutationFn: centerService.centerStaffForgotPassword,
  })

export const useCenterStaffResetPassword = () =>
  useMutation({
    mutationKey: [MutationKeys.centerStaffResetPassword],
    mutationFn: centerService.centerStaffResetPassword,
  })
