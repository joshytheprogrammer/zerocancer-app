import cross from '@/assets/images/cross.png'
import view from '@/assets/images/view.png'
import ActionButtons from '@/components/patient/dashboard/ActionButtons'
import NotificationsPanel from '@/components/patient/dashboard/NotificationsPanel'
import UpcomingAppointmentsPanel from '@/components/patient/dashboard/UpcomingAppointmentsPanel'
import ScreeningCard from '@/components/shared/ScreeningCard'
import StatusCard from '@/components/shared/StatusCard'
import { Button } from '@/components/ui/button'
import request from '@/lib/request'
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  useCheckWaitlistStatus,
  useJoinWaitlist,
} from '@/services/providers/patient.provider'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { TScreeningType } from '@zerocancer/shared/types'
import { toast } from 'sonner'

export const Route = createFileRoute('/patient/')({
  component: PatientDashboard,
})

function PatientDashboard() {
  const navigate = useNavigate()

  const { data: authData } = useQuery(useAuthUser())
  const {
    data: screeningTypesData,
    isLoading: screeningTypesLoading,
    error: screeningTypesError,
  } = useQuery(useAllScreeningTypes())
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useQuery({
    queryKey: ['patient-appointments', 'dashboard'],
    queryFn: async () => request.get('/api/appointment/patient'),
  })

  // TODO: Add notification fetching logic
  const notifications: any[] = []
  const notificationsLoading = false

  const handlePayAndBook = (screeningId: string) => {
    navigate({
      to: '/patient/book/pay',
      search: { screeningTypeId: screeningId },
    })
  }

  const userName = authData?.data?.user?.fullName || 'Patient'
  const allAppointments = (appointmentsData as any)?.data?.appointments || []
  const now = new Date()
  const upcomingAppointment =
    allAppointments
      .filter(
        (apt: any) =>
          new Date(apt.appointmentDate) >= now && apt.status === 'SCHEDULED',
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime(),
      )[0] || null

  return (
    <div className="space-y-8">
      <div className="bg-white py-4 px-6 rounded-lg">
        <h1 className="text-3xl font-bold">Welcome, {userName}👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here's a summary of your health journey.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <StatusCard appointment={upcomingAppointment} />

          <div className="flex gap-4">
            <Link
              to="/patient/book"
              className="flex items-center justify-center w-full"
            >
              <div className="w-full px-12 h-28 bg-blue-100 rounded-lg flex items-center justify-center gap-2 flex-col">
                <img src={cross} alt="cross" className="w-8 h-8" />
                <span className="text-lg font-medium text-neutral-800">
                  Book Screening
                </span>
              </div>
            </Link>

            <Link
              to="/patient/appointments"
              className="flex items-center justify-center w-full"
            >
              <div className="w-full px-12 h-28 bg-blue-100 rounded-lg flex items-center justify-center gap-2 flex-col">
                <img src={view} alt="cross" className="w-8 h-8" />
                <span className="text-lg font-medium text-neutral-800">
                  View Results
                </span>
              </div>
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Book a New Screening</h2>
              <Link to="/patient/book">
                <Button variant="link">View All</Button>
              </Link>
            </div>
            <div className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {screeningTypesLoading ? (
                <p>Loading screenings...</p>
              ) : screeningTypesError ? (
                <p>Error loading screenings.</p>
              ) : (
                (screeningTypesData?.data || [])
                  .slice(0, 5)
                  .map((screeningType: TScreeningType) => (
                    <ScreeningItem
                      key={screeningType.id}
                      screeningType={screeningType}
                      handlePayAndBook={handlePayAndBook}
                    />
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <NotificationsPanel
            notifications={notifications}
            isLoading={notificationsLoading}
          />
          <UpcomingAppointmentsPanel
            appointment={upcomingAppointment}
            isLoading={appointmentsLoading}
          />
        </div>
      </div>
    </div>
  )
}

function ScreeningItem({
  screeningType,
  handlePayAndBook,
}: {
  screeningType: TScreeningType
  handlePayAndBook: (id: string) => void
}) {
  const joinWaitlistMutation = useJoinWaitlist()
  const { data: waitlistStatus, isLoading: isCheckingWaitlist } = useQuery(
    useCheckWaitlistStatus(screeningType.id),
  )

  const handleJoinWaitlist = (screeningId: string) => {
    joinWaitlistMutation.mutate(
      { screeningTypeId: screeningId },
      {
        onSuccess: () => {
          toast.success('You have been added to the waitlist')
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.error ||
              'Failed to join waitlist. Please try again.',
          )
        },
      },
    )
  }

  return (
    <ScreeningCard
      name={screeningType.name}
      description={screeningType.description || 'No description available.'}
      onBookNow={() => handlePayAndBook(screeningType.id)}
      onJoinWaitlist={() => handleJoinWaitlist(screeningType.id)}
      isWaitlisted={waitlistStatus?.data?.inWaitlist}
      isBooking={isCheckingWaitlist || joinWaitlistMutation.isPending}
    />
  )
}
