import { Link } from 'react-router-dom'

export default function ListingCard({ listing }) {
  const isFeatured = listing.featured && (!listing.featuredUntil || listing.featuredUntil > Date.now())

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg shadow-black/10 transition-transform duration-200 hover:-translate-y-1 hover:border-gold/30"
    >
      {isFeatured && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-midnight shadow">
          ★ Featured
        </span>
      )}
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
        <span className="absolute left-3 top-3 rounded-full bg-mist/80 px-3 py-1 font-mono text-xs uppercase tracking-wide text-gold">
          {listing.category}
        </span>
        {!isFeatured && listing.ratingCount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-mist/80 px-2.5 py-1 text-xs font-medium text-midnight">
            ★ {listing.ratingAvg.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold text-midnight">{listing.title}</h3>
          <p className="truncate text-sm text-muted">{listing.location}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-black/5 px-3 py-1.5 text-right">
          <div className="font-mono text-base font-semibold leading-none text-gold">
            ₦{Number(listing.pricePerDay).toLocaleString()}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-muted">per day</div>
        </div>
      </div>
    </Link>
  )
}
