import { zodResolver } from '@hookform/resolvers/zod'
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { adminResetPasswordSchema } from '@zerocancer/shared/schemas/admin.schema'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import logo from '@/assets/images/logo-blue.svg'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import PasswordInput from '@/components/ui/password-input'
import { useAdminResetPassword } from '@/services/providers/admin.provider'
import { isAuthMiddleware } from '@/services/providers/auth.provider'

type AdminResetPasswordForm = z.infer<typeof adminResetPasswordSchema>

type SearchParams = {
  token?: string
}

export const Route = createFileRoute('/admin/reset-password')({
  component: AdminResetPasswordPage,
  validateSearch: (search): SearchParams => ({
    token: search.token as string,
  }),
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(context.queryClient)

    // If already authenticated as admin, redirect to admin dashboard
    if (isAuth && profile === 'ADMIN') {
      return redirect({ to: '/admin' })
    }

    return null
  },
})

function AdminResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const [passwordReset, setPasswordReset] = useState(false)
  const adminResetPasswordMutation = useAdminResetPassword()

  const form = useForm<AdminResetPasswordForm>({
    resolver: zodResolver(adminResetPasswordSchema),
    defaultValues: {
      token: token || '',
      password: '',
    },
  })

  // If no token, show error
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="ZeroCancer" className="h-16" />
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Invalid Reset Link
              </CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Please request a new password reset link.
              </p>

              <div className="space-y-2">
                <Link to="/admin/forgot-password">
                  <Button className="w-full">Request New Reset Link</Button>
                </Link>

                <Link to="/admin/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: AdminResetPasswordForm) => {
    try {
      const response = await adminResetPasswordMutation.mutateAsync({
        token: token,
        password: data.password,
      })

      if (response.ok) {
        setPasswordReset(true)
        toast.success('Password reset successful!')
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        'Failed to reset password. Please try again.'
      toast.error(errorMessage)
    }
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="ZeroCancer" className="h-16" />
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Password Reset Successful
              </CardTitle>
              <CardDescription>
                Your admin password has been successfully reset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You can now sign in with your new password.
              </p>

              <Link to="/admin/login">
                <Button className="w-full">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="ZeroCancer" className="h-16" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Reset Your Password
            </CardTitle>
            <CardDescription>Enter your new admin password</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Enter your new password"
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
                  disabled={adminResetPasswordMutation.isPending}
                >
                  {adminResetPasswordMutation.isPending
                    ? 'Resetting...'
                    : 'Reset Password'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t text-center">
              <Link
                to="/admin/login"
                className="text-sm text-primary hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
