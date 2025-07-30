import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { useVerifyPayment } from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Gift,
  Loader2,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute(
  '/donor/campaigns/$campaignId/payment-status',
)({
  component: CampaignPaymentStatusPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || '',
      type: (search.type as string) || '',
    }
  },
})

function CampaignPaymentStatusPage() {
  const navigate = useNavigate()
  const { campaignId } = Route.useParams()
  const { ref, type } = Route.useSearch()
  const [redirectTimer, setRedirectTimer] = useState(5)

  const {
    data: paymentData,
    isLoading,
    error,
    refetch,
  } = useQuery(useVerifyPayment(ref))

  const payment = paymentData?.data

  // Auto-redirect timer for successful payments
  useEffect(() => {
    if (payment?.status === 'success' && redirectTimer > 0) {
      const timer = setTimeout(() => {
        setRedirectTimer((prev) => prev - 1)
      }, 1000)

      if (redirectTimer === 1) {
        navigate({ to: '/donor/campaigns/$campaignId', params: { campaignId } })
      }

      return () => clearTimeout(timer)
    }
  }, [payment?.status, redirectTimer, navigate, campaignId])

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
              No payment reference was provided. Please check your payment link
              or try again.
            </p>
            <Button
              onClick={() =>
                navigate({
                  to: '/donor/campaigns/$campaignId',
                  params: { campaignId },
                })
              }
            >
              Return to Campaign
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
              Please wait while we confirm your payment with our payment
              provider...
            </p>
            <div className="text-sm text-gray-500">Reference: {ref}</div>
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
              We couldn't verify your payment at this time. This might be a
              temporary issue.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
              <Button
                onClick={() =>
                  navigate({
                    to: '/donor/campaigns/$campaignId',
                    params: { campaignId },
                  })
                }
              >
                Return to Campaign
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
              We couldn't find a payment with this reference. Please check your
              payment confirmation email or contact support.
            </p>
            <div className="text-sm text-gray-500 mb-4">Reference: {ref}</div>
            <Button
              onClick={() =>
                navigate({
                  to: '/donor/campaigns/$campaignId',
                  params: { campaignId },
                })
              }
            >
              Return to Campaign
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (payment.status === 'success') {
    const isFunding = payment.context?.type === 'campaign_funding'
    const campaign = isFunding ? (payment.context as any)?.campaign : null

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              Campaign Funding Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700 mb-2">
                ₦{payment.amount.toLocaleString()}
              </div>
              <p className="text-gray-600">
                Your campaign funding has been processed successfully
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
                <span>
                  {new Date(
                    payment.paidAt || payment.transactionDate,
                  ).toLocaleDateString()}
                </span>
              </div>
              {campaign && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Campaign:</span>
                  <span className="font-medium">{campaign.purpose}</span>
                </div>
              )}
            </div>

            {/* Campaign Update Info */}
            {campaign && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Campaign Updated
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Available Amount:</span>
                    <div className="font-semibold">
                      ₦{campaign.availableAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Patients Helped:</span>
                    <div className="font-semibold">
                      {campaign.patientsHelped}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Your additional funding is now available for patient matching!
                </p>
              </div>
            )}

            {/* Auto-redirect notice */}
            <div className="text-center text-sm text-gray-500">
              Redirecting to campaign in {redirectTimer} seconds...
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() =>
                  navigate({
                    to: '/donor/campaigns/$campaignId',
                    params: { campaignId },
                  })
                }
                className="flex-1"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                View Campaign
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/donor/campaigns' })}
              >
                All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Failed state
  if (payment.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Payment Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your payment could not be processed. Your card was not charged.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Amount:</span>
                <span>₦{payment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono">{payment.reference}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  navigate({
                    to: '/donor/campaigns/$campaignId',
                    params: { campaignId },
                  })
                }
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/donor/campaigns' })}
              >
                All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Abandoned state
  if (payment.status === 'abandoned') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Payment Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              You cancelled the payment process. No charges were made to your
              card.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  navigate({
                    to: '/donor/campaigns/$campaignId',
                    params: { campaignId },
                  })
                }
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/donor/campaigns' })}
              >
                All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pending state
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-5 w-5" />
            Payment Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your payment is still being processed. We'll update the status
            automatically.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-mono">{payment.reference}</span>
            </div>
          </div>

          <Button
            onClick={() => refetch()}
            variant="outline"
            className="w-full"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Check Status Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
