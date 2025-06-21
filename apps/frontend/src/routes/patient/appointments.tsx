import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/patient/appointments')({
  component: PatientAppointments,
})

const mockAppointments = {
  upcoming: [
    {
      id: 'appt_123',
      type: 'Cervical Cancer Screening',
      center: 'City Health Clinic',
      date: '2024-08-15T10:30:00Z',
      status: 'Confirmed',
    },
  ],
  past: [
    {
      id: 'appt_456',
      type: 'Prostate Cancer Screening',
      center: 'General Hospital',
      date: '2024-06-20T14:00:00Z',
      status: 'Completed',
      resultId: 'res_456',
    },
    {
      id: 'appt_789',
      type: 'Breast Cancer Screening',
      center: 'Wellness Center',
      date: '2023-11-10T09:00:00Z',
      status: 'Cancelled',
    },
  ],
}

function AppointmentCard({
  appointment,
}: {
  appointment: (typeof mockAppointments.upcoming)[0] & {
    resultId?: string
  }
}) {
  const isPast = new Date(appointment.date) < new Date()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{appointment.type}</CardTitle>
        <CardDescription>
          At {appointment.center} on{' '}
          {new Date(appointment.date).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Status:{' '}
          <span
            className={
              appointment.status === 'Confirmed'
                ? 'text-blue-600'
                : appointment.status === 'Completed'
                  ? 'text-green-600'
                  : 'text-red-600'
            }
          >
            {appointment.status}
          </span>
        </p>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {isPast ? (
          appointment.resultId && (
            <Button asChild>
              <Link to="/patient/results">View Results</Link>
            </Button>
          )
        ) : (
          <Button variant="destructive">Cancel</Button>
        )}
      </CardFooter>
    </Card>
  )
}

function PatientAppointments() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <p className="text-muted-foreground">
          Here you can view and manage your appointments.
        </p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <div className="space-y-4">
            {mockAppointments.upcoming.length > 0 ? (
              mockAppointments.upcoming.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} />
              ))
            ) : (
              <p>You have no upcoming appointments.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="space-y-4">
            {mockAppointments.past.length > 0 ? (
              mockAppointments.past.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} />
              ))
            ) : (
              <p>You have no past appointments.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 