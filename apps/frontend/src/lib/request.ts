// import * as t from '@/lib/types'
// import * as endpoints from '@/services/endpoints'
// import type { User } from '@zerocancer/shared'
// import axios, { AxiosError, AxiosRequestConfig } from 'axios'

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || '', // Use env variable for backend URL in dev, empty string in prod
//   //   withCredentials: true, // This is IMPORTANT for sending and receiving cookies
// })

// api.interceptors.request.use((req) => {
//   console.log('This is the request:', req.baseURL + req.url)
//   return req
// })

// let isRefreshing = false
// let failedQueue: {
//   resolve: (value?: unknown) => void
//   reject: (reason?: unknown) => void
// }[] = []

// const processQueue = (error: AxiosError | null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error)
//     } else {
//       prom.resolve()
//     }
//   })
//   failedQueue = []
// }

// // Response Interceptor
// api.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError) => {
//     const originalRequest = error.config as AxiosRequestConfig & {
//       _retry?: boolean
//     } // Cast for retry flag

//     if (originalRequest.url?.includes('/api/auth/2fa') === true) {
//       return Promise.reject(error)
//     }
//     if (originalRequest.url?.includes('/api/auth/logout') === true) {
//       return Promise.reject(error)
//     }

//     // If the error is 401 Unauthorized AND it's not the refresh request itself AND it hasn't been retried
//     if (
//       error.response?.status === 401 &&
//       originalRequest &&
//       !originalRequest._retry
//     ) {
//       if (isRefreshing) {
//         // Queue the request until refresh is done
//         return new Promise((resolve, reject) => {
//           failedQueue.push({
//             resolve: () => {
//               originalRequest._retry = true
//               // console.error('This is the error:', error);
//               resolve(api(originalRequest))
//             },
//             reject: (err) => {
//               reject(err)
//             },
//           })
//         })
//       }
//       originalRequest._retry = true
//       isRefreshing = true
//       try {
//         // Attempt to refresh the token by calling the backend refresh endpoint
//         // The browser automatically sends the refresh_token cookie here because withCredentials is true
//         await api.post(endpoints.refreshToken())

//         processQueue(null)
//         isRefreshing = false
//         // If refresh is successful, retry the original request
//         // The browser will automatically send the new access_token cookie with this retry
//         console.log(
//           'Token refreshed successfully, retrying original request:',
//           originalRequest.url,
//         )
//         return api(originalRequest)
//       } catch (refreshError: unknown) {
//         processQueue(refreshError as AxiosError)
//         isRefreshing = false
//         // If refresh fails (e.g., refresh token expired or invalid)
//         console.error(
//           'Unable to refresh token. Redirecting to login.',
//           refreshError,
//         )

//         // Redirect to login page using Tanstack Router's navigate
//         // Ensure your login route ID is correct
//         // router.navigate({ to: '/login' });

//         // Reject the promise so the original request handler knows authentication failed
//         return Promise.reject(refreshError)
//       }
//     }

//     // For any other error (including 401 errors from the refresh request or already retried requests)
//     return Promise.reject(error)
//   },
// )

// async function _get<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
//   const response = await api.get(url, { ...options })
//   return response.data
// }

// async function _getResponse<T>(
//   url: string,
//   options?: AxiosRequestConfig,
// ): Promise<T> {
//   return await api.get(url, { ...options })
// }

// async function _post<T>(url: string, data?: unknown): Promise<T> {
//   const response = await api.post(url, JSON.stringify(data), {
//     headers: { 'Content-Type': 'application/json' },
//   })
//   return response.data
// }

// async function _postRaw<T>(url: string, data?: unknown) {
//   return api.post(url, JSON.stringify(data), {
//     headers: { 'Content-Type': 'application/json' },
//   })
// }

// async function _postMultiPart(
//   url: string,
//   formData: FormData,
//   options?: AxiosRequestConfig,
// ) {
//   const response = await api.post(url, formData, {
//     ...options,
//     headers: { 'Content-Type': 'multipart/form-data' },
//   })
//   return response.data
// }

// async function _postTTS(
//   url: string,
//   formData: FormData,
//   options?: AxiosRequestConfig,
// ) {
//   const response = await api.post(url, formData, {
//     ...options,
//     headers: { 'Content-Type': 'multipart/form-data' },
//     responseType: 'arraybuffer',
//   })
//   return response.data
// }

// async function _put(url: string, data?: unknown) {
//   const response = await api.put(url, JSON.stringify(data), {
//     headers: { 'Content-Type': 'application/json' },
//   })
//   return response.data
// }

// async function _delete<T>(url: string): Promise<T> {
//   const response = await api.delete(url)
//   return response.data
// }

// async function _deleteWithOptions<T>(
//   url: string,
//   options?: AxiosRequestConfig,
// ): Promise<T> {
//   const response = await api.delete(url, { ...options })
//   return response.data
// }

// async function _patch(url: string, data?: unknown) {
//   const response = await api.patch(url, JSON.stringify(data), {
//     headers: { 'Content-Type': 'application/json' },
//   })
//   return response.data
// }

// const refreshToken = (
//   retry?: boolean,
// ): Promise<t.TRefreshTokenResponse | undefined> =>
//   _post(endpoints.refreshToken())

// /*
// const dispatchTokenUpdatedEvent = (token: string) => {
//     setTokenHeader(token);
//     window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: token }));
// };
// */

// export default {
//   get: _get,
//   getResponse: _getResponse,
//   post: _post,
//   postRaw: _postRaw,
//   postMultiPart: _postMultiPart,
//   postTTS: _postTTS,
//   put: _put,
//   delete: _delete,
//   deleteWithOptions: _deleteWithOptions,
//   patch: _patch,
//   refreshToken,
// }
