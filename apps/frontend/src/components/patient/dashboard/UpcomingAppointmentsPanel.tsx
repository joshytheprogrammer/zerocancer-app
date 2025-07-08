import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { TPatientAppointment } from '@zerocancer/shared/types'
import { useNavigate } from '@tanstack/react-router'
import calendarIcon from '@/assets/images/calendar.png'

interface UpcomingAppointmentsPanelProps {
  appointment: TPatientAppointment | null | undefined
  isLoading: boolean
}

const AppointmentItem = ({
  appointment,
}: {
  appointment: TPatientAppointment
}) => {
  const navigate = useNavigate()
  return (
    <div
      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
      onClick={() => navigate({ to: '/patient/appointments' })}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg">{appointment.screeningType?.name}</p>
          <p className="text-sm text-muted-foreground">
            {appointment.center?.centerName}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(appointment.appointmentDate).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  )
}

export default function UpcomingAppointmentsPanel({
  appointment,
  isLoading,
}: UpcomingAppointmentsPanelProps) {
  const navigate = useNavigate()

  const handleBookNow = () => {
    navigate({ to: '/patient/book' })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading appointments...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[350px] flex items-center justify-center">
      <CardContent>
        {appointment ? (
          <AppointmentItem appointment={appointment} />
        ) : (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <img
              src={calendarIcon}
              alt="No appointments"
              className="w-20 h-20 mb-4"
            />
            <p className="text-muted-foreground">
              You have no upcoming appointments.
            </p>
            <Button
              onClick={handleBookNow}
              className="mt-4 bg-secondary hover:bg-secondary/80 cursor-pointer text-white font-bold py-2 px-6 rounded-lg"
            >
              Book Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 