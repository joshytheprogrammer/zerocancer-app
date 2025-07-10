import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePatientAppointments } from '@/services/providers/patient.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircle,
  Calendar,
  Download,
  FileText,
  Loader2,
  MapPin,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/patient/_results')({
  component: PatientResults,
})

function PatientResults() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Fetch appointments to get results data
  const {
    data: appointmentsData,
    isLoading,
    error,
  } = useQuery(usePatientAppointments({}))

  // Filter appointments that have results
  const appointments = appointmentsData?.data?.appointments || []
  const appointmentsWithResults = appointments.filter(
    (appt: any) => appt.result?.id && appt.status === 'COMPLETED',
  )

  const handleDownload = async (resultId: string, fileName?: string) => {
    setDownloadingId(resultId)
    try {
      // TODO: Implement actual download functionality
      // For now, we'll simulate a download
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real implementation, you would:
      // 1. Call an API endpoint to get the file URL or blob
      // 2. Create a download link and trigger it
      console.log(`Downloading result: ${resultId}`)

      // Simulate download completion
      const link = document.createElement('a')
      link.href = '#' // This would be the actual file URL
      link.download = fileName || `result-${resultId}.pdf`
      // link.click() // Uncomment when real download is implemented
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setDownloadingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (appointment: any) => {
    if (appointment.result?.files?.length > 0) {
      return <Badge className="bg-green-100 text-green-800">Ready</Badge>
    }
    if (appointment.result?.id) {
      return <Badge variant="secondary">Processing</Badge>
    }
    return <Badge variant="outline">Pending</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your results...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">My Results</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Error loading results</p>
              <p className="text-red-700 text-sm">
                Please try refreshing the page or contact support if the problem
                persists.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          My Results
        </h1>
        <p className="text-muted-foreground">
          View and download your screening results from completed appointments.
        </p>
        {appointmentsWithResults.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {appointmentsWithResults.length} result
            {appointmentsWithResults.length !== 1 ? 's' : ''} available
          </p>
        )}
      </div>

      {appointmentsWithResults.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Results Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any screening results yet. Results will appear here
              after your appointments are completed and processed by the medical
              center.
            </p>
            <Button variant="outline" asChild>
              <a href="/patient/appointments">View My Appointments</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Screening Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Screening Type</TableHead>
                  <TableHead>Medical Center</TableHead>
                  <TableHead>Appointment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointmentsWithResults.map((appointment: any) => {
                  const result = appointment.result
                  const hasDownloadableFiles = result?.files?.length > 0
                  const isDownloading = downloadingId === result?.id

                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {appointment.screeningType?.name ||
                            'Unknown Screening'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {appointment.center?.centerName ||
                                'Unknown Center'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.center?.address}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(appointment.appointmentDateTime)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(appointment)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!hasDownloadableFiles || isDownloading}
                          onClick={() =>
                            hasDownloadableFiles &&
                            handleDownload(
                              result.id,
                              `${appointment.screeningType?.name}-result.pdf`,
                            )
                          }
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              {hasDownloadableFiles ? 'Download' : 'Processing'}
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
