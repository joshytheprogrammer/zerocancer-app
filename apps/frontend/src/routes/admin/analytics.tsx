import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/analytics')({
  component: AdminAnalytics,
})

function AdminAnalytics() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p>Here you can view deep reporting and analytics.</p>
    </div>
  )
} 