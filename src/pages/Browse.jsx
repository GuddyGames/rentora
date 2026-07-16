import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllListings, CATEGORIES } from '../services/listings'
import ListingCard from '../components/ListingCard'
import { ListingCardSkeleton } from '../components/Skeleton'
import BackButton from '../components/BackButton'

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const searchTerm = searchParams.get('search') || ''
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getAllListings({ category: category || undefined })
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [category])

  const visibleListings = useMemo(() => {
    if (!searchTerm) return listings
    const term = searchTerm.toLowerCase()
    return listings.filter(
      (l) => l.title.toLowerCase().includes(term) || l.description?.toLowerCase().includes(term)
    )
  }, [listings, searchTerm])

  function setCategory(cat) {
    const next = {}
    if (cat) next.category = cat
    if (searchTerm) next.search = searchTerm
    setSearchParams(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <BackButton to="/" />
      <h1 className="font-display text-3xl font-semibold text-midnight">Browse equipment</h1>
      {searchTerm && <p className="mt-1 text-sm text-muted">Showing results for "{searchTerm}"</p>}

      <div className="mt-6 flex flex-wrap gap-4">
        <button onClick={() => setCategory('')} className="flex flex-col items-center gap-1.5">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full text-xl transition-colors ${
              !category ? 'bg-gold text-midnight' : 'glass text-midnight/80 hover:border-gold/40'
            }`}
          >
            ✨
          </span>
          <span className={`text-xs ${!category ? 'text-gold' : 'text-midnight/60'}`}>All</span>
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat.name} onClick={() => setCategory(cat.name)} className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full text-xl transition-colors ${
                category === cat.name ? 'bg-gold text-midnight' : 'glass text-midnight/80 hover:border-gold/40'
              }`}
            >
              {cat.icon}
            </span>
            <span className={`max-w-[64px] text-center text-xs leading-tight ${category === cat.name ? 'text-gold' : 'text-midnight/60'}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="mt-10 text-ruby">Couldn't load listings: {error}</p>}
      {!loading && !error && visibleListings.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="text-4xl">🔍</span>
          <p className="mt-3 text-midnight/70">Nothing here yet — check back soon, or try a different search.</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
          : visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </div>
  )
}
