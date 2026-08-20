import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BOOST_PLANS, applyBoost } from '../services/boosts'
import BackButton from '../components/BackButton'

function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-2 border-b border-white/10 py-2.5 text-sm last:border-0">
      <span className="mt-0.5 text-emerald">✓</span>
      <span>{children}</span>
    </li>
  )
}

export default function Pricing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [planId, setPlanId] = useState(BOOST_PLANS[1].id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const plan = BOOST_PLANS.find((p) => p.id === planId)

  async function handleBoost() {
    if (!user) { navigate('/login'); return }
    if (profile?.role !== 'owner') {
      setError('Boosting is for equipment owners — list something first from your Dashboard.')
      return
    }
    setError('')
    setBusy(true)

    if (window.PaystackPop && import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: plan.price * 100,
        currency: 'NGN',
        ref: `boost_${user.uid}_${Date.now()}`,
        callback: (response) => {
          applyBoost({ ownerId: user.uid, planId, paymentReference: response.reference })
            .then((result) => setSuccess(result))
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false))
        },
        onClose: () => setBusy(false),
      })
      handler.openIframe()
    } else {
      setError('Payments aren\u2019t configured yet — add VITE_PAYSTACK_PUBLIC_KEY to test this.')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <BackButton to="/" />
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">Pricing</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-midnight">Grow your rental business</h1>
      <p className="mt-2 max-w-xl text-midnight/60">
        Straightforward pricing — every tier below reflects something that actually works today, not a wishlist.
      </p>

      {success && (
        <div className="mt-6 rounded-xl border border-emerald/30 bg-emerald/10 p-4 text-sm text-emerald">
          Boosted {success.listingsAffected} listing{success.listingsAffected === 1 ? '' : 's'} — featured until{' '}
          {new Date(success.featuredUntil).toLocaleDateString()}.
        </div>
      )}
      {error && <p className="mt-6 rounded-xl border border-ruby/30 bg-ruby/10 p-4 text-sm text-ruby">{error}</p>}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Free tier */}
        <div className="rounded-3xl bg-midnight p-6 text-mist">
          <p className="text-sm text-mist/60">Starter</p>
          <p className="mt-1 font-display text-3xl font-semibold">Free</p>
          <p className="mt-1 text-sm text-mist/50">Forever, for every owner</p>
          <button
            onClick={() => navigate(user ? '/add-listing' : '/signup')}
            className="mt-5 w-full rounded-full border border-white/20 py-2.5 text-sm font-medium hover:border-gold hover:text-gold"
          >
            Get started
          </button>
          <ul className="mt-6">
            <CheckItem>Unlimited equipment listings</CheckItem>
            <CheckItem>Booking &amp; delivery-status dashboard</CheckItem>
            <CheckItem>In-app messaging with renters</CheckItem>
            <CheckItem>Star ratings &amp; reviews</CheckItem>
            <CheckItem>Delivery-location map on every booking</CheckItem>
            <CheckItem>Standard support</CheckItem>
          </ul>
        </div>

        {/* Boost tier — the real, working paid tier */}
        <div className="relative -translate-y-0 rounded-3xl bg-gradient-to-b from-royal to-royal/80 p-6 text-white shadow-xl md:-translate-y-4">
          <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-midnight">
            Most popular
          </span>
          <p className="text-sm text-white/70">Boost</p>
          <div className="mt-2 flex gap-2">
            {BOOST_PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlanId(p.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  planId === p.id ? 'bg-white text-royal' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-3 font-display text-3xl font-semibold">₦{plan.price.toLocaleString()}</p>
          <p className="mt-1 text-sm text-white/60">One-time, covers all your active listings for {plan.days} days</p>
          <button
            onClick={handleBoost}
            disabled={busy}
            className="mt-5 w-full rounded-full bg-gold py-2.5 text-sm font-semibold text-midnight hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Processing…' : `Boost for ${plan.days} days`}
          </button>
          <ul className="mt-6">
            <CheckItem>Everything in Starter, and:</CheckItem>
            <CheckItem>Featured placement at the top of Browse</CheckItem>
            <CheckItem>Featured badge on your listing cards</CheckItem>
            <CheckItem>Priority in category results</CheckItem>
          </ul>
        </div>

        {/* Coming soon — honestly labeled, not sold */}
        <div className="rounded-3xl bg-midnight/95 p-6 text-mist opacity-90">
          <p className="text-sm text-mist/60">Business</p>
          <p className="mt-1 font-display text-2xl font-semibold">Coming soon</p>
          <p className="mt-1 text-sm text-mist/50">Not available to purchase yet</p>
          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-full border border-white/10 py-2.5 text-sm font-medium text-mist/40"
          >
            Not yet available
          </button>
          <ul className="mt-6">
            <CheckItem>Multi-listing bulk management</CheckItem>
            <CheckItem>Custom equipment categories</CheckItem>
            <CheckItem>Priority support queue</CheckItem>
          </ul>
          <p className="mt-4 text-xs text-mist/40">
            These need more building before they're real — this card is here so the roadmap is honest, not a preview of something you can buy today.
          </p>
        </div>
      </div>
    </div>
  )
}
