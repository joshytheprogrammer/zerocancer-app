import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/sign-up/app')({
  component: AppLayoutComponent,
})

function AppLayoutComponent() {
  return (
    <div>
      <h1>App Layout</h1>
      <Outlet />
    </div>
  )
}