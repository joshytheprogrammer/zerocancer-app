import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateCampaign } from '@/services/providers/donor.provider'
import { useScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { createCampaignSchema } from '@zerocancer/shared/schemas/donation.schema'
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
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  Calendar,
  Info,
  Heart
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/donor/campaigns/create')({
  component: CreateCampaign,
})

type CreateCampaignForm = z.infer<typeof createCampaignSchema>

function CreateCampaign() {
  const navigate = useNavigate()
  const createCampaignMutation = useCreateCampaign()
  
  // Fetch screening types
  const { data: screeningTypesData } = useQuery(useScreeningTypes({}))
  const screeningTypes = screeningTypesData?.data || []
  
  const form = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema) as any,
    defaultValues: {
      title: 'Cancer Screening For People In IDP Camps',
      description: 'This campaign is to help people in IDP camps get cancer screening',
      targetAmount: 10000,
      maxPerPatient: 2500,
      initialFunding: 10000,
      expiryMonths: 6,
      screeningTypeIds: [],
      targetGender: 'ALL',
    },
  })

  const onSubmit = async (data: CreateCampaignForm) => {
    try {
      // Ensure all numeric fields are actually numbers
      const submitData = {
        ...data,
        targetAmount: Number(data.targetAmount) || 0,
        maxPerPatient: Number(data.maxPerPatient) || 0,
        initialFunding: Number(data.initialFunding) || 0,
        expiryMonths: Number(data.expiryMonths) || 1,
      }
      
      const result = await createCampaignMutation.mutateAsync(submitData)
      
      if (result.data.payment?.authorizationUrl) {
        toast.success('Campaign created! Redirecting to payment...')
        window.location.href = result.data.payment.authorizationUrl
      } else {
        toast.success('Campaign created successfully!')
        navigate({ to: '/donor/campaigns' })
      }
    } catch (error: any) {
      console.error('Create campaign error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      // Handle different error cases
      if (error.response?.status === 401) {
        toast.error('Please log in as a donor to create campaigns.')
        navigate({ to: '/login' })
        return
      }
      
      if (error.response?.status === 403) {
        toast.error('You do not have permission to create campaigns. Please ensure you are logged in as a donor.')
        return
      }
      
      if (error.response?.status === 500) {
        toast.error('Server error occurred. Please check that all screening types are valid and try again.')
        return
      }
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create campaign. Please try again.'
      toast.error(errorMessage)
    }
  }

  const watchedTargetAmount = form.watch('targetAmount') || 0
  const watchedMaxPerPatient = form.watch('maxPerPatient') || 1
  const estimatedPatients = watchedMaxPerPatient > 0 ? Math.floor(watchedTargetAmount / watchedMaxPerPatient) : 0

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
          <h1 className="text-3xl font-bold">Create New Campaign</h1>
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Cervical Cancer Screening for Rural Women"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a clear, descriptive title for your campaign.
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
                        <FormLabel>Campaign Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the purpose and goals of your campaign..."
                            className="resize-none"
                            rows={4}
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

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="targetAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Amount (₦)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text"
                              placeholder="10000"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, '')
                                field.onChange(value ? Number(value) : '')
                              }}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum ₦1,000
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxPerPatient"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Per Patient (₦)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text"
                              placeholder="2500"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, '')
                                field.onChange(value ? Number(value) : '')
                              }}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Per screening cost
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
                          <FormLabel>Duration (Months)</FormLabel>
                          <FormControl>
                            <Input 
                              type="text"
                              placeholder="6"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, '')
                                field.onChange(value ? Number(value) : '')
                              }}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            1-12 months
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="initialFunding"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Funding Amount (₦)</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            placeholder="10000"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '')
                              field.onChange(value ? Number(value) : '')
                            }}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Amount you want to contribute now. Must not exceed target amount.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="screeningTypeIds"
                    render={() => {
                      const selectedIds = form.watch('screeningTypeIds') || []
                      const allSelected = selectedIds.length === screeningTypes.length && screeningTypes.length > 0
                      const someSelected = selectedIds.length > 0 && selectedIds.length < screeningTypes.length
                      
                      const handleSelectAll = () => {
                        const allIds = screeningTypes.map(type => type.id)
                        form.setValue('screeningTypeIds', allSelected ? [] : allIds)
                      }
                      
                      return (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Screening Types</FormLabel>
                            <FormDescription>
                              Select the types of cancer screening your campaign will fund.
                            </FormDescription>
                          </div>
                          
                          {/* Select All Controls */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border mb-4">
                            <div className="flex items-center space-x-3">
                                                             <Checkbox
                                 checked={allSelected}
                                 onCheckedChange={handleSelectAll}
                               />
                              <span className="font-medium text-sm">
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {selectedIds.length} of {screeningTypes.length} selected
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {screeningTypes.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="screeningTypeIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, item.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== item.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        {item.name}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          
                          {selectedIds.length === 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              💡 Tip: Select "Select All" to fund all available screening types
                            </p>
                          )}
                          
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="targetGender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ALL">All Genders</SelectItem>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the gender focus for your campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate({ to: '/donor/campaigns' })}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createCampaignMutation.isPending}
                      className="flex-1"
                    >
                      {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Campaign Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Target Amount:</span>
                </div>
                <p className="text-lg font-semibold">₦{(watchedTargetAmount || 0).toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Estimated Patients:</span>
                </div>
                <p className="text-lg font-semibold">{estimatedPatients || 0} patients</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Duration:</span>
                </div>
                <p className="text-lg font-semibold">{form.watch('expiryMonths')} months</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="bg-primary/10 rounded-full p-1 text-primary font-semibold min-w-6 h-6 flex items-center justify-center text-xs">1</div>
                <p>Create your campaign with target amount and criteria</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/10 rounded-full p-1 text-primary font-semibold min-w-6 h-6 flex items-center justify-center text-xs">2</div>
                <p>Make initial payment via Paystack</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/10 rounded-full p-1 text-primary font-semibold min-w-6 h-6 flex items-center justify-center text-xs">3</div>
                <p>System matches eligible patients to your campaign</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/10 rounded-full p-1 text-primary font-semibold min-w-6 h-6 flex items-center justify-center text-xs">4</div>
                <p>Patients get free screening, you track the impact</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 