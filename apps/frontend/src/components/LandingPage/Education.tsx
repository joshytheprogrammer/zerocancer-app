import { PlayIcon } from 'lucide-react'

export default function Education() {
  return (
    <div className="wrapper py-20 flex flex-col lg:flex-row items-center gap-8">
      <div className="lg:w-1/2">
        <h2 className="text-5xl font-bold">Your Cancer Education Toolkit</h2>
        <p className="text-muted-foreground mt-4">
          Short, helpful videos to guide you through understanding, testing, and
          taking control of your health.
        </p>
        <h3 className="text-xl font-bold mt-8">Videos</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="bg-gray-200 w-24 h-16 rounded-lg"></div>
            <div>
              <h4 className="font-bold">Cervical Cancer Awareness</h4>
              <p className="text-muted-foreground text-sm">
                Understand the risks, symptoms, and importance of early
                detection.
              </p>
            </div>
            <button className="ml-auto bg-secondary text-white p-2 rounded-full flex items-center justify-center">
              <PlayIcon />
            </button>
          </div>
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="bg-gray-200 w-24 h-16 rounded-lg"></div>
            <div>
              <h4 className="font-bold">How to Collect Self Samples</h4>
              <p className="text-muted-foreground text-sm">
                Follow these easy steps to collect your sample correctly.
              </p>
            </div>
            <button className="ml-auto bg-secondary text-white p-2 rounded-full flex items-center justify-center">
              <PlayIcon />
            </button>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p>Video PlayIconer Placeholder</p>
      </div>
    </div>
  )
}
