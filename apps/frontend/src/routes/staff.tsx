import { Outlet, createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  Home,
  Briefcase,
  FileText,
  Upload,
  ClipboardCheck,
  LogOut,
  Users
} from 'lucide-react'

import logo from '@/assets/images/logo-blue.svg'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { useLogout } from '@/services/providers/auth.provider'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/staff')({
  component: StaffLayout,
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(
      context.queryClient,
    )

    if (!isAuth) return redirect({ to: `/` })

    // Check if user is CENTER_STAFF specifically
    const isStaff = (profile as string) === 'CENTER_STAFF'
    
    // If authenticated but wrong role, redirect to correct dashboard
    if (!isStaff) {
      if (profile === 'PATIENT') return redirect({ to: '/patient' })
      if (profile === 'DONOR') return redirect({ to: '/donor' })
      if (profile === 'CENTER') return redirect({ to: '/center' })
      if (profile === 'ADMIN') return redirect({ to: '/admin' })
      
      // If unknown profile, redirect to home
      return redirect({ to: '/' })
    }

    return null
  },
})

function StaffLayout() {
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen w-full">
      {/* Fixed Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-60 lg:w-72 hidden md:block border-r bg-muted/40">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[70px] lg:px-6">
            <Link to="/staff" className="flex items-center gap-2 font-semibold">
              <img src={logo} alt="ZeroCancer" className="h-12" />
              <span className="text-sm text-muted-foreground ml-2">Staff Portal</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-2">
              <Link
                to="/staff"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/staff/appointments"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Briefcase className="h-4 w-4" />
                Appointments
              </Link>
              <Link
                to="/staff/verify-code"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <ClipboardCheck className="h-4 w-4" />
                Verify Check-in
              </Link>
              <Link
                to="/staff/upload-results"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Upload className="h-4 w-4" />
                Upload Results
              </Link>
              <Link
                to="/staff/results-history"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <FileText className="h-4 w-4" />
                Results History
              </Link>
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