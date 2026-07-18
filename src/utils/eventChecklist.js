// Rule-of-thumb quantities, not a real AI model — good enough to give someone
// a starting checklist. Numbers are rough industry norms for Nigerian events.
export const EVENT_TYPES = [
  { id: 'wedding', label: 'Wedding', emoji: '💍' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'conference', label: 'Conference', emoji: '🏢' },
  { id: 'graduation', label: 'Graduation', emoji: '🎓' },
  { id: 'concert', label: 'Concert', emoji: '🎵' },
  { id: 'engagement', label: 'Engagement', emoji: '💐' },
  { id: 'house_party', label: 'House Party', emoji: '🎈' },
  { id: 'burial', label: 'Burial / memorial', emoji: '🕯️' },
]

export function generateChecklist(eventTypeId, guests, setting = 'outdoor') {
  const g = Math.max(1, Number(guests) || 0)
  const items = []
  const outdoor = setting === 'outdoor'

  items.push({ category: 'Chairs', quantity: g })
  items.push({ category: 'Tables', quantity: Math.ceil(g / 8) })

  if (outdoor) {
    items.push({ category: 'Canopy', quantity: Math.ceil(g / 50) })
    // outdoor sound/lighting draws real power — scale generator capacity with crowd size
    items.push({ category: 'Generators', quantity: Math.max(1, Math.ceil(g / 150)) })
  } else if (g > 150) {
    items.push({ category: 'Cooling Fans', quantity: Math.ceil(g / 60) })
  }

  // one PA/speaker set comfortably covers ~120-150 guests outdoors before
  // you need a second stack to actually be heard at the back
  items.push({ category: 'Sound & AV', quantity: Math.max(1, Math.ceil(g / 130)) })

  if (['wedding', 'birthday', 'engagement', 'house_party'].includes(eventTypeId)) {
    items.push({ category: 'Lighting', quantity: Math.ceil(g / 100) || 1 })
    items.push({ category: 'Decoration', quantity: 1 })
  }

  if (['wedding', 'engagement'].includes(eventTypeId) && g > 100) {
    items.push({ category: 'Stage', quantity: 1 })
    items.push({ category: 'DJ Equipment', quantity: 1 })
  }

  if (['conference', 'graduation'].includes(eventTypeId)) {
    items.push({ category: 'Microphones', quantity: Math.max(2, Math.ceil(g / 75)) })
    items.push({ category: 'Projectors', quantity: Math.max(1, Math.ceil(g / 150)) })
    if (g > 100) items.push({ category: 'LED Screens', quantity: Math.max(1, Math.ceil(g / 300)) })
  }

  if (eventTypeId === 'concert') {
    items.push({ category: 'Stage', quantity: g > 800 ? 2 : 1 })
    items.push({ category: 'Sound & AV', quantity: Math.max(2, Math.ceil(g / 100)) })
    items.push({ category: 'Lighting', quantity: Math.max(2, Math.ceil(g / 200)) })
  }

  if (eventTypeId === 'burial') {
    items.push({ category: 'Tent', quantity: Math.ceil(g / 60) })
    items.push({ category: 'Cooling Fans', quantity: Math.ceil(g / 40) })
  }

  if (g > 150) {
    items.push({ category: 'Mobile Toilets', quantity: Math.ceil(g / 150) })
  }

  // dedupe categories pushed by more than one rule (e.g. concert's stronger
  // Sound & AV formula vs. the general one) by keeping the larger quantity
  const merged = new Map()
  for (const item of items) {
    if (item.quantity <= 0) continue
    const existing = merged.get(item.category)
    merged.set(item.category, existing ? Math.max(existing, item.quantity) : item.quantity)
  }
  return Array.from(merged, ([category, quantity]) => ({ category, quantity }))
}
