import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { TNotificationRecipient } from '@zerocancer/shared/types'
import notificationIcon from '@/assets/images/notification.png'

interface NotificationsPanelProps {
  notifications: TNotificationRecipient[]
  isLoading: boolean
}

const NotificationItem = ({
  notification,
}: {
  notification: TNotificationRecipient
}) => {
  // TODO: Build out the notification item UI
  return (
    <div className="p-2 border-b">
      <p className="font-bold">{notification.notification.title}</p>
      <p>{notification.notification.message}</p>
    </div>
  )
}

export default function NotificationsPanel({
  notifications,
  isLoading,
}: NotificationsPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading notifications...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[350px] flex items-center justify-center">
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <img
              src={notificationIcon}
              alt="No notifications"
              className="w-20 h-20 mb-4"
            />
            <p className="text-muted-foreground">You have no notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications
              .slice(0, 3)
              .map((item) => (
                <NotificationItem key={item.id} notification={item} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 