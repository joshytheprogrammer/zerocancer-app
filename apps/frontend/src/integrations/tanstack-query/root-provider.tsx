import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupAxiosInterceptors } from '@/lib/request'

const queryClient = new QueryClient()

// Setup axios interceptors with the correct QueryClient
setupAxiosInterceptors(queryClient)

export function getContext() {
  return {
    queryClient,
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
