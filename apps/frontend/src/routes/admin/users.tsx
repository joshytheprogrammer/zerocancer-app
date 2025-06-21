import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsers,
})

function AdminUsers() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <p>Here you can manage all users.</p>
    </div>
  )
} 