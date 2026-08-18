import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireRole, requireAdmin }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-midnight/60">Loading…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (profile?.suspended) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-midnight">Account restricted</h1>
        <p className="mt-3 text-midnight/60">
          Your account has been restricted. Contact support if you think this is a mistake.
        </p>
      </div>
    )
  }
  if (requireAdmin && !profile?.isAdmin) {
    return <Navigate to="/" replace />
  }
  if (requireRole && profile?.role !== requireRole) {
    return <Navigate to="/" replace />
  }
  return children
}
