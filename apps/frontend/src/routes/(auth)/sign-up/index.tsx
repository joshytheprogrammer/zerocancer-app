import { createFileRoute } from '@tanstack/react-router'
import SignUpFlow from '@/components/SignupPage/SignUpFlow'

export const Route = createFileRoute('/(auth)/sign-up/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignUpFlow />
}
