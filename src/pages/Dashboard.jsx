import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getListingsByOwner } from '../services/listings'
import { getBookingsForOwner, updateBookingStatus, nextStatus, STATUS_STEPS } from '../services/bookings'
import BookingTimeline from '../components/BookingTimeline'
import Skeleton from '../components/Skeleton'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([getListingsByOwner(user.uid), getBookingsForOwner(user.uid)]).then(([l, b]) => {
      setListings(l)
      setBookings(b)
      setLoading(false)
    })
  }, [user])

  async function handleStatus(id, status) {
    await updateBookingStatus(id, status)
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-midnight">
          Welcome back{profile?.name ? `, ${profile.name}` : ''}
        </h1>
        <Link
          to="/add-listing"
          className="rounded-full bg-gold px-5 py-2.5 font-medium text-midnight transition-all hover:brightness-110"
        >
          + List equipment
        </Link>
      </div>

      {loading ? (
        <div className="mt-10 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
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
                  <div key={l.id} className="glass rounded-2xl p-4">
                    <p className="font-mono text-xs uppercase tracking-wide text-gold">{l.category}</p>
                    <p className="font-display text-lg font-semibold text-midnight">{l.title}</p>
                    <p className="text-sm text-midnight/60">₦{Number(l.pricePerDay).toLocaleString()} / day · {l.location}</p>
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
                          <button
                            onClick={() => handleStatus(b.id, next)}
                            className="rounded-full border border-black/15 px-4 py-1.5 text-sm font-medium text-midnight hover:border-gold hover:text-gold"
                          >
                            Mark {nextLabel?.toLowerCase()}
                          </button>
                        ) : null}
                      </div>
                      <BookingTimeline status={b.status} />
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
