import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/results-history')({
  component: CenterResultsHistory,
})

function CenterResultsHistory() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Results History</h1>
      <p>Here you can view historical results for your center.</p>
    </div>
  )
} 