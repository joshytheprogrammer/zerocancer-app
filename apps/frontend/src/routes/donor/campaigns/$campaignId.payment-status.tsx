import { CampaignPaymentStatusPage } from '@/components/DonorPage/PaymentStatus/CampaignPaymentStatus.page'
import { createFileRoute } from '@tanstack/react-router'

function DonorCampaignPaymentStatusPage() {
  const { campaignId } = Route.useParams()
  const { ref, type } = Route.useSearch()
  return <CampaignPaymentStatusPage campaignId={campaignId} ref={ref} type={type} />
}

export const Route = createFileRoute(
  '/donor/campaigns/$campaignId/payment-status',
)({
  component: DonorCampaignPaymentStatusPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || '',
      type: (search.type as string) || '',
    }
  },
})
