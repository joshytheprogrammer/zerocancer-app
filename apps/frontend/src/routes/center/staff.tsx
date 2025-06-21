import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/staff')({
  component: CenterStaff,
})

function CenterStaff() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Staff</h1>
      <p>Here you can add and manage your center's staff members.</p>
    </div>
  )
} 