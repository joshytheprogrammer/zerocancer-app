import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import {
  useDeleteCampaign,
  useDonorCampaigns,
} from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import health from '@/assets/images/health.png'
import location from '@/assets/images/location.png'
import megaphone from '@/assets/images/megaphone.png'
import sponsored from '@/assets/images/sponsored.png'

// Helper function to format currency concisely
const formatCurrency = (amount: number) => {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`
  return `₦${amount}`
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
  value: string | number
  unit: string
  icon: string
  color: string
  loading: boolean
}) {
  return (
    <Card className={`p-5 ${color} border-0 shadow-sm`}>
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm font-semibold">{title}</p>
        <img src={icon} alt={title} className="w-9 h-9 opacity-70" />
      </div>
      {loading ? (
        <div className="h-9 w-1/2 bg-gray-400/20 rounded-md animate-pulse mt-2" />
      ) : (
        <p className="text-3xl font-bold">{value}</p>
      )}
      <p className="text-xs">{unit}</p>
    </Card>
  )
}

export function DonorCampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ACTIVE' | 'COMPLETED' | 'DELETED' | undefined
  >(undefined)
  const [page, setPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null)

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

  const deleteCampaignMutation = useDeleteCampaign()

  const campaigns = campaignsData?.data?.campaigns || []

  // Note: These stats are calculated from ALL campaigns, not just the paginated result.
  const totalCampaigns = campaignsData?.data?.total || 0
  const totalSponsored = campaigns.reduce(
    (sum, c) => sum + (c.patientAllocations?.patientsHelped || 0),
    0,
  )
  const totalDonated = campaigns.reduce((sum, c) => sum + c.fundingAmount, 0)
  const locationsImpacted = new Set(
    campaigns.flatMap((c) => c.targetStates || []),
  ).size

  const handleDeleteCampaign = (campaign: any) => {
    setCampaignToDelete(campaign)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (campaignToDelete) {
      try {
        await deleteCampaignMutation.mutateAsync({
          campaignId: campaignToDelete.id,
          action: 'recycle_to_general',
          reason: 'Deleted by donor',
        })
        toast.success(`Campaign "${campaignToDelete.title}" deleted.`)
        setDeleteDialogOpen(false)
        setCampaignToDelete(null)
      } catch (err) {
        toast.error('Failed to delete campaign.')
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-100 text-green-700 border border-green-200">
            Active
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
            Completed
          </Badge>
        )
      case 'DELETED':
        return (
          <Badge className="bg-red-100 text-red-700 border border-red-200">
            Deleted
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">My Campaigns</h1>
        <p className="text-gray-500 mt-1">
          Create and manage your donation campaigns to help patients access
          screening services.
        </p>
      </div>

      <div className="border-b border-dashed border-gray-200 -mx-8"></div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Campaigns"
          value={totalCampaigns}
          unit="People"
          icon={megaphone}
          color="bg-green-50 text-green-800"
          loading={isLoading}
        />
        <StatCard
          title="Total Sponsored"
          value={totalSponsored}
          unit="People"
          icon={sponsored}
          color="bg-blue-50 text-blue-800"
          loading={isLoading}
        />
        <StatCard
          title="Total Donated"
          value={formatCurrency(totalDonated)}
          unit="NGN"
          icon={health}
          color="bg-pink-50 text-pink-800"
          loading={isLoading}
        />
        <StatCard
          title="Locations Impacted"
          value={locationsImpacted}
          unit="States"
          icon={location}
          color="bg-purple-50 text-purple-800"
          loading={isLoading}
        />
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>All Campaigns</CardTitle>
            <Button
              asChild
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              <Link to="/donor/campaigns/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 flex items-center gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns by name..."
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Sponsored Tests</TableHead>
                  <TableHead>Donation</TableHead>
                  <TableHead>Sponsored Patients</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-64 text-center text-red-500"
                    >
                      Error loading campaigns.
                    </TableCell>
                  </TableRow>
                ) : campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">
                        {campaign.title}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
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
                        {campaign.patientAllocations.patientsHelped}
                      </TableCell>
                      <TableCell>
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                to="/donor/campaigns/$campaignId"
                                params={{ campaignId: campaign.id }}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            {campaign.status === 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteCampaign(campaign)}
                                className="text-red-500 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <p className="font-medium">No campaigns found.</p>
                      <p className="text-sm text-gray-500">
                        Create your first campaign to get started.
                      </p>
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
              Are you sure you want to delete the campaign titled "
              <strong>{campaignToDelete?.title}</strong>"? Any unused funds will
              be moved to the general donation pool. This action cannot be
              undone.
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
              {deleteCampaignMutation.isPending
                ? 'Deleting...'
                : 'Delete Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
