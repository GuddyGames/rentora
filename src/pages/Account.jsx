import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/BackButton'

function Row({ icon, label, to, onClick, danger }) {
  const className = `flex items-center justify-between rounded-2xl px-4 py-4 transition-colors ${
    danger ? 'text-ruby hover:bg-ruby/10' : 'text-midnight hover:bg-black/5'
  }`
  const content = (
    <>
      <span className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="font-medium">{label}</span>
      </span>
      {!danger && <span className="text-midnight/40">›</span>}
    </>
  )
  if (to) return <Link to={to} className={className}>{content}</Link>
  return <button onClick={onClick} className={`w-full text-left ${className}`}>{content}</button>
}

export default function Account() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(true)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <BackButton to="/" label="Home" />
      <h1 className="font-display text-2xl font-semibold text-midnight">My Account</h1>

      <div className="glass mt-6 flex items-center gap-4 rounded-2xl p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-royal text-xl font-semibold text-white">
          {(profile?.name || user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold text-midnight">{profile?.name || 'Rentora user'}</p>
          <p className="truncate text-sm text-midnight/60">{user.email}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-gold">{profile?.role}</p>
        </div>
      </div>

      <div className="glass mt-6 divide-y divide-black/10 rounded-2xl">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="flex items-center gap-3 text-midnight">
            <span className="text-lg">🔔</span>
            <span className="font-medium">Notifications</span>
          </span>
          <button
            onClick={() => setNotifications((v) => !v)}
            aria-label="Toggle notifications"
            className={`h-6 w-11 rounded-full transition-colors ${notifications ? 'bg-gold' : 'bg-white/15'}`}
          >
            <span className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {profile?.role === 'owner' ? (
          <Row icon="📦" label="Dashboard & listings" to="/dashboard" />
        ) : (
          <Row icon="📅" label="My bookings" to="/my-bookings" />
        )}
        <Row icon="💬" label="Messages" to="/messages" />
        <Row icon="🛒" label="Cart" to="/cart" />
        <Row icon="⭐" label="Pricing & boost" to="/pricing" />
      </div>

      {profile?.isAdmin && (
        <div className="glass mt-6 rounded-2xl">
          <Row icon="🛡️" label="Admin control room" to="/admin" />
        </div>
      )}

      <div className="glass mt-6 rounded-2xl">
        <Row icon="🚪" label="Log out" onClick={handleLogout} danger />
      </div>
    </div>
  )
}
