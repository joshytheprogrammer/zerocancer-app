import signupImage from '@/assets/images/signup.png'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
} from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const { isAuth } = await isAuthMiddleware(context.queryClient)

    if (isAuth) return redirect({ to: `/` })

    return null
  },
})

function RouteComponent() {
  const { pathname } = useLocation()
  const onSignupPages = pathname.includes('sign-up')

  return (
    <div className="flex h-screen p-2">
      {/* Desktop Image - Hidden on mobile */}
      <div className="hidden md:block md:w-1/2 lg:w-2/5">
        <img
          src={signupImage}
          alt="signup"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>

      {/* Form Section - Full width on mobile, half width on desktop */}
      <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 text-sm p-4 lg:p-8">
          <div className="flex">
            <span className="inline-block ml-auto">
              {onSignupPages
                ? 'Already have an account?'
                : "Don't have an account?"}{' '}
              <Link
                to={onSignupPages ? '/login' : '/sign-up'}
                className="text-primary font-semibold"
              >
                {onSignupPages ? 'Login' : 'Sign Up'}
              </Link>
            </span>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
