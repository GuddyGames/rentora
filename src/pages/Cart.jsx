import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import BackButton from '../components/BackButton'

function Money({ value, className = '' }) {
  return <span className={className}>₦{Number(value || 0).toLocaleString()}</span>
}

function Step({ number, label, active, complete }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${complete ? 'bg-emerald text-white' : active ? 'bg-midnight text-white' : 'bg-black/5 text-midnight/40'}`}>
        {complete ? '✓' : number}
      </span>
      <span className={`text-xs font-medium sm:text-sm ${active ? 'text-midnight' : 'text-midnight/45'}`}>{label}</span>
    </div>
  )
}

export default function Cart() {
  const { items, removeFromCart, setQty, subtotal, deliveryTotal, depositTotal, total } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <main className="min-h-[65vh] bg-[#f7f8fc] px-5 py-10">
        <div className="mx-auto max-w-xl">
          <BackButton to="/browse" label="Browse equipment" />
          <div className="mt-10 rounded-[2rem] border border-black/[0.06] bg-white px-6 py-12 text-center shadow-sm sm:px-12">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15 text-3xl" aria-hidden="true">🛒</span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Your event starts here</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-midnight">Your cart is waiting.</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-midnight/55">Explore canopies, chairs, sound and more. When you find the right setup, it will be saved here.</p>
            <Link to="/browse" className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-midnight px-6 py-3 font-semibold text-white transition hover:bg-royal">Explore equipment <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[#f7f8fc] px-5 py-7 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <BackButton to="/browse" label="Keep browsing" />
        <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Almost there</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-midnight sm:text-4xl">Your event cart</h1>
            <p className="mt-2 text-sm text-midnight/55">{items.length} rental item{items.length === 1 ? '' : 's'} selected. Review the details before checkout.</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
            <Step number="1" label="Cart" active />
            <span className="h-px w-5 bg-black/10" />
            <Step number="2" label="Delivery" />
            <span className="h-px w-5 bg-black/10" />
            <Step number="3" label="Payment" />
          </div>
        </div>

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_350px]">
          <section aria-label="Items in your cart" className="space-y-3">
            {items.map((item) => (
              <article key={item.listingId} className="rounded-3xl border border-black/[0.06] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex gap-3 sm:gap-5">
                  <Link to={`/listing/${item.listingId}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-mist sm:h-32 sm:w-36">
                    {item.imageBase64 ? <img src={item.imageBase64} alt={item.title} className="h-full w-full object-cover transition hover:scale-105" /> : <span className="flex h-full items-center justify-center text-xs text-midnight/35">No photo</span>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-semibold text-midnight sm:text-lg">{item.title}</p>
                        <p className="mt-1 text-xs text-midnight/45 sm:text-sm">{item.ownerName || 'Rental partner'}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.listingId)} aria-label={`Remove ${item.title} from cart`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-midnight/35 transition hover:bg-ruby/10 hover:text-ruby">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-midnight/55">
                      <span className="rounded-full bg-mist px-2.5 py-1">{item.startDate}</span>
                      <span aria-hidden="true">→</span>
                      <span className="rounded-full bg-mist px-2.5 py-1">{item.endDate}</span>
                      <span className="text-midnight/35">·</span>
                      <span>{item.days} day{item.days === 1 ? '' : 's'}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-midnight/45">Quantity</p>
                        <div className="mt-1 inline-flex items-center rounded-full border border-black/10 p-1">
                          <button onClick={() => setQty(item.listingId, item.qty - 1)} disabled={item.qty <= 1} aria-label="Decrease quantity" className="flex h-7 w-7 items-center justify-center rounded-full text-midnight transition hover:bg-mist disabled:opacity-25">−</button>
                          <span className="min-w-8 text-center text-sm font-semibold text-midnight">{item.qty}</span>
                          <button onClick={() => setQty(item.listingId, item.qty + 1)} disabled={item.qty >= item.maxQty} aria-label="Increase quantity" className="flex h-7 w-7 items-center justify-center rounded-full text-midnight transition hover:bg-mist disabled:opacity-25">+</button>
                        </div>
                        <p className="mt-1 text-[10px] text-midnight/35">{item.maxQty} available</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-semibold text-midnight"><Money value={item.pricePerDay * item.days * item.qty} /></p>
                        <p className="text-[11px] text-midnight/45"><Money value={item.pricePerDay} /> / day × {item.days}d × {item.qty}</p>
                      </div>
                    </div>
                    {(item.deliveryCost > 0 || item.securityDeposit > 0) && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-black/[0.05] pt-3 text-[11px] text-midnight/45">
                        {item.deliveryCost > 0 && <span>Delivery: <Money value={item.deliveryCost} /></span>}
                        {item.securityDeposit > 0 && <span>Refundable deposit: <Money value={item.securityDeposit * item.qty} /></span>}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
            <div className="flex items-start gap-3 rounded-2xl border border-emerald/15 bg-emerald/5 p-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald" aria-hidden="true">✓</span>
              <div>
                <p className="text-sm font-semibold text-midnight">You stay in control</p>
                <p className="mt-1 text-xs leading-5 text-midnight/55">Review your rental dates and quantities now. You'll add the delivery address and review payment details in the next step.</p>
              </div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-xl font-semibold text-midnight">Order summary</h2>
              <p className="mt-1 text-xs text-midnight/45">A clear breakdown before you continue</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3 text-midnight/60"><span>Rental subtotal</span><Money value={subtotal} className="font-medium text-midnight" /></div>
                {deliveryTotal > 0 && <div className="flex justify-between gap-3 text-midnight/60"><span>Delivery</span><Money value={deliveryTotal} className="font-medium text-midnight" /></div>}
                {depositTotal > 0 && <div className="flex justify-between gap-3 text-midnight/60"><span>Refundable deposits</span><Money value={depositTotal} className="font-medium text-midnight" /></div>}
                <div className="border-t border-dashed border-black/15 pt-4">
                  <div className="flex items-end justify-between gap-3">
                    <div><p className="font-semibold text-midnight">Estimated total</p><p className="mt-1 text-[11px] text-midnight/40">Final details at checkout</p></div>
                    <Money value={total} className="font-mono text-xl font-semibold text-midnight" />
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('/checkout')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-3.5 font-semibold text-midnight transition hover:-translate-y-0.5 hover:brightness-105">
                Continue to checkout <span aria-hidden="true">→</span>
              </button>
              <Link to="/browse" className="mt-3 block py-2 text-center text-sm font-medium text-midnight/55 transition hover:text-royal">+ Add more equipment</Link>
              <div className="mt-4 flex items-center justify-center gap-2 border-t border-black/[0.05] pt-4 text-[11px] text-midnight/40">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></svg>
                Secure checkout experience
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
