import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  Building,
  Users
} from 'lucide-react'
import { toast } from 'sonner'
import { createCenterStaffPasswordSchema } from '@zerocancer/shared/schemas/centerStaff.schema'
import { useCreateCenterStaffPassword } from '@/services/providers/center.provider'
import { z } from 'zod'
import PasswordInput from '@/components/ui/password-input'

type SearchParams = {
  token: string
}

export const Route = createFileRoute('/staff/create-new-password')({
  component: CreateStaffPassword,
  validateSearch: (search): SearchParams => ({
    token: String(search.token || ''),
  }),
})

type CreatePasswordForm = z.infer<typeof createCenterStaffPasswordSchema> & {
  confirmPassword: string
}

const createPasswordFormSchema = createCenterStaffPasswordSchema.extend({
  confirmPassword: z.string().min(8, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

function CreateStaffPassword() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const [isSuccess, setIsSuccess] = useState(false)
  
  const createPasswordMutation = useCreateCenterStaffPassword()
  
  const form = useForm<CreatePasswordForm>({
    resolver: zodResolver(createPasswordFormSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: CreatePasswordForm) => {
    try {
      await createPasswordMutation.mutateAsync({
        token: data.token,
        password: data.password,
      })
      
      setIsSuccess(true)
      toast.success('Password created successfully!')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate({ to: '/login', search: { actor: 'center' } })
      }, 3000)
      
    } catch (error: any) {
      console.error('Create password error:', error)
      const errorMessage = error?.response?.data?.error || 'Failed to create password. Please try again.'
      toast.error(errorMessage)
      
      // If token is invalid/expired, show specific error
      if (error?.response?.status === 400 || error?.response?.status === 401) {
        form.setError('token', { 
          message: 'Invalid or expired invitation link. Please contact your center administrator.' 
        })
      }
    }
  }

  // Validate token on component mount
  if (!token || token.length < 10) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Invalid Invitation Link</CardTitle>
            <CardDescription>
              The invitation link appears to be invalid or incomplete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>What to do next</AlertTitle>
              <AlertDescription>
                Please contact your center administrator to request a new invitation link.
                Make sure you're using the complete URL from your invitation email.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">Welcome to the Team!</CardTitle>
            <CardDescription>
              Your staff account has been successfully created.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Account Created Successfully</AlertTitle>
              <AlertDescription>
                You can now login to access the staff portal. You'll be redirected to the login page in a moment.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => navigate({ to: '/login', search: { actor: 'center' } })}
              className="w-full"
            >
              Continue to Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main password creation form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Create Your Staff Account</CardTitle>
          <CardDescription>
            Welcome! Please create a secure password to complete your staff account setup.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Hidden token field */}
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} type="hidden" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="Enter a secure password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="Confirm your password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createPasswordMutation.isPending}
              >
                {createPasswordMutation.isPending ? (
                  'Creating Account...'
                ) : (
                  'Create Staff Account'
                )}
              </Button>
            </form>
          </Form>

          {/* Information about staff access */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">As a staff member, you'll be able to:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Verify patient check-ins
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Upload screening results
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Manage center appointments
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Access results history
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 