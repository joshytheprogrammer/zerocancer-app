import CheckInQR from '@/components/CheckInQR'
import { ResultViewer } from '@/components/ResultViewer'
import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/shared/ui/dialog'
import { Separator } from '@/components/shared/ui/separator'
import { usePatientAppointmentById } from '@/services/providers/patient.provider'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  AlertCircleIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  QrCodeIcon,
  UserCheckIcon,
} from 'lucide-react'

const RouteSkeleton = () => (
  <div className="container mx-auto p-6 max-w-4xl">
    {/* Header Skeleton */}
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content Skeleton */}
      <div className="lg:col-span-2 space-y-6">
        {/* Appointment Info Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div>
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div>
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Center Information Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-44 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Skeleton */}
      <div className="space-y-6">
        {/* QR Code Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="w-[120px] h-[120px] bg-gray-200 rounded animate-pulse mx-auto"></div>
            <div className="text-sm">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mx-auto"></div>
            </div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>

        {/* Quick Actions Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-full bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </CardContent>
        </Card>

        {/* Timeline Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-2 animate-pulse"></div>
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
)

export const Route = createFileRoute('/patient/appointments_/$id')({
  component: RouteComponent,
  // loadingComponent: RouteSkeleton,
  pendingComponent: RouteSkeleton,
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(usePatientAppointmentById(id)),
})

function RouteComponent() {
  const { id } = Route.useParams()
  const appointmentQuery = useSuspenseQuery(usePatientAppointmentById(id))
  const appointment = appointmentQuery.data.data

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const QRCodeDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start sm:w-uto">
          <QrCodeIcon className="mr-2 h-4 w-4" />
          Show QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center space-y-4 p-6">
          <h3 className="text-lg font-semibold">Check-in QR Code</h3>
          <CheckInQR
            checkInCode={appointment.checkInCode || 'NO_CODE'}
            size={200}
          />
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-mono font-bold text-2xl bg-slate-200 p-2 rounded-md">
              {appointment.checkInCode}
            </p>
            {appointment.checkInCodeExpiresAt && (
              <p className="mt-1">
                Expires:{' '}
                {format(new Date(appointment.checkInCodeExpiresAt), 'PPp')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Appointment Details
            </h1>
            <p className="text-muted-foreground">
              {appointment.screeningType?.name} Screening
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.replace('_', ' ')}
            </Badge>
            {appointment.isDonation && (
              <Badge variant="secondary">Donation-Based</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Appointment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(appointment.appointmentDateTime),
                        'PPPP',
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.appointmentDateTime), 'p')}
                    </p>
                  </div>
                </div>
              </div>

              {appointment.screeningType?.description && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Screening Description
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.screeningType.description}
                  </p>
                </div>
              )}

              {appointment.cancellationReason && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircleIcon className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Cancellation Reason
                      </p>
                      <p className="text-sm text-red-600">
                        {appointment.cancellationReason}
                      </p>
                      {appointment.cancellationDate && (
                        <p className="text-xs text-red-500 mt-1">
                          Cancelled on{' '}
                          {format(
                            new Date(appointment.cancellationDate),
                            'PPp',
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Center Information */}
          {appointment.center && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Health Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">
                    {appointment.center.centerName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {appointment.center.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.center.lga}, {appointment.center.state}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {appointment.center.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${appointment.center.phoneNumber}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {appointment.center.phoneNumber}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${appointment.center.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {appointment.center.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {appointment.transaction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Amount</p>
                    <p className="text-lg font-semibold">
                      ₦{appointment.transaction.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge
                      className={getPaymentStatusColor(
                        appointment.transaction.status,
                      )}
                    >
                      {appointment.transaction.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.transaction.paymentChannel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reference</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {appointment.transaction.paymentReference}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Status */}
          {appointment.verification && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Verified
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Verified on{' '}
                      {format(
                        new Date(appointment.verification.verifiedAt),
                        'PPp',
                      )}
                    </p>
                    {appointment.verification.verifier && (
                      <p className="text-xs text-muted-foreground">
                        by {appointment.verification.verifier.email}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <ResultViewer appointmentId={id} showHeader={true} compact={false} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code Card */}
          {appointment.checkInCode && appointment.status === 'SCHEDULED' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Check-in</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <CheckInQR checkInCode={appointment.checkInCode} size={120} />
                <div className="text-sm text-muted-foreground">
                  <p className="font-mono text-xs">{appointment.checkInCode}</p>
                  {appointment.checkInCodeExpiresAt && (
                    <p className="mt-1">
                      Expires:{' '}
                      {format(
                        new Date(appointment.checkInCodeExpiresAt),
                        'MMM d, p',
                      )}
                    </p>
                  )}
                </div>
                <QRCodeDialog />
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {appointment.center?.phoneNumber && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    window.open(
                      `tel:${appointment.center?.phoneNumber}`,
                      `_self`,
                    )
                  }
                >
                  <PhoneIcon className="mr-2 h-4 w-4" />
                  Call Center
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  window.open(`mailto:${appointment.center?.email}`, `_self`)
                }
              >
                <MailIcon className="mr-2 h-4 w-4" />
                Email Center
              </Button>
              {appointment?.transaction?.paymentReference && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link
                    to="/patient/book/payment-status"
                    search={{
                      ref: appointment?.transaction?.paymentReference,
                      type: 'appointment_booking',
                    }}
                  >
                    <MailIcon className="mr-2 h-4 w-4" />
                    View Payment Receipt
                  </Link>
                </Button>
              )}
              {appointment?.result?.uploadedAt && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    window.open(`mailto:${appointment.center?.email}`, `_self`)
                  }
                >
                  <MailIcon className="mr-2 h-4 w-4" />
                  View Results
                </Button>
              )}
              {appointment.checkInCode && <QRCodeDialog />}
            </CardContent>
          </Card>

          {/* Appointment Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Appointment Booked</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(appointment.createdAt), 'PPp')}
                  </p>
                </div>
              </div>

              {appointment.verification && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Check-in Verified</p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(appointment.verification.verifiedAt),
                        'PPp',
                      )}
                    </p>
                  </div>
                </div>
              )}

              {appointment.result && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Results Uploaded</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appointment.result.uploadedAt), 'PPp')}
                    </p>
                  </div>
                </div>
              )}

              {appointment.status === 'COMPLETED' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Appointment Completed</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appointment.appointmentDateTime), 'PPp')}
                    </p>
                  </div>
                </div>
              )}

              {appointment.cancellationDate && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Appointment Cancelled</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appointment.cancellationDate), 'PPp')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
