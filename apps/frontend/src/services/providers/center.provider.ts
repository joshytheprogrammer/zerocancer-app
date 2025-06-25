import { MutationKeys, QueryKeys } from '@/services/keys'
import { queryOptions, useMutation } from '@tanstack/react-query'
import { getCenterAppointmentsSchema } from '@zerocancer/shared/schemas/appointment.schema'
import { getCentersQuerySchema } from '@zerocancer/shared/schemas/center.schema'
import type { z } from 'zod'
import * as centerService from '../center.service'

// --- Center Query Providers ---

export const centers = (params: z.infer<typeof getCentersQuerySchema>) =>
  queryOptions({
    queryKey: [QueryKeys.centers, params],
    queryFn: () => centerService.getCenters(params),
  })

export const centerById = (id: string) =>
  queryOptions({
    queryKey: [QueryKeys.centerById, id],
    queryFn: () => centerService.getCenterById(id),
    enabled: !!id,
  })

// --- Staff Management Mutations ---

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

export const useCenterStaffLogin = () =>
  useMutation({
    mutationKey: [MutationKeys.centerStaffLogin],
    mutationFn: centerService.centerStaffLogin,
  })

export const centerAppointments = (
  params: z.infer<typeof getCenterAppointmentsSchema>,
) =>
  queryOptions({
    queryKey: [QueryKeys.centerAppointments, params],
    queryFn: () => centerService.getCenterAppointments(params),
  })

export const centerAppointmentById = (id: string) =>
  queryOptions({
    queryKey: [QueryKeys.centerAppointmentById, id],
    queryFn: () => centerService.getCenterAppointmentById(id),
    enabled: !!id,
  })

export const useCancelCenterAppointment = () =>
  useMutation({
    mutationKey: [MutationKeys.cancelCenterAppointment],
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      centerService.cancelCenterAppointment(id, { reason }),
  })

export const useVerifyCheckInCode = () =>
  useMutation({
    mutationKey: [MutationKeys.verifyCheckInCode],
    mutationFn: centerService.verifyCheckInCode,
  })
