import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EVENT_TYPES, generateChecklist } from '../utils/eventChecklist'
import { getAllListings } from '../services/listings'

const STEPS = ['type', 'guests', 'setting', 'budget', 'result']

export default function PlanEvent() {
  const [searchParams] = useSearchParams()
  const [stepIdx, setStepIdx] = useState(0)
  const [eventType, setEventType] = useState('')
  const [guests, setGuests] = useState('')
  const [setting, setSetting] = useState('')
  const [budget, setBudget] = useState('')
  const [thinking, setThinking] = useState(false)
  const [checklist, setChecklist] = useState(null)

  // arriving from a Home event-type card pre-selects the type and skips ahead
  useEffect(() => {
    const preset = searchParams.get('type')
    if (preset && EVENT_TYPES.some((t) => t.id === preset)) {
      setEventType(preset)
      setStepIdx(1)
    }
  }, [searchParams])

  function goTo(idx) {
    setStepIdx(idx)
  }

  async function handleBuildChecklist() {
    setThinking(true)
    setStepIdx(4)
    const items = generateChecklist(eventType, guests, setting)
    const withPricing = await Promise.all(
      items.map(async (item) => {
        const listings = await getAllListings({ category: item.category })
        const avgPrice = listings.length
          ? listings.reduce((sum, l) => sum + l.pricePerDay, 0) / listings.length
          : null
        return { ...item, avgPrice, listingCount: listings.length }
      })
    )
    setChecklist(withPricing)
    setThinking(false)
  }

  const total = checklist ? checklist.reduce((sum, i) => sum + (i.avgPrice ? i.avgPrice * i.quantity : 0), 0) : 0
  const budgetNum = Number(budget) || 0
  const overBudget = budgetNum > 0 && total > budgetNum

  const step = STEPS[stepIdx]

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">✨ Plan my event</p>

      {/* progress dots */}
      <div className="mt-4 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${i <= stepIdx ? 'bg-gold' : 'bg-black/5'}`} />
        ))}
      </div>

      {step === 'type' && (
        <div className="animate-pop-in mt-8">
          <h1 className="font-display text-2xl font-semibold text-midnight">What event are you planning?</h1>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setEventType(t.id); goTo(1) }}
                className={`glass flex flex-col items-center gap-2 rounded-2xl px-4 py-6 transition-transform hover:-translate-y-1 ${
                  eventType === t.id ? 'border-gold/50' : ''
                }`}
              >
                <span className="text-3xl">{t.emoji}</span>
                <span className="text-sm font-medium text-midnight/90">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'guests' && (
        <div className="animate-pop-in mt-10 text-center">
          <h1 className="font-display text-2xl font-semibold text-midnight">How many guests?</h1>
          <input
            type="number"
            min="1"
            autoFocus
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder="e.g. 150"
            className="mt-6 w-full rounded-2xl border border-black/10 bg-black/5 px-5 py-4 text-center font-display text-3xl text-midnight placeholder:text-muted focus:outline-none"
          />
          <button
            onClick={() => goTo(2)}
            disabled={!guests}
            className="mt-6 w-full rounded-full bg-gold px-5 py-3 font-medium text-midnight transition-all hover:brightness-110 disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'setting' && (
        <div className="animate-pop-in mt-10 text-center">
          <h1 className="font-display text-2xl font-semibold text-midnight">Indoor or outdoor?</h1>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { id: 'outdoor', label: 'Outdoor', emoji: '☀️' },
              { id: 'indoor', label: 'Indoor', emoji: '🏛️' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => { setSetting(o.id); goTo(3) }}
                className="glass flex flex-col items-center gap-2 rounded-2xl px-4 py-8 transition-transform hover:-translate-y-1"
              >
                <span className="text-3xl">{o.emoji}</span>
                <span className="text-sm font-medium text-midnight/90">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'budget' && (
        <div className="animate-pop-in mt-10 text-center">
          <h1 className="font-display text-2xl font-semibold text-midnight">What's your budget?</h1>
          <p className="mt-1 text-sm text-muted">Optional — helps flag if the checklist runs over</p>
          <div className="mt-6 flex items-center rounded-2xl border border-black/10 bg-black/5 px-5 py-4">
            <span className="font-display text-2xl text-muted">₦</span>
            <input
              type="number"
              min="0"
              autoFocus
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Optional"
              className="w-full bg-transparent text-center font-display text-2xl text-midnight placeholder:text-muted focus:outline-none"
            />
          </div>
          <button
            onClick={handleBuildChecklist}
            className="mt-6 w-full rounded-full bg-gold px-5 py-3 font-medium text-midnight transition-all hover:brightness-110"
          >
            Build my checklist
          </button>
        </div>
      )}

      {step === 'result' && (
        <div className="mt-10">
          {thinking ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <p className="mt-4 text-midnight/70">Putting your checklist together…</p>
            </div>
          ) : (
            <div className="animate-pop-in">
              <h2 className="font-display text-xl font-semibold text-midnight">Here's what you'll need</h2>
              <div className="mt-4 space-y-2">
                {checklist.map((item, i) => (
                  <div
                    key={item.category}
                    className="glass flex items-center justify-between rounded-2xl p-4"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div>
                      <Link to={`/browse?category=${encodeURIComponent(item.category)}`} className="font-display font-semibold text-midnight hover:text-gold">
                        {item.category}
                      </Link>
                      <p className="text-sm text-muted">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right text-sm">
                      {item.avgPrice ? (
                        <p className="font-mono text-midnight/80">~₦{Math.round(item.avgPrice * item.quantity).toLocaleString()}</p>
                      ) : (
                        <p className="text-muted">Nothing listed yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-4 flex justify-between rounded-2xl border p-4 font-mono ${
                overBudget ? 'border-ruby/40 bg-ruby/10' : 'border-emerald/40 bg-emerald/10'
              }`}>
                <span className="text-midnight">Estimated total</span>
                <span className={`font-semibold ${overBudget ? 'text-ruby' : 'text-emerald'}`}>
                  ₦{Math.round(total).toLocaleString()}
                </span>
              </div>
              {budgetNum > 0 && (
                <p className={`mt-2 text-sm ${overBudget ? 'text-ruby' : 'text-emerald'}`}>
                  {overBudget
                    ? `That's ₦${Math.round(total - budgetNum).toLocaleString()} over your ₦${budgetNum.toLocaleString()} budget.`
                    : `Within your ₦${budgetNum.toLocaleString()} budget.`}
                </p>
              )}

              <Link
                to="/browse"
                className="mt-6 block w-full rounded-full bg-gold px-5 py-3 text-center font-medium text-midnight transition-all hover:brightness-110"
              >
                Start booking
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
