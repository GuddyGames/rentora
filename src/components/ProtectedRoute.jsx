import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-midnight/60">Loading…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (requireRole && profile?.role !== requireRole) {
    return <Navigate to="/" replace />
  }
  return children
}
