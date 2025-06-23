// import * as t from '@zerocancer/shared/types'
import axios from 'axios'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// export async function paginate<T>(
//   prismaQuery: () => Promise<T[]>,
//   prismaCount: () => Promise<number>,
//   { page = 1, limit = 20 }: t.TPaginationParams,
// ): Promise<t.TPaginatedResponse<T>> {
//   const skip = (page - 1) * limit

//   const [data, total] = await Promise.all([prismaQuery(), prismaCount()])

//   return {
//     data,
//     page,
//     limit,
//     total,
//     totalPages: Math.ceil(total / limit),
//   }
// }

export function setAcceptLanguageHeader(value: string): void {
  axios.defaults.headers.common['Accept-Language'] = value
}

export function setTokenHeader(token: string) {
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token
}
