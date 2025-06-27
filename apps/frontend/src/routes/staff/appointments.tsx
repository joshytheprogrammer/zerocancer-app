import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/staff/appointments')({
  component: StaffAppointments,
})

function StaffAppointments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">
          View and manage center appointments
        </p>
      </div>
      
      <div className="text-center py-8">
        <p className="text-muted-foreground">Staff appointments feature coming soon...</p>
      </div>
    </div>
  )
} 