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
import { useQuery } from '@tanstack/react-query'
import { usePatientAppointments } from '@/services/providers/patient.provider'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/patient/appointments')({
  component: PatientAppointments,
})

function AppointmentCard({ appointment }: { appointment: any }) {
  const isPast = new Date(appointment.appointmentDate) < new Date()
  const hasResult = appointment.result?.id
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{appointment.screeningType?.name || 'Unknown Screening'}</CardTitle>
        <CardDescription>
          At {appointment.center?.centerName || 'Unknown Center'} on{' '}
          {new Date(appointment.appointmentDate).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>
            Status:{' '}
            <span
              className={
                appointment.status === 'SCHEDULED'
                  ? 'text-blue-600'
                  : appointment.status === 'COMPLETED'
                    ? 'text-green-600'
                    : appointment.status === 'CANCELLED'
                      ? 'text-red-600'
                      : 'text-yellow-600'
              }
            >
              {appointment.status}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Location: {appointment.center?.address}
          </p>
          {appointment.checkInCode && (
            <p className="text-sm">
              Check-in Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{appointment.checkInCode}</span>
            </p>
          )}
          {appointment.transaction && (
            <p className="text-sm text-muted-foreground">
              Payment: ${appointment.transaction.amount} ({appointment.transaction.status})
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {isPast ? (
          hasResult && (
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
  // Fetch all appointments using the proper provider function
  // Using empty object to avoid pagination validation issues
  const { data: appointmentsData, isLoading, error } = useQuery(
    usePatientAppointments({})
  )

  const appointments = appointmentsData?.data?.appointments || []

  // Separate upcoming and past appointments
  const now = new Date()
  const upcomingAppointments = appointments.filter(
    (appt: any) => new Date(appt.appointmentDate) >= now
  )
  const pastAppointments = appointments.filter(
    (appt: any) => new Date(appt.appointmentDate) < now
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your appointments...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600">Error loading appointments</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <p className="text-muted-foreground">
          Here you can view and manage your appointments.
        </p>
        {appointments.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Total: {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <div className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appt: any) => (
                <AppointmentCard key={appt.id} appointment={appt} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You have no upcoming appointments.</p>
                <Button asChild>
                  <Link to="/patient/book">Book New Appointment</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="space-y-4">
            {pastAppointments.length > 0 ? (
              pastAppointments.map((appt: any) => (
                <AppointmentCard key={appt.id} appointment={appt} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">You have no past appointments.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 