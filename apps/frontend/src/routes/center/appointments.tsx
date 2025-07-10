import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  centerAppointmentById,
  centerAppointments,
  useCancelCenterAppointment,
} from '@/services/providers/center.provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Search,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type SearchParams = {
  appointmentId?: string
  filter?: string
}

export const Route = createFileRoute('/center/appointments')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      appointmentId: search.appointmentId as string,
      filter: search.filter as string,
    }
  },
  component: CenterAppointments,
})

function CenterAppointments() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { appointmentId, filter } = Route.useSearch()

  // Local state for filters and pagination
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState(filter || '')
  const [screeningTypeFilter, setScreeningTypeFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(
    null,
  )

  // Fetch appointments with current filters
  const {
    data: appointmentsData,
    isLoading,
    error,
  } = useQuery(
    centerAppointments({
      page,
      pageSize,
      screeningType: screeningTypeFilter || undefined,
    }),
  )

  // Fetch single appointment for dialog
  const { data: appointmentDetail } = useQuery({
    ...centerAppointmentById(selectedAppointment || ''),
    enabled: !!selectedAppointment,
  })

  // Cancel appointment mutation
  const cancelMutation = useCancelCenterAppointment()

  const appointments = appointmentsData?.data?.appointments || []
  const totalPages = appointmentsData?.data?.totalPages || 1
  const total = appointmentsData?.data?.total || 0

  // Filter appointments locally based on search term and status
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      !searchTerm ||
      apt.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.screeningType?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || apt.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handle appointment selection from URL
  if (appointmentId && !selectedAppointment) {
    setSelectedAppointment(appointmentId)
  }

  const handleViewAppointment = (id: string) => {
    setSelectedAppointment(id)
    navigate({
      to: '/center/appointments',
      search: { appointmentId: id },
    })
  }

  const handleCloseDialog = () => {
    setSelectedAppointment(null)
    navigate({
      to: '/center/appointments',
      search: {},
    })
  }

  const handleCancelAppointment = (id: string, reason?: string) => {
    cancelMutation.mutate(
      { id, reason },
      {
        onSuccess: () => {
          toast.success('Appointment cancelled successfully')
          queryClient.invalidateQueries({ queryKey: ['centerAppointments'] })
          handleCloseDialog()
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.error || 'Failed to cancel appointment',
          )
        },
      },
    )
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    return timeString || 'Not specified'
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">
          View and manage appointments for your center
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name or screening type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(value) =>
                  setStatusFilter(value === 'all' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Screening Type</label>
              <Input
                placeholder="Filter by screening type..."
                value={screeningTypeFilter}
                onChange={(e) => setScreeningTypeFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Appointments ({total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load appointments</p>
              <p className="text-sm">Please try again later</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No appointments found</p>
              <p className="text-sm">
                {searchTerm || statusFilter || screeningTypeFilter
                  ? 'Try adjusting your filters'
                  : 'New appointments will appear here'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Screening Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {appointment.patient?.fullName || 'Unknown Patient'}
                      </TableCell>
                      <TableCell>
                        {appointment.screeningType?.name || 'Unknown Type'}
                      </TableCell>
                      <TableCell>
                        {formatDate((appointment as any).appointmentDateTime)}
                      </TableCell>
                      <TableCell>
                        {formatTime((appointment as any).appointmentDateTime)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(appointment.status)}>
                          {appointment.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAppointment(appointment.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Appointment Details
              <Button variant="ghost" size="sm" onClick={handleCloseDialog}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              View and manage appointment information
            </DialogDescription>
          </DialogHeader>

          {appointmentDetail ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Patient Information</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Name:</span>{' '}
                      {appointmentDetail.data.patient?.fullName}
                    </p>
                    <p>
                      <span className="font-medium">ID:</span>{' '}
                      {appointmentDetail.data.patient?.id}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Appointment Details</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Type:</span>{' '}
                      {appointmentDetail.data.screeningType?.name}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {formatDate(
                        (appointmentDetail.data as any).appointmentDateTime,
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span>{' '}
                      {formatTime(
                        (appointmentDetail.data as any).appointmentDateTime,
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <Badge
                        variant={getStatusVariant(
                          appointmentDetail.data.status,
                        )}
                        className="ml-2"
                      >
                        {appointmentDetail.data.status
                          .replace('_', ' ')
                          .toUpperCase()}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              {appointmentDetail.data.status === 'SCHEDULED' && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleCancelAppointment(
                        appointmentDetail.data.id,
                        'Cancelled by center',
                      )
                    }
                    disabled={cancelMutation.status === 'pending'}
                  >
                    {cancelMutation.status === 'pending'
                      ? 'Cancelling...'
                      : 'Cancel Appointment'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-muted animate-pulse rounded" />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
