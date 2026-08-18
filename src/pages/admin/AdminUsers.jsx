import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getAllUsersAdmin, setUserSuspended } from '../../services/admin'
import Skeleton from '../../components/Skeleton'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllUsersAdmin()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function toggleSuspend(u) {
    const next = !u.suspended
    if (next && !window.confirm(`Restrict ${u.name || u.email}'s account?`)) return
    await setUserSuspended(u.id, next)
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, suspended: next } : x)))
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
          {users.map((u) => (
            <div key={u.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-midnight">
                  {u.name || 'Unnamed'} {u.isAdmin && <span className="ml-1 text-xs text-royal">admin</span>}
                </p>
                <p className="truncate text-sm text-midnight/50">
                  {u.email} · {u.role} {u.suspended && <span className="text-ruby">· restricted</span>}
                </p>
              </div>
              {!u.isAdmin && (
                <button
                  onClick={() => toggleSuspend(u)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    u.suspended
                      ? 'border-emerald text-emerald hover:bg-emerald hover:text-white'
                      : 'border-ruby/40 text-ruby hover:bg-ruby hover:text-white'
                  }`}
                >
                  {u.suspended ? 'Restore access' : 'Restrict account'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
