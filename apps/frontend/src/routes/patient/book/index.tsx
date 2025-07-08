import ScreeningCard from '@/components/shared/ScreeningCard'
import {
  useCheckWaitlistStatus,
  useJoinWaitlist,
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
      <div className="bg-white py-4 px-6 rounded-lg">
        <h1 className="text-3xl font-bold">Book a New Screening</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose a screening type to book an appointment or join the waitlist.
        </p>
      </div>

      <div className="space-y-4">
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
