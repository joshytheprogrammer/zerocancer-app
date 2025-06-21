import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/receipt-history')({
  component: CenterReceiptHistory,
})

function CenterReceiptHistory() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Payouts</h1>
      <p>Here you can view your center's payout and receipt history.</p>
    </div>
  )
} 