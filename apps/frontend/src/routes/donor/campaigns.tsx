import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/donor/campaigns')({
  component: DonorCampaigns,
})

// Mock data
const mockCampaigns = [
  {
    id: 'camp_1',
    name: 'Cervical Cancer Screening Drive',
    description: 'Supporting early detection of cervical cancer in rural communities',
    amount: 5000,
    amountUsed: 3200,
    patientsHelped: 64,
    status: 'Active',
    createdDate: '2024-01-15',
    expiryDate: '2024-12-31',
    targetScreening: 'Cervical Cancer Screening',
    matchedPatients: 64,
    pendingPatients: 12,
  },
  {
    id: 'camp_2',
    name: 'Prostate Health Awareness',
    description: 'Promoting prostate health screenings for men over 40',
    amount: 3000,
    amountUsed: 3000,
    patientsHelped: 50,
    status: 'Completed',
    createdDate: '2024-02-10',
    expiryDate: '2024-08-10',
    targetScreening: 'Prostate Cancer Screening',
    matchedPatients: 50,
    pendingPatients: 0,
  },
  {
    id: 'camp_3',
    name: 'General Health Initiative',
    description: 'General donation pool for various screening types',
    amount: 8000,
    amountUsed: 1200,
    patientsHelped: 24,
    status: 'Active',
    createdDate: '2024-03-01',
    expiryDate: '2024-12-01',
    targetScreening: 'All Types',
    matchedPatients: 24,
    pendingPatients: 8,
  },
  {
    id: 'camp_4',
    name: 'Breast Cancer Early Detection',
    description: 'Funding mammography screenings for early breast cancer detection',
    amount: 2500,
    amountUsed: 0,
    patientsHelped: 0,
    status: 'Pending',
    createdDate: '2024-03-20',
    expiryDate: '2024-09-20',
    targetScreening: 'Mammography',
    matchedPatients: 0,
    pendingPatients: 5,
  },
]

function DonorCampaigns() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)

  // Filter campaigns based on search
  const filteredCampaigns = mockCampaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.targetScreening.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaignToDelete(campaignId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (campaignToDelete) {
      // In real implementation, this would call the API
      toast.success('Campaign deleted successfully')
      setDeleteDialogOpen(false)
      setCampaignToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'Completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getUsagePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your donation campaigns to help patients access screening services.
          </p>
        </div>
        <Button asChild>
          <Link to="/donor/campaigns/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCampaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockCampaigns.filter(c => c.status === 'Active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockCampaigns.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${mockCampaigns.reduce((sum, c) => sum + c.amountUsed, 0).toLocaleString()} used
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
              {mockCampaigns.reduce((sum, c) => sum + c.patientsHelped, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockCampaigns.reduce((sum, c) => sum + c.pendingPatients, 0)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockCampaigns.filter(c => c.status === 'Active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockCampaigns.filter(c => c.status === 'Completed').length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns by name, description, or screening type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Target Screening</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {campaign.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{campaign.targetScreening}</TableCell>
                    <TableCell>${campaign.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${getUsagePercentage(campaign.amountUsed, campaign.amount)}%`
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getUsagePercentage(campaign.amountUsed, campaign.amount)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${campaign.amountUsed.toLocaleString()} used
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{campaign.patientsHelped} helped</p>
                        {campaign.pendingPatients > 0 && (
                          <p className="text-muted-foreground">
                            {campaign.pendingPatients} pending
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/donor`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {campaign.status === 'Active' && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Campaign
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No campaigns found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Campaign
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
              Any unused funds will be moved to the general donation pool.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 