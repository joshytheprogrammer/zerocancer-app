import DonorForm from '@/components/SignupPage/DonorForm'
import { Link } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/(auth)/sign-up/donor')({
  component: RouteComponent,
})

function RouteComponent() {
  const [showVerify, setShowVerify] = useState(false)
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)

  const handleFormSubmit = (data: any) => {
    if (data && data.email) {
      setEmail(data.email)
    }
    setShowVerify(true)
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      // TODO: Replace with actual resend verification email API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Verification email resent!')
    } catch (err) {
      toast.error('Failed to resend email.')
    } finally {
      setIsResending(false)
    }
  }

  if (showVerify) {
    return (
      <div className="">
        <div className="space-y-4">
          <p className="text-center text-lg">
            A <span className="text-primary">verification link</span> has been sent to <b>{email}</b>. Please check your email and verify your account.
          </p>
          <div className="text-center text-lg">Didnt receive an email?</div>
          <div className="flex justify-center">
            <button
              onClick={handleResend}
              className="bg-primary text-white px-4 py-2 rounded-md cursor-pointer"
              disabled={isResending}
            >
              {isResending ? 'Resending...' : 'Resend Email'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/sign-up"
          className="text-gray-600 hover:text-gray-800 px-4 py-1 bg-blue-100 rounded-lg cursor-pointer"
        >
          Back
        </Link>
      </div>
      <DonorForm onSubmitSuccess={handleFormSubmit} />
    </div>
  )
}
