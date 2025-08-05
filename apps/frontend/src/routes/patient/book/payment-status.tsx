import { PatientPaymentStatusPage } from '@/components/PatientPage/Book/PatientPaymentStatus.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/book/payment-status')({
  component: () => {
    const { ref, type } = Route.useSearch()
    return <PatientPaymentStatusPage ref={ref} type={type} />
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || '',
      type: (search.type as string) || 'appointment_booking',
    }
  },
})
