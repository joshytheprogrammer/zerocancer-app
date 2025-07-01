import { createFileRoute } from '@tanstack/react-router'
import AdminWaitlistPanel from '@/components/admin/AdminWaitlistPanel'

export const Route = createFileRoute('/admin/waitlist')({
  component: AdminWaitlist,
})

function AdminWaitlist() {
  return (
    <div className="space-y-6">
      <AdminWaitlistPanel />
    </div>
  )
} 