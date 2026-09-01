import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getAuditLog } from '../../services/admin'
import Skeleton from '../../components/Skeleton'

const ACTION_LABELS = {
  restrict_account: 'Restricted account',
  restore_account: 'Restored account',
  verify_vendor: 'Verified vendor',
  unverify_vendor: 'Removed vendor verification',
  hide_listing: 'Hid listing',
  unhide_listing: 'Unhid listing',
  feature_listing: 'Featured listing',
  unfeature_listing: 'Unfeatured listing',
  approve_listing: 'Approved listing',
  reject_listing: 'Rejected listing',
  resolve_dispute: 'Resolved dispute',
}

function formatWhen(date) {
  if (!date) return ''
  return date.toLocaleString()
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAuditLog()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <p className="mb-4 text-sm text-midnight/60">
        Every restricted account, listing moderation decision, and dispute resolution, in order — so "who did that" always has an answer.
      </p>
      {error && <p className="rounded-xl border border-ruby/30 bg-ruby/10 p-4 text-sm text-ruby">{error}</p>}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-midnight/50">No admin actions logged yet.</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((e) => (
            <div key={e.id} className="glass flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm">
              <div>
                <span className="font-medium text-midnight">{ACTION_LABELS[e.action] || e.action}</span>
                <span className="text-midnight/50"> · {e.targetType} {e.targetId?.slice(0, 8)} · by {e.adminName}</span>
                {e.details && <span className="text-midnight/40"> — {e.details}</span>}
              </div>
              <span className="shrink-0 text-xs text-midnight/40">{formatWhen(e.createdAt?.toDate?.())}</span>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
