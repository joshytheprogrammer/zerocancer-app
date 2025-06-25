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
import { useBookSelfPayAppointment, usePatientAppointments, usePatientResults } from '@/services/providers/patient.provider'
import { useAuthUser, useCheckProfiles } from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import { Calendar, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

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

function PatientDashboard() {
  // Get authenticated user data
  const { data: authData } = useQuery(useAuthUser())
  const userEmail = authData?.data?.user?.email
  const { data: checkProfilesData } = useCheckProfiles(userEmail || '')

  console.log(checkProfilesData)

  // Get patient appointments (recent ones for dashboard)  
  const { data: appointmentsData, isLoading: appointmentsLoading } = usePatientAppointments({
    page: 1,
    size: 3, 
    status: 'scheduled' 
  })
  
  // Get patient results (recent ones for dashboard)
  const { data: resultsData, isLoading: resultsLoading } = usePatientResults({
    page: 1,
    size: 3 
  })

  const handlePayAndBook = (screeningId: string) => {
    console.log(`User wants to pay and book for: ${screeningId}`)
    // Future: Navigate to booking flow

    const { data: bookSelfPayAppointmentData } = useBookSelfPayAppointment()

  }

  const handleJoinWaitlist = (screeningId: string) => {
    console.log(`User wants to join waitlist for: ${screeningId}`)
    // Future: Add user to waitlist
  }

  // Extract user name from auth data
  const userName = authData?.data?.user?.fullName || 'Patient'

  // Get upcoming appointment (first scheduled appointment)
  const upcomingAppointment = (appointmentsData as any)?.data?.appointments?.[0] || null

  // Get latest result
  const latestResult = (resultsData as any)?.data?.results?.[0] || null

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">
          Here's a summary of your health journey. Manage your screenings and track your results.
        </p>
      </div>

      {/* Quick Actions Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild className="h-16 text-lg">
          <Link to="/patient/appointments">
            <Calendar className="mr-2 h-5 w-5" />
            View Appointments
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-16 text-lg">
          <Link to="/patient/results">
            <FileText className="mr-2 h-5 w-5" />
            View Results
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-16 text-lg">
          <Link to="/patient/notifications">
            <AlertCircle className="mr-2 h-5 w-5" />
            Notifications
          </Link>
        </Button>
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
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointmentsLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : upcomingAppointment ? (
                <div>
                  <p className="font-semibold">{upcomingAppointment.screeningType?.name || 'Screening'}</p>
                  <p className="text-sm text-muted-foreground">
                    {upcomingAppointment.center?.centerName || 'Health Center'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(upcomingAppointment.appointmentDate).toLocaleDateString()} at{' '}
                    {new Date(upcomingAppointment.appointmentTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${
                      upcomingAppointment.status === 'SCHEDULED' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-muted-foreground capitalize">
                      {upcomingAppointment.status?.toLowerCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">You have no upcoming appointments.</p>
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
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Recent Test Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resultsLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : latestResult ? (
                <div>
                  <p className="font-semibold">
                    {latestResult.appointment?.screeningType?.name || 'Screening Result'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Result from {new Date(latestResult.uploadedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${
                      latestResult.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium capitalize">
                      {latestResult.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No recent results are available.</p>
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