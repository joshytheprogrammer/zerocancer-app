import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface ScreeningCardProps {
  name: string
  description: string
  onBookNow: () => void
  onJoinWaitlist: () => void
  isWaitlisted?: boolean
  isBooking?: boolean
}

export default function ScreeningCard({
  name,
  description,
  onBookNow,
  onJoinWaitlist,
  isWaitlisted,
  isBooking,
}: ScreeningCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
      <div>
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        <p className="text-gray-500 mt-1">{description}</p>
        <div className="flex items-center gap-4 mt-5">
          <Button
            onClick={onBookNow}
            className="bg-secondary hover:bg-secondary/80 text-neutral-700 cursor-pointer font-bold py-2 px-6 rounded-lg flex items-center gap-2"
            disabled={isBooking}
          >
            Book Now <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-blue-50 hover:text-primary/80 font-bold py-2 px-6 rounded-lg cursor-pointer"
            onClick={onJoinWaitlist}
            disabled={isWaitlisted}
          >
            {isWaitlisted ? 'Joined' : 'Join Waitlist'}
          </Button>
        </div>
      </div>
    </div>
  )
}