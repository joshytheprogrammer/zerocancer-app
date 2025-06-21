import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/results')({
  component: PatientResults,
})

function PatientResults() {
  return (
    <div>
      <h1 className="text-2xl font-bold">My Results</h1>
      <p>Here you can view your screening results.</p>
    </div>
  )
} 