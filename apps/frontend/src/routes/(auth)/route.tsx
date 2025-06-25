import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const { isAuth } = await isAuthMiddleware(context.queryClient)

    if (isAuth) return redirect({ to: `/` })

    return null
  },
})

function RouteComponent() {
  return <Outlet />
}
