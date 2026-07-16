import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { hasConflict, createBooking, markPaid } from '../services/bookings'
import { getCoupon } from '../services/coupons'
import PaymentSuccessOverlay from '../components/PaymentSuccessOverlay'

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [address, setAddress] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const discountedTotal = Math.round(total * (1 - discountPercent / 100))

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
        const conflict = await hasConflict(item.listingId, item.startDate, item.endDate)
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
        })
        createdBookings.push(ref.id)
      }

      if (window.PaystackPop && import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: discountedTotal * 100,
          currency: 'NGN',
          ref: createdBookings[0],
          callback: () => {
            Promise.all(createdBookings.map((id) => markPaid(id, createdBookings[0]))).then(() => {
              clearCart()
              setShowSuccess(true)
            })
          },
          onClose: () => setBusy(false),
        })
        handler.openIframe()
      } else {
        // Paystack key not set yet — bookings are still recorded as pending.
        clearCart()
        setShowSuccess(true)
      }
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (items.length === 0) {
    return <div className="mx-auto max-w-lg px-5 py-16 text-center text-midnight/60">Your cart is empty.</div>
  }

  if (showSuccess) {
    return <PaymentSuccessOverlay onDone={() => navigate('/my-bookings')} />
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-midnight">Checkout</h1>

      <label className="mt-6 block text-sm text-midnight/70">
        Delivery address
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          placeholder="Where should the equipment be delivered?"
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />
      </label>

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

      <div className="mt-6 rounded-xl border border-black/10 bg-white p-5 text-sm text-midnight/80">
        {discountPercent > 0 && (
          <div className="flex justify-between text-gold"><span>Discount</span><span>-{discountPercent}%</span></div>
        )}
        <div className="mt-1 flex justify-between border-t border-black/10 pt-2 font-mono text-base font-semibold text-midnight">
          <span>Total due</span><span>₦{discountedTotal.toLocaleString()}</span>
        </div>
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
