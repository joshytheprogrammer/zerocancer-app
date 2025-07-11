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
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,   
  Edit,
  MoreHorizontal,
  Plus,
  Target,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import sponsored from '@/assets/images/sponsored.png'
import health from '@/assets/images/health.png'
import treatment from '@/assets/images/treatment.png'
import vaccinated from '@/assets/images/vaccinated.png'

export const Route = createFileRoute('/donor/campaigns/$campaignId')({
  component: CampaignDetails,
  loader: ({ context, params: { campaignId } }) => {
    context.queryClient.prefetchQuery(useDonorCampaign(campaignId))
  },
})

function CampaignDetails() {
  const { campaignId } = Route.useParams()
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')

  const {
    data: campaignData,
    isLoading,
    error,
  } = useQuery(useDonorCampaign(campaignId))

  const deleteCampaignMutation = useDeleteCampaign()
  const fundCampaignMutation = useFundCampaign()

  const campaign = campaignData?.data

  const handleDelete = async () => {
    if (!campaign) return
    try {
      await deleteCampaignMutation.mutateAsync({
        campaignId,
        action: 'recycle_to_general',
        reason: 'Deleted by donor from campaign details',
      })
      toast.success(`Campaign "${campaign.title}" deleted successfully.`)
      navigate({ to: '/donor/campaigns' })
    } catch (err) {
      toast.error('Failed to delete campaign.')
    }
  }

  const handleFundCampaign = async () => {
    const amount = parseFloat(fundAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }

    try {
      const paymentLink = await fundCampaignMutation.mutateAsync({
        campaignId,
        amount,
      })
      if (paymentLink?.data?.authorizationUrl) {
        window.location.href = paymentLink.data.authorizationUrl
      }
      toast.success('Redirecting to payment page...')
      setFundDialogOpen(false)
      setFundAmount('')
    } catch (err) {
      toast.error('Failed to initiate funding.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 border border-green-200">Active</Badge>
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Completed</Badge>
      case 'DELETED':
        return <Badge className="bg-red-100 text-red-700 border border-red-200">Deleted</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getUsagePercentage = (used: number, total: number) => {
    if (total === 0) return 0
    return Math.min(Math.round((used / total) * 100), 100)
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading campaign details...</p>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The campaign you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/donor/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Campaigns
          </Link>
        </Button>
      </div>
    )
  }

  const availableAmount = campaign.fundingAmount - campaign.usedAmount

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/donor/campaigns">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {campaign.title}
          </h1>
          <p className="text-gray-500 mt-1">Campaign Details & Impact</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          {getStatusBadge(campaign.status)}
          {campaign.status === 'ACTIVE' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
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
                  Edit (soon)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Amount"
          value={`₦${campaign.fundingAmount.toLocaleString()}`}
          description="Initial donation amount"
          icon={health}
          color="bg-green-50 text-green-800"
        />
        <StatCard
          title="Amount Used"
          value={`₦${campaign.usedAmount.toLocaleString()}`}
          description={`${getUsagePercentage(campaign.usedAmount, campaign.fundingAmount)}% of total`}
          icon={treatment}
          color="bg-blue-50 text-blue-800"
        />
        <StatCard
          title="Available"
          value={`₦${availableAmount.toLocaleString()}`}
          description="Ready for allocation"
          icon={vaccinated}
          color="bg-purple-50 text-purple-800"
        />
        <StatCard
          title="Patients Helped"
          value={campaign.patientAllocations.patientsHelped}
          description="Lives impacted"
          icon={sponsored}
          color="bg-pink-50 text-pink-800"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Campaign Progress
              </CardTitle>
              <CardDescription>
                Track how your donation is being utilized to help patients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Funds Utilized</span>
                  <span>{getUsagePercentage(campaign.usedAmount, campaign.fundingAmount)}%</span>
                </div>
                <Progress value={getUsagePercentage(campaign.usedAmount, campaign.fundingAmount)} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₦{campaign.usedAmount.toLocaleString()} used</span>
                  <span>₦{availableAmount.toLocaleString()} remaining</span>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Successful Allocations</p>
                    <p className="text-2xl font-bold">{campaign.patientAllocations.patientsHelped}</p>
                    <p className="text-xs text-muted-foreground">Patients screened</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Allocations</p>
                    <p className="text-2xl font-bold">{Math.floor(availableAmount / 2500)}</p>
                    <p className="text-xs text-muted-foreground">Estimated capacity</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
              </div>
              <Separator />
              <div>
                <Label>Purpose</Label>
                <p className="text-sm text-muted-foreground">{campaign.purpose}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <InfoRow label="Created" value={format(new Date(campaign.createdAt), 'MMM dd, yyyy')} />
                <InfoRow label="Expires" value={format(new Date(campaign.expiryDate), 'MMM dd, yyyy')} />
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(campaign.status)}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Targeting Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CriteriaRow label="Screening Types">
                {campaign.screeningTypes?.length > 0 ? (
                  campaign.screeningTypes.map((type) => (
                    <Badge key={type.id} variant="secondary">{type.name}</Badge>
                  ))
                ) : <Badge variant="secondary">All Types</Badge>}
              </CriteriaRow>
              <CriteriaRow label="Gender">
                <Badge variant="secondary">{campaign.targetGender || 'All'}</Badge>
              </CriteriaRow>
              {campaign.targetAgeMin && campaign.targetAgeMax && (
                <CriteriaRow label="Age Range">
                  <Badge variant="secondary">{campaign.targetAgeMin} - {campaign.targetAgeMax} years</Badge>
                </CriteriaRow>
              )}
              {campaign.targetStates && campaign.targetStates.length > 0 && (
                 <CriteriaRow label="States">
                  {campaign.targetStates.map((state) => (
                    <Badge key={state} variant="secondary">{state}</Badge>
                  ))}
                </CriteriaRow>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fund Campaign Dialog */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Campaign</DialogTitle>
            <DialogDescription>
              Add additional funds to "{campaign.title}" to help more patients.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="amount">Additional Amount (NGN)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 50000"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFundCampaign} disabled={fundCampaignMutation.isPending || !fundAmount}>
              {fundCampaignMutation.isPending ? 'Processing...' : 'Proceed to Fund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" />
              Delete Campaign
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{campaign.title}"? This action cannot be undone.
              Any unused funds will be moved to the general donation pool.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCampaignMutation.isPending}>
              {deleteCampaignMutation.isPending ? 'Deleting...' : 'Delete Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Sub-components for cleaner structure ---

function StatCard({ icon, title, value, description, color }: {
  icon: string;
  title: string;
  value: string | number;
  description: string;
  color: string;
}) {
  return (
    <Card className={`p-5 ${color} border-0 shadow-sm`}>
       <div className="flex justify-between items-center mb-1">
        <p className="text-sm font-semibold">{title}</p>
        <img src={icon} alt={title} className="w-9 h-9 opacity-70" />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs">{description}</p>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function CriteriaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="flex flex-wrap gap-2 mt-2">{children}</div>
    </div>
  )
}
