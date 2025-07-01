// import { createFileRoute, Link } from '@tanstack/react-router'
// import { useState } from 'react'
// import { useQuery } from '@tanstack/react-query'
// import { useDonorReceipts } from '@/services/providers/donor.provider'
// import type { TDonationTransaction } from '@zerocancer/shared/types'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import { Input } from '@/components/ui/input'
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu'
// import {
//   Search,
//   Download,
//   Eye,
//   MoreHorizontal,
//   DollarSign,
//   Receipt,
//   Filter,
//   FileText,
//   CreditCard,
//   Gift
// } from 'lucide-react'
// import { format } from 'date-fns'

// export const Route = createFileRoute('/donor/receipts')({
//   component: DonorReceipts,
// })

// function DonorReceipts() {
//   const [searchTerm, setSearchTerm] = useState('')
//   const [statusFilter, setStatusFilter] = useState<string>('ALL')
//   const [typeFilter, setTypeFilter] = useState<string>('ALL')
//   const [page, setPage] = useState(1)

//   // Fetch receipts from API
//   // const {
//   //   data: receiptsData,
//   //   isLoading,
//   //   error
//   // } = useQuery(useDonorReceipts({
//   //   page,
//   //   size: 20
//   // }))

//   // const receipts = receiptsData?.data?.receipts || []

//   // Filter receipts (applying client-side filters on top of API data)
//   // const filteredReceipts = receipts.filter((receipt: TDonationTransaction) => {
//   //   const matchesSearch =
//   //     receipt.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
//   //     (receipt.donationData?.message && receipt.donationData.message.toLowerCase().includes(searchTerm.toLowerCase()))

//   //   const matchesStatus = statusFilter === 'ALL' || receipt.status === statusFilter
//   //   const matchesType = typeFilter === 'ALL' || receipt.type === typeFilter

//   //   return matchesSearch && matchesStatus && matchesType
//   // })

//   // Calculate stats from real data
//   const totalAmount = receipts
//     .filter((r: TDonationTransaction) => r.status === 'COMPLETED' && r.type === 'DONATION')
//     .reduce((sum: number, r: TDonationTransaction) => sum + r.amount, 0)

//   const completedCount = receipts.filter((r: TDonationTransaction) => r.status === 'COMPLETED').length
//   const pendingCount = receipts.filter((r: TDonationTransaction) => r.status === 'PENDING').length

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'COMPLETED':
//         return <Badge className="bg-green-100 text-green-800">Completed</Badge>
//       case 'PENDING':
//         return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
//       case 'FAILED':
//         return <Badge className="bg-red-100 text-red-800">Failed</Badge>
//       default:
//         return <Badge variant="secondary">{status}</Badge>
//     }
//   }

//   const getTypeBadge = (type: string) => {
//     switch (type) {
//       case 'DONATION':
//         return <Badge variant="default" className="bg-blue-100 text-blue-800">Donation</Badge>
//       case 'REFUND':
//         return <Badge variant="outline" className="border-orange-200 text-orange-800">Refund</Badge>
//       default:
//         return <Badge variant="secondary">{type}</Badge>
//     }
//   }

//   const getChannelIcon = (channel: string) => {
//     switch (channel) {
//       case 'card':
//         return <CreditCard className="h-4 w-4" />
//       case 'bank_transfer':
//         return <FileText className="h-4 w-4" />
//       case 'ussd':
//         return <Gift className="h-4 w-4" />
//       default:
//         return <DollarSign className="h-4 w-4" />
//     }
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold">Donation Receipts</h1>
//           <p className="text-muted-foreground">
//             View and download receipts for all your donations and transactions
//           </p>
//         </div>
//         <Button variant="outline">
//           <Download className="h-4 w-4 mr-2" />
//           Download All
//         </Button>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid gap-4 md:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
//             <DollarSign className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</div>
//             <p className="text-xs text-muted-foreground">
//               From completed donations
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
//             <Receipt className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{receipts.length}</div>
//             <p className="text-xs text-muted-foreground">
//               All transactions
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Completed</CardTitle>
//             <Badge className="h-4 w-4 text-muted-foreground bg-green-100" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{completedCount}</div>
//             <p className="text-xs text-muted-foreground">
//               Successful transactions
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Pending</CardTitle>
//             <Badge className="h-4 w-4 text-muted-foreground bg-yellow-100" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{pendingCount}</div>
//             <p className="text-xs text-muted-foreground">
//               Awaiting confirmation
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg flex items-center gap-2">
//             <Filter className="h-5 w-5" />
//             Filters
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid gap-4 md:grid-cols-4">
//             <div className="relative">
//               <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search receipts..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>

