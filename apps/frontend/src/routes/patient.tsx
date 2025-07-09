import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { User } from 'lucide-react'

import calendar from '@/assets/images/calendar.png'
import cross from '@/assets/images/cross.png'
import logo from '@/assets/images/logo.svg'
import logoutIcon from '@/assets/images/logout.png'
import notification from '@/assets/images/notification.png'
import stethoscope from '@/assets/images/stethoscope.png'
import { isAuthMiddleware, useLogout } from '@/services/providers/auth.provider'

export const Route = createFileRoute('/patient')({
  component: PatientLayout,
  beforeLoad: async ({ context }) => {
    const { isAuth, isAuthorized, profile } = await isAuthMiddleware(
      context.queryClient,
      'patient',
    )

    if (!isAuth) return redirect({ to: `/` })

    // If authenticated but wrong role, redirect to correct dashboard
    if (!isAuthorized) {
      if (profile === 'DONOR') return redirect({ to: '/donor' })
      if (profile === 'CENTER') return redirect({ to: '/center' })
    }

    return null
  },
})

function PatientLayout() {
  const { mutate: logout } = useLogout()

  const navLinks = [
    { to: '/patient', label: 'Dashboard', icon: cross },
    { to: '/patient/book', label: 'Book Screening', icon: stethoscope },
    { to: '/patient/appointments', label: 'Appointments', icon: calendar },
    {
      to: '/patient/notifications',
      label: 'Notifications',
      icon: notification,
    },
  ]

  return (
    <div className="min-h-screen w-full">
      {/* Fixed Sidebar for Desktop */}
      <div className="fixed inset-y-0 left-0 z-50 w-60 xl:w-72 hidden md:block bg-primary">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center px-4 lg:h-[80px] lg:px-6">
            <Link
              to="/patient"
              className="flex items-center gap-2 font-semibold"
            >
              <img src={logo} alt="ZeroCancer" className="h-12" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col justify-between">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-4 rounded-lg px-3 py-3 text-white transition-all hover:bg-white/20"
                  activeOptions={
                    link.to === '/patient' ? { exact: true } : { exact: false }
                  }
                  activeProps={{ className: 'bg-white/30 font-semibold' }}
                >
                  <img src={link.icon} alt={link.label} className="h-6 w-6" />
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="p-2 lg:p-4 mt-auto">
              <Link
                to="/patient/profile"
                className="flex items-center gap-4 rounded-lg px-3 py-3 text-white transition-all hover:bg-white/20"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-white/30 font-semibold' }}
              >
                <User className="h-6 w-6" />
                Profile
              </Link>
              <button
                onClick={() => {
                  logout()
                }}
                className="cursor-pointer flex w-full items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium text-white transition-all hover:bg-white/20"
              >
                <img src={logoutIcon} alt="logout" className="h-6 w-6" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:ml-60 xl:ml-72 pb-20 md:pb-0">
        <main className="flex flex-col gap-4 lg:gap-6 min-h-screen bg-neutral-50">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t z-50 shadow-t-md">
        <nav className="flex justify-around items-center h-16">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center justify-center text-xs w-full h-full"
              activeOptions={
                link.to === '/patient' ? { exact: true } : { exact: false }
              }
              activeProps={{ className: 'text-primary' }}
              preload="render"
            >
              <img src={link.icon} alt={link.label} className="h-6 w-6" />
              <span>{link.label.split(' ')[0]}</span>
            </Link>
          ))}
          <Link
            to="/patient/profile"
            className="flex flex-col items-center justify-center text-xs w-full h-full"
            activeOptions={{ exact: true }}
            activeProps={{ className: 'text-primary' }}
          >
            <User className="h-6 w-6" />
            <span>Profile</span>
          </Link>
        </nav>
      </div>
    </div>
  )
}
