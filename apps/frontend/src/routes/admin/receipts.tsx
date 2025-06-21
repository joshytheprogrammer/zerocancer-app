import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/receipts')({
  component: AdminReceipts,
})

function AdminReceipts() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Receipts</h1>
      <p>Here you can view and resend official receipts.</p>
    </div>
  )
} 