import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/transactions')({
  component: AdminTransactions,
})

function AdminTransactions() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Transactions</h1>
      <p>Here you can view a list of donations and payouts.</p>
    </div>
  )
} 