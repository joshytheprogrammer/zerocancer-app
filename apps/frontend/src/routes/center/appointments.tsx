import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/appointments')({
  component: CenterAppointments,
})

function CenterAppointments() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Appointments</h1>
      <p>Here you can view and manage appointments for your center.</p>
    </div>
  )
} 