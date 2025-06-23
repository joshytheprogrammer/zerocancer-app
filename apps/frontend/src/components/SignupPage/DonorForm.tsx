import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PasswordInput from "@/components/ui/password-input"
import PhoneInputComponent from "@/components/ui/phone-input"
import * as RPNInput from "react-phone-number-input"
import { donorSchema } from '@zerocancer/shared/schemas/register'
import { useDonorRegistration } from '@/services/providers/register'
import { toast } from 'sonner'



type FormData = z.infer<typeof donorSchema>

type DonorFormProps = {
  onSubmitSuccess: (data: FormData) => void
}

export default function DonorForm({ onSubmitSuccess }: DonorFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      organization: '',
    },
  })

  const mutation = useDonorRegistration()

  function onSubmit(values: FormData) {
    mutation.mutate(values, {
      onSuccess: (data) => {
        onSubmitSuccess(values)
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.error || 'Registration failed. Please try again.',
          {
            description: error.response?.data?.error || 'An error occurred.',
          },
        )
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
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
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <PhoneInputComponent
                  value={field.value as RPNInput.Value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Your Company LLC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Account
        </Button>
      </form>
    </Form>
  )
}