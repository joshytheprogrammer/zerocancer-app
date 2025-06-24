import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useResetPassword } from '@/services/providers/auth.provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { z } from 'zod'

const resetPasswordSearchSchema = z.object({
  token: z.string().catch(''),
})

export const Route = createFileRoute('/(auth)/reset-password')({
  component: ResetPasswordPage,
  validateSearch: resetPasswordSearchSchema,
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const resetPassword = useResetPassword()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error('Invalid or missing token.')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    resetPassword.mutate(
      { token, password },
      {
        onSuccess: () => toast.success('Password reset successful!'),
        onError: () => toast.error('Failed to reset password.'),
      }
    )
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-xl mx-auto mt-16 p-6 bg-white rounded shadow ">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        <Button type="submit" disabled={resetPassword.isPending} className="w-full">
          {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </div>
    </div>
  )
}
