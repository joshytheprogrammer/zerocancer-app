import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/appointments')({
  component: AdminAppointments,
})

function AdminAppointments() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Appointments</h1>
      <p>Here you can view all system-wide bookings.</p>
    </div>
  )
} 