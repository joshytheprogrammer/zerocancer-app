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
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  useDeleteCampaign,
  useDonorCampaign,
  useFundCampaign,
} from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  MoreHorizontal,
  PieChart,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/donor/campaigns/$campaignId')({
  component: CampaignDetails,
  // preload:
  // loader: ({ context, params: { campaignId } }) => {
  //   context.queryClient.prefetchQuery(useDonorCampaign(campaignId))
  // },
})

function CampaignDetails() {
  const { campaignId } = Route.useParams()
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')

  // Fetch campaign details
  const {
    data: campaignData,
    isLoading,
    error,
  } = useQuery(useDonorCampaign(campaignId))

  // Delete campaign mutation
  const deleteCampaignMutation = useDeleteCampaign()

  // Fund campaign mutation
  const fundCampaignMutation = useFundCampaign()

  const campaign = campaignData?.data

  const handleDelete = async () => {
    try {
      await deleteCampaignMutation.mutateAsync({
        campaignId,
        action: 'recycle_to_general',
        reason: 'Deleted by donor from campaign details',
      })
      toast.success('Campaign deleted successfully')
      navigate({ to: '/donor/campaigns' })
    } catch (error) {
      toast.error('Failed to delete campaign')
    }
  }

  const handleFundCampaign = async () => {
    const amount = parseFloat(fundAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await fundCampaignMutation.mutateAsync({
        campaignId,
        amount,
      })
      toast.success('Campaign funded successfully')
      setFundDialogOpen(false)
      setFundAmount('')
    } catch (error) {
      toast.error('Failed to fund campaign')
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
    return total > 0 ? Math.round((used / total) * 100) : 0
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/donor/campaigns">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaign details...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/donor/campaigns">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Campaign Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The campaign you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/donor/campaigns">View All Campaigns</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/donor/campaigns">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground">Campaign Details & Impact</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(campaign.status)}
          {campaign.status === 'ACTIVE' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFundDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Fund Campaign
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Campaign
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Campaign Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{campaign.fundingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Initial donation amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{campaign.usedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {getUsagePercentage(campaign.usedAmount, campaign.fundingAmount)}%
              of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{campaign.usedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for allocation
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
              {campaign.patientAllocations.patientsHelped}
            </div>
            <p className="text-xs text-muted-foreground">Lives impacted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Campaign Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Campaign Progress
              </CardTitle>
              <CardDescription>
                Track how your donation is being utilized to help patients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Funds Utilized</span>
                  <span>
                    {getUsagePercentage(
                      campaign.usedAmount,
                      campaign.fundingAmount,
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    campaign.usedAmount,
                    campaign.fundingAmount,
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₦{campaign.usedAmount.toLocaleString()} used</span>
                  <span>₦{campaign.usedAmount.toLocaleString()} remaining</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      Successful Allocations
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {campaign.patientAllocations.patientsHelped}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Patients screened
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">
                      Pending Allocations
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {Math.floor(campaign.usedAmount / 2500)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estimated capacity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient allocations will be available when API endpoint is implemented */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {campaign.description}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-1">Purpose</h4>
                <p className="text-sm text-muted-foreground">
                  {campaign.purpose}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(campaign.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expires:</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(campaign.expiryDate), 'MMM dd, yyyy')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(campaign.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Target Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">Screening Types</h4>
                <div className="flex flex-wrap gap-1">
                  {campaign.screeningTypes?.length > 0 ? (
                    campaign.screeningTypes.map((type) => (
                      <Badge key={type.id} variant="outline">
                        {type.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">All Types</Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Target Gender</h4>
                <Badge variant="outline">
                  {campaign.targetGender || 'All'}
                </Badge>
              </div>

              {campaign.targetStates && campaign.targetStates.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Target States</h4>
                  <div className="flex flex-wrap gap-1">
                    {campaign.targetStates.map((state, index) => (
                      <Badge key={index} variant="outline">
                        {state}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {campaign.targetAgeMin && campaign.targetAgeMax && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Age Range</h4>
                  <Badge variant="outline">
                    {campaign.targetAgeMin} - {campaign.targetAgeMax} years
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/donor/campaigns/create">
                  Create Similar Campaign
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/donor/campaigns">Back to All Campaigns</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fund Campaign Dialog */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              Fund Campaign
            </DialogTitle>
            <DialogDescription>
              Add additional funds to "{campaign.title}" to help more patients.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Additional Amount (NGN)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount to add"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                min="1000"
                step="100"
              />
              <p className="text-sm text-muted-foreground">
                Minimum funding amount is ₦1,000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFundCampaign}
              disabled={fundCampaignMutation.isPending || !fundAmount}
            >
              {fundCampaignMutation.isPending
                ? 'Processing...'
                : 'Fund Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Campaign
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{campaign.title}"? This action
              cannot be undone. Any unused funds will be moved to the general
              donation pool.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCampaignMutation.isPending}
            >
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
