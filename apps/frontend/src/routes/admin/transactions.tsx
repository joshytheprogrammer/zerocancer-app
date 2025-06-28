import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAdminTransactions } from '@/services/providers/admin.provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertTriangle,
  CreditCard,
  Building2,
  User,
  Heart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/admin/transactions')({
  component: AdminTransactions,
})

type TransactionType = 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND'
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

function AdminTransactions() {
  // Filters state
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL')
  const [dateFromFilter, setDateFromFilter] = useState<string>('')
  const [dateToFilter, setDateToFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  // Build query parameters
  const queryParams = {
    page,
    pageSize: 20,
    ...(typeFilter !== 'ALL' && { type: typeFilter }),
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(dateFromFilter && { dateFrom: dateFromFilter }),
    ...(dateToFilter && { dateTo: dateToFilter }),
  }

  // Fetch transactions data
  const { 
    data: transactionsData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(useAdminTransactions(queryParams))

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default'
      case 'PENDING': return 'secondary'
      case 'FAILED': return 'destructive'
      default: return 'outline'
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'DONATION': return 'default'
      case 'APPOINTMENT': return 'outline'
      case 'PAYOUT': return 'secondary'
      case 'REFUND': return 'destructive'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DONATION': return <Heart className="h-4 w-4 text-red-600" />
      case 'APPOINTMENT': return <Calendar className="h-4 w-4 text-blue-600" />
      case 'PAYOUT': return <ArrowUpCircle className="h-4 w-4 text-green-600" />
      case 'REFUND': return <ArrowDownCircle className="h-4 w-4 text-orange-600" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const clearFilters = () => {
    setTypeFilter('ALL')
    setStatusFilter('ALL')
    setDateFromFilter('')
    setDateToFilter('')
    setPage(1)
  }

  const transactions = transactionsData?.data?.transactions || []
  const totalPages = transactionsData?.data?.totalPages || 0
  const total = transactionsData?.data?.total || 0

  // Calculate summary stats
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
  const completedTransactions = transactions.filter(t => t.status === 'COMPLETED')
  const completedAmount = completedTransactions.reduce((sum, t) => sum + t.amount, 0)
  const pendingTransactions = transactions.filter(t => t.status === 'PENDING')
  const failedTransactions = transactions.filter(t => t.status === 'FAILED')
  
  const donationAmount = transactions
    .filter(t => t.type === 'DONATION' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const appointmentAmount = transactions
    .filter(t => t.type === 'APPOINTMENT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Financial Transactions</h1>
        <p className="text-muted-foreground">
          Monitor all financial transactions, payments, and money flows across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedTransactions.length}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(completedAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingTransactions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold">{failedTransactions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center p-6">
            <Heart className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Donations Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(donationAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Appointments Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(appointmentAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {/* Type Filter */}
            <div>
              <Label htmlFor="type-filter">Transaction Type</Label>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as TransactionType | 'ALL')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="DONATION">Donations</SelectItem>
                  <SelectItem value="APPOINTMENT">Appointments</SelectItem>
                  <SelectItem value="PAYOUT">Payouts</SelectItem>
                  <SelectItem value="REFUND">Refunds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as TransactionStatus | 'ALL')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From Filter */}
            <div>
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            {/* Date To Filter */}
            <div>
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Transactions ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-destructive mb-4">Failed to load transactions</p>
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type & Amount</TableHead>
                    <TableHead>Payment Details</TableHead>
                    <TableHead>Related Entities</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-mono text-sm">{transaction.id.slice(0, 8)}...</p>
                          {transaction.paymentReference && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {transaction.paymentReference}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(transaction.type)}
                            <Badge variant={getTypeBadgeVariant(transaction.type)}>
                              {transaction.type}
                            </Badge>
                          </div>
                          <p className="font-bold text-lg">
                            {formatCurrency(transaction.amount)}
                          </p>
                          {transaction.paymentChannel && (
                            <p className="text-xs text-muted-foreground capitalize">
                              via {transaction.paymentChannel}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {transaction.paymentChannel ? 
                                transaction.paymentChannel.charAt(0).toUpperCase() + transaction.paymentChannel.slice(1) : 
                                'N/A'
                              }
                            </span>
                          </div>
                          {transaction.paymentReference && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {transaction.paymentReference}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {/* Donation Information */}
                          {transaction.donation && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Building2 className="h-3 w-3" />
                              <span>{transaction.donation.donor.fullName}</span>
                            </div>
                          )}
                          {transaction.donation?.purpose && (
                            <p className="text-xs text-muted-foreground">
                              {transaction.donation.purpose}
                            </p>
                          )}
                          
                          {/* Appointment Information */}
                          {transaction.appointments.length > 0 && (
                            <div className="space-y-1">
                              {transaction.appointments.slice(0, 2).map((appointment) => (
                                <div key={appointment.id} className="flex items-center space-x-2 text-sm">
                                  <User className="h-3 w-3" />
                                  <span>{appointment.patient.fullName}</span>
                                </div>
                              ))}
                              {transaction.appointments.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{transaction.appointments.length - 2} more
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Standalone transaction indicator */}
                          {!transaction.donation && transaction.appointments.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              Direct transaction
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(transaction.status)}
                          <Badge variant={getStatusBadgeVariant(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(transaction.createdAt), 'hh:mm a')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 