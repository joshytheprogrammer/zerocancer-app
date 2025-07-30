import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Progress } from '@/components/shared/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useDonorCampaigns } from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import center from '@/assets/images/center.png'
import health from '@/assets/images/health.png'
import impact from '@/assets/images/impact.png'
import location from '@/assets/images/location.png'
import megaphone from '@/assets/images/megaphone.png'
import awaiting from '@/assets/images/notification.png'
import sponsored from '@/assets/images/sponsored.png'

export const Route = createFileRoute('/donor/')({
  component: DonorDashboard,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(
      useDonorCampaigns({
        page: 1,
        pageSize: 5,
      }),
    )
  },
})

function DonorDashboard() {
  const { data: authData } = useQuery(useAuthUser())
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery(
    useDonorCampaigns({ page: 1, pageSize: 5 }),
  )

  const donorName = authData?.data?.user?.fullName || 'Valued Donor'
  const campaigns = campaignsData?.data?.campaigns || []

  // --- Stat Calculations ---
  const totalDonated = campaigns.reduce((sum, c) => sum + c.fundingAmount, 0)
  const totalPatientsHelped = campaigns.reduce(
    (sum, c) => sum + (c.patientAllocations?.patientsHelped || 0),
    0,
  )
  const totalCampaigns = campaigns.length
  const locationsImpacted = new Set(
    campaigns.flatMap((c) => c.targetStates || []),
  ).size

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `₦${(amount / 1_000_000).toFixed(1)}m`
    }
    if (amount >= 1_000) {
      return `₦${Math.round(amount / 1_000)}k`
    }
    return `₦${amount}`
  }

  const getStatusColor = (status: string) => {
    if (status === 'ACTIVE') return 'bg-green-500/10 text-green-600'
    if (status === 'COMPLETED') return 'bg-blue-500/10 text-blue-600'
    return 'bg-gray-500/10 text-gray-600'
  }

  const getCampaignProgress = (campaign: any) => {
    if (!campaign.targetAmount || campaign.targetAmount === 0) return 0
    return Math.min((campaign.usedAmount / campaign.targetAmount) * 100, 100)
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          Welcome, {donorName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here's a summary of your health journey.
        </p>
      </div>

      <div className="">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-white">
              <div className="absolute -bottom-10 -right-10 opacity-20">
                <img src={center} alt="Hospital" className="w-48 h-48" />
              </div>
              <div className="relative">
                <h2 className="text-2xl font-bold mb-6">Acme Foundation!</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold">
                      {campaignsLoading ? '...' : formatCurrency(totalDonated)}
                    </p>
                    <p className="text-sm opacity-80">Total Donated</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {campaignsLoading ? '...' : totalCampaigns}
                    </p>
                    <p className="text-sm opacity-80">Total Campaigns</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {campaignsLoading ? '...' : totalPatientsHelped}
                    </p>
                    <p className="text-sm opacity-80">Total Lives Impacted</p>
                  </div>
                </div>
              </div>
            </div>
            <Link
              to="/donor/campaigns/create"
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-pink-500 text-white p-6 hover:bg-pink-600 transition-all"
            >
              <div className="p-3 bg-white/20 rounded-full">
                <Plus className="h-6 w-6" />
              </div>
              <p className="font-semibold text-lg">Create New Campaign</p>
            </Link>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Patients Helped"
              value={totalPatientsHelped}
              unit="People"
              icon={sponsored}
              color="bg-pink-100"
              loading={campaignsLoading}
            />
            <StatCard
              title="Completed Screening"
              value={0}
              unit="People"
              icon={health}
              color="bg-purple-100"
              loading={campaignsLoading}
            />
            <StatCard
              title="Awaiting Screening"
              value={0}
              unit="People"
              icon={awaiting}
              color="bg-blue-100"
              loading={campaignsLoading}
            />
            <StatCard
              title="Locations Impacted"
              value={locationsImpacted}
              unit="States"
              icon={location}
              color="bg-green-100"
              loading={campaignsLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Campaigns</CardTitle>
                    <Button variant="link" asChild>
                      <Link to="/donor/campaigns">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign Name</TableHead>
                        <TableHead>Donation</TableHead>
                        <TableHead>Sponsored</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 text-center">
                            Loading campaigns...
                          </TableCell>
                        </TableRow>
                      ) : campaigns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <img
                                src={megaphone}
                                alt="No campaigns"
                                className="w-16 h-16"
                              />
                              <p className="font-medium">
                                You have no active campaigns
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        campaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">
                              {campaign.title}
                            </TableCell>
                            <TableCell>
                              ₦{campaign.fundingAmount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {campaign.patientAllocations?.patientsHelped || 0}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={getCampaignProgress(campaign)}
                                  className="w-20 h-2"
                                />
                                <span className="text-xs text-gray-500">
                                  {getCampaignProgress(campaign).toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(campaign.status)}
                              >
                                {campaign.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            {/* Side Content */}
            <div className="space-y-6">
              {/* Recent Impact */}
              <Card className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Impact</CardTitle>
                    <Button variant="link">See All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                    <img
                      src={impact}
                      alt="No impact yet"
                      className="w-24 h-24"
                    />
                    <p>Your campaign impacts will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  unit,
  icon,
  color,
  loading,
}: {
  title: string
  value: number
  unit: string
  icon: string
  color: string
  loading: boolean
}) {
  return (
    <Card className={`p-4 ${color}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <img src={icon} alt={title} className="w-8 h-8" />
      </div>
      {loading ? (
        <div className="h-8 w-1/2 bg-gray-300/50 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      )}
      <p className="text-sm text-gray-500">{unit}</p>
    </Card>
  )
}
