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
      className={`${dark ? 'ios-glass-dark text-white' : 'ios-glass text-midnight'} flex flex-col items-start gap-2 rounded-3xl p-5 transition-transform duration-200 hover:-translate-y-1`}
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
    <div className="aurora-bg min-h-[calc(100vh-57px)] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        {/* greeting + search */}
        <div className="ios-glass rounded-3xl p-6 md:p-8">
          <p className="font-display text-xl text-midnight/80 md:text-2xl">
            {greeting()}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-midnight md:text-4xl">
            What are you <span className="text-gold">planning</span> today?
          </h1>
          <form onSubmit={handleSearch} className="mt-6 max-w-xl">
            <div className="ios-glass-dark flex items-center gap-3 rounded-full px-5 py-3.5">
              <SearchIcon className="h-5 w-5 shrink-0 text-white/70" />
              <input
                name="search"
                type="text"
                placeholder="Search canopies, chairs, sound systems…"
                className="w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* quick actions */}
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
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
          <div className="ios-glass mt-5 rounded-3xl p-6">
            <p className="text-xs uppercase tracking-wide text-midnight/50">Your next booking</p>
            <p className="mt-1 font-display text-xl font-semibold text-midnight">{upcoming.listingTitle}</p>
            <p className="text-sm text-midnight/60">{upcoming.startDate} → {upcoming.endDate} · {upcoming.status}</p>
            <Link to="/my-bookings" className="mt-3 inline-block text-sm text-royal hover:underline">View all bookings →</Link>
          </div>
        )}

        {/* featured listings */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-midnight">Popular right now</h2>
            <Link to="/browse" className="text-sm text-royal hover:underline">See all →</Link>
          </div>
          {loading ? (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
