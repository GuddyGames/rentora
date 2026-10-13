import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getListing } from '../services/listings'
import { hasConflict } from '../services/bookings'
import { getReviewsForListing } from '../services/reviews'
import { getOrCreateConversation } from '../services/chat'
import { reportListing } from '../services/disputes'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import BackButton from '../components/BackButton'

function daysBetween(start, end) {
  const ms = new Date(end) - new Date(start)
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1)
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { addToCart } = useCart()

  const [listing, setListing] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('') // '', 'checking', 'conflict', 'ready'
  const [errorMsg, setErrorMsg] = useState('')
  const [loadError, setLoadError] = useState('')
  const [messaging, setMessaging] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('Fake or misleading listing')
  const [reportDetails, setReportDetails] = useState('')
  const [reportBusy, setReportBusy] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  useEffect(() => {
    getListing(id)
      .then((l) => setListing(l))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false))
    getReviewsForListing(id).then(setReviews).catch(() => {})
  }, [id])

  const totalDays = useMemo(() => (startDate && endDate ? daysBetween(startDate, endDate) : 0), [startDate, endDate])
  const rentalCost = listing ? totalDays * listing.pricePerDay : 0
  const totalPrice = listing ? rentalCost + (listing.deliveryCost || 0) + (listing.securityDeposit || 0) : 0

  async function handleCheckAvailability() {
    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
      setErrorMsg('Pick a valid start and end date.')
      return
    }
    setErrorMsg('')
    setStatus('checking')
    try {
      const conflict = await hasConflict(id, startDate, endDate, 1, listing.quantity || 1)
      setStatus(conflict ? 'conflict' : 'ready')
    } catch (e) {
      setErrorMsg(`Couldn't check availability: ${e.message}`)
      setStatus('')
    }
  }

  function handleAddToCart() {
    if (!user) { navigate('/login'); return }
    addToCart(listing, startDate, endDate)
    navigate('/cart')
  }

  async function handleMessageOwner() {
    if (!user) { navigate('/login'); return }
    if (user.uid === listing.ownerId) return
    setMessaging(true)
    try {
      const conversationId = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: listing.title,
        ownerId: listing.ownerId,
        ownerName: listing.ownerName,
        renterId: user.uid,
        renterName: profile?.name || user.email,
      })
      navigate(`/messages/${conversationId}`)
    } catch (e) {
      setErrorMsg(`Couldn't start the conversation: ${e.message}`)
      setMessaging(false)
    }
  }

  async function handleSubmitReport() {
    if (!user) { navigate('/login'); return }
    setReportBusy(true)
    try {
      await reportListing({
        listingId: listing.id,
        listingTitle: listing.title,
        filedBy: user.uid,
        filedByName: profile?.name || user.email,
        reason: reportReason,
        details: reportDetails,
      })
      setReportSent(true)
      setReportOpen(false)
    } catch (e) {
      setErrorMsg(`Couldn't send the report: ${e.message}`)
    } finally {
      setReportBusy(false)
    }
  }

  if (loading) return <div className="mx-auto max-w-4xl px-5 py-16 text-midnight/60">Loading…</div>
  if (loadError) return <div className="mx-auto max-w-4xl px-5 py-16 text-ruby">Couldn't load this listing: {loadError}</div>
  if (!listing) return <div className="mx-auto max-w-4xl px-5 py-16 text-midnight/60">Listing not found.</div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-5 sm:py-8 lg:py-10">
      <BackButton to="/browse" label="Browse" />
      <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)] md:gap-8">
        <div>
          <div className="aspect-video overflow-hidden rounded-2xl bg-card/10">
            {listing.imageBase64 ? (
              <img src={listing.imageBase64} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">No photo yet</div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-wide text-gold">{listing.category}</p>
            {listing.ratingCount > 0 && (
              <p className="text-sm text-midnight/60">★ {listing.ratingAvg.toFixed(1)} ({listing.ratingCount})</p>
            )}
          </div>
          <h1 className="mt-1 break-words font-display text-2xl font-semibold leading-tight text-midnight sm:text-3xl">{listing.title}</h1>
          <p className="mt-1 text-midnight/60">{listing.location}</p>
          <p className="mt-4 text-midnight/80">{listing.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-midnight/50">
              Listed by {listing.ownerName}
              {listing.ownerVerified && <span className="ml-1.5 text-emerald">✓ Verified</span>}
            </p>
            {user?.uid !== listing.ownerId && (
              <>
                <button onClick={handleMessageOwner} disabled={messaging} className="text-sm text-gold hover:underline disabled:opacity-60">
                  Message owner
                </button>
                {reportSent ? (
                  <span className="text-sm text-midnight/40">Report sent</span>
                ) : (
                  <button onClick={() => setReportOpen((v) => !v)} className="text-sm text-midnight/40 hover:text-ruby">
                    Report listing
                  </button>
                )}
              </>
            )}
          </div>

          {reportOpen && (
            <div className="glass mt-3 space-y-2 rounded-2xl p-4">
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-mist px-3 py-2 text-sm text-midnight"
              >
                <option>Fake or misleading listing</option>
                <option>Wrong price</option>
                <option>Inappropriate image</option>
                <option>Suspected scam</option>
                <option>Other</option>
              </select>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Anything else we should know?"
                rows={2}
                className="w-full rounded-lg border border-black/10 bg-mist px-3 py-2 text-sm text-midnight placeholder:text-midnight/40"
              />
              <button
                onClick={handleSubmitReport}
                disabled={reportBusy}
                className="rounded-full bg-ruby px-4 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
              >
                {reportBusy ? 'Sending…' : 'Submit report'}
              </button>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-midnight">Reviews</h2>
              <div className="mt-3 space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border border-black/10 bg-white p-3">
                    <p className="text-sm text-gold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} <span className="text-midnight/50">— {r.renterName}</span></p>
                    {r.text && <p className="mt-1 text-sm text-midnight/70">{r.text}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-fit min-w-0 rounded-2xl border border-black/10 bg-white p-4 sm:p-6 md:sticky md:top-24">
          <div className="font-mono text-2xl font-semibold text-gold">
            ₦{Number(listing.pricePerDay).toLocaleString()}
            <span className="text-sm text-midnight/50"> / day</span>
          </div>
          {(listing.deliveryCost > 0 || listing.securityDeposit > 0) && (
            <p className="mt-1 text-xs text-midnight/50">
              {listing.deliveryCost > 0 && `+ ₦${listing.deliveryCost.toLocaleString()} delivery `}
              {listing.securityDeposit > 0 && `+ ₦${listing.securityDeposit.toLocaleString()} refundable deposit`}
            </p>
          )}

          <div className="mt-5 space-y-3">
            <label className="block text-sm text-midnight/70">
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setStatus('') }}
                className="mt-1 block w-full min-w-0 rounded-lg border border-black/10 bg-mist px-3 py-3 text-base text-midnight"
              />
            </label>
            <label className="block text-sm text-midnight/70">
              End date
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setStatus('') }}
                className="mt-1 w-full rounded-lg border border-black/10 bg-mist px-3 py-2 text-midnight"
              />
            </label>
          </div>

          {totalDays > 0 && (
            <p className="mt-3 font-mono text-sm text-midnight/70">
              {totalDays} day{totalDays > 1 ? 's' : ''} — total ₦{totalPrice.toLocaleString()}
            </p>
          )}

          {errorMsg && <p className="mt-3 text-sm text-ruby">{errorMsg}</p>}
          {status === 'conflict' && (
            <p className="mt-3 text-sm text-ruby">Already booked for part of that range — try different dates.</p>
          )}

          {status !== 'ready' ? (
            <button
              onClick={handleCheckAvailability}
              disabled={status === 'checking'}
              className="mt-5 min-h-12 w-full rounded-full bg-card px-4 py-3 font-medium text-midnightdeep transition-colors hover:brightness-110 disabled:opacity-60"
            >
              {status === 'checking' ? 'Checking…' : 'Check availability'}
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="mt-5 min-h-12 w-full rounded-full bg-gold px-4 py-3 font-medium text-midnightdeep transition-colors hover:brightness-110"
            >
              Add to cart — ₦{totalPrice.toLocaleString()}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
