import request from '@/lib/request'
import {
  screeningTypeCategorySchema,
  screeningTypeSchema,
} from '@zerocancer/shared/schemas/screeningType.schema'
import type {
  TGetScreeningTypeCategoriesResponse,
  TGetScreeningTypeResponse,
  TGetScreeningTypesResponse,
} from '@zerocancer/shared/types'
import { z } from 'zod'
import * as endpoints from './endpoints'

const ScreeningTypeArraySchema = z.array(screeningTypeSchema)
const ScreeningTypeCategoryArraySchema = z.array(screeningTypeCategorySchema)

export const fetchScreeningTypes = async (params: {
  page?: number
  pageSize?: number
  search?: string
}): Promise<TGetScreeningTypesResponse> => {
  const res = await request.get<TGetScreeningTypesResponse>(
    endpoints.getScreeningTypes(params),
  )
  return {
    ...res,
    data: ScreeningTypeArraySchema.parse(res.data),
  }
}

export const fetchAllScreeningTypes = async (
  search?: string,
): Promise<TGetScreeningTypesResponse> => {
  const res = await request.get<TGetScreeningTypesResponse>(
    endpoints.getAllScreeningTypes(search),
  )
  return {
    ...res,
    data: ScreeningTypeArraySchema.parse(res.data),
  }
}

export const fetchScreeningTypeCategories =
  async (): Promise<TGetScreeningTypeCategoriesResponse> => {
    const res = await request.get<TGetScreeningTypeCategoriesResponse>(
      endpoints.getScreeningTypeCategories(),
    )
    return {
      ...res,
      data: ScreeningTypeCategoryArraySchema.parse(res.data),
    }
  }

export const fetchScreeningTypesByCategory = async (
  categoryId: string,
  params: { page?: number; pageSize?: number; search?: string },
): Promise<TGetScreeningTypesResponse> => {
  const res = await request.get<TGetScreeningTypesResponse>(
    endpoints.getScreeningTypesByCategory(categoryId, params),
  )
  return {
    ...res,
    data: ScreeningTypeArraySchema.parse(res.data),
  }
}

export const fetchScreeningTypeById = async (
  id: string,
): Promise<TGetScreeningTypeResponse> => {
  const res = await request.get<TGetScreeningTypeResponse>(
    endpoints.getScreeningTypeById(id),
  )
  return {
    ...res,
    data: screeningTypeSchema.parse(res.data),
  }
}

export const fetchScreeningTypeByName = async (
  name: string,
): Promise<TGetScreeningTypeResponse> => {
  const res = await request.get<TGetScreeningTypeResponse>(
    endpoints.getScreeningTypeByName(name),
  )
  return {
    ...res,
    data: screeningTypeSchema.parse(res.data),
  }
}
