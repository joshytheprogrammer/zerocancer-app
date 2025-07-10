import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useAdminAppointments } from '@/services/providers/admin.provider'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  Activity,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  User,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/admin/appointments')({
  component: AdminAppointments,
})

type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

function AdminAppointments() {
  // Filters state
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>(
    'ALL',
  )
  const [centerFilter, setCenterFilter] = useState<string>('')
  const [donationFilter, setDonationFilter] = useState<
    'ALL' | 'DONATION' | 'SELF_PAY'
  >('ALL')
  const [dateFromFilter, setDateFromFilter] = useState<string>('')
  const [dateToFilter, setDateToFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  // Build query parameters
  const queryParams = {
    page,
    pageSize: 20,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(centerFilter && { centerId: centerFilter }),
    ...(donationFilter === 'DONATION' && { isDonation: true }),
    ...(donationFilter === 'SELF_PAY' && { isDonation: false }),
    ...(dateFromFilter && { dateFrom: dateFromFilter }),
    ...(dateToFilter && { dateTo: dateToFilter }),
  }

  // Fetch appointments data
  const {
    data: appointmentsData,
    isLoading,
    error,
    refetch,
  } = useAdminAppointments(queryParams)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'default'
      case 'IN_PROGRESS':
        return 'secondary'
      case 'COMPLETED':
        return 'default'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime)
      return {
        date: format(date, 'MMM dd, yyyy'),
        time: format(date, 'hh:mm a'),
      }
    } catch (error) {
      return {
        date: dateTime,
        // time: time,
      }
    }
  }

  const clearFilters = () => {
    setStatusFilter('ALL')
    setCenterFilter('')
    setDonationFilter('ALL')
    setDateFromFilter('')
    setDateToFilter('')
    setPage(1)
  }

  const appointments = appointmentsData?.data?.appointments || []
  const totalPages = appointmentsData?.data?.totalPages || 0
  const total = appointmentsData?.data?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Appointments Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage all appointments across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Appointments
              </p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Activity className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Scheduled
              </p>
              <p className="text-2xl font-bold">
                {appointments.filter((a) => a.status === 'SCHEDULED').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Heart className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Donations
              </p>
              <p className="text-2xl font-bold">
                {appointments.filter((a) => a.isDonation).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Building2 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Centers
              </p>
              <p className="text-2xl font-bold">
                {new Set(appointments.map((a) => a.centerId)).size}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            {/* Status Filter */}
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as AppointmentStatus | 'ALL')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Center Filter */}
            <div>
              <Label htmlFor="center-filter">Center ID</Label>
              <Input
                id="center-filter"
                placeholder="Filter by center ID..."
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
              />
            </div>

            {/* Donation Type Filter */}
            <div>
              <Label htmlFor="donation-filter">Type</Label>
              <Select
                value={donationFilter}
                onValueChange={(value) =>
                  setDonationFilter(value as 'ALL' | 'DONATION' | 'SELF_PAY')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="DONATION">Donations</SelectItem>
                  <SelectItem value="SELF_PAY">Self Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From Filter */}
            <div>
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            {/* Date To Filter */}
            <div>
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appointments ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading appointments...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-destructive mb-4">
                  Failed to load appointments
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Screening Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => {
                    const dateTime = formatDateTime(
                      appointment.appointmentDateTime,
                    )

                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {appointment.patient.fullName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.patient.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {appointment.center.centerName}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {appointment.center.state},{' '}
                                {appointment.center.lga}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {appointment.screeningType.name}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dateTime.date}</p>
                            <p className="text-sm text-muted-foreground">
                              {dateTime.time}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {appointment.isDonation ? (
                              <>
                                <Heart className="h-4 w-4 text-red-600" />
                                <Badge variant="secondary">Donation</Badge>
                              </>
                            ) : (
                              <Badge variant="outline">Self Pay</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(appointment.status)}
                          >
                            {appointment.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(appointment.createdAt),
                              'MMM dd, yyyy',
                            )}
                          </p>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
