import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  useAdminCenters, 
  useUpdateCenterStatus 
} from '@/services/providers/admin.provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Search, Users, Stethoscope, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/centers')({
  component: AdminCenters,
})

type CenterStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

function AdminCenters() {
  // Filters state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CenterStatus | 'ALL'>('ALL')
  const [stateFilter, setStateFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  // Status update dialog state
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean
    center: any
    newStatus: CenterStatus
    reason: string
  }>({
    open: false,
    center: null,
    newStatus: 'ACTIVE',
    reason: ''
  })

  // Build query parameters
  const queryParams = {
    page,
    pageSize: 20,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(stateFilter && { state: stateFilter }),
    ...(search && { search }),
  }

  // Fetch centers data
  const { 
    data: centersData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(useAdminCenters(queryParams))

  // Status update mutation
  const updateStatusMutation = useUpdateCenterStatus()

  const handleStatusUpdate = async () => {
    if (!statusDialog.center) return

    try {
      await updateStatusMutation.mutateAsync({
        centerId: statusDialog.center.id,
        status: statusDialog.newStatus,
        reason: statusDialog.reason || undefined
      })
      
      toast.success(`Center status updated to ${statusDialog.newStatus}`)
      setStatusDialog(prev => ({ ...prev, open: false, reason: '' }))
      refetch()
    } catch (error) {
      toast.error('Failed to update center status')
    }
  }

  const openStatusDialog = (center: any, newStatus: CenterStatus) => {
    setStatusDialog({
      open: true,
      center,
      newStatus,
      reason: ''
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'INACTIVE': return 'secondary'
      case 'SUSPENDED': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Centers Management</h1>
        <p className="text-muted-foreground">
          Manage and monitor all screening centers in the platform
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search centers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as CenterStatus | 'ALL')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {/* State Filter */}
            <Input
              placeholder="Filter by state..."
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            />

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
                setStateFilter('')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Centers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Centers ({centersData?.data?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading centers...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center h-64 flex items-center justify-center">
              <div>
                <p className="text-red-600 mb-4">Failed to load centers</p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Center Details</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Staff & Services</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centersData?.data?.centers?.map((center) => (
                    <TableRow key={center.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{center.centerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {center.email}
                          </div>
                          {center.phone && (
                            <div className="text-sm text-muted-foreground">
                              {center.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">{center.state}, {center.lga}</div>
                            <div className="text-xs text-muted-foreground">
                              {center.address}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(center.status)}>
                          {center.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4" />
                            <span>{center.staff?.length || 0} staff</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Stethoscope className="h-4 w-4" />
                            <span>{center.services?.length || 0} services</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {center.status !== 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStatusDialog(center, 'ACTIVE')}
                            >
                              Activate
                            </Button>
                          )}
                          {center.status !== 'SUSPENDED' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openStatusDialog(center, 'SUSPENDED')}
                            >
                              Suspend
                            </Button>
                          )}
                          {center.status !== 'INACTIVE' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openStatusDialog(center, 'INACTIVE')}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) || []}
                </TableBody>
              </Table>

              {/* Pagination */}
              {centersData?.data?.totalPages && centersData.data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {centersData.data.page} of {centersData.data.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= centersData.data.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => 
        setStatusDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Center Status
            </DialogTitle>
            <DialogDescription>
              Change the status of "{statusDialog.center?.centerName}" to{' '}
              <strong>{statusDialog.newStatus}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for status change..."
                value={statusDialog.reason}
                onChange={(e) => setStatusDialog(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialog(prev => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 