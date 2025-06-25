import { MutationKeys, QueryKeys } from '@/services/keys'
import { queryOptions, useMutation } from '@tanstack/react-query'
import { getCenterAppointmentsSchema } from '@zerocancer/shared/schemas/appointment.schema'
import type { z } from 'zod'
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
