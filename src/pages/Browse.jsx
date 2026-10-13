import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadListings() {
      setLoading(true)
      setError('')
      try {
        const results = await getAllListings({ category: category || undefined })
        if (!cancelled) setListings(results)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Please check your connection and try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadListings()
    return () => {
      cancelled = true
    }
  }, [category, reloadKey])

  const visibleListings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return listings
    return listings.filter((listing) =>
      [listing.title, listing.description, listing.category, listing.location]
        .some((value) => String(value || '').toLowerCase().includes(term))
    )
  }, [listings, searchTerm])

  function setCategory(cat) {
    const next = {}
    if (cat) next.category = cat
    if (searchTerm) next.search = searchTerm
    setSearchParams(next)
  }

  function clearFilters() {
    setSearchParams({})
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <BackButton to="/" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Find what your event needs</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-midnight sm:text-4xl">Browse equipment</h1>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
            Compare event essentials from local equipment owners, all in one place.
          </p>
        </div>
        <Link
          to="/add-listing"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-midnight transition-colors hover:border-gold hover:text-gold"
        >
          List your equipment
        </Link>
      </div>

      {searchTerm && (
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
          <SearchIcon className="h-4 w-4" />
          <span>Search: <strong className="font-semibold text-midnight">“{searchTerm}”</strong></span>
          <button onClick={clearFilters} className="rounded-full px-2 py-1 font-medium text-midnight underline underline-offset-2 hover:text-gold">
            Clear search
          </button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3" aria-label="Filter equipment by category">
          <button
            type="button"
            aria-pressed={!category}
            onClick={() => setCategory('')}
            className="flex min-w-[68px] flex-col items-center gap-1.5 rounded-xl p-2 transition-colors hover:bg-white"
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
              !category ? 'bg-gold text-midnight' : 'glass text-midnight/80'
            }`}>
              <SparkleIcon className="h-6 w-6" />
            </span>
            <span className={`text-xs font-medium ${!category ? 'text-midnight' : 'text-midnight/60'}`}>All</span>
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name]
            const selected = category === cat.name
            return (
              <button
                key={cat.name}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(cat.name)}
                className="flex min-w-[68px] flex-col items-center gap-1.5 rounded-xl p-2 transition-colors hover:bg-white"
              >
                <span className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                  selected ? 'bg-gold text-midnight' : 'glass text-midnight/80'
                }`}>
                  {Icon && <Icon className="h-6 w-6" />}
                </span>
                <span className={`max-w-[76px] text-center text-xs leading-tight ${selected ? 'font-semibold text-midnight' : 'text-midnight/60'}`}>
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
        <p className="text-sm text-muted" aria-live="polite">
          {loading ? 'Finding equipment…' : error ? 'Listings unavailable' : (
            <><strong className="text-midnight">{visibleListings.length}</strong> {visibleListings.length === 1 ? 'item' : 'items'} found</>
          )}
          {category && !loading && !error ? ` · ${category}` : ''}
        </p>
        {(category || searchTerm) && (
          <button onClick={clearFilters} className="text-sm font-medium text-midnight underline underline-offset-2 hover:text-gold">
            Clear all filters
          </button>
        )}
      </div>

      {error && (
        <div className="mt-8 rounded-2xl border border-ruby/20 bg-white p-5 sm:p-6" role="alert">
          <h2 className="font-display text-lg font-semibold text-midnight">We couldn’t load equipment</h2>
          <p className="mt-1 text-sm text-muted">Check your internet connection and try again. Your filters will be kept.</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-4 rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-midnight/80"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && visibleListings.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-black/10 bg-white/60 px-5 py-12 text-center sm:mt-14">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-midnight/60">
            <SearchIcon className="h-8 w-8" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-midnight">
            {searchTerm || category ? 'No matching equipment yet' : 'No equipment listed yet'}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            {searchTerm || category
              ? 'Try another search or clear your filters to see all available listings.'
              : 'Check back soon, or be the first to list equipment for your next event.'}
          </p>
          {searchTerm || category ? (
            <button onClick={clearFilters} className="mt-5 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-midnight hover:brightness-105">
              Show all equipment
            </button>
          ) : (
            <Link to="/add-listing" className="mt-5 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-midnight hover:brightness-105">
              List equipment
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
          : !error && visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </div>
  )
}
