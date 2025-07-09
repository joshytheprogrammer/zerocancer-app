import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useMarkNotificationRead,
  useNotifications,
} from '@/services/providers/notification.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Bell, Calendar, FileText } from 'lucide-react'
import bell from '@/assets/images/notification2.png'
import { toast } from 'sonner'

export const Route = createFileRoute('/patient/notifications')({
  component: PatientNotifications,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(useNotifications())
  },
})

const notificationIcons = {
  appointment: <Calendar className="h-5 w-5" />,
  result: <FileText className="h-5 w-5" />,
  general: <Bell className="h-5 w-5" />,
  // Default fallback
  default: <Bell className="h-5 w-5" />,
}

function PatientNotifications() {
  const {
    data: notificationsData,
    isLoading,
    error,
  } = useQuery(useNotifications())

  const markAsReadMutation = useMarkNotificationRead()

  const handleMarkAsRead = (notificationRecipientId: string) => {
    markAsReadMutation.mutate(notificationRecipientId, {
      onSuccess: () => {
        toast.success('Notification marked as read')
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.error || 'Failed to mark as read')
      },
    })
  }

  const notifications = notificationsData?.data || []

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Here you can view your notifications.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">My Notifications</h1>
          <p className="text-muted-foreground">
            Here you can view your notifications.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">
              Failed to load notifications. Please try again.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">My Notifications</h1>
        <p className="text-muted-foreground">
          Here you can view your notifications.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {notifications.length > 0 ? (
              notifications.map((notificationRecipient) => {
                const notification = notificationRecipient.notification
                const isRead = notificationRecipient.read

                return (
                  <div
                    key={notificationRecipient.id}
                    className={`flex items-start gap-4 p-4 ${
                      !isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="mt-1 text-muted-foreground">
                      {notificationIcons[
                        notification.type as keyof typeof notificationIcons
                      ] || notificationIcons.default}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {notification.data && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {/* Display additional notification data if needed */}
                          {JSON.stringify(notification.data)}
                        </div>
                      )}
                    </div>
                    {!isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleMarkAsRead(notificationRecipient.id)
                        }
                        disabled={markAsReadMutation.isPending}
                      >
                        {markAsReadMutation.isPending
                          ? 'Marking...'
                          : 'Mark as read'}
                      </Button>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <img src={bell} alt="No notifications" className="mx-auto size-24 mb-4" />
                <p className='font-semibold text-lg'>You have no notifications.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
