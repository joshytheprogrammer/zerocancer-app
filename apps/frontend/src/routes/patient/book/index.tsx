import ScreeningCard from '@/components/shared/ScreeningCard'
import {
  useCheckWaitlistStatus,
  useJoinWaitlist,
  useLeaveWaitlist,
} from '@/services/providers/patient.provider'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { TScreeningType } from '@zerocancer/shared/types'
import { toast } from 'sonner'

export const Route = createFileRoute('/patient/book/')({
  component: BookScreeningPage,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(useAllScreeningTypes())
  },
})

function BookScreeningPage() {
  const navigate = useNavigate()
  const {
    data: screeningTypesData,
    isLoading: screeningTypesLoading,
    error: screeningTypesError,
  } = useQuery(useAllScreeningTypes())

  const handlePayAndBook = (screeningId: string) => {
    navigate({
      to: '/patient/book/pay',
      search: { screeningTypeId: screeningId },
    })
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 rounded-lg">
        <h1 className="text-3xl font-bold">Book Screening</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose a screening type to book an appointment or join the waitlist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {screeningTypesLoading ? (
          <p>Loading screenings...</p>
        ) : screeningTypesError ? (
          <p>Error loading screenings.</p>
        ) : (
          (screeningTypesData?.data || []).map((screeningType) => (
            <ScreeningItem
              key={screeningType.id}
              screeningType={screeningType}
              handlePayAndBook={handlePayAndBook}
            />
          ))
        )}
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
  const navigate = useNavigate()
  const joinWaitlistMutation = useJoinWaitlist()
  const leaveWaitlistMutation = useLeaveWaitlist()
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

  const handleLeaveWaitlist = () => {
    const waitlistId = waitlistStatus?.data?.waitlist?.id
    if (!waitlistId) {
      toast.error('Cannot leave waitlist without a waitlist ID.')
      return
    }
    leaveWaitlistMutation.mutate(
      { waitlistId },
      {
        onSuccess: () => {
          toast.success('You have been removed from the waitlist')
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.error ||
              'Failed to leave waitlist. Please try again.',
          )
        },
      },
    )
  }

  const handleBookWithDonation = (screeningId: string) => {
    navigate({
      to: '/patient/book',
      search: { screeningTypeId: screeningId, sponsored: true },
    })
  }

  return (
    <ScreeningCard
      name={screeningType.name}
      description={screeningType.description || 'No description available.'}
      onBookNow={() => handlePayAndBook(screeningType.id)}
      onJoinWaitlist={() => handleJoinWaitlist(screeningType.id)}
      onLeaveWaitlist={handleLeaveWaitlist}
      onBookWithDonation={() => handleBookWithDonation(screeningType.id)}
      hasDonation={!!waitlistStatus?.data?.waitlist?.allocation}
      isWaitlisted={waitlistStatus?.data?.inWaitlist}
      isJoiningWaitlist={joinWaitlistMutation.isPending}
      isLeavingWaitlist={leaveWaitlistMutation.isPending}
      isBooking={isCheckingWaitlist}
    />
  )
}
