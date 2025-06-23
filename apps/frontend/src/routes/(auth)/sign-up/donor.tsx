import DonorForm from '@/components/SignupPage/DonorForm'
import { Link } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/sign-up/donor')({
  component: RouteComponent,
})

function RouteComponent() {
  const handleFormSubmit = (data: unknown) => {
    console.log('Donor form data:', data)
    // Handle form submission - could navigate to verify email or dashboard
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/sign-up"
          className="text-gray-600 hover:text-gray-800 px-4 py-1 bg-blue-100 rounded-lg cursor-pointer"
        >
          Back
        </Link>
      </div>
      <DonorForm onSubmitSuccess={handleFormSubmit} />
    </div>
  )
}
