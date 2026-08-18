import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getAllListingsAdmin, setListingActive, setListingFeatured } from '../../services/admin'
import { deleteListing } from '../../services/listings'
import Skeleton from '../../components/Skeleton'

export default function AdminListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllListingsAdmin()
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(l) {
    await setListingActive(l.id, !l.active)
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, active: !l.active } : x)))
  }

  async function toggleFeatured(l) {
    await setListingFeatured(l.id, !l.featured)
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, featured: !l.featured } : x)))
  }

  async function handleDelete(l) {
    if (!window.confirm(`Permanently remove "${l.title}"?`)) return
    await deleteListing(l.id)
    setListings((prev) => prev.filter((x) => x.id !== l.id))
  }

  return (
    <AdminLayout>
      {error && <p className="rounded-xl border border-ruby/30 bg-ruby/10 p-4 text-sm text-ruby">{error}</p>}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((l) => (
            <div key={l.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-midnight">
                  {l.title} {l.featured && <span className="ml-1 text-xs text-gold">★ featured</span>}
                </p>
                <p className="text-sm text-midnight/50">
                  {l.category} · ₦{Number(l.pricePerDay).toLocaleString()}/day · by {l.ownerName} · {l.active ? 'active' : 'hidden'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleFeatured(l)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    l.featured ? 'border-gold bg-gold/10 text-gold' : 'border-black/15 text-midnight/70 hover:border-gold'
                  }`}
                >
                  {l.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => toggleActive(l)}
                  className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-midnight/70 hover:border-royal hover:text-royal"
                >
                  {l.active ? 'Hide' : 'Unhide'}
                </button>
                <button
                  onClick={() => handleDelete(l)}
                  className="rounded-full border border-ruby/40 px-3 py-1.5 text-xs font-medium text-ruby hover:bg-ruby hover:text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
