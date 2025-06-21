import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/results')({
  component: AdminResults,
})

function AdminResults() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Aggregate Results</h1>
      <p>Here you can view aggregate result data.</p>
    </div>
  )
} 