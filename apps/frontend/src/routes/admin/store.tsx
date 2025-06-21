import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/store')({
  component: AdminStore,
})

function AdminStore() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Store</h1>
      <p>Here you can manage store items.</p>
    </div>
  )
} 