import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/listings', label: 'Listings' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/bookings', label: 'Payments' },
  { to: '/admin/disputes', label: 'Disputes' },
]

export default function AdminLayout({ children }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-midnight px-3 py-1 font-mono text-xs uppercase tracking-wide text-gold">Admin</span>
        <h1 className="font-display text-2xl font-semibold text-midnight">Control room</h1>
      </div>

      <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-black/10">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'border-gold text-midnight' : 'border-transparent text-midnight/50 hover:text-midnight'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  )
}
