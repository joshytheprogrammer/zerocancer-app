import { createFileRoute, useNavigate, Link, redirect } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminLoginSchema } from '@zerocancer/shared/schemas/admin.schema'
import type { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PasswordInput from '@/components/ui/password-input'
import { useAdminLogin } from '@/services/providers/admin.provider'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import logo from '@/assets/images/logo-blue.svg'

type AdminLoginForm = z.infer<typeof adminLoginSchema>

export const Route = createFileRoute('/admin/login')({
  component: AdminLoginPage,
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(context.queryClient)
    
    // If already authenticated as admin, redirect to admin dashboard
    if (isAuth && profile === 'ADMIN') {
      return redirect({ to: '/admin' })
    }
    
    // If authenticated as other role, don't redirect (allow admin login)
    return null
  },
})

function AdminLoginPage() {
  const navigate = useNavigate()
  const adminLoginMutation = useAdminLogin()

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: 'ttaiwo4910@gmail.com',
      password: 'fake.password',
    },
  })

  const onSubmit = async (data: AdminLoginForm) => {
    try {
      const response = await adminLoginMutation.mutateAsync(data)
      
      if (response.ok) {
        toast.success('Welcome back, Admin!')
        navigate({ to: '/admin', replace: true, reloadDocument: true })
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Login failed. Please try again.'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="ZeroCancer" className="h-16" />
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>
              Sign in to your admin account to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@zerocancer.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
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
                          placeholder="Enter your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={adminLoginMutation.isPending}
                >
                  {adminLoginMutation.isPending ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <Link
                to="/admin/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Not an admin?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in as user
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 