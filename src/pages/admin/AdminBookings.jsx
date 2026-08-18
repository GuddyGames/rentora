import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getAllBookingsAdmin } from '../../services/admin'
import Skeleton from '../../components/Skeleton'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all | paid | unpaid

  useEffect(() => {
    getAllBookingsAdmin()
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter((b) => {
    if (filter === 'paid') return b.paid
    if (filter === 'unpaid') return !b.paid
    return true
  })

  return (
    <AdminLayout>
      {error && <p className="rounded-xl border border-ruby/30 bg-ruby/10 p-4 text-sm text-ruby">{error}</p>}

      <div className="mb-4 flex gap-2">
        {['all', 'paid', 'unpaid'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
              filter === f ? 'bg-gold text-midnight' : 'border border-black/15 text-midnight/70'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <div key={b.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-midnight">{b.listingTitle}</p>
                <p className="text-sm text-midnight/50">
                  {b.renterName} · {b.startDate} → {b.endDate} · <span className="uppercase">{b.status}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold text-midnight">₦{Number(b.totalPrice).toLocaleString()}</p>
                <p className={`text-xs ${b.paid ? 'text-emerald' : 'text-ruby'}`}>{b.paid ? 'Paid' : 'Unpaid'}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-midnight/50">No bookings match this filter.</p>}
        </div>
      )}
    </AdminLayout>
  )
}
