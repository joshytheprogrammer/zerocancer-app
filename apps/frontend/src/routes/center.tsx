import { Outlet, createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  Home,
  Briefcase,
  FileText,
  Users,
  Upload,
  ClipboardCheck,
} from 'lucide-react'

import logo from '@/assets/images/logo-blue.svg'
import { isAuthMiddleware } from '@/services/providers/auth.provider'

export const Route = createFileRoute('/center')({
  component: CenterLayout,
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(
      context.queryClient,
      'center',
    )

    if (!isAuth) return redirect({ to: `/` })

    if (profile === 'PATIENT') return redirect({ to: '/patient' })

    if (profile === 'DONOR') return redirect({ to: '/donor' })

    return null
  },
})

function CenterLayout() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[70px] lg:px-6">
            <Link to="/center" className="flex items-center gap-2 font-semibold">
              <img src={logo} alt="ZeroCancer" className="h-12" />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                to="/center"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/center/appointments"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Briefcase className="h-4 w-4" />
                Appointments
              </Link>
              <Link
                to="/center/verify-code"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <ClipboardCheck className="h-4 w-4" />
                Verify Code
              </Link>
              <Link
                to="/center/upload-results"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Upload className="h-4 w-4" />
                Upload Results
              </Link>
              <Link
                to="/center/results-history"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <FileText className="h-4 w-4" />
                Results History
              </Link>
              <Link
                to="/center/receipt-history"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <FileText className="h-4 w-4" />
                Payouts
              </Link>
              <Link
                to="/center/staff"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Users className="h-4 w-4" />
                Staff
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