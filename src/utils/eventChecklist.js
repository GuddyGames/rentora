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
    items.push({ category: 'Generators', quantity: g > 60 ? 1 : 0 })
  } else if (g > 150) {
    items.push({ category: 'Cooling Fans', quantity: Math.ceil(g / 60) })
  }

  if (g > 80) {
    items.push({ category: 'Sound & AV', quantity: 1 })
  }

  if (['wedding', 'birthday', 'engagement', 'house_party'].includes(eventTypeId)) {
    items.push({ category: 'Lighting', quantity: Math.ceil(g / 100) || 1 })
    items.push({ category: 'Decoration', quantity: 1 })
  }

  if (['wedding', 'engagement'].includes(eventTypeId) && g > 100) {
    items.push({ category: 'Stage', quantity: 1 })
    items.push({ category: 'DJ Equipment', quantity: 1 })
  }

  if (['conference', 'graduation'].includes(eventTypeId)) {
    items.push({ category: 'Microphones', quantity: g > 50 ? 4 : 2 })
    items.push({ category: 'Projectors', quantity: 1 })
    if (g > 100) items.push({ category: 'LED Screens', quantity: 1 })
  }

  if (eventTypeId === 'concert') {
    items.push({ category: 'Stage', quantity: 1 })
    items.push({ category: 'Sound & AV', quantity: 1 })
    items.push({ category: 'Lighting', quantity: 2 })
  }

  if (eventTypeId === 'burial') {
    items.push({ category: 'Tent', quantity: Math.ceil(g / 60) })
    items.push({ category: 'Cooling Fans', quantity: Math.ceil(g / 40) })
  }

  if (g > 150) {
    items.push({ category: 'Mobile Toilets', quantity: Math.ceil(g / 150) })
  }

  return items.filter((i) => i.quantity > 0)
}
