import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/staff/upload-results')({
  component: StaffUploadResults,
})

function StaffUploadResults() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Results</h1>
        <p className="text-muted-foreground">
          Upload and manage screening results for patients
        </p>
      </div>
      
      <div className="text-center py-8">
        <p className="text-muted-foreground">Result upload feature coming soon...</p>
      </div>
    </div>
  )
} 