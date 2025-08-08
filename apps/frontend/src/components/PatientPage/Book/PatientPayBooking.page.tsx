import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import { Input } from '@/components/shared/ui/input'
import { centers } from '@/services/providers/center.provider'
import { useBookSelfPayAppointment } from '@/services/providers/patient.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import AppointmentDatePicker from './components/AppointmentDatePicker'
import CenterSearchSelect from './components/CenterSearchSelect'
import TimeSlotsPicker from './components/TimeSlotsPicker'

// Zod schema for form validation
const bookingSchema = z.object({
  screeningTypeId: z.string().min(1, 'Screening type is required'),
  centerId: z.string().min(1, 'Center ID is required'),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  appointmentTime: z.string().min(1, 'Appointment time is required'),
  paymentReference: z.string().optional(),
})

type FormData = z.infer<typeof bookingSchema>

interface PatientPayBookingPageProps {
  screeningTypeId?: string
}

export function PatientPayBookingPage({
  screeningTypeId,
}: PatientPayBookingPageProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      screeningTypeId: screeningTypeId || '',
      centerId: '',
      appointmentDate: '',
      appointmentTime: '',
      paymentReference: '',
    },
  })

  // Fetch centers for the dropdown
  const {
    data: centersData,
    isLoading: centersLoading,
    error: centersError,
  } = useQuery(
    centers({
      page: 1,
      pageSize: 100,
      status: 'ACTIVE',
    }),
  )

  // Filter centers that offer the selected screening service
  const availableCenters =
    centersData?.data?.centers?.filter((center) => {
      if (!screeningTypeId) return true // Show all if no service selected
      return center.services?.some((service) => service.id === screeningTypeId)
    }) || []

  // Filter centers based on search query
  const filteredCenters = availableCenters // CenterSearchSelect will handle filtering

  const bookSelfPayAppointmentMutation = useBookSelfPayAppointment()

  function onSubmit(values: FormData) {
    // Generate a dummy payment reference if not provided
    const paymentReference =
      values.paymentReference ||
      'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    // Combine date and time into a single datetime
    const appointmentDateTime = new Date(values.appointmentDate)
    const [hours, minutes] = values.appointmentTime.split(':')
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const formattedValues = {
      screeningTypeId: values.screeningTypeId,
      centerId: values.centerId,
      paymentReference,
      // Send combined datetime instead of separate date and time
      appointmentDateTime: appointmentDateTime.toISOString(),
    }

    console.log('Booking data being sent:', formattedValues)

    bookSelfPayAppointmentMutation.mutate(formattedValues, {
      onSuccess: (data) => {
        console.log('Appointment booking response:', data)

        // Check if payment is required (same pattern as donor campaigns)
        if (data.data.payment?.authorizationUrl) {
          toast.success('Appointment created! Redirecting to payment...')
          window.location.href = data.data.payment.authorizationUrl
        } else {
          // Fallback for appointments that don't require payment
          toast.success('Appointment booked successfully!')
          navigate({ to: '/patient/appointments' })
        }
      },
      onError: (error: any) => {
        console.error('Booking error:', error)
        console.error('Error response:', error?.response?.data)
        toast.error(
          error?.response?.data?.error ||
            error?.response?.data?.message ||
            'Booking failed',
        )
      },
    })
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Book Self-Pay Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {!screeningTypeId && (
                <FormField
                  control={form.control}
                  name="screeningTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screening Type ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter screening type ID"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="centerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Screening Center
                      {screeningTypeId && availableCenters.length > 0 && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({availableCenters.length} center
                          {availableCenters.length !== 1 ? 's' : ''} available)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <CenterSearchSelect
                        centers={filteredCenters}
                        value={field.value}
                        onChange={field.onChange}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        loading={centersLoading}
                        error={centersError}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Date</FormLabel>
                    <FormControl>
                      <AppointmentDatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Time</FormLabel>
                    <FormControl>
                      <TimeSlotsPicker
                        slots={timeSlots}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 cursor-pointer"
                disabled={bookSelfPayAppointmentMutation.isPending}
              >
                {bookSelfPayAppointmentMutation.isPending && (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                )}
                {bookSelfPayAppointmentMutation.isPending
                  ? 'Booking...'
                  : 'Book Appointment'}
              </Button>

              {/* CTA: Link to donation-based options */}
              <div className="-mt-2">
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => navigate({ to: '/patient/book' })}
                >
                  Prefer a sponsored screening? See donation options
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
