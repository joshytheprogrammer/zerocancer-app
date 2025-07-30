import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shared/ui/tabs'
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  centerBalance,
  centerPayouts,
  centerTransactionHistory,
} from '@/services/providers/payout.provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  Download,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Search,
} from 'lucide-react'
import { useState } from 'react'

// Image assets
import outstandingBalanceIcon from '@/assets/images/calendar.png'
import totalEarningsIcon from '@/assets/images/impact.png'
import totalPayoutsIcon from '@/assets/images/sponsored.png'

export const Route = createFileRoute('/center/receipt-history')({
  component: CenterReceiptHistory,
})

function CenterReceiptHistory() {
  const authUserQuery = useQuery(useAuthUser())
  const centerId = authUserQuery.data?.data?.user?.id

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  // Fetch data
  const { data: balanceData, isLoading: balanceLoading } = useQuery(
    centerBalance(centerId || ''),
  )

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery(
    centerTransactionHistory(centerId || '', { page, limit: 20 }),
  )

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery(
    centerPayouts(centerId || '', { page, limit: 10 }),
  )

  const balance = balanceData?.data
  const transactions = transactionsData?.data?.transactions || []
  const payouts = payoutsData?.data?.payouts || []

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: any) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.appointments.some(
        (apt: any) =>
          apt.patient.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          apt.screeningType.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )

    const matchesStatus =
      statusFilter === 'ALL' || transaction.status === statusFilter
    const matchesPayoutStatus =
      payoutStatusFilter === 'ALL' ||
      (payoutStatusFilter === 'PAID_OUT' && transaction.payoutItem) ||
      (payoutStatusFilter === 'PENDING' && !transaction.payoutItem)

    return matchesSearch && matchesStatus && matchesPayoutStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPayoutStatusBadge = (transaction: any) => {
    if (transaction.payoutItem) {
      return <Badge className="bg-blue-100 text-blue-800">Paid Out</Badge>
    }
    return (
      <Badge className="bg-orange-100 text-orange-800">Pending Payout</Badge>
    )
  }

  const getPayoutStatusBadgeForPayout = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (authUserQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading center information...</p>
      </div>
    )
  }

  if (!centerId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Center information not available
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Records</h1>
          <p className="text-muted-foreground">
            View your transaction history, receipts, and payout records
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Records
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 bg-green-100 relative overflow-hidden">
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm font-medium text-green-800">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-900">
              ₦
              {(
                (balance?.eligibleAmount || 0) + (balance?.totalPaidOut || 0)
              ).toLocaleString()}
            </div>
            <p className="text-xs text-green-700 mt-1">All time earnings</p>
          </CardContent>
          <img
            src={totalEarningsIcon}
            alt=""
            className="absolute -right-4 -top-4 w-24 h-24 opacity-20"
          />
        </Card>

        <Card className="border-0 bg-blue-100 relative overflow-hidden">
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm font-medium text-blue-800">
              Total Payouts Sent
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-900">
              ₦{(balance?.totalPaidOut || 0).toLocaleString()}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {balance?.lastPayoutDate
                ? `Last payout: ${format(new Date(balance.lastPayoutDate), 'MMM dd, yyyy')}`
                : 'No payouts yet'}
            </p>
          </CardContent>
          <img
            src={totalPayoutsIcon}
            alt=""
            className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20"
          />
        </Card>

        <Card className="border-0 bg-purple-100 relative overflow-hidden">
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm font-medium text-purple-800">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-900">
              ₦{(balance?.eligibleAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-purple-700 mt-1">
              {balance?.transactionCount || 0} eligible transactions
            </p>
          </CardContent>
          <img
            src={outstandingBalanceIcon}
            alt=""
            className="absolute -right-2 -top-2 w-20 h-20 opacity-20"
          />
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Transaction Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={payoutStatusFilter}
                  onValueChange={setPayoutStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payout Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Payout Status</SelectItem>
                    <SelectItem value="PAID_OUT">Paid Out</SelectItem>
                    <SelectItem value="PENDING">Pending Payout</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('ALL')
                    setPayoutStatusFilter('ALL')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Records</CardTitle>
              <CardDescription>
                All transactions from appointments at your center (
                {filteredTransactions.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">
                    Loading transactions...
                  </p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payout Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">
                            {transaction.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {transaction.appointments[0]?.patient.fullName ||
                              'N/A'}
                          </TableCell>
                          <TableCell>
                            {transaction.appointments[0]?.screeningType.name ||
                              'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{Number(transaction.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(transaction.createdAt),
                              'MMM dd, yyyy',
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell>
                            {getPayoutStatusBadge(transaction)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Receipt
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          {/* Payouts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                Record of all payouts sent to your account ({payouts.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payoutsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Loading payouts...</p>
                </div>
              ) : payouts.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No payouts yet</p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout Number</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Net Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Initiated</TableHead>
                        <TableHead>Date Completed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout: any) => (
                        <TableRow key={payout.id}>
                          <TableCell className="font-mono">
                            {payout.payoutNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{Number(payout.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{Number(payout.netAmount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getPayoutStatusBadgeForPayout(payout.status)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(payout.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {payout.completedAt
                              ? format(
                                  new Date(payout.completedAt),
                                  'MMM dd, yyyy',
                                )
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Payout Breakdown
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
