import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import { Input } from '@/components/shared/ui/input'
import { useVerifyCheckInCode } from '@/services/providers/center.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifyCheckInCodeSchema } from '@zerocancer/shared/schemas/appointment.schema'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  QrCode,
  Scan,
  User,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type FormData = z.infer<typeof verifyCheckInCodeSchema>

interface CenterVerifyCodePageProps {
  codeFromUrl?: string
}

export function CenterVerifyCodePage({
  codeFromUrl = '',
}: CenterVerifyCodePageProps) {
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean
    appointmentId?: string
    message?: string
  } | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(verifyCheckInCodeSchema),
    defaultValues: {
      checkInCode: codeFromUrl,
    },
  })

  // Submit form on mount if verification code exist
  useEffect(() => {
    if (codeFromUrl) form.handleSubmit(onSubmit)()
  }, [codeFromUrl])

  const verifyMutation = useVerifyCheckInCode()

  const onSubmit = (values: FormData) => {
    setVerificationResult(null)

    verifyMutation.mutate(values, {
      onSuccess: (response) => {
        const result = response.data
        setVerificationResult(result)

        if (result.valid) {
          toast.success(result.message || 'Check-in verified successfully!')
          form.reset() // Clear the form on successful verification
        } else {
          toast.error(result.message || 'Invalid check-in code')
        }
      },
      onError: (error: any) => {
        const errorMessage =
          error.response?.data?.error || 'Failed to verify check-in code'
        toast.error(errorMessage)
        setVerificationResult({
          valid: false,
          message: errorMessage,
        })
      },
    })
  }

  const handleClearResult = () => {
    setVerificationResult(null)
    form.reset()
  }

  const isLoading = verifyMutation.status === 'pending'

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Verify Patient Check-in</h1>
        <p className="text-muted-foreground">
          Enter a patient's check-in code to verify their appointment and update
          their status.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Verification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Enter Check-in Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="checkInCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-in Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 6-8 digit code..."
                          {...field}
                          disabled={isLoading}
                          className="font-mono text-lg tracking-wider"
                          autoComplete="off"
                          maxLength={20}
                        />
                      </FormControl>
                      <FormDescription>
                        The patient should provide this code from their
                        appointment confirmation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Code
                      </>
                    )}
                  </Button>

                  {(verificationResult || form.getValues().checkInCode) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearResult}
                      disabled={isLoading}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            {/* Future QR Scanner Option */}
            <div className="mt-6 pt-6 border-t">
              <Button
                variant="outline"
                disabled
                className="w-full"
                title="QR scanning feature coming soon"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan QR Code (Coming Soon)
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                QR code scanning will be available in a future update
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Verification Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!verificationResult ? (
              <div className="text-center py-12 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter a check-in code to see verification results</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`flex items-center gap-3 p-4 rounded-lg ${
                    verificationResult.valid
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {verificationResult.valid ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {verificationResult.valid
                        ? 'Verification Successful'
                        : 'Verification Failed'}
                    </h3>
                    <p className="text-sm">
                      {verificationResult.message ||
                        (verificationResult.valid
                          ? 'Check-in code is valid'
                          : 'Check-in code is invalid')}
                    </p>
                  </div>
                </div>

                {verificationResult.valid &&
                  verificationResult.appointmentId && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-medium text-gray-900">
                        Appointment Details
                      </h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Appointment ID:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {verificationResult.appointmentId}
                          </code>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            How to Use Check-in Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-medium">Patient Provides Code</h4>
              <p className="text-sm text-muted-foreground">
                Ask the patient for their 6-8 digit check-in code from their
                appointment confirmation
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-green-600">2</span>
              </div>
              <h4 className="font-medium">Enter & Verify</h4>
              <p className="text-sm text-muted-foreground">
                Type the code into the form above and click "Verify Code" to
                validate
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-medium">Update Status</h4>
              <p className="text-sm text-muted-foreground">
                If valid, the appointment status will be automatically updated
                to "In Progress"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
