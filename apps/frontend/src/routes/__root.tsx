import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import TanStackQueryLayout from '../integrations/tanstack-query/layout.tsx'

import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        name: 'Zero Cancer',
        content: 'Reaching out to save lives one donation at a time',
      },
      {
        title: 'Zero Cancer',
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
    // scripts: [
    //   {
    //     src: 'https://www.google-analytics.com/analytics.js',
    //   },
    // ],
  }),
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg">The page you are looking for does not exist.</p>
    </div>
  ),
  component: () => (
    <>
      <HeadContent />
      {/* <Header /> */}

      <Outlet />
      <Toaster richColors/>
      <TanStackRouterDevtools />

      <TanStackQueryLayout />
    </>
  ),
})
