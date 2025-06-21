import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/upload-results')({
  component: CenterUploadResults,
})

function CenterUploadResults() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Upload Results</h1>
      <p>Here you can upload screening results for patients.</p>
    </div>
  )
} 