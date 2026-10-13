import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { getFunctions, httpsCallable } from 'firebase/functions'
import firebaseApp from '../firebase'
import { hasConflict, createBooking } from '../services/bookings'
import { getCoupon } from '../services/coupons'
import { geocodeAddress } from '../utils/geocode'
import PaymentSuccessOverlay from '../components/PaymentSuccessOverlay'
import AddressMap from '../components/AddressMap'
import BackButton from '../components/BackButton'

export default function Checkout() {
  const { items, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Discount applies to rental charges only; delivery and refundable deposits remain unchanged.
  const rentalSubtotal = items.reduce((sum, item) => sum + item.pricePerDay * item.days * item.qty, 0)
  const deliveryTotal = items.reduce((sum, item) => sum + item.deliveryCost, 0)
  const depositTotal = items.reduce((sum, item) => sum + item.securityDeposit * item.qty, 0)
  const discountTotal = Math.round(rentalSubtotal * discountPercent / 100)
  const discountedTotal = rentalSubtotal - discountTotal + deliveryTotal + depositTotal

  async function handlePreviewLocation() {
    setGeocodeError('')
    setCoords(null)
    setGeocoding(true)
    try {
      const result = await geocodeAddress(address)
      if (result) {
        setCoords(result)
      } else {
        setGeocodeError("Couldn't find that on the map — you can still check out, just double-check the address is right.")
      }
    } catch (e) {
      setGeocodeError(e.message)
    } finally {
      setGeocoding(false)
    }
  }

  async function handleApplyCoupon() {
    const coupon = await getCoupon(couponCode)
    if (coupon) {
      setDiscountPercent(coupon.percentOff)
      setCouponMsg(`Applied — ${coupon.percentOff}% off.`)
    } else {
      setDiscountPercent(0)
      setCouponMsg('That code isn\u2019t valid.')
    }
  }

  async function handlePay() {
    if (!user) { navigate('/login'); return }
    if (!address.trim()) { setError('Add a delivery address before checking out.'); return }
    if (!agreed) { setError('You need to accept the rental agreement to continue.'); return }
    setError('')
    setBusy(true)

    try {
      // re-check conflicts right before payment — dates were picked earlier and slots can fill up
      for (const item of items) {
        const conflict = await hasConflict(item.listingId, item.startDate, item.endDate, item.qty, item.maxQty || item.qty)
        if (conflict) {
          setError(`"${item.title}" got booked by someone else for those dates — remove it from your cart and try different dates.`)
          setBusy(false)
          return
        }
      }

      const createdBookings = []
      for (const item of items) {
        const ref = await createBooking({
          listingId: item.listingId,
          listingTitle: item.title,
          ownerId: item.ownerId,
          renterId: user.uid,
          renterName: user.email,
          startDate: item.startDate,
          endDate: item.endDate,
          quantity: item.qty,
          totalPrice: Math.round(item.pricePerDay * item.days * item.qty * (1 - discountPercent / 100)) + item.deliveryCost + (item.securityDeposit * item.qty),
          deliveryAddress: address,
          deliveryLat: coords?.lat || null,
          deliveryLon: coords?.lon || null,
        })
        createdBookings.push({
          id: ref.id,
          ownerId: item.ownerId,
          listingTitle: item.title,
          totalPrice: Math.round(item.pricePerDay * item.days * item.qty * (1 - discountPercent / 100)) + item.deliveryCost + (item.securityDeposit * item.qty),
        })
      }

      if (window.PaystackPop && import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
        const functions = getFunctions(firebaseApp, 'us-central1')
        const verifyPayment = httpsCallable(functions, 'verifyRentoraPayment')
        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: Math.round(createdBookings.reduce((sum, booking) => sum + booking.totalPrice, 0) * 100),
          currency: 'NGN',
          ref: createdBookings[0].id,
          callback: async (response) => {
            try {
              await verifyPayment({
                bookingIds: createdBookings.map((booking) => booking.id),
                reference: response.reference,
              })
              clearCart()
              setShowSuccess(true)
            } catch (verificationError) {
              console.error('Server-side payment verification failed', verificationError)
              setError('We could not verify this payment yet. Do not pay again. Keep this reference and contact support if your booking does not update: ' + response.reference)
              setBusy(false)
            }
          },
          onClose: () => setBusy(false),
        })
        handler.openIframe()
      } else {
        setError('Online payment is not configured right now. Your bookings have not been paid. Please contact support or try again later.')
        setBusy(false)
      }
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (items.length === 0) {
    return <div className="mx-auto max-w-lg px-4 py-12 text-center text-midnight/60">Your cart is empty.</div>
  }

  if (showSuccess) {
    return <PaymentSuccessOverlay onDone={() => navigate('/my-bookings')} />
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-5 sm:py-10">
      <BackButton to="/cart" label="Cart" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Step 2 of 3</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-midnight">Delivery & checkout</h1>
      <p className="mt-2 text-sm leading-6 text-midnight/55">Confirm where your rentals should arrive, then review the total before paying.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.06] bg-white p-3 sm:flex-nowrap">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">✓</span>
        <span className="text-xs font-medium text-midnight/55">Cart</span>
        <span className="h-px flex-1 bg-black/10" />
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-midnight text-xs font-bold text-white">2</span>
        <span className="text-xs font-semibold text-midnight">Delivery</span>
        <span className="h-px flex-1 bg-black/10" />
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-xs font-bold text-midnight/40">3</span>
        <span className="text-xs text-midnight/40">Payment</span>
      </div>

      <section className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-midnight">Your rentals</h2>
          <button type="button" onClick={() => navigate('/cart')} className="text-xs font-semibold text-royal hover:underline">Edit cart</button>
        </div>
        <div className="mt-3 divide-y divide-black/[0.06]">
          {items.map((item) => (
            <div key={item.listingId} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-midnight">{item.title}</p>
                <p className="mt-1 text-xs text-midnight/45">{item.qty} item{item.qty === 1 ? '' : 's'} · {item.days} day{item.days === 1 ? '' : 's'} · {item.startDate} → {item.endDate}</p>
              </div>
              <span className="shrink-0 font-mono text-sm font-semibold text-midnight">₦{(item.pricePerDay * item.days * item.qty).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>

      <label className="mt-6 block text-sm font-medium text-midnight/75">
        Delivery address
        <textarea
          value={address}
          onChange={(e) => { setAddress(e.target.value); setCoords(null); setGeocodeError('') }}
          rows={2}
          placeholder="Where should the equipment be delivered?"
          className="mt-1 block w-full min-w-0 rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-midnight placeholder:text-midnight/40"
        />
      </label>

      <button
        type="button"
        onClick={handlePreviewLocation}
        disabled={!address.trim() || geocoding}
        className="mt-2 text-sm text-royal hover:underline disabled:opacity-50"
      >
        {geocoding ? 'Looking up…' : '📍 Preview on map'}
      </button>

      {geocodeError && <p className="mt-1 text-sm text-midnight/50">{geocodeError}</p>}
      {coords && (
        <div className="mt-2">
          <AddressMap lat={coords.lat} lon={coords.lon} label={address} />
          <p className="mt-1 text-xs text-midnight/50">{coords.displayName}</p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="flex-1 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />
        <button onClick={handleApplyCoupon} className="rounded-lg border border-black/15 px-4 py-2.5 text-sm text-midnight hover:border-gold hover:text-gold">
          Apply
        </button>
      </div>
      {couponMsg && <p className="mt-1 text-sm text-gold">{couponMsg}</p>}

      <label className="mt-5 flex items-start gap-2 text-sm text-midnight/70">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
        I agree to the rental agreement — I'm responsible for equipment condition until it's returned, and refundable deposits are released after inspection.
      </label>

      <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-5 text-sm text-midnight/80">
        <h2 className="font-display text-lg font-semibold text-midnight">Payment summary</h2>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between gap-3"><span className="text-midnight/55">Rental subtotal</span><span>₦{rentalSubtotal.toLocaleString()}</span></div>
          {discountTotal > 0 && <div className="flex justify-between gap-3 text-emerald"><span>Coupon discount ({discountPercent}%)</span><span>−₦{discountTotal.toLocaleString()}</span></div>}
          {deliveryTotal > 0 && <div className="flex justify-between gap-3"><span className="text-midnight/55">Delivery</span><span>₦{deliveryTotal.toLocaleString()}</span></div>}
          {depositTotal > 0 && <div className="flex justify-between gap-3"><span className="text-midnight/55">Refundable deposits</span><span>₦{depositTotal.toLocaleString()}</span></div>}
          <div className="flex justify-between gap-3 border-t border-dashed border-black/15 pt-4 font-semibold text-midnight">
            <span>Total due now</span><span className="font-mono text-lg">₦{discountedTotal.toLocaleString()}</span>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-midnight/45">Refundable deposits are included in today's payment and are returned after the rental is completed and the equipment is inspected, subject to the rental agreement.</p>
      </div>

      {error && <p className="mt-3 text-sm text-ruby">{error}</p>}

      <button
        onClick={handlePay}
        disabled={busy}
        className="mt-6 w-full rounded-full bg-gold px-5 py-3 font-medium text-midnightdeep transition-colors hover:brightness-110 disabled:opacity-60"
      >
        {busy ? 'Processing…' : `Pay ₦${discountedTotal.toLocaleString()}`}
      </button>
    </div>
  )
}
