import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useJoinWaitlist } from '@/services/providers/patient.provider'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/patient/book/')({
  component: BookScreeningPage,
})

function BookScreeningPage() {
  const navigate = useNavigate()
  // Fetch all screening types from backend
  const {
    data: screeningTypesData,
    isLoading: screeningTypesLoading,
    error: screeningTypesError,
  } = useQuery(useAllScreeningTypes())

  const handlePayAndBook = (screeningId: string) => {
    console.log(`User wants to pay and book for: ${screeningId}`)
    navigate({ to: '/patient/book/pay', search: { screeningTypeId: screeningId } })
  }



  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Book a Screening</h1>
        <p className="text-muted-foreground">
          Choose a screening type to book an appointment or join the waitlist.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {screeningTypesLoading ? (
          <div>Loading screening types...</div>
        ) : screeningTypesError ? (
          <div>Error loading screening types. {screeningTypesError.message}</div>
        ) : (
          (screeningTypesData?.data || []).map((option) => (
            <BookScreeningCard
              key={option.id}
              option={{
                id: option.id,
                name: option.name,
                description: option.description || '',
              }}
              handlePayAndBook={handlePayAndBook}
            />
          ))
        )}
      </div>
    </div>
  )
}

type BookScreeningCardProps = {
  option: {
    id: string
    name: string
    description?: string
  }
  handlePayAndBook: (screeningId: string) => void
}

// Doing it this way because react query is a context provider, so better mutation keys is needed
// to avoid conflicts with other mutations in the app
const BookScreeningCard: React.FC<BookScreeningCardProps> = ({
  option,
  handlePayAndBook,
}) => {
  const joinWaitlistMutation = useJoinWaitlist(option.id)

  const handleJoinWaitlist = (screeningId: string) => {
    joinWaitlistMutation.mutate(
      { screeningTypeId: screeningId },
      {
        onSuccess: (data) => {
          toast.success('You have been added to the waitlist')
          console.log('Join waitlist success:', data)
        },
        onError: (error: any) => {
          if (error?.response?.status === 400 && error?.response?.data?.error) {
            toast.error(error.response.data.error)
          } else {
            toast.error(error.code)
          }
          console.error('Join waitlist error:', error)
        },
      },
    )
  }

  return (
    <Card key={option.id}>
      <CardHeader>
        <CardTitle>{option.name}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-[3em]">
          {option.description || 'No description available'}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Button onClick={() => handlePayAndBook(option.id)}>
          Pay and Book
        </Button>
        <Button
          variant="outline"
          onClick={() => handleJoinWaitlist(option.id)}
          disabled={joinWaitlistMutation.isPending}
        >
          Join Waitlist
        </Button>
      </CardFooter>
    </Card>
  )
}