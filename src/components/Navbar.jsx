import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, profile } = useAuth()
  const { items } = useCart()

  return (
    <header className="glass-dark sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-mist">
          Rent<span className="text-gold">ora</span>
        </Link>

        <nav className="flex items-center gap-5 font-body text-sm text-mist/80">
          <Link to="/browse" className="hover:text-gold transition-colors">Browse</Link>
          <Link to="/plan" className="hover:text-gold transition-colors">Plan my event</Link>
          {user && (
            <Link to="/messages" className="hover:text-gold transition-colors">Messages</Link>
          )}
          <Link to="/cart" className="relative hover:text-gold transition-colors">
            Cart
            {items.length > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-royal text-[10px] font-semibold text-white">
                {items.length}
              </span>
            )}
          </Link>
          {user && profile?.role === 'owner' && (
            <Link to="/dashboard" className="hover:text-gold transition-colors">Dashboard</Link>
          )}
          {user && profile?.role === 'renter' && (
            <Link to="/my-bookings" className="hover:text-gold transition-colors">My bookings</Link>
          )}
          {user ? (
            <Link
              to="/account"
              aria-label="Account"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-royal text-sm font-semibold text-white hover:brightness-110"
            >
              {(profile?.name || user.email || '?').charAt(0).toUpperCase()}
            </Link>
          ) : (
            <>
              <Link to="/login" className="hover:text-gold transition-colors">Log in</Link>
              <Link
                to="/signup"
                className="rounded-full bg-gold px-4 py-1.5 font-medium text-midnight hover:brightness-110 transition-all"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
