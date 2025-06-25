import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookSelfPayAppointment } from '@/services/providers/patient.provider'
import { toast } from 'sonner'

export const Route = createFileRoute('/patient/book/pay')({
  component: PayBookingPage,
  validateSearch: (search) => ({
    screeningTypeId: search.screeningTypeId as string | undefined,
  }),
})

function PayBookingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate()
  const [form, setForm] = useState({
    screeningTypeId: search.screeningTypeId || '',
    centerId: '',
    appointmentDate: '',
    appointmentTime: '',
    paymentReference: '',
  })

  const bookSelfPayAppointmentMutation = useBookSelfPayAppointment()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !form.screeningTypeId ||
      !form.centerId ||
      !form.appointmentDate ||
      !form.appointmentTime
    ) {
      toast.error('Please fill all fields')
      return
    }
    // Generate a dummy payment reference for now
    const paymentReference =
      form.paymentReference || 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    bookSelfPayAppointmentMutation.mutate(
      { ...form, paymentReference },
      {
        onSuccess: (data) => {
          toast.success('Appointment booked successfully!')
          navigate({ to: '/patient/appointments' })
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || error.code || 'Booking failed')
        },
      }
    )
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Book Self-Pay Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 font-medium">Screening Type ID</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="screeningTypeId"
                value={form.screeningTypeId}
                onChange={handleChange}
                placeholder="Screening Type ID"
                required
                disabled={!!search.screeningTypeId}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Center ID</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="centerId"
                value={form.centerId}
                onChange={handleChange}
                placeholder="Center ID"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Date</label>
              <input
                className="w-full border rounded px-3 py-2"
                type="date"
                name="appointmentDate"
                value={form.appointmentDate}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Time</label>
              <input
                className="w-full border rounded px-3 py-2"
                type="time"
                name="appointmentTime"
                value={form.appointmentTime}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Payment Reference</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="paymentReference"
                value={form.paymentReference}
                onChange={handleChange}
                placeholder="Payment Reference (auto-generated if left blank)"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={bookSelfPayAppointmentMutation.isPending}
            >
              {bookSelfPayAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}