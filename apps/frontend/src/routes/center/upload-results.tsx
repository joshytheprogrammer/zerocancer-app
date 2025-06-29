import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  Calendar,
  CheckCircle,
  Search,
  Clock,
  X,
  File,
  Loader2
} from 'lucide-react'
import { centerAppointments, useUploadResults } from '@/services/providers/center.provider'
import { FileUploadService, type UploadProgress } from '@/services/upload.service'
import { toast } from 'sonner'

// Schema for upload result form
const uploadResultSchema = z.object({
  appointmentId: z.string().min(1, 'Please select an appointment'),
  notes: z.string().optional(),
  files: z.array(z.any()).min(1, 'Please select at least one file'),
})

type UploadResultFormData = z.infer<typeof uploadResultSchema>

export const Route = createFileRoute('/center/upload-results')({
  component: CenterUploadResults,
})

function CenterUploadResults() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedAppointment, setSelectedAppointment] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState('completed')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const uploadResultsMutation = useUploadResults()
  const fileUploadService = FileUploadService.getInstance()
  
  const form = useForm<UploadResultFormData>({
    resolver: zodResolver(uploadResultSchema),
    defaultValues: {
      appointmentId: '',
      notes: '',
      files: [],
    },
  })

  // Fetch completed appointments that need results uploaded
  const { data: appointmentsData, isLoading } = useQuery(
    centerAppointments({
      page: 1,
      pageSize: 50,
    })
  )

  const appointments = appointmentsData?.data?.appointments || []
  
  // Filter appointments that are completed and don't have results yet
  const eligibleAppointments = appointments.filter((apt: any) => {
    const matchesSearch = !searchTerm || 
      apt.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.screeningType?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const isCompleted = apt.status === 'COMPLETED'
    const isInProgress = apt.status === 'IN_PROGRESS'
    const needsResults = !(apt as any).result?.id
    
    return matchesSearch && (isCompleted || isInProgress) && (statusFilter === 'all' || needsResults)
  })

  const selectedAppointmentData = appointments.find((apt: any) => apt.id === selectedAppointment)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Validate file types
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
    const invalidFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase()
      return !allowedTypes.includes(extension || '')
    })
    
    if (invalidFiles.length > 0) {
      toast.error(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}. Allowed: PDF, Images, DOC, DOCX`)
      return
    }
    
    // Validate file sizes (max 10MB each)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Max size: 10MB`)
      return
    }
    
    setSelectedFiles(prev => [...prev, ...files])
    form.setValue('files', [...selectedFiles, ...files])
  }, [selectedFiles, form])

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    form.setValue('files', newFiles)
  }

  const onSubmit = async (values: UploadResultFormData) => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file')
      return
    }
    
    setIsUploading(true)
    
    try {
      // Upload files to Cloudinary first
      const uploadResults = await fileUploadService.uploadFiles(
        selectedFiles,
        {
          folder: `screening-results/${selectedAppointment}`,
          maxFileSize: 10,
          allowedTypes: ['pdf', 'image', 'application']
        },
        (progresses) => {
          setUploadProgress(progresses)
        }
      )
      
      // Check if all uploads succeeded
      const failedUploads = uploadResults.filter(result => result.status === 'error')
      if (failedUploads.length > 0) {
        toast.error(`Failed to upload: ${failedUploads.map(f => f.fileName).join(', ')}`)
        setIsUploading(false)
        return
      }
      
      // Prepare file data for backend
      const fileData = uploadResults.map(result => ({
        fileName: result.fileName,
        originalName: result.fileName,
        filePath: result.filePath || result.fileName,
        fileType: selectedFiles.find(f => f.name === result.fileName)?.type || 'application/octet-stream',
        fileSize: selectedFiles.find(f => f.name === result.fileName)?.size || 0,
        url: result.url!,
        cloudinaryId: result.url!.split('/').pop()?.split('.')[0] || '',
      }))
      
      // Submit to backend
      await uploadResultsMutation.mutateAsync({
        appointmentId: selectedAppointment,
        files: fileData,
        notes: values.notes || undefined,
      })
      
      toast.success('Results uploaded successfully!')
      
      // Reset form and state
      form.reset()
      setSelectedAppointment('')
      setSelectedFiles([])
      setUploadProgress([])
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['centerAppointments'] })
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.error || 'Failed to upload results')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId)
    form.setValue('appointmentId', appointmentId)
    // Clear files when switching appointments
    setSelectedFiles([])
    setUploadProgress([])
    form.setValue('files', [])
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
                    <SelectItem value="completed">Need Results Upload</SelectItem>
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
                    {searchTerm ? 'Try adjusting your search' : 'No appointments need results upload'}
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
                <p className="text-sm">Choose from appointments on the left</p>
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
                    <p><span className="font-medium">ID:</span> <span className="font-mono text-xs">{selectedAppointment}</span></p>
                  </div>
                </div>

                {/* Upload Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Result Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter any additional notes about the results..."
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional notes about the screening results
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* File Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Result Files *</label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload PDF reports, images, or lab results
                        </p>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Select Files
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, Images, DOC files • Max 10MB each
                        </p>
                      </div>
                    </div>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Selected Files ({selectedFiles.length})</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4" />
                                <span className="text-sm truncate">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024 / 1024).toFixed(1)}MB)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload Progress */}
                    {uploadProgress.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Upload Progress</label>
                        {uploadProgress.map((progress) => (
                          <div key={progress.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{progress.fileName}</span>
                              <span>{progress.progress}%</span>
                            </div>
                            <Progress value={progress.progress} className="h-2" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={isUploading || selectedFiles.length === 0 || uploadResultsMutation.isPending}
                        className="flex-1"
                      >
                        {isUploading || uploadResultsMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Results
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedAppointment('')
                          setSelectedFiles([])
                          setUploadProgress([])
                          form.reset()
                        }}
                        disabled={isUploading}
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
                <li>• Upload results for completed or in-progress appointments</li>
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
              <strong>Note:</strong> Once uploaded, results will be automatically made available to patients 
              through their patient portal. Ensure accuracy before submission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 