import { Button } from '@/components/ui/button'
import type { TPatientAppointment } from '@zerocancer/shared/types'
import { useNavigate } from '@tanstack/react-router'
import notScreenedIllustration from '@/assets/images/girl-think.png'
import scheduledIllustration from '@/assets/images/center.png'
import { ArrowRight } from 'lucide-react'

interface StatusCardProps {
  appointment: TPatientAppointment | null | undefined
}

export default function StatusCard({ appointment }: StatusCardProps) {
  const navigate = useNavigate()

  const handleBookScreening = () => {
    navigate({ to: '/patient/book' })
  }

  const handleViewDetails = () => {
    if (appointment) {
      navigate({
        to: '/patient/appointments',
        search: { appointmentId: appointment.id },
      })
    }
  }

  return (
    <div className="w-full bg-pink-100 rounded-lg p-6 flex items-center justify-between">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Status</p>
        {appointment ? (
          <>
            <h2 className="text-3xl font-bold text-blue-900">
              Screening Scheduled
            </h2>
            <p className="text-muted-foreground">
              Location: {appointment.center?.centerName},{' '}
              {new Date(appointment.appointmentDate).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                },
              )}{' '}
              |{' '}
              {new Date(appointment.appointmentTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <Button onClick={handleViewDetails}>View Details</Button>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-red-900">Not Screened</h2>
            <p className="text-muted-foreground">Location: -</p>
            <Button
              onClick={handleBookScreening}
              variant="secondary"
              className="flex items-center gap-2"
            >
              Book Screening <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      <div>
        <img
          src={appointment ? scheduledIllustration : notScreenedIllustration}
          alt={appointment ? 'Screening scheduled' : 'Not screened'}
          className="h-32"
        />
      </div>
    </div>
  )
}
