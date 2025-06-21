import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/')({
  component: CenterDashboard,
})

function CenterDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Center Dashboard</h1>
      <p>Welcome to your center's dashboard.</p>
    </div>
  )
} 