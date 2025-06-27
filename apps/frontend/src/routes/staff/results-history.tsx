import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/staff/results-history')({
  component: StaffResultsHistory,
})

function StaffResultsHistory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Results History</h1>
        <p className="text-muted-foreground">
          View and manage previously uploaded results
        </p>
      </div>
      
      <div className="text-center py-8">
        <p className="text-muted-foreground">Results history feature coming soon...</p>
      </div>
    </div>
  )
} 