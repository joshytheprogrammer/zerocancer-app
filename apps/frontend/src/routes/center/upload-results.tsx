import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Clock
} from 'lucide-react'
import { centerAppointments } from '@/services/providers/center.provider'
import { toast } from 'sonner'

// Schema for upload result form (ready for when backend is implemented)
const uploadResultSchema = z.object({
  appointmentId: z.string().min(1, 'Please select an appointment'),
  result: z.string().min(10, 'Result details must be at least 10 characters'),
  notes: z.string().optional(),
  resultFile: z.any().optional(), // For future file upload implementation
})

type UploadResultFormData = z.infer<typeof uploadResultSchema>

export const Route = createFileRoute('/center/upload-results')({
  component: CenterUploadResults,
})

function CenterUploadResults() {
  const navigate = useNavigate()
  const [selectedAppointment, setSelectedAppointment] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState('completed')
  const [searchTerm, setSearchTerm] = useState('')
  
  const form = useForm<UploadResultFormData>({
    resolver: zodResolver(uploadResultSchema),
    defaultValues: {
      appointmentId: '',
      result: '',
      notes: '',
    },
  })

  // Fetch completed appointments that need results uploaded
  const { data: appointmentsData, isLoading } = useQuery(
    centerAppointments({
      page: 1,
      pageSize: 50, // Show more for result upload selection
    })
  )

  const appointments = appointmentsData?.data?.appointments || []
  
  // Filter appointments that are completed and don't have results yet
  const eligibleAppointments = appointments.filter((apt) => {
    const matchesSearch = !searchTerm || 
      apt.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.screeningType?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const isCompleted = apt.status === 'completed'
    const needsResults = !(apt as any).resultUploaded // This field may not exist yet
    
    return matchesSearch && isCompleted && (statusFilter === 'all' || statusFilter === 'completed')
  })

  const selectedAppointmentData = appointments.find(apt => apt.id === selectedAppointment)

  const onSubmit = (values: UploadResultFormData) => {
    // This will be implemented when backend endpoint is ready
    toast.error('Result upload feature is currently under development. Backend endpoint pending implementation.')
    console.log('Upload result data:', values)
    
    // Future implementation:
    // uploadResultMutation.mutate(values, {
    //   onSuccess: () => {
    //     toast.success('Result uploaded successfully')
    //     form.reset()
    //     setSelectedAppointment('')
    //   },
    //   onError: (error) => {
    //     toast.error('Failed to upload result')
    //   }
    // })
  }

  const handleSelectAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId)
    form.setValue('appointmentId', appointmentId)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    return timeString || 'Not specified'
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Upload Results</h1>
        <p className="text-muted-foreground">
          Upload screening results for completed appointments.
        </p>
      </div>

      {/* Development Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Feature In Development
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700">
            The result upload functionality is currently under development. 
            The backend endpoint for uploading screening results has not been implemented yet. 
            This interface shows the intended workflow once the feature is complete.
          </p>
        </CardContent>
      </Card>

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
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name or screening type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed (Need Results)</SelectItem>
                    <SelectItem value="all">All Appointments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Appointments List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : eligibleAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No appointments found</p>
                  <p className="text-xs">
                    {searchTerm ? 'Try adjusting your search' : 'No completed appointments need results'}
                  </p>
                </div>
              ) : (
                eligibleAppointments.map((appointment) => (
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
                          {formatDate((appointment as any).date || (appointment as any).appointmentDate)} • {formatTime((appointment as any).timeSlot || (appointment as any).appointmentTime)}
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

        {/* Result Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedAppointment ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an appointment to upload results</p>
                <p className="text-sm">Choose from completed appointments on the left</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected Appointment Info */}
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Selected Appointment</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Patient:</span> {selectedAppointmentData?.patient?.fullName}</p>
                    <p><span className="font-medium">Screening:</span> {selectedAppointmentData?.screeningType?.name}</p>
                    <p><span className="font-medium">Date:</span> {formatDate((selectedAppointmentData as any)?.date || (selectedAppointmentData as any)?.appointmentDate)}</p>
                    <p><span className="font-medium">ID:</span> <span className="font-mono">{selectedAppointment}</span></p>
                  </div>
                </div>

                {/* Upload Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="result"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Result Details *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter detailed screening results, findings, and recommendations..."
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide comprehensive results and any clinical findings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional observations or follow-up recommendations..."
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional notes for patient or referring physician
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Future File Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Result Files</label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          File upload will be available when backend is implemented
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Support for PDF, images, and lab reports
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={true} // Disabled until backend is ready
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Result
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedAppointment('')
                          form.reset()
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>
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
                <li>• Only completed appointments can have results uploaded</li>
                <li>• Ensure all screening procedures are finished before uploading</li>
                <li>• Include comprehensive findings and recommendations</li>
                <li>• Double-check patient identity before submitting</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Result Requirements:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Detailed description of screening results</li>
                <li>• Clear indication of normal/abnormal findings</li>
                <li>• Follow-up recommendations if applicable</li>
                <li>• Professional language and terminology</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once uploaded, results will be automatically made available to patients 
              and can be accessed through their patient portal. Ensure accuracy before submission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 