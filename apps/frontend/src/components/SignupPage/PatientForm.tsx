import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PasswordInput from "@/components/ui/password-input"
import PhoneInputComponent from "@/components/ui/phone-input"
import statesData from "@/constants/states.json"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  phoneNumber: z.string().min(1, {
    message: "Please enter your phone number.",
  }),
  state: z.string().min(1, {
    message: "Please select a state.",
  }),
  localGovernment: z.string().min(1, {
    message: "Please select a local government.",
  }),
})

type FormData = z.infer<typeof formSchema>

export default function PatientForm() {
  const [selectedState, setSelectedState] = useState<string>("")
  const [localGovernments, setLocalGovernments] = useState<Array<{ name: string; id: number }>>([])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phoneNumber: "",
      state: "",
      localGovernment: "",
    },
  })

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName)
    form.setValue("state", stateName)
    form.setValue("localGovernment", "") // Reset local government when state changes
    
    // Find the selected state and get its local governments
    const selectedStateData = statesData.find(item => item.state.name === stateName)
    if (selectedStateData) {
      setLocalGovernments(selectedStateData.state.locals)
    } else {
      setLocalGovernments([])
    }
  }

  function onSubmit(values: FormData) {
    console.log("Patient form submitted:", values)
    // Handle form submission here
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Ngozi Janet" {...field} />
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
                <Input type="email" placeholder="ngozijanet@gmail.com" {...field} />
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
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <PhoneInputComponent />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select onValueChange={handleStateChange} value={selectedState}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statesData.map((item) => (
                      <SelectItem key={item.state.id} value={item.state.name}>
                        {item.state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="localGovernment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local Government</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedState ? "Select a local government" : "Select a state first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {localGovernments.map((local) => (
                      <SelectItem key={local.id} value={local.name}>
                        {local.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full py-6 text-lg">Create Account</Button>
      </form>
    </Form>
  )
}