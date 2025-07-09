import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowRight } from 'lucide-react'

interface ScreeningCardProps {
  name: string
  description: string
  onBookNow: () => void
  onJoinWaitlist: () => void
  onLeaveWaitlist: () => void
  onBookWithDonation: () => void
  isWaitlisted?: boolean
  hasDonation?: boolean
  isBooking?: boolean
  isJoiningWaitlist?: boolean
  isLeavingWaitlist?: boolean
  isBookingWithDonation?: boolean
}

export default function ScreeningCard({
  name,
  description,
  onBookNow,
  onJoinWaitlist,
  onLeaveWaitlist,
  onBookWithDonation,
  isWaitlisted,
  hasDonation,
  isBooking,
  isJoiningWaitlist,
  isLeavingWaitlist,
  isBookingWithDonation,
}: ScreeningCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 flex items-center justify-between shadow-sm border border-gray-100">
      <div>
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        <p className="text-gray-500 mt-1">{description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-5">
          {hasDonation ? (
            <Button
              onClick={onBookWithDonation}
              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer  py-2 px-6 rounded-lg flex items-center gap-2"
              disabled={isBookingWithDonation || isBooking}
            >
              {isBookingWithDonation ? 'Booking...' : 'Book with Donation'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onBookNow}
              className="bg-pink-600 hover:bg-pink-700 text-white cursor-pointer  py-2 px-6 rounded-lg flex items-center gap-2"
              disabled={isBooking || isBookingWithDonation}
            >
              {isBooking ? 'Booking...' : 'Book Now'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {isWaitlisted ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600  py-2 px-6 rounded-lg cursor-pointer"
                  disabled={isLeavingWaitlist}
                >
                  {isLeavingWaitlist ? 'Leaving...' : 'Leave Waitlist'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    You are about to leave the waitlist. You will lose your
                    current position.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button
                    className="bg-red-500 hover:bg-red-600"
                    onClick={onLeaveWaitlist}
                  >
                    Continue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-blue-50 hover:text-primary/80  py-2 px-6 rounded-lg cursor-pointer"
              onClick={onJoinWaitlist}
              disabled={isJoiningWaitlist}
            >
              {isJoiningWaitlist ? 'Joining...' : 'Join Waitlist'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
