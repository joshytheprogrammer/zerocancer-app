import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import TanStackQueryLayout from '../integrations/tanstack-query/layout.tsx'

import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import request from '@/lib/request.ts'
import { authUser } from '@/services/endpoints.ts'

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
  // loader: async () => {
  //   const a = await request.get(authUser())
  //   console.log('a', a)
  //   return null
  // },
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
