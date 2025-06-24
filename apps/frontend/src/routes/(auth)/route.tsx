import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/(auth)')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const isAuth = await isAuthMiddleware(context.queryClient)

    if (isAuth) {
      // doesn't work
      toast.error('You are already authenticated.', {
        duration: 10000,
        // position: 'top-center',
      })
      return redirect({ to: `/` })
      // Redirect to home if already authenticated
    }

    return null
  },
})

function RouteComponent() {
  return <Outlet />
}
