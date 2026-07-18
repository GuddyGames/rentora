import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBookingsForRenter } from '../services/bookings'
import { addReview, hasReviewed } from '../services/reviews'
import BookingTimeline from '../components/BookingTimeline'
import Skeleton from '../components/Skeleton'
import BackButton from '../components/BackButton'

function ReviewForm({ booking, onDone }) {
  const { user, profile } = useAuth()
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    await addReview({
      listingId: booking.listingId,
      bookingId: booking.id,
      renterId: user.uid,
      renterName: profile?.name || user.email,
      rating,
      text,
    })
    setBusy(false)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-black/10 pt-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className={`text-lg ${n <= rating ? 'text-gold' : 'text-midnight/20'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="How was the equipment and the owner?"
        rows={2}
        className="w-full rounded-lg border border-black/10 bg-mist px-3 py-2 text-sm text-midnight placeholder:text-midnight/40"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-midnightdeep hover:opacity-90 disabled:opacity-60"
      >
        {busy ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}

export default function MyBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewedIds, setReviewedIds] = useState({})
  const [openReviewFor, setOpenReviewFor] = useState(null)

  useEffect(() => {
    if (!user) return
    getBookingsForRenter(user.uid)
      .then(async (b) => {
        setBookings(b)
        const completed = b.filter((x) => x.status === 'completed')
        const flags = {}
        await Promise.all(
          completed.map(async (x) => {
            flags[x.id] = await hasReviewed(x.listingId, x.id)
          })
        )
        setReviewedIds(flags)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <BackButton to="/" />
      <h1 className="font-display text-3xl font-semibold text-midnight">My bookings</h1>

      {loading ? (
        <div className="mt-10 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : error ? (
        <p className="mt-10 text-ruby">Couldn't load your bookings: {error}</p>
      ) : bookings.length === 0 ? (
        <div className="mt-10 flex flex-col items-center py-10 text-center">
          <span className="text-3xl">🎉</span>
          <p className="mt-2 text-midnight/60">Your next unforgettable event starts here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="glass space-y-3 rounded-2xl p-4">
              <div>
                <p className="font-display font-semibold text-midnight">{b.listingTitle}</p>
                <p className="text-sm text-midnight/60">{b.startDate} → {b.endDate} · ₦{Number(b.totalPrice).toLocaleString()}{b.paid ? ' · paid' : ''}</p>
              </div>
              <BookingTimeline status={b.status} />

              {b.status === 'completed' && !reviewedIds[b.id] && (
                openReviewFor === b.id ? (
                  <ReviewForm booking={b} onDone={() => { setReviewedIds((p) => ({ ...p, [b.id]: true })); setOpenReviewFor(null) }} />
                ) : (
                  <button onClick={() => setOpenReviewFor(b.id)} className="mt-2 text-sm text-gold hover:underline">
                    Leave a review
                  </button>
                )
              )}
              {b.status === 'completed' && reviewedIds[b.id] && (
                <p className="mt-2 text-sm text-midnight/40">Thanks for the review.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
