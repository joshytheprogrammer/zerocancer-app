import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Calendar,
  Upload,
  CircleDollarSign,
  ArrowUpRight,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/center/')({
  component: CenterDashboard,
})

const mockDashboardData = {
  stats: [
    {
      title: 'Upcoming Appointments',
      value: '12',
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
      change: '+3 since last week',
    },
    {
      title: 'Results to Upload',
      value: '8',
      icon: <Upload className="h-4 w-4 text-muted-foreground" />,
      change: '2 new today',
    },
    {
      title: 'Total Patients Served',
      value: '234',
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      change: '+20 this month',
    },
    {
      title: 'Monthly Revenue',
      value: '$2,450',
      icon: <CircleDollarSign className="h-4 w-4 text-muted-foreground" />,
      change: '+5.2% from last month',
    },
  ],
  recentAppointments: [
    {
      id: 'appt_c1',
      patient: 'John Doe',
      type: 'Cervical Cancer Screening',
      date: '2024-08-15',
      status: 'Confirmed',
    },
    {
      id: 'appt_c2',
      patient: 'Jane Smith',
      type: 'Prostate Cancer Screening',
      date: '2024-08-16',
      status: 'Confirmed',
    },
    {
      id: 'appt_c3',
      patient: 'Peter Jones',
      type: 'Breast Cancer Screening',
      date: '2024-08-14',
      status: 'Completed',
    },
  ],
}

function CenterDashboard() {
  const center = { name: 'City Health Clinic' }
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {center.name}. Here's an overview of your center's
          activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockDashboardData.stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent appointments table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Screening Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDashboardData.recentAppointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>{appt.patient}</TableCell>
                  <TableCell>{appt.type}</TableCell>
                  <TableCell>{appt.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        appt.status === 'Confirmed' ? 'default' : 'secondary'
                      }
                    >
                      {appt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/center/appointments">View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 