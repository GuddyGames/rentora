import { useEffect } from 'react'
import ConfettiBurst from './ConfettiBurst'

export default function PaymentSuccessOverlay({ onDone, duration = 1800 }) {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate(40)
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [onDone, duration])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-mist">
      <ConfettiBurst />
      <div className="animate-pop-in flex h-20 w-20 items-center justify-center rounded-full bg-gold">
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-midnight" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="mt-6 font-display text-xl font-semibold text-midnight">Your booking is confirmed.</p>
    </div>
  )
}
