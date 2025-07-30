import ScreeningCard from '@/components/shared/ScreeningCard'
import StatusCard from '@/components/shared/StatusCard'
import { Button } from '@/components/shared/ui/button'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useNotifications } from '@/services/providers/notification.provider'
import {
  useCheckWaitlistStatus,
  useJoinWaitlist,
  useLeaveWaitlist,
  usePatientAppointments,
} from '@/services/providers/patient.provider'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import type { TScreeningType } from '@zerocancer/shared/types'
import { toast } from 'sonner'
import NotificationsPanel from './NotificationsPanel'
import UpcomingAppointmentsPanel from './UpcomingAppointmentsPanel'

export default function PatientDashboardPage() {
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
  } = useQuery(usePatientAppointments({}))

  // ...rest of the dashboard logic and rendering...
  return (
    <div>
      {/* Example usage of panels and cards */}
      <NotificationsPanel notifications={[]} isLoading={false} />
      <UpcomingAppointmentsPanel appointment={null} isLoading={false} />
      <ScreeningCard
        name="Sample Screening"
        description="Description"
        onBookNow={() => {}}
        onJoinWaitlist={() => {}}
        onLeaveWaitlist={() => {}}
        onBookWithDonation={() => {}}
      />
      <StatusCard appointment={null} />
      {/* ...other dashboard content... */}
    </div>
  )
}
