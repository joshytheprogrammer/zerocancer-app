import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'

export const getNotifications = async () => {
  return await request.get(endpoints.getNotifications())
}

export const markNotificationRead = async (id: string) => {
  return await request.post(endpoints.markNotificationRead(id))
}

export const createNotification = async (data: {
  type: string
  title: string
  message: string
  data?: any
  userIds: string[]
}) => {
  return await request.post(endpoints.createNotification(), data)
}
