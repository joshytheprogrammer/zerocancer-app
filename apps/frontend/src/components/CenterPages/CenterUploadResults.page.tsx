// import { ResultViewer } from '@/components/ResultViewer'
// import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { ResultUploadComponent } from '@/components/CenterPages/ResultUploadComponent'
import { Badge } from '@/components/shared/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { centerAppointments } from '@/services/providers/center.provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, CheckCircle, Clock, FileText, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function CenterUploadResultsPage() {
  const queryClient = useQueryClient()
  const [selectedAppointment, setSelectedAppointment] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState('completed')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch completed appointments that need results uploaded
  const { data: appointmentsData, isLoading } = useQuery(
    centerAppointments({
      page: 1,
      pageSize: 50,
    }),
  )

  const appointments = appointmentsData?.data?.appointments || []

  // Filter appointments that are completed and don't have results yet
  const eligibleAppointments = appointments.filter((apt: any) => {
    const matchesSearch =
      !searchTerm ||
      apt.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.screeningType?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const isCompleted = apt.status === 'COMPLETED'
    const isInProgress = apt.status === 'IN_PROGRESS'
    const needsResults = !(apt as any).result?.id

    return (
      matchesSearch &&
      (isCompleted || isInProgress) &&
      (statusFilter === 'all' || needsResults)
    )
  })

  const selectedAppointmentData = appointments.find(
    (apt: any) => apt.id === selectedAppointment,
  )

  const handleSelectAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return 'Invalid time'
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Upload Results</h1>
        <p className="text-muted-foreground">
          Upload screening results for completed appointments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointment Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by patient name or screening type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Needs Results</SelectItem>
                  <SelectItem value="all">All Eligible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Appointments List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : eligibleAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No appointments found</p>
                  <p className="text-xs">
                    {searchTerm
                      ? 'Try adjusting your search'
                      : 'No appointments need results upload'}
                  </p>
                </div>
              ) : (
                eligibleAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedAppointment === appointment.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                    onClick={() => handleSelectAppointment(appointment.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {appointment.patient?.fullName || 'Unknown Patient'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.screeningType?.name || 'Unknown Type'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(appointment.appointmentDateTime)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs">
                          {appointment.status.toUpperCase()}
                        </Badge>
                        {selectedAppointment === appointment.id && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result Upload Component */}
        {!selectedAppointment ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an appointment to upload results</p>
                <p className="text-sm">Choose from appointments on the left</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <ResultUploadComponent
              appointmentId={selectedAppointment}
              appointmentData={selectedAppointmentData}
              onUploadComplete={() => {
                // Invalidate queries to refresh appointment list
                queryClient.invalidateQueries({
                  queryKey: ['centerAppointments'],
                })
              }}
              onAppointmentComplete={() => {
                // Refresh and clear selection
                queryClient.invalidateQueries({
                  queryKey: ['centerAppointments'],
                })
                setSelectedAppointment('')
                toast.success('Appointment completed successfully!')
              }}
            />

            {/* Show existing results if any */}
            {/* <ResultViewer
              appointmentId={selectedAppointment}
              showHeader={true}
              compact={false}
            /> */}
          </div>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">For Center Staff:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • Upload results for completed or in-progress appointments
                </li>
                <li>• Ensure all screening procedures are finished</li>
                <li>• Include all relevant test results and reports</li>
                <li>• Double-check patient identity before submitting</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">File Requirements:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Supported: PDF, JPG, PNG, DOC, DOCX</li>
                <li>• Maximum file size: 10MB per file</li>
                <li>• Multiple files can be uploaded per appointment</li>
                <li>• Files are securely stored and encrypted</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once uploaded, results will be
              automatically made available to patients through their patient
              portal. Ensure accuracy before submission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
