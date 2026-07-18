import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, profile } = useAuth()
  const { items } = useCart()

  return (
    <header className="glass-dark sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <Link to="/" className="shrink-0 font-display text-xl font-semibold tracking-tight text-mist sm:text-2xl">
          Rent<span className="text-gold">ora</span>
        </Link>

        <nav className="flex items-center gap-3 overflow-x-auto whitespace-nowrap font-body text-xs text-mist/80 sm:gap-5 sm:text-sm">
          <Link to="/browse" className="hover:text-gold transition-colors">Browse</Link>
          <Link to="/plan" className="hover:text-gold transition-colors">Plan my event</Link>
          {user && (
            <Link to="/messages" className="hover:text-gold transition-colors">Messages</Link>
          )}
          {user && profile?.role === 'owner' && (
            <Link to="/dashboard" className="hover:text-gold transition-colors">Dashboard</Link>
          )}
          {user && profile?.role === 'renter' && (
            <Link to="/my-bookings" className="hover:text-gold transition-colors">My bookings</Link>
          )}
          {!user && (
            <Link to="/login" className="hover:text-gold transition-colors">Log in</Link>
          )}
          <Link to="/cart" className="relative hover:text-gold transition-colors">
            Cart
            {items.length > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-royal text-[10px] font-semibold text-white">
                {items.length}
              </span>
            )}
          </Link>
          {user ? (
            <Link
              to="/account"
              aria-label="Account"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-royal text-xs font-semibold text-white hover:brightness-110 sm:h-8 sm:w-8 sm:text-sm"
            >
              {(profile?.name || user.email || '?').charAt(0).toUpperCase()}
            </Link>
          ) : (
            <Link
              to="/signup"
              className="shrink-0 rounded-full bg-gold px-3 py-1.5 font-medium text-midnight hover:brightness-110 transition-all"
            >
              Sign up
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
