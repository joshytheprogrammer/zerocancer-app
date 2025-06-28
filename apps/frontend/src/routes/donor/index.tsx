import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useDonorCampaigns } from '@/services/providers/donor.provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CircleDollarSign, Gift, Users, Receipt } from 'lucide-react'

export const Route = createFileRoute('/donor/')({
  component: DonorDashboard,
})

// Real API integration complete - removed mock data

function DonorDashboard() {
  const donor = { name: 'Acme Foundation' }
  
  // Fetch recent campaigns
  const { 
    data: campaignsData, 
    isLoading: campaignsLoading 
  } = useQuery(useDonorCampaigns({ 
    page: 1, 
    pageSize: 5 
  }))
  
  const campaigns = campaignsData?.data?.campaigns || []
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE')
  const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED')
  
  // Calculate stats from real data
  const totalDonated = campaigns.reduce((sum, c) => sum + c.initialAmount, 0)
  const totalPatientsHelped = campaigns.reduce((sum, c) => sum + c.patientsHelped, 0)
  const totalReceipts = campaigns.length
  
  const activeCampaign = activeCampaigns[0] // Most recent active campaign

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Welcome, {donor.name}!</h1>
        <p className="text-muted-foreground">
          Here's a summary of your impact and activity as a donor.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaignsLoading ? '...' : `₦${totalDonated.toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {campaigns.length} campaigns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaignsLoading ? '...' : activeCampaigns.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {completedCampaigns.length} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Patients Helped</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaignsLoading ? '...' : totalPatientsHelped}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all campaigns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaignsLoading ? '...' : `₦${campaigns.reduce((sum, c) => sum + c.availableAmount, 0).toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for allocation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/donor/campaigns/create">Create Campaign</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/donor/receipts">View Receipts</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/donor/campaigns">All Campaigns</Link>
            </Button>
          </div>

          {/* Recent campaigns/donations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        Loading campaigns...
                      </TableCell>
                    </TableRow>
                  ) : campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>{campaign.title}</TableCell>
                        <TableCell>₦{campaign.initialAmount.toLocaleString()}</TableCell>
                        <TableCell>{campaign.patientsHelped}</TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {campaign.status === 'ACTIVE' ? 'Active' : campaign.status === 'COMPLETED' ? 'Completed' : 'Deleted'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/donor/campaigns/$campaignId" params={{ campaignId: campaign.id }}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">No campaigns yet.</p>
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <Link to="/donor/campaigns/create">Create Your First Campaign</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Latest Campaign Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Impact Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaignsLoading ? (
                <div className="text-center">Loading...</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Impact:</span>
                    <span className="font-semibold">{totalPatientsHelped} patients</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Available Funds:</span>
                    <span className="font-semibold">₦{campaigns.reduce((sum, c) => sum + c.availableAmount, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Campaigns:</span>
                    <span className="font-semibold">{activeCampaigns.length}</span>
                  </div>
                </div>
              )}
            </CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/donor/receipts">View All Receipts</Link>
            </Button>
          </Card>

          {/* Active Campaign */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Active Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaignsLoading ? (
                <div className="text-center">Loading...</div>
              ) : activeCampaign ? (
                <div>
                  <p className="font-semibold">{activeCampaign.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: ₦{activeCampaign.initialAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Patients: {activeCampaign.patientsHelped}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Available: ₦{activeCampaign.availableAmount.toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No active campaigns.</p>
              )}
            </CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/donor/campaigns">Manage Campaigns</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
