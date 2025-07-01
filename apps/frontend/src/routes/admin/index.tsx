import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  Building2, 
  HeartHandshake, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Store,
  Activity,
  Eye,
  ArrowUpRight,
  Stethoscope,
  FileText,
  Bell
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminUsers, adminCenters, adminCampaigns, adminAppointments, adminTransactions, adminStoreProducts } from '@/services/providers/admin.provider'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { data: users } = useQuery(adminUsers({ profileType: undefined }))
  const { data: centers } = useQuery(adminCenters({ search: '' }))
  const { data: campaigns } = useQuery(adminCampaigns({ search: '' }))
  const { data: appointments } = useQuery(adminAppointments({}))
  const { data: transactions } = useQuery(adminTransactions({}))
  const { data: storeProducts } = useQuery(adminStoreProducts({ search: '' }))

  // Calculate key metrics
  const totalUsers = users?.data?.users?.length || 0
  const totalCenters = centers?.data?.centers?.length || 0
  const activeCenters = centers?.data?.centers?.filter(center => center.status === 'ACTIVE').length || 0
  const totalCampaigns = campaigns?.data?.campaigns?.length || 0
  const activeCampaigns = campaigns?.data?.campaigns?.filter(campaign => campaign.status === 'ACTIVE').length || 0
  const totalAppointments = appointments?.data?.appointments?.length || 0
  const scheduledAppointments = appointments?.data?.appointments?.filter(apt => apt.status === 'SCHEDULED').length || 0
  const totalTransactions = transactions?.data?.transactions?.length || 0
  const completedTransactions = transactions?.data?.transactions?.filter(txn => txn.status === 'COMPLETED').length || 0
  const totalProducts = storeProducts?.data?.products?.length || 0
  const lowStockProducts = storeProducts?.data?.products?.filter(product => product.stock <= 10).length || 0

  // Calculate revenue
  const totalRevenue = transactions?.data?.transactions
    ?.filter(txn => txn.status === 'COMPLETED')
    ?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0

  // Recent activity items
  const recentAppointments = appointments?.data?.appointments?.slice(0, 5) || []
  const recentTransactions = transactions?.data?.transactions?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your Zero Cancer platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/admin/notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Patients, donors, and staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Centers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCenters}</div>
            <p className="text-xs text-muted-foreground">
              of {totalCenters} total centers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <HeartHandshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              of {totalCampaigns} total campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {completedTransactions} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* System Health */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Appointments</span>
                  <Badge variant="secondary">
                    {scheduledAppointments} scheduled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Transaction Success</span>
                  <Badge variant={completedTransactions > totalTransactions * 0.8 ? "default" : "destructive"}>
                    {totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Platform Utilization</span>
                  <Badge variant={activeCenters > totalCenters * 0.7 ? "default" : "secondary"}>
                    {totalCenters > 0 ? Math.round((activeCenters / totalCenters) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Campaign Funding</span>
                  <Badge variant={activeCampaigns > 0 ? "default" : "secondary"}>
                    {activeCampaigns} active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Store Inventory</span>
                  <Badge variant={lowStockProducts > 0 ? "destructive" : "default"}>
                    {lowStockProducts > 0 ? `${lowStockProducts} low stock` : 'Healthy'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Center Network</span>
                  <Badge variant="default">
                    {totalCenters} locations
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/centers">
                <Stethoscope className="h-4 w-4 mr-2" />
                Manage Centers
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                View Users
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/campaigns">
                <HeartHandshake className="h-4 w-4 mr-2" />
                Campaign Status
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/waitlist">
                <Clock className="h-4 w-4 mr-2" />
                Waitlist Management
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/store">
                <Store className="h-4 w-4 mr-2" />
                Store Management
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/transactions">
                <DollarSign className="h-4 w-4 mr-2" />
                Financial Overview
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>Latest appointment bookings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/appointments">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAppointments.length > 0 ? (
                recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {appointment.patient?.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.center?.centerName} • {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      appointment.status === 'SCHEDULED' ? 'secondary' :
                      appointment.status === 'COMPLETED' ? 'default' :
                      appointment.status === 'CANCELLED' ? 'destructive' : 'outline'
                    }>
                      {appointment.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent appointments</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/transactions">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {transaction.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ₦{transaction.amount?.toLocaleString()} • {transaction.paymentChannel || 'N/A'}
                      </p>
                    </div>
                    <Badge variant={
                      transaction.status === 'COMPLETED' ? 'default' :
                      transaction.status === 'PENDING' ? 'secondary' :
                      transaction.status === 'FAILED' ? 'destructive' : 'outline'
                    }>
                      {transaction.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Section */}
      {lowStockProducts > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Inventory Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-3">
              {lowStockProducts} products are running low on stock and need restocking.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/store">
                <Store className="h-4 w-4 mr-2" />
                Manage Inventory
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 