//             <Select value={statusFilter} onValueChange={setStatusFilter}>
//               <SelectTrigger>
//                 <SelectValue placeholder="All Statuses" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="ALL">All Statuses</SelectItem>
//                 <SelectItem value="COMPLETED">Completed</SelectItem>
//                 <SelectItem value="PENDING">Pending</SelectItem>
//                 <SelectItem value="FAILED">Failed</SelectItem>
//               </SelectContent>
//             </Select>

//             <Select value={typeFilter} onValueChange={setTypeFilter}>
//               <SelectTrigger>
//                 <SelectValue placeholder="All Types" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="ALL">All Types</SelectItem>
//                 <SelectItem value="DONATION">Donations</SelectItem>
//                 <SelectItem value="REFUND">Refunds</SelectItem>
//               </SelectContent>
//             </Select>

//             <Button
//               variant="outline"
//               onClick={() => {
//                 setSearchTerm('')
//                 setStatusFilter('ALL')
//                 setTypeFilter('ALL')
//               }}
//             >
//               Clear Filters
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Receipts Table */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg">
//             Receipts ({filteredReceipts.length})
//           </CardTitle>
//           <CardDescription>
//             Complete history of your donation transactions and receipts
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Reference</TableHead>
//                 <TableHead>Type</TableHead>
//                 <TableHead>Campaign</TableHead>
//                 <TableHead>Amount</TableHead>
//                 <TableHead>Channel</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Date</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredReceipts.length > 0 ? (
//                 filteredReceipts.map((receipt: TDonationTransaction) => (
//                   <TableRow key={receipt.id}>
//                     <TableCell className="font-medium">
//                       {receipt.paymentReference}
//                     </TableCell>
//                     <TableCell>
//                       {getTypeBadge(receipt.type)}
//                     </TableCell>
//                     <TableCell>
//                       {receipt.donationData?.campaignId ? (
//                         <div>
//                           <p className="font-medium">Campaign #{receipt.donationData.campaignId.slice(-6)}</p>
//                           {receipt.donationData.message && (
//                             <p className="text-sm text-muted-foreground">
//                               {receipt.donationData.message}
//                             </p>
//                           )}
//                         </div>
//                       ) : (
//                         <span className="text-muted-foreground">
//                           {receipt.donationData?.isAnonymous ? 'Anonymous Donation' : 'General Fund'}
//                         </span>
//                       )}
//                     </TableCell>
//                     <TableCell className="font-medium">
//                       ₦{receipt.amount.toLocaleString()}
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         {getChannelIcon(receipt.paymentChannel)}
//                         <span className="capitalize">
//                           {receipt.paymentChannel.replace('_', ' ')}
//                         </span>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       {getStatusBadge(receipt.status)}
//                     </TableCell>
//                     <TableCell>
//                       {format(new Date(receipt.createdAt), 'MMM dd, yyyy')}
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" className="h-8 w-8 p-0">
//                             <MoreHorizontal className="h-4 w-4" />
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                           <DropdownMenuItem>
//                             <Eye className="mr-2 h-4 w-4" />
//                             View Details
//                           </DropdownMenuItem>
//                           {receipt.status === 'COMPLETED' && (
//                             <DropdownMenuItem>
//                               <Download className="mr-2 h-4 w-4" />
//                               Download PDF
//                             </DropdownMenuItem>
//                           )}
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell colSpan={8} className="text-center py-8">
//                     <div className="space-y-2">
//                       <Receipt className="h-8 w-8 mx-auto text-muted-foreground" />
//                       <p className="text-muted-foreground">No receipts found</p>
//                       <Button variant="outline" asChild>
//                         <Link to="/donor/campaigns/create">
//                           Create Your First Campaign
//                         </Link>
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
