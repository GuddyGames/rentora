import { Link } from 'react-router-dom'
import { EVENT_TYPES } from '../utils/eventChecklist'
import { EVENT_ICONS } from '../components/iconMap'
import { SparkleIcon } from '../components/icons'

function ArrowRightIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
}

function CheckIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m5 12 4 4L19 6" /></svg>
}

const benefits = [
  { number: '01', title: 'Find what you need', body: 'Explore event essentials from equipment owners in your area.' },
  { number: '02', title: 'Plan with confidence', body: 'Build a practical checklist around your event and guest count.' },
  { number: '03', title: 'Bring it all together', body: 'Keep your rentals and booking details in one place.' },
]

export default function HomeGuest() {
  return (
    <main className="overflow-hidden">
      <section className="relative isolate overflow-hidden bg-hero text-mist">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -right-20 top-16 h-96 w-96 rounded-full bg-royal/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-72 rounded-full bg-emerald/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:pb-24 lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
              <span className="h-2 w-2 rounded-full bg-emerald" />
              The event rental marketplace
            </div>
            <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
              Great events start with the <span className="text-gold">right setup.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              Rent canopies, chairs, sound, lighting and more from equipment owners. Less running around. More time to make the day memorable.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-semibold text-midnight shadow-lg shadow-gold/20 transition hover:-translate-y-0.5 hover:brightness-105">
                Find event essentials
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-6 py-3.5 font-medium text-white transition hover:border-white/40 hover:bg-white/[0.08]">
                List your equipment
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/55">
              <span className="inline-flex items-center gap-2"><CheckIcon className="h-4 w-4 text-emerald" /> Browse event essentials</span>
              <span className="inline-flex items-center gap-2"><CheckIcon className="h-4 w-4 text-emerald" /> Plan around your guest list</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-gold/20 via-royal/10 to-emerald/10 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.07] p-4 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between px-1 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Your next big day</p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">Start with a plan</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                  <SparkleIcon className="h-5 w-5" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EVENT_TYPES.slice(0, 4).map((event, index) => {
                  const Icon = EVENT_ICONS[event.id]
                  return (
                    <Link
                      key={event.id}
                      to="/signup"
                      className={`group rounded-2xl border p-4 transition hover:-translate-y-1 hover:border-gold/50 ${index === 0 ? 'border-gold/35 bg-gold/[0.11]' : 'border-white/10 bg-black/10 hover:bg-white/[0.07]'}`}
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${index === 0 ? 'bg-gold text-midnight' : 'bg-white/10 text-white'}`}>
                        {Icon && <Icon className="h-6 w-6" />}
                      </span>
                      <span className="mt-4 block font-semibold text-white">{event.label}</span>
                      <span className="mt-1 block text-xs text-white/45">Plan your setup <span aria-hidden="true">↗</span></span>
                    </Link>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="flex -space-x-2" aria-hidden="true">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-midnight bg-royal text-xs">⌂</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-midnight bg-emerald text-xs">✓</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-midnight bg-gold text-xs">✦</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">One place to get organised</p>
                  <p className="mt-0.5 text-xs text-white/45">Equipment, dates and bookings together</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-3 top-10 hidden rounded-2xl border border-white/15 bg-midnight/90 px-4 py-3 shadow-xl sm:block">
              <p className="text-xs text-white/50">The Rentora way</p>
              <p className="mt-1 text-sm font-semibold text-gold">Plan smarter. Celebrate more.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Made for your kind of event</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-midnight sm:text-4xl">What are we celebrating?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-midnight/60 sm:text-base">From an intimate birthday to a full-scale wedding, start with the occasion and build your checklist from there.</p>
          </div>
          <Link to="/signup" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-royal transition hover:gap-3">
            Explore all events <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {EVENT_TYPES.map((event, index) => {
            const Icon = EVENT_ICONS[event.id]
            return (
              <Link key={event.id} to="/signup" className="group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg sm:p-5">
                <span className={`absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl ${index % 2 ? 'bg-royal/10' : 'bg-gold/15'}`} />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-mist text-midnight transition group-hover:bg-gold/15 group-hover:text-gold">
                  {Icon && <Icon className="h-6 w-6" />}
                </span>
                <span className="relative mt-4 block font-display text-base font-semibold text-midnight sm:text-lg">{event.label}</span>
                <span className="relative mt-1 block text-xs text-midnight/45">Build your checklist <span aria-hidden="true">→</span></span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="border-y border-black/[0.05] bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-20 md:grid-cols-[.8fr_1.2fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">A better way to organise</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-midnight sm:text-4xl">Spend less time chasing rentals.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-midnight/60 sm:text-base">Keep the moving parts of your event organised, from the first checklist to the booking details.</p>
            <Link to="/signup" className="mt-6 inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-3 text-sm font-semibold text-white transition hover:bg-royal">
              Get started for free <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {benefits.map((item) => (
              <div key={item.number} className="flex gap-4 rounded-2xl border border-black/[0.06] bg-mist/70 p-5 sm:gap-5 sm:p-6">
                <span className="font-mono text-sm text-gold">{item.number}</span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-midnight">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-midnight/60">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-[2rem] bg-gradient-to-r from-midnight to-[#172b50] p-7 text-white sm:p-10 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Have equipment to rent out?</p>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Turn your equipment into opportunity.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">List your items and connect with people planning their next event.</p>
          </div>
          <Link to="/signup?mode=owner" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-6 py-3.5 font-semibold text-midnight transition hover:-translate-y-0.5 hover:brightness-105">
            Become a rental partner <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
