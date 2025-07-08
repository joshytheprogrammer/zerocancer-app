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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Calendar as ShadCalendar } from '@/components/ui/calendar'
import {
  Popover as ShadPopover,
  PopoverContent as ShadPopoverContent,
  PopoverTrigger as ShadPopoverTrigger,
} from '@/components/ui/popover'
import { useBookSelfPayAppointment } from '@/services/providers/patient.provider'
import { centers } from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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
  const [searchQuery, setSearchQuery] = useState('')

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

  // Fetch centers for the dropdown
  const { data: centersData, isLoading: centersLoading, error: centersError } = useQuery(
    centers({
      page: 1,
      pageSize: 100, // Get a large number to show all available centers
      status: 'ACTIVE', // Only show active centers
    })
  )

  // Filter centers that offer the selected screening service
  const availableCenters = centersData?.data?.centers?.filter((center) => {
    if (!search.screeningTypeId) return true // Show all if no service selected
    return center.services?.some((service) => service.id === search.screeningTypeId)
  }) || []

  // Filter centers based on search query
  const filteredCenters = availableCenters.filter((center) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      center.centerName.toLowerCase().includes(query) ||
      center.lga.toLowerCase().includes(query) ||
      center.state.toLowerCase().includes(query) ||
      center.address.toLowerCase().includes(query)
    )
  })

  const bookSelfPayAppointmentMutation = useBookSelfPayAppointment()

  function onSubmit(values: FormData) {
    // Generate a dummy payment reference if not provided
    const paymentReference =
      values.paymentReference || 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    // Parse and format the appointment time properly
    const appointmentDateTime = new Date(values.appointmentDate)
    const [hours, minutes] = values.appointmentTime.split(':')
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const formattedValues = {
      ...values,
      paymentReference,
      // Ensure date is properly formatted as ISO string
      appointmentDate: values.appointmentDate ? new Date(values.appointmentDate).toISOString() : values.appointmentDate,
      // Format appointment time as a proper datetime ISO string
      appointmentTime: appointmentDateTime.toISOString()
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
          toast.error(error?.response?.data?.error || error?.response?.data?.message || 'Booking failed')
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
                    <FormLabel>
                      Screening Center
                      {search.screeningTypeId && availableCenters.length > 0 && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({availableCenters.length} center{availableCenters.length !== 1 ? 's' : ''} available)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          placeholder="Type to search centers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          disabled={centersLoading}
                        />
                        
                        {searchQuery && (
                          <div className="border rounded-md max-h-48 overflow-y-auto bg-white">
                            {filteredCenters.length > 0 ? (
                              filteredCenters.map((center) => (
                                <div
                                  key={center.id}
                                  className={cn(
                                    "p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0",
                                    field.value === center.id && "bg-blue-50 border-blue-200"
                                  )}
                                  onClick={() => {
                                    console.log('Selected center:', center.id, center.centerName)
                                    field.onChange(center.id)
                                    setSearchQuery(center.centerName)
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    {field.value === center.id && (
                                      <Check className="h-4 w-4 text-blue-600" />
                                    )}
                                    <div className="flex flex-col">
                                      <span className="font-medium">{center.centerName}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {center.lga}, {center.state}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {center.address}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center text-sm text-muted-foreground">
                                {search.screeningTypeId 
                                  ? "No centers offer this service" 
                                  : "No centers found"}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {field.value && !searchQuery && (
                          <div className="text-sm text-green-600">
                            ✓ Selected: {availableCenters.find(c => c.id === field.value)?.centerName}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    {centersLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading available centers...
                      </div>
                    )}
                    {centersError && (
                      <div className="text-sm text-destructive mt-2">
                        Failed to load centers. Please try refreshing the page.
                      </div>
                    )}
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


              {/* 
              
              NOT NEEDED
              
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
              /> */}

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