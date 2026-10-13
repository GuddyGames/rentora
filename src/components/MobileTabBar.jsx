import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const icons = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  explore: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M11 7l2 4-4 2 2-6Z" /></>,
  plan: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M9 14h2M9 17h2M14 14h2" /></>,
  bookings: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6" /></>,
  dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
  account: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
}

function TabIcon({ name }) {
  return <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>
}

export default function MobileTabBar() {
  const { user, profile } = useAuth()
  const location = useLocation()

  // Give focused tasks more room, especially checkout and the on-screen keyboard in chat.
  if (
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/checkout' ||
    /^\/messages\/[^/]+/.test(location.pathname) ||
    location.pathname.startsWith('/admin')
  ) return null

  const tabs = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/browse', label: 'Explore', icon: 'explore' },
    { to: '/plan', label: 'Plan', icon: 'plan' },
    user
      ? (profile?.role === 'owner'
        ? { to: '/dashboard', label: 'Manage', icon: 'dashboard' }
        : { to: '/my-bookings', label: 'Bookings', icon: 'bookings' })
      : { to: '/login', label: 'Bookings', icon: 'bookings' },
    user
      ? { to: '/account', label: 'Account', icon: 'account' }
      : { to: '/login', label: 'Sign in', icon: 'account' },
  ]

  return (
    <nav aria-label="Primary mobile navigation" className="mobile-tabbar md:hidden">
      {tabs.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.to}
          end={tab.end}
          aria-label={tab.label}
          className={({ isActive }) => `mobile-tabbar-item ${isActive ? 'is-active' : ''}`}
        >
          <TabIcon name={tab.icon} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
