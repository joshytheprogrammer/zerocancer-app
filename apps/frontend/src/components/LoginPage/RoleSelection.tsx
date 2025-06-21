import { useId } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ControllerRenderProps } from "react-hook-form"
import { cn } from "@/lib/utils"

interface RoleSelectionProps {
  field: ControllerRenderProps<any, "role">
}

export default function RoleSelection({ field }: RoleSelectionProps) {
  const id = useId()
  const roles = [
    {
      value: "patient",
      label: "Patient",
      description: "Book, waitlist, and view your results.",
    },
    {
      value: "donor",
      label: "Donor",
      description: "Create and view donation campaigns.",
    },
    {
      value: "center",
      label: "Center / Health Worker",
      description: "Manage dashboard, staff, and results.",
    },
  ]

  return (
    <RadioGroup
      className="flex flex-col lg:flex-row gap-4"
      defaultValue={field.value}
      onValueChange={field.onChange}
      {...field}
    >
      {roles.map((role) => (
        <div
          key={role.value}
          className={cn(
            "border-input has-data-[state=checked]:border-primary relative flex w-full items-start gap-2 rounded-md border p-4 shadow-sm transition",
          )}
        >
          <RadioGroupItem
            value={role.value}
            id={`${id}-${role.value}`}
            aria-describedby={`${id}-${role.value}-description`}
            className="order-1 mt-0.5 after:absolute after:inset-0"
          />
          <div className="grid grow gap-1.5">
            <Label htmlFor={`${id}-${role.value}`} className="font-semibold">
              {role.label}
            </Label>
            <p
              id={`${id}-${role.value}-description`}
              className="text-muted-foreground text-sm"
            >
              {role.description}
            </p>
          </div>
        </div>
      ))}
    </RadioGroup>
  )
} 