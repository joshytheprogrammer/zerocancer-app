import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/staff/verify-code')({
  component: StaffVerifyCode,
})

function StaffVerifyCode() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verify Check-in</h1>
        <p className="text-muted-foreground">
          Scan QR codes and verify patient arrivals
        </p>
      </div>
      
      <div className="text-center py-8">
        <p className="text-muted-foreground">QR code verification feature coming soon...</p>
      </div>
    </div>
  )
} 