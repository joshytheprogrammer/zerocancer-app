import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/appointments')({
  component: PatientAppointments,
})

function PatientAppointments() {
  return (
    <div>
      <h1 className="text-2xl font-bold">My Appointments</h1>
      <p>Here you can view and manage your appointments.</p>
    </div>
  )
} 