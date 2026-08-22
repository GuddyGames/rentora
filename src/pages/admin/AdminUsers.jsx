import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getAllUsersAdmin, setUserSuspended } from '../../services/admin'
import { getOrCreateAdminConversation } from '../../services/chat'
import { useAuth } from '../../context/AuthContext'
import Skeleton from '../../components/Skeleton'

const ONLINE_WINDOW_MS = 2 * 60 * 1000 // active within the last 2 minutes reads as "online"

function timeAgo(date) {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function AdminUsers() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messaging, setMessaging] = useState(null)

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

  async function handleMessage(u) {
    setMessaging(u.id)
    try {
      const conversationId = await getOrCreateAdminConversation({
        adminId: user.uid,
        adminName: profile?.name || 'Rentora support',
        targetUserId: u.id,
        targetUserName: u.name || u.email,
      })
      navigate(`/messages/${conversationId}`)
    } finally {
      setMessaging(null)
    }
  }

  const onlineCount = users.filter((u) => {
    const t = u.lastActiveAt?.toDate?.()
    return t && Date.now() - t.getTime() < ONLINE_WINDOW_MS
  }).length

  return (
    <AdminLayout>
      {error && <p className="rounded-xl border border-ruby/30 bg-ruby/10 p-4 text-sm text-ruby">{error}</p>}
      {!loading && (
        <p className="mb-4 text-sm text-midnight/60">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald" />
          {onlineCount} active in the last 2 minutes
        </p>
      )}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const lastActive = u.lastActiveAt?.toDate?.()
            const isOnline = lastActive && Date.now() - lastActive.getTime() < ONLINE_WINDOW_MS
            return (
              <div key={u.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-display font-semibold text-midnight">
                    <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${isOnline ? 'bg-emerald' : 'bg-black/15'}`} />
                    {u.name || 'Unnamed'} {u.isAdmin && <span className="ml-1 text-xs text-royal">admin</span>}
                  </p>
                  <p className="truncate text-sm text-midnight/50">
                    {u.email} · {u.role} {u.suspended && <span className="text-ruby">· restricted</span>}
                  </p>
                  <p className="text-xs text-midnight/40">{isOnline ? 'Online now' : `Last active ${timeAgo(lastActive)}`}</p>
                </div>
                <div className="flex gap-2">
                  {!u.isAdmin && (
                    <button
                      onClick={() => handleMessage(u)}
                      disabled={messaging === u.id}
                      className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-midnight hover:border-royal hover:text-royal disabled:opacity-50"
                    >
                      {messaging === u.id ? 'Opening…' : 'Message'}
                    </button>
                  )}
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
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
