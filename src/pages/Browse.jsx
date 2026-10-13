import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllListings, CATEGORIES } from '../services/listings'
import ListingCard from '../components/ListingCard'
import { ListingCardSkeleton } from '../components/Skeleton'
import BackButton from '../components/BackButton'
import { CATEGORY_ICONS } from '../components/iconMap'
import { SparkleIcon, SearchIcon } from '../components/icons'

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const searchTerm = searchParams.get('search') || ''
  const [searchDraft, setSearchDraft] = useState(searchTerm)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => setSearchDraft(searchTerm), [searchTerm])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getAllListings({ category: category || undefined })
      .then((data) => { if (active) setListings(data) })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [category])

  const visibleListings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return listings
    return listings.filter((listing) =>
      [listing.title, listing.description, listing.category, listing.location]
        .some((value) => String(value || '').toLowerCase().includes(term))
    )
  }, [listings, searchTerm])

  function updateFilters(nextCategory = category, nextSearch = searchTerm) {
    const next = {}
    if (nextCategory) next.category = nextCategory
    if (nextSearch.trim()) next.search = nextSearch.trim()
    setSearchParams(next)
  }

  function submitSearch(event) {
    event.preventDefault()
    updateFilters(category, searchDraft)
  }

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[#f7f8fc]">
      <section className="relative overflow-hidden bg-hero px-5 pb-8 pt-7 text-white sm:pb-10 sm:pt-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-royal/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <BackButton to="/" label="Home" />
          <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">The Rentora marketplace</p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Find the pieces for your event.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60 sm:text-base">Search local event essentials and bring your setup together in one place.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 sm:min-w-36">
              <p className="text-xs text-white/50">Available in this view</p>
              <p className="mt-1 font-display text-2xl font-semibold">{loading ? '—' : visibleListings.length} <span className="text-sm font-normal text-white/50">items</span></p>
            </div>
          </div>

          <form onSubmit={submitSearch} className="mt-7 flex max-w-2xl gap-2 rounded-2xl border border-white/10 bg-white p-2 shadow-xl shadow-black/15">
            <SearchIcon className="ml-3 mt-2.5 h-5 w-5 shrink-0 text-midnight/40" />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              type="search"
              placeholder="Try “white chairs”, “canopy”, or a location"
              aria-label="Search event equipment"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-midnight outline-none placeholder:text-midnight/40"
            />
            <button type="submit" className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-midnight transition hover:brightness-105">Search</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Browse by category</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-midnight sm:text-2xl">What do you need?</h2>
          </div>
          {(category || searchTerm) && (
            <button onClick={() => { setSearchDraft(''); updateFilters('', '') }} className="shrink-0 text-sm font-medium text-royal hover:underline">Clear filters</button>
          )}
        </div>

        <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button onClick={() => updateFilters('')} aria-pressed={!category} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${!category ? 'border-midnight bg-midnight text-white shadow-md shadow-midnight/10' : 'border-black/10 bg-white text-midnight/70 hover:border-gold/60'}`}>
            <SparkleIcon className="h-4 w-4" /> All equipment
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name]
            const active = category === cat.name
            return (
              <button key={cat.name} onClick={() => updateFilters(cat.name)} aria-pressed={active} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${active ? 'border-midnight bg-midnight text-white shadow-md shadow-midnight/10' : 'border-black/10 bg-white text-midnight/70 hover:border-gold/60'}`}>
                {Icon && <Icon className="h-4 w-4" />}
                {cat.name}
              </button>
            )
          })}
        </div>

        <div className="mt-7 flex items-center justify-between border-b border-black/[0.07] pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-midnight">{category || 'All equipment'}</h2>
            <p className="mt-1 text-sm text-midnight/50">{searchTerm ? `Results for “${searchTerm}”` : 'Discover equipment for your next gathering'}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-midnight/60 shadow-sm">{loading ? 'Loading…' : `${visibleListings.length} found`}</span>
        </div>

        {error && <div role="alert" className="mt-6 rounded-2xl border border-ruby/20 bg-ruby/5 p-4 text-sm text-ruby">Couldn't load listings: {error}</div>}

        {!loading && !error && visibleListings.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white px-5 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-midnight/50"><SearchIcon className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-midnight">No matches just yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-midnight/55">Try another keyword or category. New equipment can be added by rental partners.</p>
            <button onClick={() => { setSearchDraft(''); updateFilters('', '') }} className="mt-5 rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-royal">Show all equipment</button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
            : visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      </section>
    </main>
  )
}
