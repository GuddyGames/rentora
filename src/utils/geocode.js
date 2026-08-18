// Converts a typed address into coordinates using OpenStreetMap's free
// Nominatim service. No API key needed, but it's rate-limited and meant for
// light use — call it on an explicit button press, never on every keystroke.
export async function geocodeAddress(address) {
  if (!address || address.trim().length < 5) return null

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Location lookup failed — try again in a moment.')

  const results = await res.json()
  if (!results.length) return null

  return {
    lat: parseFloat(results[0].lat),
    lon: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  }
}
