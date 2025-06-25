import { QueryKeys } from '@/services/keys'
import { queryOptions } from '@tanstack/react-query'
import {
  fetchAllScreeningTypes,
  fetchScreeningTypeById,
  fetchScreeningTypeByName,
  fetchScreeningTypeCategories,
  fetchScreeningTypes,
  fetchScreeningTypesByCategory,
} from '../screeningType.service'

export const useScreeningTypes = (params: {
  page?: number
  pageSize?: number
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypes, params],
    queryFn: () => fetchScreeningTypes(params),
  })

export const useAllScreeningTypes = (search?: string) =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypesAll, search],
    queryFn: () => fetchAllScreeningTypes(search),
  })

export const useScreeningTypeCategories = () =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypeCategories],
    queryFn: fetchScreeningTypeCategories,
  })

export const useScreeningTypesByCategory = (
  categoryId: string,
  params: { page?: number; pageSize?: number; search?: string },
) =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypesCategory, categoryId, params],
    queryFn: () => fetchScreeningTypesByCategory(categoryId, params),
    enabled: !!categoryId,
  })

export const useScreeningTypeById = (id: string) =>
  queryOptions({
    queryKey: [QueryKeys.screeningType, id],
    queryFn: () => fetchScreeningTypeById(id),
    enabled: !!id,
  })

export const useScreeningTypeByName = (name: string) =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypeByName, name],
    queryFn: () => fetchScreeningTypeByName(name),
    enabled: !!name,
  })
