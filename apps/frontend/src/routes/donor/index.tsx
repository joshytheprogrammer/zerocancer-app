import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CircleDollarSign, Gift, Users, Receipt } from 'lucide-react'

export const Route = createFileRoute('/donor/')({
  component: DonorDashboard,
})

const mockStats = [
  {
    title: 'Total Donated',
    value: '$5,000',
    icon: <CircleDollarSign className="h-4 w-4 text-muted-foreground" />, 
    change: '+$500 this month',
  },
  {
    title: 'Active Campaigns',
    value: '3',
    icon: <Gift className="h-4 w-4 text-muted-foreground" />, 
    change: '1 new',
  },
  {
    title: 'Patients Helped',
    value: '120',
    icon: <Users className="h-4 w-4 text-muted-foreground" />, 
    change: '+10 this month',
  },
  {
    title: 'Receipts',
    value: '8',
    icon: <Receipt className="h-4 w-4 text-muted-foreground" />, 
    change: '+2 this month',
  },
]

const mockCampaigns = [
  {
    id: 'camp_1',
    name: 'Cervical Cancer Drive',
    amount: '$2,000',
    patients: 40,
    status: 'Active',
  },
  {
    id: 'camp_2',
    name: 'Prostate Awareness',
    amount: '$1,500',
    patients: 30,
    status: 'Completed',
  },
  {
    id: 'camp_3',
    name: 'General Donation',
    amount: '$1,500',
    patients: 50,
    status: 'Active',
  },
]

function DonorDashboard() {
  const donor = { name: 'Acme Foundation' }
  const recentReceipt = {
    id: 'rec_001',
    amount: '$1,000',
    date: '2024-08-10',
    campaign: 'Cervical Cancer Drive',
  }
  const activeCampaign = mockCampaigns.find((c) => c.status === 'Active')

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
            {mockStats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/donor">Create Campaign</Link>
            </Button>
            {/* <Button asChild variant="outline">
              <Link to="/donor/donate-anonymous">Donate Anonymously</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/donor/receipts">View Receipts</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/donor/campaigns">All Campaigns</Link>
            </Button> */}
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
                  {mockCampaigns.map((camp) => (
                    <TableRow key={camp.id}>
                      <TableCell>{camp.name}</TableCell>
                      <TableCell>{camp.amount}</TableCell>
                      <TableCell>{camp.patients}</TableCell>
                      <TableCell>
                        <Badge variant={camp.status === 'Active' ? 'default' : 'secondary'}>
                          {camp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/donor`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Recent Receipt */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Receipt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentReceipt ? (
                <div>
                  <p className="font-semibold">{recentReceipt.amount}</p>
                  <p className="text-sm text-muted-foreground">
                    {recentReceipt.campaign}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {recentReceipt.date}
                  </p>
                </div>
              ) : (
                <p>No recent receipts available.</p>
              )}
            </CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/donor">View All Receipts</Link>
            </Button>
          </Card>

          {/* Active Campaign */}
          <Card>
            <CardHeader>
              <CardTitle>Active Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeCampaign ? (
                <div>
                  <p className="font-semibold">{activeCampaign.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: {activeCampaign.amount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Patients: {activeCampaign.patients}
                  </p>
                </div>
              ) : (
                <p>No active campaigns.</p>
              )}
            </CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/donor">Manage Campaigns</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
