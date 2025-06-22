import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import {
  centerSchema,
  donorSchema,
  patientSchema,
} from '@shared/schemas/register'
import type {
  TDonorRegisterResponse,
  TPatientRegisterResponse,
  TScreeningCenterRegisterResponse,
} from '@shared/types'
import { z } from 'zod'

export const registerPatient = (
  params: z.infer<typeof patientSchema>,
): Promise<TPatientRegisterResponse> => {
  return request.post(endpoints.registerUser('patient'), params)
}

export const registerDonor = (
  params: z.infer<typeof donorSchema>,
): Promise<TDonorRegisterResponse> => {
  return request.post(endpoints.registerUser('donor'), params)
}

export const registerCenter = (
  params: z.infer<typeof centerSchema>,
): Promise<TScreeningCenterRegisterResponse> => {
  return request.post(endpoints.registerUser('center'), params)
}
