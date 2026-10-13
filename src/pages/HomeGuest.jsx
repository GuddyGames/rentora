import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { EVENT_TYPES } from '../utils/eventChecklist'
import { EVENT_ICONS } from '../components/iconMap'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// A PS5-menu-style reactive backdrop: soft glowing orbs that drift toward
// wherever the pointer is, with a gentle spring-like lag. Falls back to a
// slow ambient drift on touch devices (no pointer to react to) and is
// disabled entirely under prefers-reduced-motion.
function ReactiveGlow() {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 50, y: 40 })

  function handlePointerMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPos({ x, y })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handlePointerMove}
      className="absolute inset-0 overflow-hidden motion-reduce:hidden"
      aria-hidden="true"
    >
      <div
        className="absolute h-[38vw] w-[38vw] rounded-full bg-gold/30 blur-3xl transition-transform duration-[1200ms] ease-out"
        style={{ transform: `translate(${pos.x * 0.7}%, ${pos.y * 0.5}%)`, left: '-15%', top: '-15%' }}
      />
      <div
        className="absolute h-[30vw] w-[30vw] rounded-full bg-royal/40 blur-3xl transition-transform duration-[1600ms] ease-out"
        style={{ transform: `translate(${(100 - pos.x) * 0.5}%, ${(100 - pos.y) * 0.6}%)`, right: '-10%', bottom: '-10%' }}
      />
    </div>
  )
}

export default function HomeGuest() {
  return (
    <div>
      <section className="relative overflow-hidden bg-hero px-5 pb-16 pt-16 md:pt-24">
        <ReactiveGlow />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-display text-xl text-mist/80 md:text-2xl">{greeting()} 👋</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.1] text-mist md:text-6xl">
            Everything for your <span className="text-gold">event</span>, in one place.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-mist/70">
            Canopies, chairs, sound systems, lighting and more — rented from real people near you.
            Browse equipment first, then create a free account when you’re ready to book or plan your event.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-gold px-8 py-3.5 font-semibold text-midnight shadow-lg shadow-gold/20 transition-transform hover:-translate-y-0.5 hover:brightness-110"
            >
              Create free account
            </Link>
            <Link
              to="/browse"
              className="rounded-full border border-white/25 px-8 py-3.5 font-medium text-mist transition-colors hover:border-gold hover:text-gold"
            >
              Browse equipment
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-8 py-3.5 font-medium text-mist/80 transition-colors hover:border-white/40 hover:text-white"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-gold">What people plan here</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {EVENT_TYPES.map((t) => {
            const Icon = EVENT_ICONS[t.id]
            return (
              <Link
                key={t.id}
                to="/signup"
                className="glass group flex flex-col items-center gap-2 rounded-2xl px-4 py-6 text-center transition-transform duration-200 hover:-translate-y-1 hover:border-gold/40"
              >
                {Icon && <Icon className="h-7 w-7 text-midnight/70 transition-transform duration-200 group-hover:scale-110 group-hover:text-gold" />}
                <span className="text-sm font-medium text-midnight/90">{t.label}</span>
              </Link>
            )
          })}
        </div>
        <p className="mt-4 text-center text-xs text-midnight/40">Sign up to plan one of these — it takes about a minute.</p>

        <div className="mt-10 flex justify-center">
          <Link
            to="/signup"
            className="rounded-full border border-black/15 px-6 py-3 font-medium text-midnight transition-colors hover:border-gold hover:text-gold"
          >
            List your own equipment instead →
          </Link>
        </div>
      </section>
    </div>
  )
}
