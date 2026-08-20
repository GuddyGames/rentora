import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EVENT_TYPES, generateChecklist } from '../utils/eventChecklist'
import { getAllListings, CATEGORIES } from '../services/listings'
import BackButton from '../components/BackButton'

const STEPS = ['type', 'guests', 'setting', 'budget', 'result']

function categoryIcon(name) {
  return CATEGORIES.find((c) => c.name === name)?.icon || '📦'
}

export default function PlanEvent() {
  const [searchParams] = useSearchParams()
  const [stepIdx, setStepIdx] = useState(0)
  const [eventType, setEventType] = useState('')
  const [guests, setGuests] = useState('')
  const [setting, setSetting] = useState('')
  const [budget, setBudget] = useState('')
  const [thinking, setThinking] = useState(false)
  const [checklist, setChecklist] = useState(null)
  const [buildError, setBuildError] = useState('')
  const [customName, setCustomName] = useState('')
  const [customQty, setCustomQty] = useState(1)

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
    setBuildError('')
    const items = generateChecklist(eventType, guests, setting)
    try {
      const withPricing = await Promise.all(
        items.map(async (item) => {
          try {
            const listings = await getAllListings({ category: item.category })
            const avgPrice = listings.length
              ? listings.reduce((sum, l) => sum + l.pricePerDay, 0) / listings.length
              : null
            return { ...item, avgPrice, listingCount: listings.length }
          } catch {
            // one category's query failing (e.g. a missing Firestore index)
            // shouldn't block the rest of the checklist
            return { ...item, avgPrice: null, listingCount: 0 }
          }
        })
      )
      setChecklist(withPricing)
    } catch (e) {
      setBuildError(e.message)
    } finally {
      setThinking(false)
    }
  }

  const total = checklist ? checklist.reduce((sum, i) => sum + (i.avgPrice ? i.avgPrice * i.quantity : 0), 0) : 0
  const budgetNum = Number(budget) || 0
  const overBudget = budgetNum > 0 && total > budgetNum

  function setQty(category, qty) {
    setChecklist((prev) => prev.map((i) => (i.category === category ? { ...i, quantity: Math.max(1, qty) } : i)))
  }

  function removeItem(category) {
    setChecklist((prev) => prev.filter((i) => i.category !== category))
  }

  async function addCustomItem(e) {
    e.preventDefault()
    const name = customName.trim()
    if (!name) return
    if (checklist?.some((i) => i.category.toLowerCase() === name.toLowerCase())) {
      setCustomName('')
      return
    }
    // if it happens to match a real category, price it the same way the
    // auto-generated items are priced; otherwise it's just a personal to-do
    const matched = CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase())
    let avgPrice = null
    let listingCount = 0
    if (matched) {
      try {
        const listings = await getAllListings({ category: matched.name })
        listingCount = listings.length
        avgPrice = listings.length ? listings.reduce((sum, l) => sum + l.pricePerDay, 0) / listings.length : null
      } catch {
        // fine, it just shows as an unpriced custom item
      }
    }
    setChecklist((prev) => [...prev, { category: matched ? matched.name : name, quantity: customQty, avgPrice, listingCount, custom: true }])
    setCustomName('')
    setCustomQty(1)
  }

  const step = STEPS[stepIdx]

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      {stepIdx === 0 ? (
        <BackButton to="/" />
      ) : (
        <button
          onClick={() => goTo(stepIdx - 1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-midnight/60 hover:text-gold transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
      )}
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
          ) : buildError ? (
            <div className="py-10 text-center">
              <p className="text-ruby">Couldn't build your checklist: {buildError}</p>
              <button onClick={handleBuildChecklist} className="mt-4 rounded-full border border-black/15 px-5 py-2 text-sm text-midnight hover:border-gold hover:text-gold">
                Try again
              </button>
            </div>
          ) : checklist ? (
            <div className="animate-pop-in">
              <h2 className="font-display text-xl font-semibold text-midnight">Here's what you'll need</h2>
              <p className="mt-1 text-xs text-muted">Adjust quantities, remove what you don't need, or add your own.</p>
              <div className="mt-4 space-y-2">
                {checklist.map((item, i) => (
                  <div
                    key={item.category}
                    className="glass flex items-center justify-between gap-3 rounded-2xl p-4"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-xl">{categoryIcon(item.category)}</span>
                      <div className="min-w-0">
                        {CATEGORIES.some((c) => c.name === item.category) ? (
                          <Link to={`/browse?category=${encodeURIComponent(item.category)}`} className="truncate font-display font-semibold text-midnight hover:text-gold">
                            {item.category}
                          </Link>
                        ) : (
                          <p className="truncate font-display font-semibold text-midnight">{item.category}</p>
                        )}
                        <div className="mt-1 flex items-center gap-1.5">
                          <button
                            onClick={() => setQty(item.category, item.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-midnight/60 hover:border-gold hover:text-gold"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-mono text-sm text-midnight">{item.quantity}</span>
                          <button
                            onClick={() => setQty(item.category, item.quantity + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-midnight/60 hover:border-gold hover:text-gold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right text-sm">
                        {item.avgPrice ? (
                          <p className="font-mono text-midnight/80">~₦{Math.round(item.avgPrice * item.quantity).toLocaleString()}</p>
                        ) : (
                          <p className="text-muted">{item.custom ? 'Personal item' : 'Nothing listed yet'}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.category)}
                        aria-label={`Remove ${item.category}`}
                        className="text-midnight/30 hover:text-ruby"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={addCustomItem} className="glass mt-3 flex items-center gap-2 rounded-2xl p-3">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Add something else — photographer, cake, MC…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-midnight placeholder:text-muted focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={customQty}
                  onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value)))}
                  className="w-14 rounded-lg border border-black/10 bg-white px-2 py-1 text-center text-sm text-midnight"
                />
                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="shrink-0 rounded-full bg-midnight px-3 py-1.5 text-sm font-medium text-gold disabled:opacity-40"
                >
                  + Add
                </button>
              </form>

              <div className={`mt-4 flex justify-between rounded-2xl border p-4 font-mono ${
                overBudget ? 'border-ruby/40 bg-ruby/10' : 'border-emerald/40 bg-emerald/10'
              }`}>
                <span className="text-midnight">Estimated total</span>
                <span className={`font-semibold ${overBudget ? 'text-ruby' : 'text-emerald'}`}>
                  ₦{Math.round(total).toLocaleString()}
                </span>
              </div>
              {(() => {
                const pricedCount = checklist.filter((i) => i.avgPrice).length
                return pricedCount < checklist.length ? (
                  <p className="mt-2 text-xs text-muted">
                    Based on {pricedCount} of {checklist.length} categories with active listings — the rest aren't stocked yet, so this total is likely an undercount for a full event this size.
                  </p>
                ) : null
              })()}
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
          ) : null}
        </div>
      )}
    </div>
  )
}
