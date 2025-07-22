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
import { RotateCwIcon } from 'lucide-react'
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
    refetch,
    isFetching,
    isPending,
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
        <button
          type="button"
          className={`flex items-center gap-2 px-3 py-2 rounded-md border bg-muted hover:bg-muted/80 transition`}
          onClick={() => refetch()}
        >
          <RotateCwIcon
            size={18}
            className={`${isFetching ? 'animate-spin' : ''}`}
          />
          Reload (to be removed later)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {screeningTypesLoading ? (
          <p>Loading screenings...</p>
        ) : screeningTypesError ? (
          <p>Error loading screenings.</p>
        ) : (
          (screeningTypesData?.data || []).map((screeningType) => (
            <ScreeningCard
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
