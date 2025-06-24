import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { Bell, Briefcase, FileText, Home } from 'lucide-react'

import logo from '@/assets/images/logo-blue.svg'
import { isAuthMiddleware } from '@/services/providers/auth.provider'

export const Route = createFileRoute('/patient')({
  component: PatientLayout,
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(
      context.queryClient,
      'patient',
    )

    if (!isAuth) return redirect({ to: `/` })

    if (profile === 'DONOR') return redirect({ to: '/donor' })

    if (profile === 'CENTER') return redirect({ to: '/center' })

    return null
  },
})

function PatientLayout() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[70px] lg:px-6">
            <Link
              to="/patient"
              className="flex items-center gap-2 font-semibold"
            >
              <img src={logo} alt="ZeroCancer" className="h-12" />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                to="/patient"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/patient/notifications"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Bell className="h-4 w-4" />
                Notifications
              </Link>
              <Link
                to="/patient/appointments"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Briefcase className="h-4 w-4" />
                Appointments
              </Link>
              <Link
                to="/patient/results"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <FileText className="h-4 w-4" />
                Results
              </Link>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
