import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getAllListingsAdmin, setListingActive, setListingFeatured, setListingModeration } from '../../services/admin'
import { deleteListing } from '../../services/listings'
import { useAuth } from '../../context/AuthContext'
import Skeleton from '../../components/Skeleton'

export default function AdminListings() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const admin = { uid: user?.uid, name: profile?.name || user?.email }

  useEffect(() => {
    getAllListingsAdmin()
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(l) {
    await setListingActive(l.id, !l.active, admin)
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, active: !l.active } : x)))
  }

  async function toggleFeatured(l) {
    await setListingFeatured(l.id, !l.featured, admin)
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, featured: !l.featured } : x)))
  }

  async function handleModerate(l, status) {
    await setListingModeration(l.id, status, admin, l.ownerId, l.title)
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, moderationStatus: status } : x)))
  }

  async function handleDelete(l) {
    if (!window.confirm(`Permanently remove "${l.title}"?`)) return
    await deleteListing(l.id)
    setListings((prev) => prev.filter((x) => x.id !== l.id))
  }

  const pending = listings.filter((l) => l.moderationStatus === 'pending')
  const rest = listings.filter((l) => l.moderationStatus !== 'pending')

  return (
    <AdminLayout>
      {error && <p className="rounded-xl border border-ruby/30 bg-ruby/10 p-4 text-sm text-ruby">{error}</p>}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display text-lg font-semibold text-midnight">Pending approval ({pending.length})</h2>
              <div className="mt-3 space-y-2">
                {pending.map((l) => (
                  <div key={l.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold text-midnight">{l.title}</p>
                      <p className="text-sm text-midnight/50">{l.category} · ₦{Number(l.pricePerDay).toLocaleString()}/day · by {l.ownerName}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerate(l, 'approved')}
                        className="rounded-full bg-emerald px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerate(l, 'rejected')}
                        className="rounded-full border border-ruby/40 px-3 py-1.5 text-xs font-medium text-ruby hover:bg-ruby hover:text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <h2 className="font-display text-lg font-semibold text-midnight">All listings</h2>
          <div className="mt-3 space-y-2">
            {rest.map((l) => (
              <div key={l.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold text-midnight">
                    {l.title} {l.featured && <span className="ml-1 text-xs text-gold">★ featured</span>}
                  </p>
                  <p className="text-sm text-midnight/50">
                    {l.category} · ₦{Number(l.pricePerDay).toLocaleString()}/day · by {l.ownerName} · {l.active ? 'active' : 'hidden'} ·{' '}
                    <span className={l.moderationStatus === 'approved' ? 'text-emerald' : 'text-ruby'}>{l.moderationStatus}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
        </>
      )}
    </AdminLayout>
  )
}
