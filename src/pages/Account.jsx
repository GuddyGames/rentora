import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'
import BackButton from '../components/BackButton'
import { DashboardIcon, CalendarIcon, ChatIcon, CartIcon, StarIcon, ShieldIcon, BellIcon } from '../components/icons'

function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

function Row({ icon, label, to, onClick, danger }) {
  const className = `flex items-center justify-between rounded-2xl px-4 py-4 transition-colors ${
    danger ? 'text-ruby hover:bg-ruby/10' : 'text-midnight hover:bg-black/5'
  }`
  const content = (
    <>
      <span className="flex items-center gap-3">
        <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
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
  const [resendBusy, setResendBusy] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  async function handleResendVerification() {
    setResendBusy(true)
    try {
      await sendEmailVerification(user)
      setResendSent(true)
    } catch {
      // Firebase rate-limits this — fine to just quietly no-op
    } finally {
      setResendBusy(false)
    }
  }

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

      {!user.emailVerified && (
        <div className="glass mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <p className="text-sm text-midnight">Your email isn't verified yet.</p>
          {resendSent ? (
            <p className="mt-1 text-sm text-emerald">Sent — check your inbox (and spam folder).</p>
          ) : (
            <button onClick={handleResendVerification} disabled={resendBusy} className="mt-1 text-sm text-royal hover:underline disabled:opacity-60">
              {resendBusy ? 'Sending…' : 'Resend verification email'}
            </button>
          )}
        </div>
      )}

      <div className="glass mt-6 divide-y divide-black/10 rounded-2xl">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="flex items-center gap-3 text-midnight">
            <span className="flex h-5 w-5 items-center justify-center"><BellIcon className="h-5 w-5" /></span>
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
          <Row icon={<DashboardIcon className="h-5 w-5" />} label="Dashboard & listings" to="/dashboard" />
        ) : (
          <Row icon={<CalendarIcon className="h-5 w-5" />} label="My bookings" to="/my-bookings" />
        )}
        <Row icon={<ChatIcon className="h-5 w-5" />} label="Messages" to="/messages" />
        <Row icon={<CartIcon className="h-5 w-5" />} label="Cart" to="/cart" />
        <Row icon={<StarIcon className="h-5 w-5 text-gold" />} label="Pricing & boost" to="/pricing" />
      </div>

      {profile?.isAdmin && (
        <div className="glass mt-6 rounded-2xl">
          <Row icon={<ShieldIcon className="h-5 w-5" />} label="Admin control room" to="/admin" />
        </div>
      )}

      <div className="glass mt-6 rounded-2xl">
        <Row icon={<LogoutIcon className="h-5 w-5" />} label="Log out" onClick={handleLogout} danger />
      </div>
    </div>
  )
}
