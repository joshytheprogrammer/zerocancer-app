import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Profile Page</h1>
      <p>This page is under construction.</p>
    </div>
  )
} 