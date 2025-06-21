import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/')({
  component: PatientDashboard,
})

function PatientDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Patient Dashboard</h1>
      <p>Welcome to your dashboard.</p>
    </div>
  )
} 