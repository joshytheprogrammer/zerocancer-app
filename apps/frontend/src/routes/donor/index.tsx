import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDonorCampaigns } from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Activity,
  ArrowRight,
  Calendar,
  CircleDollarSign,
  Gift,
  Heart,
  Plus,
  Receipt,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'

export const Route = createFileRoute('/donor/')({
  component: DonorDashboard,
})

// Real API integration complete - removed mock data

function DonorDashboard() {
  const donor = { name: 'Acme Foundation' }

  // Fetch recent campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery(
    useDonorCampaigns({
      page: 1,
      pageSize: 5,
    }),
  )

  const campaigns = campaignsData?.data?.campaigns || []
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE')
  const completedCampaigns = campaigns.filter((c) => c.status === 'COMPLETED')

  // Calculate stats from real data
  const totalDonated = campaigns.reduce((sum, c) => sum + c.fundingAmount, 0) // wrong stats
  const totalPatientsHelped = campaigns.reduce(
    (sum, c) => sum + c.patientAllocations.patientsHelped,
    0,
  )
  const totalAvailable = campaigns.reduce(
    (sum, c) => sum + c.fundingAmount, // wrong stats
    0,
  )
  const totalUsed = campaigns.reduce((sum, c) => sum + c.usedAmount, 0)

  const activeCampaign = activeCampaigns[0] // Most recent active campaign

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCampaignProgress = (campaign: any) => {
    if (campaign.targetAmount === 0) return 0
    return Math.min((campaign.usedAmount / campaign.targetAmount) * 100, 100)
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[length:30px_30px] opacity-30"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Heart className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {donor.name}!
              </h1>
              <p className="text-blue-100 mt-1">
                Your generosity is changing lives and providing hope to those in
                need.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {campaignsLoading ? '...' : totalPatientsHelped}
              </div>
              <div className="text-blue-100">Lives Impacted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {campaignsLoading ? '...' : `₦${totalDonated.toLocaleString()}`}
              </div>
              <div className="text-blue-100">Total Contributed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {campaignsLoading ? '...' : activeCampaigns.length}
              </div>
              <div className="text-blue-100">Active Campaigns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          asChild
          size="lg"
          className="h-20 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
        >
          <Link
            to="/donor/campaigns/create"
            className="flex items-center gap-3"
          >
            <Plus className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">Create Campaign</div>
              <div className="text-sm opacity-90">Start helping patients</div>
            </div>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-20 text-lg border-2 hover:bg-blue-50"
        >
          <Link to="/donor/campaigns" className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold">Manage Campaigns</div>
              <div className="text-sm text-muted-foreground">
                View all campaigns
              </div>
            </div>
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Enhanced Stat Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="relative overflow-hidden border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Donated
                </CardTitle>
                <div className="p-2 bg-green-100 rounded-full">
                  <CircleDollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {campaignsLoading
                    ? '...'
                    : `₦${totalDonated.toLocaleString()}`}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Across {campaigns.length} campaigns
                </p>
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Growing impact</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Available Funds
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {campaignsLoading
                    ? '...'
                    : `₦${totalAvailable.toLocaleString()}`}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Ready for allocation
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${totalDonated > 0 ? (totalAvailable / totalDonated) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Patients Helped
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {campaignsLoading ? '...' : totalPatientsHelped}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Lives touched by your generosity
                </p>
                <div className="flex items-center gap-2 text-purple-600">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Making a difference
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Campaign Status
                </CardTitle>
                <div className="p-2 bg-orange-100 rounded-full">
                  <Gift className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {campaignsLoading ? '...' : activeCampaigns.length}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Active • {completedCampaigns.length} completed
                </p>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    {activeCampaigns.length} Active
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {completedCampaigns.length} Done
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Campaigns Table */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Recent Campaigns</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Track your campaign performance and impact
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link
                    to="/donor/campaigns"
                    className="flex items-center gap-2"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Campaign</TableHead>
                    <TableHead className="font-semibold">Funding</TableHead>
                    <TableHead className="font-semibold">Progress</TableHead>
                    <TableHead className="font-semibold">Patients</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
                          <p className="text-gray-500">
                            Loading your campaigns...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : campaigns.length > 0 ? (
                    campaigns.map((campaign) => {
                      const progress = getCampaignProgress(campaign)
                      return (
                        <TableRow
                          key={campaign.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">
                                {campaign.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {campaign.purpose || 'General screening'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                ₦{campaign.fundingAmount.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                ₦{campaign.usedAmount.toLocaleString()}{' '}
                                available
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Utilization
                                </span>
                                <span className="font-medium">
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">
                                {campaign.patientAllocations.patientsHelped}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(campaign.status)} font-medium`}
                            >
                              {campaign.status === 'ACTIVE'
                                ? 'Active'
                                : campaign.status === 'COMPLETED'
                                  ? 'Completed'
                                  : 'Deleted'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="hover:bg-blue-50"
                            >
                              <Link
                                to="/donor/campaigns/$campaignId"
                                params={{ campaignId: campaign.id }}
                              >
                                View Details
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Gift className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-900 mb-1">
                              No campaigns yet
                            </p>
                            <p className="text-gray-500 mb-4">
                              Start your first campaign to help patients in need
                            </p>
                            <Button
                              asChild
                              className="bg-gradient-to-r from-blue-600 to-blue-700"
                            >
                              <Link
                                to="/donor/campaigns/create"
                                className="flex items-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Create Your First Campaign
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Impact Summary */}
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <TrendingUp className="h-5 w-5" />
                Impact Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaignsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                    <div className="h-4 bg-blue-200 rounded w-1/2"></div>
                    <div className="h-4 bg-blue-200 rounded w-2/3"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">
                        Lives Impacted
                      </span>
                      <div className="font-bold text-2xl text-blue-900">
                        {totalPatientsHelped}
                      </div>
                    </div>
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>

                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">
                        Funds Deployed
                      </span>
                      <div className="font-bold text-lg text-blue-900">
                        ₦{totalUsed.toLocaleString()}
                      </div>
                    </div>
                    <CircleDollarSign className="h-8 w-8 text-green-500" />
                  </div>

                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">
                        Available Now
                      </span>
                      <div className="font-bold text-lg text-blue-900">
                        ₦{totalAvailable.toLocaleString()}
                      </div>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Active Campaign */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Activity className="h-5 w-5" />
                Featured Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {campaignsLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : activeCampaign ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {activeCampaign.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <div className="font-semibold">
                          ₦{activeCampaign.fundingAmount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Patients:</span>
                        <div className="font-semibold">
                          {activeCampaign.patientAllocations.patientsHelped}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {getCampaignProgress(activeCampaign).toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={getCampaignProgress(activeCampaign)}
                      className="h-3"
                    />
                  </div>

                  <div className="pt-2">
                    <span className="text-sm text-gray-500">Available:</span>
                    <div className="font-semibold text-green-600">
                      ₦{activeCampaign.usedAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No active campaigns</p>
                  <p className="text-gray-400 text-xs">
                    Create one to start helping patients
                  </p>
                </div>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full mt-4 border-green-200 hover:bg-green-50"
              >
                <Link
                  to="/donor/campaigns"
                  className="flex items-center justify-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Manage All Campaigns
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
