import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  FileText, 
  Calendar,
  Search,
  Filter,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react'
import { centerAppointments } from '@/services/providers/center.provider'
import { useAuthUser } from '@/services/providers/auth.provider'

export const Route = createFileRoute('/center/results-history')({
  component: CenterResultsHistory,
})

function CenterResultsHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Get current authenticated center info
  const authUserQuery = useQuery(useAuthUser())
  const centerName = authUserQuery.data?.data?.user?.fullName || 'Your Center'
  
  // Fetch appointments to simulate results data
  const { data: appointmentsData, isLoading } = useQuery(
    centerAppointments({
      page: 1,
      pageSize: 100, // Get more for results view
    })
  )
  
  const appointments = appointmentsData?.data?.appointments || []
  
  // Simulate results from completed appointments
  // In real implementation, this would be actual ScreeningResult data
  const simulatedResults = appointments
    .filter(apt => apt.status === 'completed')
    .map((apt, index) => ({
      id: `result_${apt.id}`,
      appointmentId: apt.id,
      patient: apt.patient,
      screeningType: apt.screeningType,
      appointmentDate: (apt as any).date || (apt as any).appointmentDate,
      appointmentTime: (apt as any).timeSlot || (apt as any).appointmentTime,
      uploadedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
      uploadedBy: 'Current Staff', // Would be actual staff member
      result: `Screening completed successfully. ${index % 3 === 0 ? 'Normal findings, no follow-up required.' : index % 3 === 1 ? 'Some abnormalities detected, follow-up recommended.' : 'Results pending further analysis.'}`,
      notes: index % 4 === 0 ? 'Patient was cooperative during procedure. No complications.' : '',
      status: index % 10 === 0 ? 'pending_review' : 'uploaded',
      resultFile: index % 5 === 0 ? 'mock-result.pdf' : null,
    }))
  
  // Filter results based on search and filters
  const filteredResults = simulatedResults.filter((result) => {
    const matchesSearch = !searchTerm || 
      result.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.screeningType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter
    
    const matchesDate = dateFilter === 'all' || (() => {
      const uploadDate = new Date(result.uploadedAt)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (dateFilter) {
        case 'today': return daysDiff === 0
        case 'week': return daysDiff <= 7
        case 'month': return daysDiff <= 30
        default: return true
      }
    })()
    
    return matchesSearch && matchesStatus && matchesDate
  })
  
  // Calculate stats
  const totalResults = simulatedResults.length
  const pendingReview = simulatedResults.filter(r => r.status === 'pending_review').length
  const uploadedToday = simulatedResults.filter(r => {
    const uploadDate = new Date(r.uploadedAt)
    const today = new Date()
    return uploadDate.toDateString() === today.toDateString()
  }).length
  
  const handleViewResult = (result: any) => {
    setSelectedResult(result)
    setDialogOpen(true)
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
  
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'uploaded':
        return { label: 'Uploaded', variant: 'default' as const, icon: CheckCircle }
      case 'pending_review':
        return { label: 'Pending Review', variant: 'secondary' as const, icon: Clock }
      default:
        return { label: 'Unknown', variant: 'outline' as const, icon: AlertTriangle }
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Results History</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading results history...</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Results History
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage screening results uploaded by {centerName}
          </p>
        </div>
      </div>
      
      {/* Development Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Development Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-800 text-sm">
            <strong>Results History Backend Pending:</strong> This interface shows simulated data based on completed appointments. 
            Once the backend endpoint for center results retrieval is implemented, this page will display actual uploaded results 
            with full functionality for viewing, downloading, and managing screening results.
          </p>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResults}</div>
            <p className="text-xs text-muted-foreground">
              All uploaded results
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploaded Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uploadedToday}</div>
            <p className="text-xs text-muted-foreground">
              New results today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Served</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(simulatedResults.map(r => r.patient?.id)).size}</div>
            <p className="text-xs text-muted-foreground">
              Unique patients
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient, type, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDateFilter('all')
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Screening Results</CardTitle>
          <p className="text-sm text-muted-foreground">
            {filteredResults.length} of {totalResults} results shown
          </p>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'No results match your filters' 
                  : 'No results uploaded yet'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by uploading results for completed appointments'
                }
              </p>
              {!(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                <Button variant="outline" onClick={() => {}}>
                  Go to Upload Results
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Screening Type</TableHead>
                    <TableHead>Appointment Date</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => {
                    const { label, variant, icon: StatusIcon } = getStatusDisplay(result.status)
                    
                    return (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">
                          {result.patient?.fullName || 'Unknown Patient'}
                        </TableCell>
                        <TableCell>
                          {result.screeningType?.name || 'Unknown Type'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {formatDate(result.appointmentDate)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(result.appointmentTime)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {formatDate(result.uploadedAt)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(result.uploadedAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {result.uploadedBy}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewResult(result)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {result.resultFile && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Result Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Screening Result Details</DialogTitle>
            <DialogDescription>
              Complete details for result ID: {selectedResult?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-4">
              {/* Patient & Appointment Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Patient Information</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {selectedResult.patient?.fullName}</p>
                    <p><strong>Patient ID:</strong> {selectedResult.patient?.id}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Appointment Details</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Type:</strong> {selectedResult.screeningType?.name}</p>
                    <p><strong>Date:</strong> {formatDate(selectedResult.appointmentDate)}</p>
                    <p><strong>Time:</strong> {formatTime(selectedResult.appointmentTime)}</p>
                  </div>
                </div>
              </div>
              
              {/* Result Content */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Result Details</h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedResult.result}</p>
                </div>
              </div>
              
              {/* Additional Notes */}
              {selectedResult.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Additional Notes</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedResult.notes}</p>
                  </div>
                </div>
              )}
              
              {/* Upload Info */}
              <div className="pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Uploaded by:</p>
                    <p className="font-medium">{selectedResult.uploadedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Upload time:</p>
                    <p className="font-medium">
                      {formatDate(selectedResult.uploadedAt)} at {' '}
                      {new Date(selectedResult.uploadedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 