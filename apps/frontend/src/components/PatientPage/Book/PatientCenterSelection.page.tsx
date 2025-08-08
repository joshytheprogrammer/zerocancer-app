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
import {
  useEligibleCenters,
  useSelectCenter,
} from '@/services/providers/patient.provider'
import { useScreeningTypeById } from '@/services/providers/screeningType.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Gift, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import AppointmentDatePicker from './components/AppointmentDatePicker'
import CenterCardsGrid from './components/CenterCardsGrid'
import TimeSlotsPicker from './components/TimeSlotsPicker'

// Zod schema for center selection form
const centerSelectionSchema = z.object({
  centerId: z.string().min(1, 'Please select a center'),
  appointmentDate: z.string().min(1, 'Please select a date'),
  appointmentTime: z.string().min(1, 'Please select a time'),
})

type FormData = z.infer<typeof centerSelectionSchema>

interface PatientCenterSelectionPageProps {
  allocationId?: string
  screeningTypeId?: string
}

export function PatientCenterSelectionPage({
  allocationId,
  screeningTypeId,
}: PatientCenterSelectionPageProps) {
  const navigate = useNavigate()
  const [selectedCenter, setSelectedCenter] = useState<any>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(centerSelectionSchema),
    defaultValues: {
      centerId: '',
      appointmentDate: '',
      appointmentTime: '',
    },
  })

  // Fetch screening type details
  const { data: screeningTypeData, isLoading: screeningTypeLoading } = useQuery(
    useScreeningTypeById(screeningTypeId || ''),
  )

  // Fetch eligible centers for this allocation
  const {
    data: centersData,
    isLoading: centersLoading,
    error: centersError,
  } = useQuery(useEligibleCenters(allocationId || '', 1, 20))

  const selectCenterMutation = useSelectCenter()

  // Redirect if missing required params
  if (!allocationId || !screeningTypeId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Missing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Required booking information is missing. Please try again.
            </p>
            <Button onClick={() => navigate({ to: '/patient/book' })}>
              Back to Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const centers = centersData?.data?.centers || []
  const screeningType = screeningTypeData?.data

  // Generate time slots (9 AM to 5 PM, every hour)
  const timeSlots = Array.from({ length: 9 }, (_, i) => {
    const hour = i + 9
    return {
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour === 12 ? '12' : hour > 12 ? hour - 12 : hour}:00 ${
        hour >= 12 ? 'PM' : 'AM'
      }`,
    }
  })

  function onSubmit(values: FormData) {
    if (!allocationId) {
      toast.error('Missing allocation information')
      return
    }

    // Combine date and time into a single datetime
    const appointmentDateTime = new Date(values.appointmentDate)
    const [hours, minutes] = values.appointmentTime.split(':')
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const bookingData = {
      allocationId,
      centerId: values.centerId,
      appointmentDateTime: appointmentDateTime.toISOString(),
    }

    selectCenterMutation.mutate(bookingData, {
      onSuccess: () => {
        toast.success('Appointment booked successfully with donation!')
        navigate({ to: '/patient/appointments' })
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.error ||
            error?.response?.data?.message ||
            'Failed to book appointment. Please try again.',
        )
      },
    })
  }

  if (centersLoading || screeningTypeLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading available centers...</span>
        </div>
      </div>
    )
  }

  if (centersError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Centers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">
              There was an error loading eligible centers.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Error: {centersError?.message || 'Unknown error'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/patient/book' })}
              >
                Back to Booking
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!centersLoading && centers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-600">
              No Centers Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">
              No centers are currently available for your allocated screening.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Allocation ID: {allocationId}
              <br />
              Screening Type ID: {screeningTypeId}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/patient/book' })}
              >
                Back to Booking
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-6 rounded-lg border">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-6 w-6 text-pink-600" />
          <h1 className="text-2xl font-bold">Book with Donation</h1>
        </div>
        <p className="text-gray-600">
          Great news! Your {screeningType?.name} screening has been sponsored by
          a generous donor. Select a center and schedule your appointment below.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Center Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Select a Health Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="centerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Available Centers ({centers.length} options)
                    </FormLabel>
                    <FormControl>
                      <CenterCardsGrid
                        centers={centers}
                        value={field.value}
                        onSelect={(c) => {
                          field.onChange(c.id)
                          setSelectedCenter(c)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Date and Time Selection */}
          {selectedCenter && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Schedule Your Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Selection */}
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

                  {/* Time Selection */}
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/patient/book' })}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={selectCenterMutation.isPending || !selectedCenter}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              {selectCenterMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking Appointment...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
