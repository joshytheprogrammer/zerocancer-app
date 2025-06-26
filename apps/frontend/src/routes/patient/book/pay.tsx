import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Calendar as ShadCalendar } from '@/components/ui/calendar'
import {
  Popover as ShadPopover,
  PopoverContent as ShadPopoverContent,
  PopoverTrigger as ShadPopoverTrigger,
} from '@/components/ui/popover'
import { useBookSelfPayAppointment } from '@/services/providers/patient.provider'
import { ChevronDownIcon } from 'lucide-react'
import { toast } from 'sonner'

// Zod schema for form validation
const bookingSchema = z.object({
  screeningTypeId: z.string().min(1, 'Screening type is required'),
  centerId: z.string().min(1, 'Center ID is required'),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  appointmentTime: z.string().min(1, 'Appointment time is required'),
  paymentReference: z.string().optional(),
})

type FormData = z.infer<typeof bookingSchema>

export const Route = createFileRoute('/patient/book/pay')({
  component: PayBookingPage,
  validateSearch: (search) => ({
    screeningTypeId: search.screeningTypeId as string | undefined,
  }),
})

function PayBookingPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const form = useForm<FormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
    screeningTypeId: search.screeningTypeId || '',
    centerId: '',
    appointmentDate: '',
    appointmentTime: '',
    paymentReference: '',
    },
  })

  const bookSelfPayAppointmentMutation = useBookSelfPayAppointment()

  function onSubmit(values: FormData) {
    // Generate a dummy payment reference if not provided
    const paymentReference =
      values.paymentReference || 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    const formattedValues = {
      ...values,
      paymentReference,
      // Ensure date is properly formatted
      appointmentDate: values.appointmentDate ? new Date(values.appointmentDate).toISOString() : values.appointmentDate
    }

    bookSelfPayAppointmentMutation.mutate(formattedValues, {
        onSuccess: (data) => {
          toast.success('Appointment booked successfully!')
          navigate({ to: '/patient/appointments' })
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || error.code || 'Booking failed')
        },
    })
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Book Self-Pay Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!search.screeningTypeId && (
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
                    <FormLabel>Center ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter center ID"
                        {...field}
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
                      <div>
                        <ShadPopover>
                          <ShadPopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-normal"
                            >
                              {field.value
                                ? new Date(field.value).toLocaleDateString()
                                : 'Select appointment date'}
                              <ChevronDownIcon />
                            </Button>
                          </ShadPopoverTrigger>
                          <ShadPopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="start"
                          >
                            <ShadCalendar
                              mode="single"
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date: Date | undefined) => {
                                field.onChange(
                                  date ? date.toISOString() : '',
                                )
                              }}
                              disabled={(date) => {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                const dayOfWeek = date.getDay()
                                // Disable past dates, weekends (Saturday=6, Sunday=0)
                                return date < today || dayOfWeek === 0 || dayOfWeek === 6
                              }}
                              initialFocus
                            />
                          </ShadPopoverContent>
                        </ShadPopover>
                      </div>
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
                      <Input
                        type="time"
                        min="09:00"
                        max="17:00"
                        {...field}
              />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Auto-generated if left blank"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <Button
              type="submit"
                className="w-full flex items-center justify-center gap-2"
              disabled={bookSelfPayAppointmentMutation.isPending}
            >
                {bookSelfPayAppointmentMutation.isPending && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
              {bookSelfPayAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
            </Button>
          </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}