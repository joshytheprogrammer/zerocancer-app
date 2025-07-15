import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useVerifyPayment,
  useDonorCampaigns,
} from '@/services/providers/donor.provider'
import { QueryKeys } from '@/services/keys'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Home,
  Loader2,
  PartyPopper,
  Printer,
  Share2,
  XCircle,
} from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/donor/campaigns/payment-status')({
  component: PaymentStatusPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || '',
      type: (search.type as string) || '',
      campaignId: (search.campaignId as string) || '',
    }
  },
})

function PaymentStatusPage() {
  const navigate = useNavigate()
  const { ref, type, campaignId } = Route.useSearch()
  const queryClient = useQueryClient()

  const {
    data: paymentData,
    isLoading,
    error,
    refetch,
  } = useQuery(useVerifyPayment(ref))

  const payment = paymentData?.data

  // Invalidate queries on successful payment to refresh dashboard/campaign data
  useEffect(() => {
    if (payment?.status === 'success') {
      toast.success('Payment confirmed! Your data is being updated.')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.donorCampaigns] })
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.donorCampaign, campaignId],
        })
      }
    }
  }, [payment?.status, queryClient, campaignId])

  // Handle missing reference
  if (!ref) {
    return <StatusCard status="error" title="Invalid Payment Reference" message="No payment reference was provided. Please check your payment link or try again." />
  }

  // Loading state
  if (isLoading) {
    return <StatusCard status="loading" />
  }

  // Error state
  if (error) {
    return <StatusCard status="error" title="Payment Verification Failed" message="We couldn't verify your payment at this time. This might be a temporary issue." onRetry={refetch} />
  }

  if (!payment) {
     return <StatusCard status="error" title="Payment Not Found" message="We couldn't find a payment with this reference. Please check your payment confirmation email or contact support." />
  }
  
  if (payment.status === 'success') {
    const isCreation = payment.context?.type === 'campaign_creation'
    const campaign = payment.context?.campaign

    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
                <PartyPopper className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-800">Thank You for Your Donation!</h1>
                <p className="text-gray-600 mt-2">Your campaign has been successfully funded. Here are the details of your transaction.</p>
            </div>

            <Card className="shadow-lg">
                <CardHeader className="bg-gray-100/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Payment Receipt</CardTitle>
                            <p className="text-sm text-gray-500">Transaction ID: {payment.reference}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border border-green-200">Paid</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600">Amount Paid</p>
                        <p className="text-2xl font-bold text-gray-800">₦{payment.amount.toLocaleString()}</p>
                    </div>
                    <div className="border-t border-dashed" />
                    <div className="space-y-3">
                        <InfoRow label="Campaign Title" value={campaign?.title || 'N/A'} />
                        <InfoRow label="Payment Method" value={payment.channel} className="capitalize" />
                        <InfoRow label="Transaction Date" value={new Date(payment.paidAt || payment.transactionDate).toLocaleString()} />
                        <InfoRow label="Status" value="Successful" />
                    </div>
                     <div className="border-t border-dashed" />
                    <div className="flex flex-col gap-4 pt-4">
                        <Button variant="outline" className="w-full" onClick={() => navigate({ to: '/donor/campaigns' })}>
                            <Home className="h-4 w-4 mr-2" />
                            Back to Campaigns
                        </Button>
                        <Button className="w-full" onClick={() => navigate({ to: '/donor/campaigns/$campaignId', params: {campaignId: campaign!.id}})} disabled={!campaign}>
                            View Campaign <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <div className="mt-6 flex justify-center gap-4">
                <Button variant="ghost" size="sm" className="text-gray-600">
                    <Printer className="h-4 w-4 mr-2" /> Print Receipt
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600">
                    <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
            </div>
        </div>
      </div>
    )
  }

  // Pending and Failed states
  return <StatusCard status={payment.status} onRetry={refetch} />

}


// --- UI Components for different states ---

function StatusCard({
    status,
    title,
    message,
    onRetry
}: {
    status: 'loading' | 'error' | 'pending' | 'failed' | 'abandoned';
    title?: string;
    message?: string;
    onRetry?: () => void;
}) {
    const navigate = useNavigate()
    const iconMap = {
        loading: <Loader2 className="h-12 w-12 animate-spin text-blue-600" />,
        error: <XCircle className="h-12 w-12 text-red-500" />,
        pending: <Clock className="h-12 w-12 text-yellow-500" />,
        failed: <XCircle className="h-12 w-12 text-red-500" />,
        abandoned: <AlertTriangle className="h-12 w-12 text-gray-500" />,
    }

    const titleMap = {
        loading: 'Verifying Payment...',
        error: title || 'Verification Failed',
        pending: 'Payment Pending',
        failed: 'Payment Failed',
        abandoned: 'Payment Abandoned',
    }
    
    const messageMap = {
        loading: 'Please wait while we confirm your transaction.',
        error: message || 'There was an error verifying your payment.',
        pending: 'Your payment is still being processed. We will update this page automatically.',
        failed: 'Your payment could not be completed. Please try again.',
        abandoned: 'The payment was not completed.',
    }


    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center shadow-lg">
                <CardContent className="p-8">
                    <div className="mb-4">{iconMap[status]}</div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">{titleMap[status]}</h2>
                    <p className="text-gray-600 mb-6">{messageMap[status]}</p>
                    <div className="flex gap-4 justify-center">
                         {onRetry && (
                            <Button variant="outline" onClick={onRetry}>
                                Check Again
                            </Button>
                        )}
                        <Button onClick={() => navigate({ to: '/donor/campaigns' })}>
                            Back to Campaigns
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function InfoRow({ label, value, className = '' }: { label: string; value: string, className?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <p className="text-gray-600">{label}</p>
      <p className={`font-medium text-gray-800 ${className}`}>{value}</p>
    </div>
  )
}
