import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EVENT_TYPES } from '../utils/eventChecklist'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function handleSearch(e) {
    e.preventDefault()
    navigate(`/browse${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`)
  }

  return (
    <div>
      <section className="bg-hero px-5 pb-12 pt-16 md:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-2xl text-mist/90 md:text-3xl">
            {greeting()}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-[1.15] text-mist md:text-5xl">
            What are you <span className="text-gold">planning</span> today?
          </h1>

          {/* floating pill search */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl">
            <div className="glass-dark flex items-center gap-3 rounded-full px-5 py-3.5 shadow-lg shadow-black/40">
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search canopies, chairs, sound systems…"
                className="w-full bg-transparent text-mist placeholder:text-muted focus:outline-none"
              />
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {EVENT_TYPES.map((t) => (
            <Link
              key={t.id}
              to={`/plan?type=${t.id}`}
              className="glass group flex flex-col items-center gap-2 rounded-2xl px-4 py-6 text-center transition-transform duration-200 hover:-translate-y-1 hover:border-gold/40"
            >
              <span className="text-3xl transition-transform duration-200 group-hover:scale-110">{t.emoji}</span>
              <span className="text-sm font-medium text-midnight/90">{t.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/browse"
            className="rounded-full bg-gold px-6 py-3 font-medium text-midnight transition-all hover:brightness-110"
          >
            Browse equipment
          </Link>
          <Link
            to="/signup"
            className="rounded-full border border-black/15 px-6 py-3 font-medium text-midnight transition-colors hover:border-gold hover:text-gold"
          >
            List your equipment
          </Link>
        </div>
      </section>
    </div>
  )
}
