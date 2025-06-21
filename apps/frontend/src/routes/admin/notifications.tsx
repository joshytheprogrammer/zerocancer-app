import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/notifications')({
  component: AdminNotifications,
})

function AdminNotifications() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p>Here you can view all system notifications.</p>
    </div>
  )
}
