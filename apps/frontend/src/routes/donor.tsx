import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { Briefcase, FileText, Home, LogOut, Upload } from 'lucide-react'

import logo from '@/assets/images/logo-blue.svg'
import { isAuthMiddleware, useLogout } from '@/services/providers/auth.provider'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/donor')({
  component: DonorLayout,
  beforeLoad: async ({ context }) => {
    const { isAuth, isAuthorized, profile } = await isAuthMiddleware(
      context.queryClient,
      'donor',
    )

    if (!isAuth) return redirect({ to: `/` })

    // If authenticated but wrong role, redirect to correct dashboard
    if (!isAuthorized) {
      if (profile === 'PATIENT') return redirect({ to: '/patient' })
      if (profile === 'CENTER') return redirect({ to: '/center' })
    }

    return null
  },
})

function DonorLayout() {
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen w-full">
      {/* Fixed Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-60 lg:w-72 hidden md:block border-r bg-muted/40">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[70px] lg:px-6">
            <Link to="/donor" className="flex items-center gap-2 font-semibold">
              <img src={logo} alt="ZeroCancer" className="h-12" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-2">
              <Link
                to="/donor"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/donor/campaigns"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
                preload="render"
              >
                <Briefcase className="h-4 w-4" />
                My Campaigns
              </Link>
              {/* Add code below */}
              <div className="border-t p-2 lg:p-4">
                <button
                  onClick={() => {
                    logout()
                    navigate({ to: '/', replace: true, reloadDocument: true })
                  }}
                  className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:ml-60 lg:ml-72">
        <main className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
