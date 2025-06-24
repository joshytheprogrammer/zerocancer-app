import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { ACCESS_TOKEN_KEY } from '@/services/keys'

export const Route = createFileRoute('/(auth)')({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    const queryClient = context.queryClient
    const accessToken = queryClient.getQueryData<string>([ACCESS_TOKEN_KEY])
    console.log('accessToken', accessToken)
    if (accessToken) {
      return redirect({ to: `/` })
    }
    return null
  },
})

function RouteComponent() {
  return <Outlet />
}
