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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import { cn } from '@/lib/utils'
import {
  centerAppointmentById,
  centerAppointments,
  useCancelCenterAppointment,
} from '@/services/providers/center.provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getCenterAppointmentsSchema } from '@zerocancer/shared/schemas/appointment.schema'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

type SearchParams = {
  appointmentId?: string
  status?: z.infer<typeof getCenterAppointmentsSchema>['status']
}

type StatusFilter =
  | z.infer<typeof getCenterAppointmentsSchema>['status']
  | 'ALL'

export const Route = createFileRoute('/center/appointments')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      appointmentId: search.appointmentId as string,
      status: search.status as SearchParams['status'],
    }
  },
  component: CenterAppointments,
})

function CenterAppointments() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { appointmentId, status } = Route.useSearch()

  // Local state for filters and pagination
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    status || 'ALL',
  )
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
      status: statusFilter === 'ALL' ? undefined : statusFilter,
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

  // Filter appointments locally based on search term
  const filteredAppointments = searchTerm
    ? appointments.filter((apt) =>
        apt.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : appointments

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

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-orange-400'
      case 'COMPLETED':
        return 'bg-green-500'
      case 'CANCELED':
        return 'bg-gray-500'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      default:
        return 'bg-gray-400'
    }
  }

  const handleStatusChange = (newStatus: string) => {
    const typedStatus = newStatus as StatusFilter
    setStatusFilter(typedStatus)
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

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return 'Invalid Time'
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">
          View and manage appointments for your center
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Tabs value={statusFilter} onValueChange={handleStatusChange}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="CANCELED">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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
                {searchTerm || statusFilter === 'ALL'
                  ? 'Try adjusting your filters'
                  : 'New appointments will appear here'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50 hover:bg-blue-100">
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {appointment.patient?.fullName || 'Unknown Patient'}
                      </TableCell>
                      <TableCell>
                        {formatTime(appointment.appointmentDateTime)}
                      </TableCell>
                      <TableCell>
                        {appointment.screeningType?.name || 'Unknown Type'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-white border-transparent',
                            getStatusBadgeClasses(appointment.status),
                          )}
                        >
                          {appointment.status
                            .replace('_', ' ')
                            .replace('SCHEDULED', 'PENDING')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                handleViewAppointment(appointment.id)
                              }
                            >
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                        className={cn(
                          'text-white border-transparent ml-2',
                          getStatusBadgeClasses(appointmentDetail.data.status),
                        )}
                      >
                        {appointmentDetail.data.status
                          .replace('_', ' ')
                          .replace('SCHEDULED', 'PENDING')}
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
