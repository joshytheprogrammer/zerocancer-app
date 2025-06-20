export default function Stats() {
  return (
    <div className="wrapper grid grid-cols-1 lg:grid-cols-3 gap-8 py-20 bg-neutral-100">
      <div className="px-6 py-8 bg-white rounded-xl border-l-secondary border-l-4 space-y-3">
        <h2 className="text-5xl font-bold ">7,532</h2>
        <p className="text-neutral-500 text-sm">People Screened</p>
      </div>
      <div className="px-6  py-8 bg-white rounded-xl border-l-secondary border-l-4 space-y-3">
        <h2 className="text-5xl font-bold ">1020</h2>
        <p className="text-neutral-500 text-sm">
          Sponsored Screenings this month
        </p>
      </div>
      <div className="px-6  py-8 bg-white rounded-xl border-l-secondary border-l-4 space-y-3">
        <h2 className="text-5xl font-bold ">18</h2>
        <p className="text-neutral-500 text-sm">Partner NGO </p>
      </div>
    </div>
  )
}
