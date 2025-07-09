import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { Menu, User } from 'lucide-react'

import calendar from '@/assets/images/calendar.png'
import cross from '@/assets/images/cross.png'
import logo from '@/assets/images/logo.svg'
import logoutIcon from '@/assets/images/logout.png'
import notification from '@/assets/images/notification.png'
import stethoscope from '@/assets/images/stethoscope.png'
import { Button } from '@/components/ui/button'
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

      {/* Mobile Topbar */}

      <div className="flex flex-col md:ml-60 xl:ml-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-primary px-4 py-6 shadow-md md:hidden">
          <Link to="/patient" className="flex items-center gap-2 font-semibold">
            <img src={logo} alt="ZeroCancer" className="h-12" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => logout()}
              className="cursor-pointer rounded-full p-2 text-white transition-all hover:bg-white/20"
              aria-label="Logout"
            >
              <img src={logoutIcon} alt="logout" className="h-6 w-6" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <Menu className="size-8" />
            </Button>
          </div>
        </header>

        <main className="flex-grow bg-neutral-50 p-4 pb-24 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>


      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-2 inset-x-2 md:hidden bg-white z-50 shadow-lg rounded-xl">
        <nav className="flex justify-around items-center h-16 px-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex-1"
              activeOptions={
                link.to === '/patient' ? { exact: true } : { exact: false }
              }
              preload="render"
            >
              {({ isActive }) => (
                <div
                  className={`flex h-16 w-full flex-col items-center justify-center rounded-lg p-1 transition-colors duration-200 ${
                    isActive ? 'bg-primary' : 'bg-transparent'
                  }`}
                >
                  <img src={link.icon} alt={link.label} className="h-6 w-6" />
                  <span
                    className={`mt-2 text-xs ${
                      isActive
                        ? 'font-semibold text-white'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {link.label.split(' ')[0]}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
