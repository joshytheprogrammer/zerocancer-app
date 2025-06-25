import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useBookSelfPayAppointment } from '@/services/providers/patient.provider'
import {
  useAuthUser,
  useCheckProfiles,
} from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import {
  usePatientAppointments,
  usePatientResults,
  useJoinWaitlist,
} from '@/services/providers/patient.provider'
import { toast } from 'sonner'

export const Route = createFileRoute('/patient/')({
  component: PatientDashboard,
})

function PatientDashboard() {
  const navigate = useNavigate()

  // Get authenticated user data
  const { data: authData } = useQuery(useAuthUser())
  const userEmail = authData?.data?.user?.email
  const { data: checkProfilesData } = useCheckProfiles(userEmail || '')

  // Fetch all screening types from backend
  const {
    data: screeningTypesData,
    isLoading: screeningTypesLoading,
    error: screeningTypesError,
  } = useQuery(useAllScreeningTypes())

  console.log(screeningTypesData)

  // Fetch patient appointments (recent ones for dashboard)
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useQuery(
    usePatientAppointments({ page: 1, size: 3, status: 'scheduled' }),
  )

  // Fetch patient results (recent ones for dashboard)
  const {
    data: resultsData,
    isLoading: resultsLoading,
    error: resultsError,
  } = useQuery(usePatientResults({ page: 1, size: 3 }))

  const joinWaitlistMutation = useJoinWaitlist();

  const handlePayAndBook = (screeningId: string) => {
      console.log(`User wants to pay and book for: ${screeningId}`)
      navigate({ to: '/patient/book/pay', search: { screeningTypeId: screeningId } })
    }

  const handleJoinWaitlist = (screeningId: string) => {
    joinWaitlistMutation.mutate(
      { screeningTypeId: screeningId },
      {
        onSuccess: (data) => {
          toast.success('You have been added to the waitlist');
          console.log('Join waitlist success:', data);
        },
        onError: (error: any) => {
          if (error?.response?.status === 400 && error?.response?.data?.error) {
            toast.error(error.response.data.error);
          } else {
            toast.error(error.code);
          }
          console.error('Join waitlist error:', error);
        },
      }
    );
  }

  // Extract user name from auth data
  const userName = authData?.data?.user?.fullName || 'Patient'

  // Get upcoming appointment (first scheduled appointment)
  const upcomingAppointment = appointmentsData?.data?.appointments?.[0] || null

  // Get latest result
  const latestResult = resultsData?.data?.results?.[0] || null

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">
          Here's a summary of your health journey. Manage your screenings and
          track your results.
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
            {screeningTypesLoading ? (
              <div>Loading screening types...</div>
            ) : screeningTypesError ? (
              <div>Error loading screening types. {screeningTypesError.message}</div>
            ) : (
              (screeningTypesData?.data || []).map((option) => (
                <Card key={option.id}>
                  <CardHeader>
                    <CardTitle>{option.name}</CardTitle>
                    <CardDescription className='line-clamp-2 min-h-[3em]'>{option.description || 'No description available'} </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between">
                    <Button onClick={() => handlePayAndBook(option.id)}>
                      Pay and Book
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleJoinWaitlist(option.id)}
                      disabled={joinWaitlistMutation.isPending}
                    >
                      Join Waitlist
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
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
                  <p className="font-semibold">
                    {upcomingAppointment.screeningType?.name || 'Screening'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {upcomingAppointment.center?.centerName || 'Health Center'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      upcomingAppointment.appointmentDate,
                    ).toLocaleDateString()}{' '}
                    at{' '}
                    {new Date(
                      upcomingAppointment.appointmentTime,
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        upcomingAppointment.status === 'SCHEDULED'
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      }`}
                    ></div>
                    <span className="text-sm text-muted-foreground capitalize">
                      {upcomingAppointment.status?.toLowerCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  You have no upcoming appointments.
                </p>
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
                  {/* <p className="font-semibold">
                    {latestResult.appointment?.screeningType?.name ||
                      'Screening Result'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Result from{' '}
                    {new Date(latestResult.uploadedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        latestResult.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    ></div>
                    <span className="text-sm font-medium capitalize">
                      {latestResult.status}
                    </span>
                  </div> */}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No recent results are available.
                </p>
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
