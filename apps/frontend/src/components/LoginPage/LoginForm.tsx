import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PasswordInput from '@/components/ui/password-input'
import { useAuthUser, useForgotPassword, useLogin, useResendVerification } from '@/services/providers/auth.provider'
import { loginSchema } from '@zerocancer/shared/schemas/auth.schema'
import { toast } from 'sonner'
import type { z } from 'zod'
import RoleSelection from './RoleSelection'

type FormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [role, setRole] = useState<'patient' | 'donor' | 'center'>('patient')
  const queryClient = useQueryClient()
  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'testdonor3@example.com',
      password: 'demo789',
    },
  })

  const loginMutation = useLogin()
  const forgotPasswordMutation = useForgotPassword()
  const resendVerificationMutation = useResendVerification();
  const navigate = useNavigate()

  useEffect(() => {
    if (forgotPasswordMutation.status === 'error') {
      let msg = 'Failed to send reset email.'
      if (isAxiosError(forgotPasswordMutation.error)) {
        const data = forgotPasswordMutation.error.response?.data
        if (data && typeof data === 'object') {
          msg = JSON.stringify(data)
        }
      }
      toast.error(msg)
    }
  }, [forgotPasswordMutation.status])

  function onSubmit(values: FormData) {
    loginMutation.mutate(
      {
        params: {
          email: values.email,
          password: values.password,
        },
        actor: role,
      },
      {
        onSuccess: async (response) => {
          toast.success('Login successful')

          queryClient.fetchQuery(useAuthUser()).then((data) => {
            const userProfile = data?.data?.user?.profile.toLowerCase()
            console.log('userProfile', userProfile)
            navigate({ to: `/${userProfile}` })
          })

        },
        onError: (error) => {
          if (error.response?.data?.err_code === 'email_not_verified') {
            toast.error(
              'User not verified. Please check your email for verification code.',
            )
            resendVerificationMutation.mutate({
              email: values.email,
              profileType: role,
            }, {
              onSuccess: () => {
                toast.success('Verification code resent successfully!')
              },
              onError: (error) => {
                toast.error('Failed to resend verification code. Please try again.')
              },
            })
          }
          toast.error(
            error.response?.data?.error || 'Login failed. Please try again.',
          )
        },
      },
    )
  }

  function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    forgotPasswordMutation.mutate(forgotEmail, {
      onSuccess: () => setForgotSent(true),
    })
  }

  if (showForgot) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Forgot Password</h2>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset link.
          </p>
        </div>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <Input
            type="email"
            placeholder="john.doe@example.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />
          <Button
            type="submit"
            className="w-full"
            disabled={forgotPasswordMutation.status === 'pending'}
          >
            {forgotPasswordMutation.status === 'pending'
              ? 'Sending...'
              : 'Send Reset Link'}
          </Button>
          {forgotSent && (
            <div className="text-green-600 text-sm">
              Reset link sent! Check your email.
            </div>
          )}
        </form>
        <Button
          variant="link"
          className="w-full"
          onClick={() => setShowForgot(false)}
        >
          Back to Sign In
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Sign In</h2>
        <p className="text-muted-foreground">
          Select your role to access your account.
        </p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Sign in as...</label>
        <RoleSelection
          field={{
            value: role,
            onChange: (value: string) =>
              setRole(value as 'patient' | 'donor' | 'center'),
            name: 'role',
            onBlur: () => {},
            ref: () => {},
          }}
        />
      </div>
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
                    placeholder="john.doe@example.com"
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
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Enter your password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <button
              className=" text-primary cursor-pointer"
              onClick={() => setShowForgot(true)}
            >
              Forgot Password?
            </button>
          </div>
          <Button
            type="submit"
            disabled={loginMutation.status === 'pending'}
            className="w-full flex items-center justify-center gap-2"
          >
            {loginMutation.status === 'pending' && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            Sign In
          </Button>
        </form>
      </Form>
    </div>
  )
}
