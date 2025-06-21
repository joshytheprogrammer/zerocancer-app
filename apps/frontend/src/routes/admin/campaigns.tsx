import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/campaigns')({
  component: AdminCampaigns,
})

function AdminCampaigns() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Campaigns</h1>
      <p>Here you can manage all donation campaigns.</p>
    </div>
  )
} 