import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/notifications')({
  component: PatientNotifications,
})

function PatientNotifications() {
  return (
    <div>
      <h1 className="text-2xl font-bold">My Notifications</h1>
      <p>Here you can view your notifications.</p>
    </div>
  )
} 