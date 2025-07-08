import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import signupImage from '@/assets/images/signup.png'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  centers,
  useCenterStaffForgotPassword,
  useCenterStaffLogin,
} from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import {
  centerStaffForgotPasswordSchema,
  centerStaffLoginSchema,
} from '@zerocancer/shared/schemas/centerStaff.schema'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import type { z } from 'zod'

export const Route = createFileRoute('/staff/login')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      centers({
        page: 1,
        pageSize: 100, // Get a large number to show all available centers
        status: 'ACTIVE', // Only show active centers
      }),
    )
  },
})

type LoginFormData = z.infer<typeof centerStaffLoginSchema>
type ForgotPasswordFormData = z.infer<typeof centerStaffForgotPasswordSchema>

function RouteComponent() {
  const [showForgot, setShowForgot] = useState(false)
  const navigate = useNavigate()
  const [loginPopoverOpen, setLoginPopoverOpen] = useState(false)
  const [forgotPopoverOpen, setForgotPopoverOpen] = useState(false)

  const {
    data: centersData,
    isLoading: centersLoading,
    isError,
    error,
  } = useQuery(
    centers({
      page: 1,
      pageSize: 100, // Get a large number to show all available centers
      status: 'ACTIVE', // Only show active centers
    }),
  )

  if (isError) {
    console.error('Failed to fetch centers:', error)
  }
  if (centersData) {
    console.log('Fetched centers data:', centersData)
  }

  const centersList = centersData?.data?.centers || []

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(centerStaffLoginSchema),
    defaultValues: {
      centerId: '',
      email: '',
      password: '',
    },
  })

  const forgotForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(centerStaffForgotPasswordSchema),
    defaultValues: {
      centerId: '',
      email: '',
    },
  })

  const loginMutation = useCenterStaffLogin()
  const forgotPasswordMutation = useCenterStaffForgotPassword()

  function onLoginSubmit(values: LoginFormData) {
    loginMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Login successful')
        navigate({ to: '/center' })
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.error || 'Login failed. Please try again.',
        )
      },
    })
  }

  function onForgotSubmit(values: ForgotPasswordFormData) {
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Password reset link sent to your email')
        setShowForgot(false)
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.error || 'Failed to send reset email.',
        )
      },
    })
  }

  const centerSelectField = (
    form: any,
    popoverOpen: boolean,
    setPopoverOpen: (open: boolean) => void,
  ) => (
    <FormField
      control={form.control}
      name="centerId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Center</FormLabel>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    'w-full justify-between',
                    !field.value && 'text-muted-foreground',
                  )}
                  disabled={centersLoading}
                >
                  {field.value
                    ? centersList.find((center) => center.id === field.value)
                        ?.centerName
                    : 'Select center'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search centers..." />
                <CommandList>
                  {centersLoading && (
                    <div className="p-4 text-center text-sm">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                      Loading...
                    </div>
                  )}
                  {isError && (
                    <div className="p-2 text-center text-sm text-red-500">
                      Failed to load centers.
                    </div>
                  )}
                  {!centersLoading && !isError && centersList.length === 0 && (
                    <CommandEmpty>No center found.</CommandEmpty>
                  )}
                  <CommandGroup>
                    {!centersLoading &&
                      !isError &&
                      centersList.map((center) => (
                        <CommandItem
                          value={center.centerName}
                          key={center.id}
                          onSelect={() => {
                            form.setValue('centerId', center.id)
                            setPopoverOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              center.id === field.value
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {center.centerName}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  if (showForgot) {
    return (
      <div className="flex h-screen p-2">
        <div className="hidden md:block md:w-1/2 lg:w-2/5">
          <img
            src={signupImage}
            alt="Reset Password"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
          <div className="flex-shrink-0 p-4 lg:p-8">
            <div className="flex">
              <span className="inline-block ml-auto">
                Remember your password?{' '}
                <button
                  onClick={() => setShowForgot(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign In
                </button>
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center">
            <div className="w-full max-w-md">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Reset Password</h2>
                  <p className="text-muted-foreground">
                    Enter your center ID and email to receive a password reset
                    link.
                  </p>
                </div>

                <Form {...forgotForm}>
                  <form
                    onSubmit={forgotForm.handleSubmit(onForgotSubmit)}
                    className="space-y-4"
                  >
                    {centerSelectField(
                      forgotForm,
                      forgotPopoverOpen,
                      setForgotPopoverOpen,
                    )}

                    <FormField
                      control={forgotForm.control}
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

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={forgotPasswordMutation.status === 'pending'}
                    >
                      {forgotPasswordMutation.status === 'pending' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen p-2">
      <div className="hidden md:block md:w-1/2 lg:w-2/5">
        <img
          src={signupImage}
          alt="Staff Login"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>

      <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
        <div className="flex-shrink-0 p-4 lg:p-8">
          <div className="flex">
            <span className="inline-block ml-auto">
              Need to create an account?{' '}
              <Link to="/sign-up" className="text-primary font-semibold">
                Sign Up
              </Link>
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center">
          <div className="w-full max-w-md">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Staff Portal</h2>
                <p className="text-muted-foreground">
                  Sign in to access your center's staff portal.
                </p>
              </div>

              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                  {centerSelectField(
                    loginForm,
                    loginPopoverOpen,
                    setLoginPopoverOpen,
                  )}

                  <FormField
                    control={loginForm.control}
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
                    control={loginForm.control}
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
                      type="button"
                      className="text-primary cursor-pointer hover:underline"
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign In
                  </Button>
                </form>
              </Form>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  For patients, donors, or center admins:{' '}
                  <Link
                    to="/login"
                    className="text-primary font-semibold hover:underline"
                  >
                    Use Main Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
