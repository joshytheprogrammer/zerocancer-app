import UserTypeSelection from '@/components/SignupPage/UserTypeSelection'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/sign-up/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <UserTypeSelection />
}
