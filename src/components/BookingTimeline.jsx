import { STATUS_STEPS } from '../services/bookings'

export default function BookingTimeline({ status }) {
  if (status === 'cancelled') {
    return <p className="text-sm font-medium text-ruby">Cancelled</p>
  }

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx
        return (
          <div key={step.key} className="flex flex-1 items-center gap-1" title={step.label}>
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                done ? 'bg-gold' : 'bg-black/5'
              }`}
            />
            {i === STATUS_STEPS.length - 1 ? null : <span className="sr-only">→</span>}
          </div>
        )
      })}
      <span className="ml-2 shrink-0 text-xs font-medium text-midnight/70">
        {STATUS_STEPS[currentIdx]?.label || status}
      </span>
    </div>
  )
}
