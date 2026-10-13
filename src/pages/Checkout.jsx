import { useMemo, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { getCoupon } from '../services/coupons'
import { geocodeAddress } from '../utils/geocode'
import PaymentSuccessOverlay from '../components/PaymentSuccessOverlay'
import AddressMap from '../components/AddressMap'
import BackButton from '../components/BackButton'

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [couponBusy, setCouponBusy] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Coupons discount rental charges only; delivery and refundable deposits are
  // kept at their listed amounts. The payment total must equal booking totals.
  const payableTotal = useMemo(() => items.reduce((sum, item) => {
    const rental = Math.round(Number(item.pricePerDay) * Number(item.days) * Number(item.qty || 1) * (1 - discountPercent / 100))
    return sum + rental + Number(item.deliveryCost || 0) + Number(item.securityDeposit || 0) * Number(item.qty || 1)
  }, 0), [items, discountPercent])

  async function handlePreviewLocation() {
    setGeocodeError('')
    setCoords(null)
    setGeocoding(true)
    try {
      const result = await geocodeAddress(address)
      if (result) setCoords(result)
      else setGeocodeError("Couldn't find that on the map — you can still check out, just double-check the address is right.")
    } catch {
      setGeocodeError('The map lookup failed. You can still enter the delivery address manually.')
    } finally {
      setGeocoding(false)
    }
  }

  async function handleApplyCoupon() {
    setCouponBusy(true)
    setCouponMsg('')
    try {
      const coupon = await getCoupon(couponCode.trim().toUpperCase())
      if (coupon && coupon.active !== false && Number(coupon.percentOff) > 0 && Number(coupon.percentOff) <= 100) {
        setDiscountPercent(Number(coupon.percentOff))
        setCouponMsg(`Applied — ${coupon.percentOff}% off rental charges.`)
      } else {
        setDiscountPercent(0)
        setCouponMsg('That code isn’t valid.')
      }
    } catch {
      setDiscountPercent(0)
      setCouponMsg('Could not check that code. Please try again.')
    } finally {
      setCouponBusy(false)
    }
  }

  async function handlePay() {
    if (!user) { navigate('/login'); return }
    if (!items.length) { setError('Your cart is empty.'); return }
    if (!address.trim()) { setError('Add a delivery address before checking out.'); return }
    if (!agreed) { setError('You need to accept the rental agreement to continue.'); return }
    if (!Number.isFinite(payableTotal) || payableTotal <= 0) { setError('The checkout total is invalid. Please review your cart.'); return }
    if (!window.PaystackPop || !import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      setError('Online payment is not configured yet. Your cart is safe; please try again later or contact support.')
      return
    }

    setError('')
    setBusy(true)
    let createdBookings = []

    try {
      for (const item of items) {
        const qty = Number(item.qty || 1)
        const maxQty = Number(item.maxQty || 1)
        if (qty < 1 || qty > maxQty) throw new Error(`Please review the quantity for “${item.title}”.`)
        if (!item.startDate || !item.endDate || new Date(item.startDate) > new Date(item.endDate)) {
          throw new Error(`Please choose valid rental dates for “${item.title}”.`)
        }
      }

      const createBookings = httpsCallable(getFunctions(), 'createPendingBookings')
      const bookingResult = await createBookings({
        items: items.map((item) => ({
          listingId: item.listingId,
          qty: Number(item.qty || 1),
          startDate: item.startDate,
          endDate: item.endDate,
        })),
        deliveryAddress: address.trim(),
        couponCode: discountPercent > 0 ? couponCode.trim().toUpperCase() : '',
        expectedTotal: payableTotal,
      })
      createdBookings = bookingResult.data.bookingIds.map((id) => ({ id }))
      if (!createdBookings.length) throw new Error('No bookings were created. Please try again.')

      const reference = `rentora-${user.uid.slice(0, 8)}-${Date.now()}`
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.round(payableTotal * 100),
        currency: 'NGN',
        ref: reference,
        callback: async (response) => {
          try {
            if (!response?.reference) throw new Error('Paystack did not return a payment reference.')
            const verifyPayment = httpsCallable(getFunctions(), 'verifyPaystackPayment')
            await verifyPayment({
              reference: response.reference,
              bookingIds: createdBookings.map((booking) => booking.id),
            })
            clearCart()
            setShowSuccess(true)
          } catch (verificationError) {
            setError(verificationError?.message || 'Payment could not be verified yet. Do not pay again; refresh or contact support with your payment reference.')
            setBusy(false)
          }
        },
        onClose: () => setBusy(false),
      })
      handler.openIframe()
    } catch (e) {
      setError(e?.message || 'Checkout failed. Please try again.')
      setBusy(false)
    }
  }

  if (items.length === 0 && !showSuccess) {
    return <div className="mx-auto max-w-lg px-5 py-16 text-center text-midnight/60">Your cart is empty.</div>
  }

  if (showSuccess) {
    return <PaymentSuccessOverlay onDone={() => navigate('/my-bookings')} />
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <BackButton to="/cart" label="Cart" />
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Secure checkout</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-midnight">Checkout</h1>
      <p className="mt-2 text-sm text-midnight/60">Your booking stays pending until the payment provider confirms your payment.</p>

      <label className="mt-6 block text-sm text-midnight/70">
        Delivery address
        <textarea
          value={address}
          onChange={(e) => { setAddress(e.target.value); setCoords(null); setGeocodeError('') }}
          rows={3}
          required
          maxLength={500}
          placeholder="Street, area, city, state"
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-midnight placeholder:text-midnight/40"
        />
      </label>

      <button type="button" onClick={handlePreviewLocation} disabled={!address.trim() || geocoding} className="mt-2 text-sm text-royal hover:underline disabled:opacity-50">
        {geocoding ? 'Looking up…' : '📍 Preview on map'}
      </button>
      {geocodeError && <p className="mt-1 text-sm text-midnight/50">{geocodeError}</p>}
      {coords && <div className="mt-2"><AddressMap lat={coords.lat} lon={coords.lon} label={address} /><p className="mt-1 text-xs text-midnight/50">{coords.displayName}</p></div>}

      <div className="mt-5 flex gap-2">
        <input
          type="text"
          aria-label="Coupon code"
          placeholder="Coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          maxLength={40}
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-midnight placeholder:text-midnight/40"
        />
        <button type="button" onClick={handleApplyCoupon} disabled={couponBusy || !couponCode.trim()} className="rounded-xl border border-black/15 px-4 py-3 text-sm font-medium text-midnight hover:border-gold hover:text-gold disabled:opacity-50">
          {couponBusy ? 'Checking…' : 'Apply'}
        </button>
      </div>
      {couponMsg && <p className="mt-1 text-sm text-midnight/70" aria-live="polite">{couponMsg}</p>}

      <label className="mt-5 flex items-start gap-2 text-sm text-midnight/70">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
        <span>I agree to the rental agreement. I’m responsible for equipment condition until it’s returned; refundable deposits are handled after inspection.</span>
      </label>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 text-sm text-midnight/80">
        <div className="flex justify-between"><span>Rental charges</span><span>₦{items.reduce((sum, item) => sum + Number(item.pricePerDay) * Number(item.days) * Number(item.qty || 1), 0).toLocaleString()}</span></div>
        {discountPercent > 0 && <div className="mt-1 flex justify-between text-emerald"><span>Coupon discount</span><span>-{discountPercent}% on rental charges</span></div>}
        <div className="mt-1 flex justify-between"><span>Delivery and deposits</span><span>₦{items.reduce((sum, item) => sum + Number(item.deliveryCost || 0) + Number(item.securityDeposit || 0) * Number(item.qty || 1), 0).toLocaleString()}</span></div>
        <div className="mt-3 flex justify-between border-t border-black/10 pt-3 font-mono text-base font-semibold text-midnight"><span>Total due</span><span>₦{payableTotal.toLocaleString()}</span></div>
        <p className="mt-2 text-xs text-midnight/50">Prices are shown in Nigerian naira (NGN).</p>
      </div>

      {error && <p className="mt-3 rounded-xl border border-ruby/20 bg-ruby/5 p-3 text-sm text-ruby" role="alert">{error}</p>}
      <button onClick={handlePay} disabled={busy || !agreed || !address.trim()} className="mt-6 w-full rounded-full bg-gold px-5 py-3.5 font-semibold text-midnightdeep transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? 'Processing…' : `Pay ₦${payableTotal.toLocaleString()}`}
      </button>
      <p className="mt-3 text-center text-xs text-midnight/50">Payment is verified securely before bookings are confirmed.</p>
    </div>
  )
}
