import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useVerifyPayment } from '@/services/providers/donor.provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  ArrowRight,
  Calendar,
  MapPin,
  Stethoscope
} from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/patient/book/payment-status')({
  component: PatientPaymentStatusPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || '',
      type: (search.type as string) || 'appointment_booking',
    }
  },
})

function PatientPaymentStatusPage() {
  const navigate = useNavigate()
  const { ref, type } = Route.useSearch()
  const [redirectTimer, setRedirectTimer] = useState(5)
  
  const { 
    data: paymentData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(useVerifyPayment(ref))
  
  const payment = paymentData?.data

  // Auto-redirect timer for successful payments
  useEffect(() => {
    if (payment?.status === 'success' && redirectTimer > 0) {
      const timer = setTimeout(() => {
        setRedirectTimer(prev => prev - 1)
      }, 1000)
      
      if (redirectTimer === 1) {
        navigate({ to: '/patient/appointments' })
      }
      
      return () => clearTimeout(timer)
    }
  }, [payment?.status, redirectTimer, navigate])

  // Handle missing reference
  if (!ref) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Invalid Payment Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              No payment reference was provided. Please check your payment link or try booking again.
            </p>
            <Button onClick={() => navigate({ to: '/patient/book' })}>
              Book New Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Verifying Payment</h3>
            <p className="text-gray-600 mb-4">
              Please wait while we confirm your appointment payment...
            </p>
            <div className="text-sm text-gray-500">
              Reference: {ref}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Payment Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We couldn't verify your payment at this time. This might be a temporary issue.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => navigate({ to: '/patient/appointments' })}>
                View Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Payment Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We couldn't find a payment with this reference. Please check your payment confirmation email or contact support.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              Reference: {ref}
            </div>
            <Button onClick={() => navigate({ to: '/patient/book' })}>
              Book New Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (payment.status === 'success') {
    const paymentContext = payment.context as any
    const isAppointmentBooking = paymentContext?.type === 'appointment_booking'
    const appointmentData = isAppointmentBooking ? paymentContext?.appointment : null
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              Appointment Booked Successfully! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700 mb-2">
                ₦{payment.amount.toLocaleString()}
              </div>
              <p className="text-gray-600">
                Your appointment has been confirmed and paid for
              </p>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono">{payment.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="capitalize">{payment.channel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(payment.paidAt || payment.transactionDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">Medical Screening Appointment</span>
              </div>
            </div>

            {/* Appointment Info (if available from context) */}
            {appointmentData && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Appointment Details
                </h4>
                <div className="space-y-2 text-sm">
                  {appointmentData.screeningType && (
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{appointmentData.screeningType}</span>
                    </div>
                  )}
                  {appointmentData.center && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>{appointmentData.center}</span>
                    </div>
                  )}
                  {appointmentData.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>{new Date(appointmentData.date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• You'll receive a check-in code before your appointment</li>
                <li>• Present your QR code at the screening center</li>
                <li>• Results will be available after your screening</li>
                <li>• You can view your appointment details in your dashboard</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate({ to: '/patient/appointments' })}
                className="flex-1"
              >
                View My Appointments
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate({ to: '/patient' })}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>

            {/* Auto-redirect notice */}
            <div className="text-center text-sm text-gray-500">
              Redirecting to your appointments in {redirectTimer} seconds...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Failed/Abandoned state
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Payment {payment.status === 'failed' ? 'Failed' : 'Cancelled'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            {payment.status === 'failed' 
              ? 'Your payment could not be processed. Please try booking again or contact support if the issue persists.'
              : 'Your payment was cancelled. You can try booking again when you\'re ready.'
            }
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reference:</span>
              <span className="font-mono">{payment.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span>₦{payment.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="capitalize text-red-600">{payment.status}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate({ to: '/patient/book' })}
              className="flex-1"
            >
              Try Booking Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate({ to: '/patient' })}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 