import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useDeleteCampaign,
  useDonorCampaigns,
  useUpdateCampaign,
} from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/donor/campaigns/')({
  component: DonorCampaigns,
  loader: ({ context }) => {
    // update to properly match later
    context.queryClient.prefetchQuery(
      useDonorCampaigns({
        page: 1,
        pageSize: 10,
        status: undefined,
        search: undefined,
      }),
    )
  },
})

// Real API integration will be added here - keeping mock for now during development

function DonorCampaigns() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ACTIVE' | 'COMPLETED' | 'DELETED' | undefined
  >(undefined)
  const [page, setPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)

  // Fetch campaigns with filters
  const {
    data: campaignsData,
    isLoading,
    error,
  } = useQuery(
    useDonorCampaigns({
      page,
      pageSize: 10,
      status: statusFilter,
      search: searchTerm || undefined,
    }),
  )

  // Delete campaign mutation
  const deleteCampaignMutation = useDeleteCampaign()

  const campaigns = campaignsData?.data?.campaigns || []

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaignToDelete(campaignId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (campaignToDelete) {
      try {
        await deleteCampaignMutation.mutateAsync({
          campaignId: campaignToDelete,
          action: 'recycle_to_general', // Default action
          reason: 'Deleted by donor',
        })
        toast.success('Campaign deleted successfully')
        setDeleteDialogOpen(false)
        setCampaignToDelete(null)
      } catch (error) {
        toast.error('Failed to delete campaign')
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'DELETED':
        return <Badge className="bg-red-100 text-red-800">Deleted</Badge>
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
            Create and manage your donation campaigns to help patients access
            screening services.
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
            <CardTitle className="text-sm font-medium">
              Total Campaigns
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : campaignsData?.data?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter((c) => c.status === 'ACTIVE').length} active
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
              {isLoading
                ? '...'
                : `₦${campaigns.reduce((sum, c) => sum + c.fundingAmount, 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              ₦
              {campaigns
                .reduce((sum, c) => sum + c.usedAmount, 0)
                .toLocaleString()}{' '}
              used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Patients Helped
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? '...'
                : campaigns.reduce(
                    (sum, c) => sum + c.patientAllocations.patientsHelped,
                    0,
                  )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Funds
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? '...'
                : `₦${campaigns.reduce((sum, c) => sum + c.usedAmount, 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for allocation
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
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter || 'ALL'}
              onValueChange={(value) =>
                setStatusFilter(value === 'ALL' ? undefined : (value as any))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter(undefined)
              }}
            >
              Clear Filters
            </Button>
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      Loading campaigns...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-red-600"
                    >
                      Error loading campaigns. Please try again.
                    </TableCell>
                  </TableRow>
                ) : campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {campaign.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.screeningTypes?.length > 0
                          ? campaign.screeningTypes
                              .map((st) => st.name)
                              .join(', ')
                          : 'All Types'}
                      </TableCell>
                      <TableCell>
                        ₦{campaign.fundingAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${getUsagePercentage(campaign.usedAmount, campaign.fundingAmount)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {getUsagePercentage(
                                campaign.usedAmount,
                                campaign.fundingAmount,
                              )}
                              %
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ₦{campaign.usedAmount.toLocaleString()} used
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {campaign.patientAllocations.patientsHelped} helped
                          </p>
                          <p className="text-muted-foreground">
                            ₦{campaign.usedAmount.toLocaleString()} available
                          </p>
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
                              <Link
                                to="/donor/campaigns/$campaignId"
                                params={{ campaignId: campaign.id }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {campaign.status === 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteCampaign(campaign.id)
                                }
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No campaigns found.
                      </p>
                      <Button variant="outline" className="mt-2" asChild>
                        <Link to="/donor/campaigns/create">
                          Create Your First Campaign
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
              Are you sure you want to delete this campaign? This action cannot
              be undone. Any unused funds will be moved to the general donation
              pool.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
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
