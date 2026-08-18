// Shows a pin at a fixed address using OpenStreetMap's free embed — no API
// key, no billing. This is a static location pin, not live vehicle tracking:
// there's no GPS hardware feed behind it, so it only shows where delivery is
// headed, not where the vehicle currently is.
export default function AddressMap({ lat, lon, label }) {
  if (!lat || !lon) return null

  const delta = 0.006
  const bbox = `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`

  return (
    <div className="overflow-hidden rounded-xl border border-black/10">
      <iframe
        title={label || 'Delivery location'}
        src={src}
        className="h-52 w-full"
        loading="lazy"
      />
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`}
        target="_blank"
        rel="noreferrer"
        className="block bg-white px-3 py-2 text-center text-xs text-royal hover:underline"
      >
        Open larger map
      </a>
    </div>
  )
}
