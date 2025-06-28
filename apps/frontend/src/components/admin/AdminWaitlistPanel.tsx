// /**
//  * Admin Waitlist Management Component
//  *
//  * This component demonstrates how to use the waitlist matching trigger
//  * in an admin dashboard. It provides:
//  *
//  * 1. Real-time statistics about waitlist and matching status
//  * 2. One-click manual trigger for the matching algorithm
//  * 3. Service health monitoring
//  * 4. Auto-refresh capabilities
//  *
//  * Usage:
//  * - Import this component in your admin dashboard
//  * - The component handles authentication through existing auth middleware
//  * - Statistics auto-refresh every 5 minutes
//  * - Manual trigger invalidates cache and refreshes data
//  */

// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { useTriggerWaitlistMatching } from '@/services/providers/waitlist.provider';
// import { useQuery } from '@tanstack/react-query';
// import { QueryKeys } from '@/services/keys';
// import { waitlistMatchingStats, waitlistMatchingStatus } from '@/services/providers/waitlist.provider';
// import { Loader2, Users, Clock, Target, Activity, CheckCircle, AlertCircle } from 'lucide-react';

// const AdminWaitlistPanel: React.FC = () => {
//   // Query hooks for data
//   const { data: stats, isLoading: statsLoading, error: statsError } = useQuery(waitlistMatchingStats());
//   const { data: status, isLoading: statusLoading } = useQuery(waitlistMatchingStatus());

//   // Mutation hook for triggering matching
//   const triggerMatching = useTriggerWaitlistMatching();

//   const handleTriggerMatch = () => {
//     triggerMatching.mutate(undefined, {
//       onSuccess: (result) => {
//         console.log(`Matching completed in ${result.data.executionTime}ms`);
//         // You could add a toast notification here
//         // toast.success(`Matching completed successfully in ${result.data.executionTime}ms`);
//       },
//       onError: (error) => {
//         console.error('Matching failed:', error);
//         // You could add a toast notification here
//         // toast.error('Failed to run matching algorithm');
//       }
//     });
//   };

//   // Service status indicator
//   const getStatusColor = (serviceStatus?: string) => {
//     switch (serviceStatus) {
//       case 'healthy': return 'text-green-600 bg-green-100';
//       case 'unhealthy': return 'text-red-600 bg-red-100';
//       default: return 'text-gray-600 bg-gray-100';
//     }
//   };

//   const getStatusIcon = (serviceStatus?: string) => {
//     switch (serviceStatus) {
//       case 'healthy': return <CheckCircle className="w-4 h-4" />;
//       case 'unhealthy': return <AlertCircle className="w-4 h-4" />;
//       default: return <Clock className="w-4 h-4" />;
//     }
//   };

//   if (statsLoading || statusLoading) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <Loader2 className="w-6 h-6 animate-spin mr-2" />
//         <span>Loading waitlist data...</span>
//       </div>
//     );
//   }

//   if (statsError) {
//     return (
//       <div className="p-8 text-center">
//         <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//         <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Waitlist Data</h3>
//         <p className="text-red-600">Failed to load waitlist statistics. Please try again.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Waitlist Management</h2>
//           <p className="text-gray-600">Monitor and manage patient waitlist matching</p>
//         </div>

//         {/* Service Status Badge */}
//         <Badge
//           variant="outline"
//           className={`flex items-center gap-2 ${getStatusColor(status?.data?.status)}`}
//         >
//           {getStatusIcon(status?.data?.status)}
//           Service: {status?.data?.status || 'Unknown'}
//         </Badge>
//       </div>

//       {/* Statistics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Pending Patients</CardTitle>
//             <Users className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-blue-600">
//               {stats?.data?.pending || 0}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Waiting for matches
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Matched Patients</CardTitle>
//             <Target className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-600">
//               {stats?.data?.matched || 0}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Successfully matched
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Recent Matches</CardTitle>
//             <Clock className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-purple-600">
//               {stats?.data?.recentMatches || 0}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               Last 24 hours
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
//             <Activity className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-orange-600">
//               {stats?.data?.campaigns?.active || 0}
//             </div>
//             <p className="text-xs text-muted-foreground">
//               of {stats?.data?.campaigns?.total || 0} total
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Actions Panel */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Manual Actions</CardTitle>
//           <p className="text-sm text-muted-foreground">
//             Trigger the waitlist matching algorithm to process pending patients
//           </p>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {/* Manual Trigger Button */}
//           <div className="flex items-center justify-between p-4 border rounded-lg">
//             <div>
//               <h4 className="font-medium">Run Matching Algorithm</h4>
//               <p className="text-sm text-muted-foreground">
//                 Process up to 10 patients per screening type and match them to available campaigns
//               </p>
//             </div>
//             <Button
//               onClick={handleTriggerMatch}
//               disabled={triggerMatching.isPending}
//               className="ml-4"
//             >
//               {triggerMatching.isPending ? (
//                 <>
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                   Running...
//                 </>
//               ) : (
//                 'Run Matching'
//               )}
//             </Button>
//           </div>

//           {/* Success Message */}
//           {triggerMatching.isSuccess && (
//             <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
//               <div className="flex items-center">
//                 <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
//                 <div>
//                   <h4 className="font-medium text-green-800">Matching Completed Successfully!</h4>
//                   <p className="text-sm text-green-700">
//                     Execution time: {triggerMatching.data?.data?.executionTime}ms
//                   </p>
//                   <p className="text-sm text-green-700">
//                     Triggered by: {triggerMatching.data?.data?.triggeredBy?.adminEmail}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Error Message */}
//           {triggerMatching.isError && (
//             <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
//               <div className="flex items-center">
//                 <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
//                 <div>
//                   <h4 className="font-medium text-red-800">Matching Failed</h4>
//                   <p className="text-sm text-red-700">
//                     {triggerMatching.error?.message || 'Unknown error occurred'}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Information Panel */}
//       <Card>
//         <CardHeader>
//           <CardTitle>How It Works</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3 text-sm">
//             <div className="flex items-start gap-3">
//               <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
//               <p>Processes up to 10 pending patients per screening type (FCFS order)</p>
//             </div>
//             <div className="flex items-start gap-3">
//               <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
//               <p>Skips patients with 3+ unclaimed allocations or existing matches</p>
//             </div>
//             <div className="flex items-start gap-3">
//               <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
//               <p>Prioritizes most specific campaigns, then highest amount, then earliest created</p>
//             </div>
//             <div className="flex items-start gap-3">
//               <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
//               <p>Falls back to general donor pool if no specific campaign matches</p>
//             </div>
//             <div className="flex items-start gap-3">
//               <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">5</div>
//               <p>Creates notifications for matched patients and updates campaign balances</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Last Updated */}
//       <div className="text-center text-sm text-muted-foreground">
//         Last updated: {stats?.data?.lastUpdated ? new Date(stats.data.lastUpdated).toLocaleString() : 'Never'}
//       </div>
//     </div>
//   );
// };

// export default AdminWaitlistPanel;

// /**
//  * Usage Example in Admin Dashboard:
//  *
//  * import AdminWaitlistPanel from '@/components/admin/AdminWaitlistPanel';
//  *
//  * function AdminDashboard() {
//  *   return (
//  *     <div className="admin-dashboard">
//  *       <AdminWaitlistPanel />
//  *     </div>
//  *   );
//  * }
//  *
//  * The component will automatically:
//  * - Load and display waitlist statistics
//  * - Check service health status
//  * - Provide manual trigger functionality
//  * - Auto-refresh data every 5 minutes
//  * - Show loading states and error handling
//  * - Invalidate cache after successful triggers
//  */
