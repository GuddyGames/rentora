import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { getAllListings, getListingsByOwner } from '../services/listings'
import { getBookingsForRenter, getBookingsForOwner } from '../services/bookings'
import ListingCard from '../components/ListingCard'
import Skeleton from '../components/Skeleton'
import { SearchIcon, SparkleIcon, CartIcon, DashboardIcon, CalendarIcon, StarIcon } from '../components/icons'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function GlassTile({ to, icon, label, sub, dark }) {
  return (
    <Link
      to={to}
      className={`${dark ? 'ios-glass-dark text-white' : 'ios-glass text-midnight'} flex min-h-[7.75rem] min-w-0 flex-col items-start gap-2 rounded-[1.35rem] p-3.5 transition-transform duration-200 hover:-translate-y-1 sm:min-h-0 sm:rounded-3xl sm:p-5`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${dark ? 'bg-white/15' : 'bg-black/5'}`}>
        {icon}
      </span>
      <span className="font-display text-base font-semibold">{label}</span>
      {sub && <span className={`text-xs ${dark ? 'text-white/70' : 'text-midnight/60'}`}>{sub}</span>}
    </Link>
  )
}

export default function HomeDashboard() {
  const { user, profile } = useAuth()
  const { items } = useCart()
  const navigate = useNavigate()
  const isOwner = profile?.role === 'owner'

  const [loading, setLoading] = useState(true)
  const [upcoming, setUpcoming] = useState(null)
  const [ownerStats, setOwnerStats] = useState(null)
  const [featured, setFeatured] = useState([])

  function handleSearch(e) {
    e.preventDefault()
    const q = e.target.search.value.trim()
    navigate(`/browse${q ? `?search=${encodeURIComponent(q)}` : ''}`)
  }

  useEffect(() => {
    if (!user) return
    async function load() {
      const listings = await getAllListings({})
      setFeatured(listings.slice(0, 4))

      if (isOwner) {
        const [myListings, myBookings] = await Promise.all([getListingsByOwner(user.uid), getBookingsForOwner(user.uid)])
        setOwnerStats({
          listingCount: myListings.length,
          pending: myBookings.filter((b) => b.status === 'pending').length,
        })
      } else {
        const bookings = await getBookingsForRenter(user.uid)
        const next = bookings
          .filter((b) => b.status !== 'cancelled' && b.status !== 'completed')
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]
        setUpcoming(next || null)
      }
      setLoading(false)
    }
    load()
  }, [user, isOwner])

  return (
    <div className="aurora-bg min-h-[calc(100vh-57px)] px-4 py-5 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-6xl">
        {/* Mobile-first greeting + search */}
        <div className="ios-glass rounded-[1.75rem] p-4 sm:rounded-3xl sm:p-6 md:p-8">
          <p className="font-display text-base text-midnight/65 sm:text-xl md:text-2xl">
            {greeting()}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
          </p>
          <h1 className="mt-1 max-w-2xl break-words font-display text-[1.7rem] font-semibold leading-tight tracking-tight text-midnight sm:text-3xl md:text-4xl">
            What are you <span className="text-gold">planning</span> today?
          </h1>
          <form onSubmit={handleSearch} className="mt-5 max-w-xl sm:mt-6">
            <div className="ios-glass-dark flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 sm:rounded-full sm:px-5 sm:py-3.5">
              <SearchIcon className="h-5 w-5 shrink-0 text-white/70" />
              <input
                name="search"
                type="text"
                placeholder="Search canopies, chairs, sound systems…"
                aria-label="Search event equipment"
                className="w-full min-w-0 bg-transparent text-base text-white placeholder:text-white/50 focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* quick actions */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 md:grid-cols-4">
          <GlassTile to="/browse" icon={<SearchIcon className="h-5 w-5" />} label="Browse" sub="Find equipment" />
          <GlassTile to="/plan" icon={<SparkleIcon className="h-5 w-5" />} label="Plan my event" sub="Get a checklist" dark />
          <GlassTile to="/cart" icon={<CartIcon className="h-5 w-5" />} label="Cart" sub={items.length ? `${items.length} item${items.length > 1 ? 's' : ''}` : 'Empty'} />
          {isOwner ? (
            <GlassTile to="/dashboard" icon={<DashboardIcon className="h-5 w-5" />} label="Dashboard" sub={ownerStats ? `${ownerStats.pending} pending` : '…'} dark />
          ) : (
            <GlassTile to="/my-bookings" icon={<CalendarIcon className="h-5 w-5" />} label="My bookings" sub={upcoming ? '1 upcoming' : 'None yet'} dark />
          )}
        </div>

        {isOwner && (
          <Link
            to="/pricing"
            className="ios-glass-dark mt-4 flex items-center justify-between rounded-3xl p-5 text-white transition-transform hover:-translate-y-0.5"
          >
            <span>
              <span className="font-display text-lg font-semibold inline-flex items-center gap-1.5">Boost your listings <StarIcon className="h-4 w-4 text-gold" /></span>
              <span className="ml-2 text-sm text-white/70">Get featured placement in Browse</span>
            </span>
            <span className="text-white/70">→</span>
          </Link>
        )}

        {/* upcoming booking (renter) */}
        {!isOwner && !loading && upcoming && (
          <div className="ios-glass mt-4 rounded-[1.5rem] p-4 sm:mt-5 sm:rounded-3xl sm:p-6">
            <p className="text-xs uppercase tracking-wide text-midnight/50">Your next booking</p>
            <p className="mt-1 font-display text-xl font-semibold text-midnight">{upcoming.listingTitle}</p>
            <p className="text-sm text-midnight/60">{upcoming.startDate} → {upcoming.endDate} · {upcoming.status}</p>
            <Link to="/my-bookings" className="mt-3 inline-block text-sm text-royal hover:underline">View all bookings →</Link>
          </div>
        )}

        {/* featured listings */}
        <div className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold sm:text-xs">Picked for your event</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-midnight sm:text-2xl">Popular right now</h2>
            </div>
            <Link to="/browse" className="text-sm text-royal hover:underline">See all →</Link>
          </div>
          {loading ? (
            <div className="mobile-horizontal-scroll mt-4 gap-3 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="min-w-[72%] snap-start min-[430px]:min-w-[48%] md:min-w-0"><Skeleton className="h-56 w-full rounded-2xl" /></div>)}
            </div>
          ) : (
            <div className="mobile-horizontal-scroll mt-4 gap-3 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible lg:grid-cols-4">
              {featured.map((l) => <div key={l.id} className="min-w-[72%] snap-start min-[430px]:min-w-[48%] md:min-w-0"><ListingCard listing={l} /></div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
