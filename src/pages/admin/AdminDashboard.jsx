import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getPlatformStats, getOpenDisputesCount } from '../../services/admin'
import Skeleton from '../../components/Skeleton'

function StatCard({ label, value }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-midnight/60">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-midnight">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [openDisputes, setOpenDisputes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getPlatformStats(), getOpenDisputesCount()])
      .then(([s, d]) => {
        setStats(s)
        setOpenDisputes(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      {error && <p className="rounded-xl border border-ruby/30 bg-ruby/10 p-4 text-sm text-ruby">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : stats ? (
        <>
          {openDisputes > 0 && (
            <Link
              to="/admin/disputes"
              className="mb-4 block rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-midnight hover:border-gold"
            >
              <strong>{openDisputes} open dispute{openDisputes > 1 ? 's' : ''}</strong> need your attention →
            </Link>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total users" value={stats.totalUsers} />
            <StatCard label="Owners" value={stats.totalOwners} />
            <StatCard label="Renters" value={stats.totalRenters} />
            <StatCard label="Listings" value={`${stats.activeListings} / ${stats.totalListings}`} />
            <StatCard label="Total bookings" value={stats.totalBookings} />
            <StatCard label="Paid bookings" value={stats.paidBookings} />
            <StatCard label="Total revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} />
            <StatCard label="Open disputes" value={openDisputes} />
          </div>
        </>
      ) : null}
    </AdminLayout>
  )
}
