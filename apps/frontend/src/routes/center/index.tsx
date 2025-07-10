import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuthUser } from '@/services/providers/auth.provider'
import { centerAppointments } from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Calendar,
  CircleDollarSign,
  FileText,
  QrCode,
  Upload,
  Users,
} from 'lucide-react'

export const Route = createFileRoute('/center/')({
  component: CenterDashboard,
})

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

function CenterDashboard() {
  const authUserQuery = useQuery(useAuthUser())

  // Get recent appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery(
    centerAppointments({
      page: 1,
      pageSize: 5,
    }),
  )

  // TODO: Add these service functions to center.service.ts
  // const { data: dashboardStats } = useQuery(centerDashboardStats())
  // For now, using calculated stats from appointments data

  const appointments = appointmentsData?.data?.appointments || []

  // Calculate stats from available data
  const upcomingCount = appointments.filter(
    (apt: any) => apt.status === 'scheduled',
  ).length
  const completedCount = appointments.filter(
    (apt: any) => apt.status === 'completed',
  ).length
  const inProgressCount = appointments.filter(
    (apt: any) => apt.status === 'in_progress',
  ).length
  const pendingResultsCount = appointments.filter(
    (apt: any) => apt.status === 'completed' && !(apt as any).resultUploaded,
  ).length

  const stats = [
    {
      title: 'Upcoming Appointments',
      value: appointmentsLoading ? '...' : upcomingCount.toString(),
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
      change: 'Today',
      link: '/center/appointments?filter=scheduled',
    },
    {
      title: 'Results to Upload',
      value: appointmentsLoading ? '...' : pendingResultsCount.toString(),
      icon: <Upload className="h-4 w-4 text-muted-foreground" />,
      change: 'Pending upload',
      link: '/center/upload-results',
    },
    {
      title: 'In Progress',
      value: appointmentsLoading ? '...' : inProgressCount.toString(),
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      change: 'Currently checking in',
      link: '/center/verify-code',
    },
    {
      title: 'Completed Today',
      value: appointmentsLoading ? '...' : completedCount.toString(),
      icon: <CircleDollarSign className="h-4 w-4 text-muted-foreground" />,
      change: 'This month',
      link: '/center/results-history',
    },
  ]

  const centerName = authUserQuery.data?.data?.user?.fullName || 'Your Center'

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {centerName}. Here's an overview of your center's
          activity.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild className="h-16 flex-col gap-2">
          <Link to="/center/verify-code">
            <QrCode className="h-6 w-6" />
            Verify Check-in
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-16 flex-col gap-2">
          <Link to="/center/upload-results">
            <Upload className="h-6 w-6" />
            Upload Results
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-16 flex-col gap-2">
          <Link to="/center/appointments">
            <FileText className="h-6 w-6" />
            View All Appointments
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
              {stat.link && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-2"
                  asChild
                >
                  <Link to={stat.link}>View all →</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent appointments table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Appointments</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/center/appointments">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No appointments found</p>
              <p className="text-sm">New appointments will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Screening Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell className="font-medium">
                      {appt.patient?.fullName || 'Unknown Patient'}
                    </TableCell>
                    <TableCell>
                      {appt.screeningType?.name || 'Unknown Type'}
                    </TableCell>
                    <TableCell>
                      {formatDate(appt.appointmentDateTime)} at{' '}
                      {formatTime(appt.appointmentDateTime)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          appt.status === 'SCHEDULED'
                            ? 'default'
                            : appt.status === 'IN_PROGRESS'
                              ? 'secondary'
                              : appt.status === 'COMPLETED'
                                ? 'outline'
                                : 'destructive'
                        }
                      >
                        {appt.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to="/center/appointments"
                          search={{ appointmentId: appt.id }}
                        >
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
