import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/patient/')({
  component: PatientDashboard,
})

const screeningOptions = [
  {
    id: 'cervical',
    title: 'Cervical Cancer Screening',
    description:
      'Detects abnormal cells on the cervix. Recommended for women aged 21 and over.',
  },
  {
    id: 'prostate',
    title: 'Prostate Cancer Screening',
    description:
      'Includes a PSA blood test to screen for prostate cancer. Recommended for men over 50.',
  },
  {
    id: 'breast',
    title: 'Breast Cancer Screening',
    description:
      'A mammogram to detect breast cancer early. Recommended for women over 40.',
  },
]

const mockAppointment = {
  id: 'appt_123',
  type: 'Cervical Cancer Screening',
  center: 'City Health Clinic',
  date: '2024-08-15T10:30:00Z',
}

const mockResult = {
  id: 'res_456',
  type: 'Prostate Cancer Screening',
  date: '2024-07-20',
  status: 'Ready',
}

function PatientDashboard() {
  const handlePayAndBook = (screeningId: string) => {
    console.log(`User wants to pay and book for: ${screeningId}`)
    // Future: Navigate to booking flow
  }

  const handleJoinWaitlist = (screeningId: string) => {
    console.log(`User wants to join waitlist for: ${screeningId}`)
    // Future: Add user to waitlist
  }

  // A placeholder for the authenticated user
  const user = {
    name: 'Jane Doe',
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">
          Here's a summary of your account. Manage your health journey with ease.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-xl font-semibold">Book a New Screening</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {screeningOptions.map((option) => (
              <Card key={option.id}>
                <CardHeader>
                  <CardTitle>{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between">
                  <Button onClick={() => handlePayAndBook(option.id)}>
                    Pay and Book
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleJoinWaitlist(option.id)}
                  >
                    Join Waitlist
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Upcoming Appointment */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAppointment ? (
                <div>
                  <p className="font-semibold">{mockAppointment.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {mockAppointment.center}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(mockAppointment.date).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p>You have no upcoming appointments.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/patient/appointments">View All Appointments</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Test Result */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockResult ? (
                <div>
                  <p className="font-semibold">{mockResult.type}</p>
                  <p className="text-sm text-muted-foreground">
                    Result from {mockResult.date}
                  </p>
                  <p className="text-sm font-medium text-green-600">
                    Status: {mockResult.status}
                  </p>
                </div>
              ) : (
                <p>No recent results are available.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/patient/results">View All Results</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 