import SignupPage from '@/components/SignupPage/SignupPage.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/sign-up')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignupPage />
}
