import { Link } from 'react-router-dom'

export default function ListingCard({ listing }) {
  const isFeatured = listing.featured && (!listing.featuredUntil || listing.featuredUntil > Date.now())

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg shadow-black/10 transition-transform duration-200 hover:-translate-y-1 hover:border-gold/30"
    >
      <div className="relative h-44 w-full overflow-hidden bg-black/5">
        {listing.imageBase64 ? (
          <img
            src={listing.imageBase64}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-lg text-muted">
            No photo yet
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent" />

        {/* top row — category on the left, at most ONE compact badge on the
            right (featured takes priority over rating so they never both try
            to render, and both are icon-first so they stay narrow even on a
            2-column mobile card) */}
        <span className="absolute left-2 top-2 max-w-[62%] truncate rounded-full bg-mist/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-gold sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
          {listing.category}
        </span>
        {isFeatured ? (
          <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-gold px-2 py-1 text-[10px] font-semibold text-midnight shadow sm:right-3 sm:top-3 sm:px-2.5 sm:text-xs">
            ★<span className="hidden sm:inline"> Featured</span>
          </span>
        ) : listing.ratingCount > 0 ? (
          <span className="absolute right-2 top-2 rounded-full bg-mist/85 px-2 py-1 text-[10px] font-medium text-midnight sm:right-3 sm:top-3 sm:px-2.5 sm:text-xs">
            ★ {listing.ratingAvg.toFixed(1)}
          </span>
        ) : null}
      </div>

      {/* stacked, not side-by-side — guarantees the title never gets
          squeezed by the price no matter how narrow the card is */}
      <div className="p-3 sm:p-4">
        <h3 className="truncate font-display text-base font-semibold text-midnight sm:text-lg">{listing.title}</h3>
        <p className="truncate text-sm text-muted">{listing.location}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-mono text-base font-semibold text-gold sm:text-lg">
            ₦{Number(listing.pricePerDay).toLocaleString()}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted">/ day</span>
        </div>
      </div>
    </Link>
  )
}
