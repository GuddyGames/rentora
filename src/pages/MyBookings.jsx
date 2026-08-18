import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBookingsForRenter } from '../services/bookings'
import { addReview, hasReviewed } from '../services/reviews'
import { fileDispute } from '../services/disputes'
import { compressImage } from '../utils/compressImage'
import AddressMap from '../components/AddressMap'
import BookingTimeline from '../components/BookingTimeline'
import Skeleton from '../components/Skeleton'
import BackButton from '../components/BackButton'

const DISPUTE_REASONS = ['Item not delivered', 'Item damaged/not as described', 'Owner unresponsive', 'Payment issue', 'Other']

function DisputeForm({ booking, onDone }) {
  const { user, profile } = useAuth()
  const [reason, setReason] = useState(DISPUTE_REASONS[0])
  const [details, setDetails] = useState('')
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(await compressImage(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    await fileDispute({
      bookingId: booking.id,
      listingTitle: booking.listingTitle,
      filedBy: user.uid,
      filedByName: profile?.name || user.email,
      reason,
      details,
      photoBase64: photo,
    })
    setBusy(false)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-black/10 pt-3">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-mist px-3 py-2 text-sm text-midnight"
      >
        {DISPUTE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="What happened?"
        rows={2}
        className="w-full rounded-lg border border-black/10 bg-mist px-3 py-2 text-sm text-midnight placeholder:text-midnight/40"
      />
      <input type="file" accept="image/*" onChange={handlePhoto} className="text-xs text-midnight/60" />
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-ruby px-4 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
      >
        {busy ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  )
}

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
  const [openDisputeFor, setOpenDisputeFor] = useState(null)
  const [disputedIds, setDisputedIds] = useState({})

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
              {b.deliveryLat && b.deliveryLon && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-royal hover:underline">📍 View delivery location</summary>
                  <div className="mt-2 max-w-sm">
                    <AddressMap lat={b.deliveryLat} lon={b.deliveryLon} label={b.deliveryAddress} />
                  </div>
                </details>
              )}
              {(b.deliveryPhotoBase64 || b.returnPhotoBase64) && (
                <div className="flex gap-2">
                  {b.deliveryPhotoBase64 && (
                    <div>
                      <p className="text-xs text-midnight/50">Delivery photo</p>
                      <img src={b.deliveryPhotoBase64} alt="Delivery condition" className="mt-1 h-20 w-20 rounded-lg object-cover" />
                    </div>
                  )}
                  {b.returnPhotoBase64 && (
                    <div>
                      <p className="text-xs text-midnight/50">Return photo</p>
                      <img src={b.returnPhotoBase64} alt="Return condition" className="mt-1 h-20 w-20 rounded-lg object-cover" />
                    </div>
                  )}
                </div>
              )}

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

              {b.status !== 'cancelled' && (
                disputedIds[b.id] ? (
                  <p className="text-sm text-midnight/40">Report submitted — our team will review it.</p>
                ) : openDisputeFor === b.id ? (
                  <DisputeForm booking={b} onDone={() => { setDisputedIds((p) => ({ ...p, [b.id]: true })); setOpenDisputeFor(null) }} />
                ) : (
                  <button onClick={() => setOpenDisputeFor(b.id)} className="text-sm text-ruby hover:underline">
                    Report an issue
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
