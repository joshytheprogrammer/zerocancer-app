import { createFileRoute } from '@tanstack/react-router'
import { Bell, Calendar, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/patient/notifications')({
  component: PatientNotifications,
})

const mockNotifications = [
  {
    id: 'notif_1',
    type: 'result',
    title: 'Your results are ready!',
    description: 'Your Prostate Cancer Screening results are now available.',
    timestamp: '2024-06-21T10:00:00Z',
    isRead: false,
  },
  {
    id: 'notif_2',
    type: 'appointment',
    title: 'Appointment Confirmed',
    description:
      'Your Cervical Cancer Screening at City Health Clinic is confirmed for August 15, 2024.',
    timestamp: '2024-06-20T14:30:00Z',
    isRead: false,
  },
  {
    id: 'notif_3',
    type: 'general',
    title: 'Welcome to ZeroCancer!',
    description: 'We are glad to have you on board. Stay healthy!',
    timestamp: '2024-06-19T09:00:00Z',
    isRead: true,
  },
]

const notificationIcons = {
  appointment: <Calendar className="h-5 w-5" />,
  result: <FileText className="h-5 w-5" />,
  general: <Bell className="h-5 w-5" />,
}

function PatientNotifications() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">My Notifications</h1>
        <p className="text-muted-foreground">
          Here you can view your notifications.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 ${
                  !notification.isRead ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="mt-1 text-muted-foreground">
                  {notificationIcons[notification.type as keyof typeof notificationIcons]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button variant="ghost" size="sm">
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
            {mockNotifications.length === 0 && (
              <p className="p-6 text-center text-muted-foreground">
                You have no new notifications.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 