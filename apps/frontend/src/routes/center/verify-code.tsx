import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useVerifyCheckInCode } from '@/services/providers/center.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { fallback, zodValidator } from '@tanstack/zod-adapter'
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

export const Route = createFileRoute('/center/verify-code')({
  component: CenterVerifyCode,
  validateSearch: zodValidator(
    fallback(verifyCheckInCodeSchema.partial(), {
      checkInCode: '',
    }).default({ checkInCode: '' }),
  ),
})

function CenterVerifyCode() {
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean
    appointmentId?: string
    message?: string
  } | null>(null)

  const codeFromUrl = Route.useSearch().checkInCode || ''

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

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verificationResult?.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : verificationResult ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!verificationResult ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter a check-in code to verify</p>
                <p className="text-sm">Results will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  <Badge
                    variant={
                      verificationResult.valid ? 'default' : 'destructive'
                    }
                    className="text-base px-4 py-2"
                  >
                    {verificationResult.valid ? '✓ Valid' : '✗ Invalid'}
                  </Badge>
                </div>

                {/* Message */}
                <div className="text-center">
                  <p className="text-lg font-medium">
                    {verificationResult.message}
                  </p>
                </div>

                {/* Appointment ID (if available) */}
                {verificationResult.appointmentId && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">
                      Appointment Details:
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      ID: {verificationResult.appointmentId}
                    </p>
                  </div>
                )}

                {/* Success Actions */}
                {verificationResult.valid && (
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium text-green-700">
                      ✓ Patient checked in successfully
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • Appointment status updated to "In Progress"
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • Patient has been notified
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • Patient can now proceed with screening
                    </p>
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
            <AlertCircle className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                For Patients:
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Show your check-in code to the center staff</li>
                <li>• The code is found in your appointment confirmation</li>
                <li>• Codes are only valid on your appointment date</li>
                <li>• Each code can only be used once</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                For Staff:
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Enter the patient's check-in code exactly as provided</li>
                <li>• Verify the patient's identity before proceeding</li>
                <li>• Successful verification updates appointment status</li>
                <li>• Guide the patient to the appropriate screening area</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
