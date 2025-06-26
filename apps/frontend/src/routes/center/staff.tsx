import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm, useFieldArray, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  UserPlus, 
  Users, 
  Mail,
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { inviteStaffSchema } from '@zerocancer/shared/schemas/center.schema'
import { centerById, useInviteStaff } from '@/services/providers/center.provider'
import { useAuthUser } from '@/services/providers/auth.provider'
import type { z } from 'zod'

export const Route = createFileRoute('/center/staff')({
  component: CenterStaff,
})

type InviteStaffForm = z.infer<typeof inviteStaffSchema> & FieldValues

function CenterStaff() {
  const queryClient = useQueryClient()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  
  // Get current authenticated center info
  const authUserQuery = useQuery(useAuthUser())
  const centerId = authUserQuery.data?.data?.user?.id
  
  // Get center details including staff
  const { data: centerData, isLoading: centerLoading } = useQuery({
    ...centerById(centerId!),
    enabled: !!centerId,
  })
  
  const center = centerData?.data
  const staff = center?.staff || []
  
  // Invite staff mutation
  const inviteStaffMutation = useInviteStaff()
  
  const form = useForm<InviteStaffForm>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: {
      centerId: centerId || '',
      emails: [''],
    },
  })
  
  const { fields, append, remove } = useFieldArray<InviteStaffForm, "emails">({
    control: form.control,
    name: 'emails',
  })
  
  // Update centerId when auth loads
  useEffect(() => {
    if (centerId) {
      form.setValue('centerId', centerId)
    }
  }, [centerId, form])
  
  const onInviteStaff = async (data: InviteStaffForm) => {
    try {
      // Filter out empty emails
      const validEmails = data.emails.filter(email => email.trim())
      
      if (validEmails.length === 0) {
        toast.error('Please add at least one email address')
        return
      }
      
      await inviteStaffMutation.mutateAsync({
        centerId: data.centerId,
        emails: validEmails,
      })
      
      toast.success(`Successfully sent ${validEmails.length} invitation(s)`)
      
      // Reset form and close dialog
      form.reset({ centerId: data.centerId, emails: [''] })
      setInviteDialogOpen(false)
      
      // Refresh center data to get updated staff list
      queryClient.invalidateQueries({ queryKey: ['centerById', centerId] })
      
    } catch (error: any) {
      console.error('Invite staff error:', error)
      toast.error(error?.response?.data?.error || 'Failed to send invitations')
    }
  }
  
  const addEmailField = () => {
    append('')
  }
  
  const removeEmailField = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }
  
  const getStaffStatusDisplay = (email: string) => {
    // In a real implementation, you'd check invite status from backend
    // For now, showing all as active since they're in the staff array
    return { status: 'active', label: 'Active', variant: 'default' as const }
  }
  
  if (centerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Manage Staff</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading staff information...</div>
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
            <Users className="h-6 w-6" />
            Manage Staff
          </h1>
          <p className="text-muted-foreground mt-1">
            Invite and manage staff members for {center?.centerName || 'your center'}
          </p>
        </div>
        
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Invite Staff Members</DialogTitle>
              <DialogDescription>
                Enter email addresses to invite new staff members to your center. 
                They'll receive an email with instructions to set up their account.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onInviteStaff)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="centerId"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Email Addresses</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEmailField}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Email
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-2">
                        <FormField
                          control={form.control}
                          name={`emails.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="colleague@example.com"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeEmailField(index)}
                            className="shrink-0 mt-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <FormDescription>
                    Staff members will be able to verify check-ins, upload results, 
                    and access center management features.
                  </FormDescription>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={inviteStaffMutation.isPending}
                  >
                    {inviteStaffMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Sending Invites...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitations
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">
              Active staff members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">
              Can access center features
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Waiting for setup
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <p className="text-sm text-muted-foreground">
            All staff members who have access to your center's features
          </p>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No staff members yet</h3>
              <p className="text-muted-foreground mb-4">
                Invite your first staff member to help manage your center
              </p>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Staff
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => {
                  const { status, label, variant } = getStaffStatusDisplay(member.email)
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant}>
                          {label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Recently
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Staff Access Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <strong>Verify Check-ins:</strong> Staff can scan QR codes and verify patient check-in codes
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <strong>Upload Results:</strong> Staff can upload screening results and manage patient records
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <strong>View Appointments:</strong> Staff can see all center appointments and patient information
              </div>
            </div>
            <div className="flex items-start gap-3">
              <X className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <strong>Staff Management:</strong> Only center owners can invite and manage staff members
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 