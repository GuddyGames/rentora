import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getListingsByOwner, deleteListing } from '../services/listings'
import { getBookingsForOwner, updateBookingStatus, nextStatus, STATUS_STEPS } from '../services/bookings'
import { compressImage } from '../utils/compressImage'
import AddressMap from '../components/AddressMap'
import BookingTimeline from '../components/BookingTimeline'
import Skeleton from '../components/Skeleton'
import BackButton from '../components/BackButton'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingPhoto, setPendingPhoto] = useState({}) // bookingId -> base64, staged before status change

  useEffect(() => {
    if (!user) return
    Promise.all([getListingsByOwner(user.uid), getBookingsForOwner(user.uid)])
      .then(([l, b]) => {
        setListings(l)
        setBookings(b)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  async function handleStatus(id, status) {
    await updateBookingStatus(id, status, pendingPhoto[id])
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    setPendingPhoto((prev) => ({ ...prev, [id]: null }))
  }

  async function handlePhotoStaged(id, file) {
    if (!file) return
    const compressed = await compressImage(file)
    setPendingPhoto((prev) => ({ ...prev, [id]: compressed }))
  }

  async function handleDeleteListing(id, title) {
    if (!window.confirm(`Remove "${title}"? This can't be undone.`)) return
    await deleteListing(id)
    setListings((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-midnight">
          Welcome back{profile?.name ? `, ${profile.name}` : ''}
        </h1>
        <div className="flex gap-2">
          <Link
            to="/pricing"
            className="rounded-full border border-black/15 px-5 py-2.5 font-medium text-midnight transition-colors hover:border-gold hover:text-gold"
          >
            Boost listings
          </Link>
          <Link
            to="/add-listing"
            className="rounded-full bg-gold px-5 py-2.5 font-medium text-midnight transition-all hover:brightness-110"
          >
            + List equipment
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-ruby/30 bg-ruby/10 p-4 text-sm text-ruby">
          Couldn't load your dashboard: {error}
        </p>
      )}

      {loading ? (
        <div className="mt-10 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : error ? null : (
        <>
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-midnight">Your listings ({listings.length})</h2>
            {listings.length === 0 ? (
              <div className="mt-4 flex flex-col items-center py-10 text-center">
                <span className="text-3xl">📦</span>
                <p className="mt-2 text-midnight/60">Your first listing takes two minutes — start whenever you're ready.</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {listings.map((l) => (
                  <div key={l.id} className="glass flex items-start justify-between gap-3 rounded-2xl p-4">
                    <div className="min-w-0">
                      <p className="font-mono text-xs uppercase tracking-wide text-gold">{l.category}</p>
                      <p className="font-display text-lg font-semibold text-midnight">{l.title}</p>
                      <p className="text-sm text-midnight/60">₦{Number(l.pricePerDay).toLocaleString()} / day · {l.location}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteListing(l.id, l.title)}
                      aria-label="Delete listing"
                      className="shrink-0 rounded-full p-2 text-ruby hover:bg-ruby/10"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-midnight">Booking requests ({bookings.length})</h2>
            {bookings.length === 0 ? (
              <div className="mt-4 flex flex-col items-center py-10 text-center">
                <span className="text-3xl">📅</span>
                <p className="mt-2 text-midnight/60">Your next unforgettable event starts here.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {bookings.map((b) => {
                  const next = nextStatus(b.status)
                  const nextLabel = STATUS_STEPS.find((s) => s.key === next)?.label
                  return (
                    <div key={b.id} className="glass space-y-3 rounded-2xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-display font-semibold text-midnight">{b.listingTitle}</p>
                          <p className="text-sm text-midnight/60">
                            {b.renterName} · {b.startDate} → {b.endDate} · ₦{Number(b.totalPrice).toLocaleString()}
                          </p>
                        </div>
                        {b.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatus(b.id, 'confirmed')}
                              className="rounded-full bg-emerald px-4 py-1.5 text-sm font-medium text-white hover:brightness-110"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatus(b.id, 'cancelled')}
                              className="rounded-full border border-ruby px-4 py-1.5 text-sm font-medium text-ruby hover:bg-ruby hover:text-white"
                            >
                              Decline
                            </button>
                          </div>
                        ) : b.status !== 'cancelled' && next ? (
                          <div className="flex items-center gap-2">
                            {(next === 'delivered' || next === 'returned') && (
                              <label className="cursor-pointer text-xs text-midnight/50 hover:text-royal">
                                {pendingPhoto[b.id] ? '📷 photo attached' : '📷 attach condition photo'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handlePhotoStaged(b.id, e.target.files?.[0])}
                                />
                              </label>
                            )}
                            <button
                              onClick={() => handleStatus(b.id, next)}
                              className="rounded-full border border-black/15 px-4 py-1.5 text-sm font-medium text-midnight hover:border-gold hover:text-gold"
                            >
                              Mark {nextLabel?.toLowerCase()}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <BookingTimeline status={b.status} />
                      {b.deliveryLat && b.deliveryLon && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-royal hover:underline">📍 View delivery location</summary>
                          <div className="mt-2 max-w-sm">
                            <AddressMap lat={b.deliveryLat} lon={b.deliveryLon} label={b.deliveryAddress} />
                          </div>
                        </details>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
