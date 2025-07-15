import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { MultiSelect } from '@/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateCampaign } from '@/services/providers/donor.provider'
import { useScreeningTypes } from '@/services/providers/screeningType.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createCampaignSchema } from '@zerocancer/shared/schemas/donation.schema'
import {
  ArrowLeft,
  CircleDollarSign,
  Heart,
  Info,
  Lightbulb,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/donor/campaigns/create')({
  component: CreateCampaign,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(useScreeningTypes({}))
  },
})

type CreateCampaignForm = z.infer<typeof createCampaignSchema>

function CreateCampaign() {
  const navigate = useNavigate()
  const createCampaignMutation = useCreateCampaign()

  const { data: screeningTypesData } = useQuery(useScreeningTypes({}))
  const screeningTypes = screeningTypesData?.data || []
  const screeningTypeOptions =
    screeningTypes.map((st) => ({
      value: st.id,
      label: st.name,
    })) || []

  const form = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      screeningTypeIds: [],
      fundingAmount: 10000,
      targetGender: 'ALL',
    },
  })

  const onSubmit = async (data: CreateCampaignForm) => {
    try {
      const result = await createCampaignMutation.mutateAsync(data)

      if (result.data.payment?.authorizationUrl) {
        toast.success('Campaign created! Redirecting to payment...')
        window.location.href = result.data.payment.authorizationUrl
      } else {
        toast.success('Campaign created successfully!')
        navigate({ to: '/donor/campaigns' })
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Failed to create campaign.'
      toast.error(errorMessage)
    }
  }

  const fundingAmount = form.watch('fundingAmount') || 0
  const screeningTypeIds = form.watch('screeningTypeIds') || []
  const selectedScreeningTypes = screeningTypes.filter((type) =>
    screeningTypeIds.includes(type.id),
  )

  const sponsoredPeople = Math.floor(fundingAmount / 2500)

  const allScreeningTypesSelected =
    screeningTypeOptions.length > 0 &&
    screeningTypeIds.length === screeningTypeOptions.length

  const handleSelectAllScreeningTypes = () => {
    if (allScreeningTypesSelected) {
      form.setValue('screeningTypeIds', [])
    } else {
      form.setValue(
        'screeningTypeIds',
        screeningTypeOptions.map((o) => o.value),
      )
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 mb-2"
          onClick={() => navigate({ to: '/donor/campaigns' })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-800">
          Create New Campaign
        </h1>
        <p className="text-gray-500 mt-1">
          Set up a donation campaign to help patients access screening services.
        </p>
      </div>

      <div className="border-b border-dashed border-gray-200 -mx-8"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funding & Targeting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fundingAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Funding Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                              type="text"
                              placeholder="10,000"
                              className="pl-10"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, '')
                                field.onChange(value ? Number(value) : '')
                              }}
                              value={
                                field.value
                                  ? field.value.toLocaleString()
                                  : ''
                              }
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                              Sponsors {sponsoredPeople} person
                              {sponsoredPeople !== 1 && 's'}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="screeningTypeIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Screening Types</FormLabel>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id="select-all"
                              checked={allScreeningTypesSelected}
                              onCheckedChange={handleSelectAllScreeningTypes}
                            />
                            <label
                              htmlFor="select-all"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {allScreeningTypesSelected
                                ? 'Deselect All'
                                : 'Select All'}
                            </label>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(field.value || []).length} of {screeningTypeOptions.length}{' '}
                            selected
                          </div>
                        </div>
                        <MultiSelect
                          placeholder="Select screening types..."
                          options={screeningTypeOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          className="w-full"
                        />
                        <FormDescription>
                          Select the types of cancer screening your campaign
                          will fund.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetGender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ALL">All Genders</SelectItem>
                            <SelectItem value="MALE">Male Only</SelectItem>
                            <SelectItem value="FEMALE">Female Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={createCampaignMutation.isPending}
                className="w-full h-12 text-lg bg-pink-500 hover:bg-pink-600"
              >
                {createCampaignMutation.isPending
                  ? 'Creating...'
                  : 'Create & Fund Campaign'}
              </Button>
            </form>
          </Form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-primary text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="text-yellow-400" />
                Campaign Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Funding Amount</p>
                <p className="text-2xl font-bold">
                  ₦{fundingAmount.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Total Sponsored</p>
                <p className="text-2xl font-bold">{sponsoredPeople}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Screening Types</p>
                {selectedScreeningTypes.length > 0 ? (
                  <div className="text-base font-semibold space-y-1">
                    {selectedScreeningTypes.map((type) => (
                      <p key={type.id}>{type.name}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">None selected</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="text-blue-500" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HowItWorksStep
                icon={<ShieldCheck />}
                title="Create & Fund"
                description="Create your campaign and make the initial payment via Paystack."
              />
              <HowItWorksStep
                icon={<Users />}
                title="System Matches Patients"
                description="Our system matches eligible patients to your campaign criteria."
              />
              <HowItWorksStep
                icon={<Heart />}
                title="Track Your Impact"
                description="Patients get free screening, and you get to see the impact you've made."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function HowItWorksStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-blue-500 mt-1">{icon}</div>
      <div>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}
