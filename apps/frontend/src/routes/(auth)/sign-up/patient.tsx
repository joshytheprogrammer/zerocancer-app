import PatientForm from '@/components/SignupPage/PatientForm'
import { useResendVerification } from '@/services/providers/auth.provider'
import { Link } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/(auth)/sign-up/patient')({
  component: RouteComponent,
})

function RouteComponent() {
  const [showVerify, setShowVerify] = useState(false)
  const [email, setEmail] = useState('')
  const resendVerificationMutation = useResendVerification()

  const handleFormSubmit = (data: any) => {
    if (data && data.email) {
      setEmail(data.email)
    }
    setShowVerify(true)
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address not found. Please try registering again.')
      return
    }

    const resendPromise = new Promise((resolve, reject) => {
      resendVerificationMutation.mutate(
        {
          email,
          profileType: 'PATIENT',
        },
        {
          onSuccess: (data) => {
            resolve(data)
          },
          onError: (error: any) => {
            reject(error)
          },
        }
      )
    })

    toast.promise(resendPromise, {
      loading: 'Resending verification email...',
      success: 'Verification email resent successfully!',
      error: (error: any) => {
        return error.response?.data?.error || 'Failed to resend verification email. Please try again.'
      },
    })
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
              disabled={resendVerificationMutation.isPending}
            >
              {resendVerificationMutation.isPending ? 'Resending...' : 'Resend Email'}
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
      <PatientForm onSubmitSuccess={handleFormSubmit} />
    </div>
  )
}
