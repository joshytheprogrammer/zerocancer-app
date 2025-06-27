import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  Calendar,
  Info,
  CreditCard,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/donor/campaigns/create')({
  component: CreateCampaign,
})

// Form validation schema
const createCampaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  targetScreening: z.string().min(1, 'Please select a screening type'),
  amount: z.number().min(100, 'Minimum donation amount is $100'),
  purpose: z.string().min(10, 'Please describe the purpose of this campaign'),
  targetDemographic: z.string().optional(),
  expiryMonths: z.number().min(1).max(12, 'Campaign duration must be between 1-12 months'),
})

type CreateCampaignForm = z.infer<typeof createCampaignSchema>

// Mock screening types
const screeningTypes = [
  { id: 'cervical', name: 'Cervical Cancer Screening' },
  { id: 'prostate', name: 'Prostate Cancer Screening' },
  { id: 'breast', name: 'Breast Cancer Screening (Mammography)' },
  { id: 'colonoscopy', name: 'Colorectal Cancer Screening' },
  { id: 'lung', name: 'Lung Cancer Screening' },
  { id: 'skin', name: 'Skin Cancer Screening' },
  { id: 'all', name: 'All Screening Types (General Fund)' },
]

function CreateCampaign() {
  const navigate = useNavigate()
  
  const form = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      description: '',
      targetScreening: '',
      amount: 500,
      purpose: '',
      targetDemographic: '',
      expiryMonths: 6,
    },
  })

  const onSubmit = async (data: CreateCampaignForm) => {
    try {
      console.log('Creating campaign:', data)
      
      // Mock payment integration - in real implementation, this would redirect to Paystack
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate processing
      
      toast.success('Campaign created successfully! Redirecting to payment...')
      
      // In real implementation, redirect to Paystack here
      setTimeout(() => {
        navigate({ to: '/donor/campaigns' })
      }, 2000)
      
    } catch (error) {
      console.error('Create campaign error:', error)
      toast.error('Failed to create campaign. Please try again.')
    }
  }

  const watchedAmount = form.watch('amount')
  const estimatedPatients = Math.floor(watchedAmount / 50) // Assuming $50 per screening

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate({ to: '/donor/campaigns' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Campaign</h1>
          <p className="text-muted-foreground">
            Set up a donation campaign to help patients access screening services.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Provide information about your donation campaign and its goals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Cervical Cancer Awareness Drive"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a clear, descriptive name for your campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the purpose and goals of your campaign..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Explain what your campaign aims to achieve and who it will help.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetScreening"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Screening Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select screening type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {screeningTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the type of screening your campaign will fund.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Donation Amount ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="100"
                              step="50"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum $100. Estimated to help {estimatedPatients} patients.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Duration (Months)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              max="12"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            How long should this campaign run? (1-12 months)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Purpose</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Explain the specific purpose and impact goals..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Detail the specific objectives and expected outcomes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetDemographic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Demographic (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Women aged 25-65, Rural communities"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Specify if this campaign targets a particular group.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate({ to: '/donor/campaigns' })}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Create Campaign & Pay
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Campaign Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Donation Amount:</span>
                <span className="font-semibold">${watchedAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Est. Patients Helped:</span>
                <span className="font-semibold">{estimatedPatients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Campaign Duration:</span>
                <span className="font-semibold">{form.watch('expiryMonths')} months</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Total Impact:</span>
                <span className="font-bold text-green-600">{estimatedPatients} lives</span>
              </div>
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle>How Campaigns Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Create & Fund</p>
                  <p className="text-xs text-muted-foreground">Set up your campaign and make the donation payment.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-green-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Patient Matching</p>
                  <p className="text-xs text-muted-foreground">Patients are automatically matched based on screening type.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-purple-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Track Impact</p>
                  <p className="text-xs text-muted-foreground">Monitor your campaign's progress and patient outcomes.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Secure Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Payments are processed securely through Paystack. You'll receive a receipt 
                and can track your donation's impact in real-time.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 