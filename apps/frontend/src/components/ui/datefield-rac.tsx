import { DateInput as DateInputPrimitive } from "react-aria-components"
import { Input } from "./input"

export function DateInput(props: React.ComponentProps<typeof DateInputPrimitive>) {
  return <DateInputPrimitive {...props} />
} 