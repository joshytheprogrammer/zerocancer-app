import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/centers')({
  component: AdminCenters,
})

function AdminCenters() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Centers</h1>
      <p>Here you can manage all centers.</p>
    </div>
  )
} 