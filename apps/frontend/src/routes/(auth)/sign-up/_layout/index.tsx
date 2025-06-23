import { createFileRoute } from '@tanstack/react-router'
import SignUpFlow from '@/components/SignupPage/SignUpFlow'

export const Route = createFileRoute('/(auth)/sign-up/_layout/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignUpFlow />
}
