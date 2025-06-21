import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/verify-code')({
  component: CenterVerifyCode,
})

function CenterVerifyCode() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Verify Patient Code</h1>
      <p>Enter a patient's code or scan their QR to verify check-in.</p>
    </div>
  )
} 