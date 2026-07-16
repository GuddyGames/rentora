import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, removeFromCart, setQty, subtotal, deliveryTotal, depositTotal, total } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold text-midnight">Your cart is empty</h1>
        <p className="mt-3 text-midnight/60">Add equipment from the browse page to get started.</p>
        <Link to="/browse" className="mt-6 inline-block rounded-full bg-gold px-6 py-3 font-medium text-midnightdeep hover:brightness-110 transition-colors">
          Browse equipment
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-midnight">Your cart</h1>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.listingId} className="glass flex items-center gap-4 rounded-2xl p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5">
              {item.imageBase64 && <img src={item.imageBase64} alt={item.title} className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display font-semibold text-midnight">{item.title}</p>
              <p className="text-sm text-midnight/60">{item.ownerName} · {item.startDate} → {item.endDate} ({item.days}d)</p>
              {item.deliveryCost > 0 && <p className="text-xs text-midnight/50">+ ₦{item.deliveryCost.toLocaleString()} delivery</p>}
              {item.securityDeposit > 0 && <p className="text-xs text-midnight/50">+ ₦{(item.securityDeposit * item.qty).toLocaleString()} refundable deposit</p>}

              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setQty(item.listingId, item.qty - 1)}
                  disabled={item.qty <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 text-midnight hover:border-gold hover:text-gold disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-6 text-center font-mono text-sm text-midnight">{item.qty}</span>
                <button
                  onClick={() => setQty(item.listingId, item.qty + 1)}
                  disabled={item.qty >= item.maxQty}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 text-midnight hover:border-gold hover:text-gold disabled:opacity-30"
                >
                  +
                </button>
                <span className="text-xs text-muted">of {item.maxQty} available</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="font-mono font-semibold text-gold">₦{(item.pricePerDay * item.days * item.qty).toLocaleString()}</p>
              <button
                onClick={() => removeFromCart(item.listingId)}
                aria-label="Remove item"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ruby hover:bg-ruby/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass mt-8 rounded-2xl p-5 text-sm text-midnight/80">
        <div className="flex justify-between"><span>Rental subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
        {deliveryTotal > 0 && <div className="flex justify-between"><span>Delivery</span><span>₦{deliveryTotal.toLocaleString()}</span></div>}
        {depositTotal > 0 && <div className="flex justify-between"><span>Refundable deposits</span><span>₦{depositTotal.toLocaleString()}</span></div>}
        <div className="mt-2 flex justify-between border-t border-black/10 pt-2 font-mono text-base font-semibold text-midnight">
          <span>Total</span><span>₦{total.toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        className="mt-6 w-full rounded-full bg-gold px-5 py-3 font-medium text-midnightdeep transition-colors hover:brightness-110"
      >
        Proceed to checkout
      </button>
    </div>
  )
}
