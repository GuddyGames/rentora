import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, profile } = useAuth()
  const { items } = useCart()
  const [open, setOpen] = useState(false)

  const navLinks = (
    <>
      <Link to="/browse" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">Browse</Link>
      <Link to="/plan" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">Plan my event</Link>
      {user && (
        <Link to="/messages" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">Messages</Link>
      )}
      {user && profile?.role === 'owner' && (
        <Link to="/dashboard" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">Dashboard</Link>
      )}
      {user && profile?.role === 'renter' && (
        <Link to="/my-bookings" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">My bookings</Link>
      )}
      {!user && (
        <Link to="/login" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">Log in</Link>
      )}
    </>
  )

  return (
    <header className="glass-dark sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-mist">
          Rent<span className="text-gold">ora</span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-5 font-body text-sm text-mist/80 md:flex">
          {navLinks}
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
              className="flex h-8 w-8 items-center justify-center rounded-full bg-royal text-sm font-semibold text-white hover:brightness-110"
            >
              {(profile?.name || user.email || '?').charAt(0).toUpperCase()}
            </Link>
          ) : (
            <Link
              to="/signup"
              className="rounded-full bg-gold px-4 py-1.5 font-medium text-midnight hover:brightness-110 transition-all"
            >
              Sign up
            </Link>
          )}
        </nav>

        {/* mobile: cart icon + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link to="/cart" aria-label="Cart" className="relative text-mist/80 hover:text-gold">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {items.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-royal text-[10px] font-semibold text-white">
                {items.length}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-mist hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile dropdown panel */}
      {open && (
        <nav className="glass-dark flex flex-col gap-1 border-t border-white/10 px-5 py-3 font-body text-sm text-mist/80 md:hidden">
          {navLinks}
          {user ? (
            <Link to="/account" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">My account</Link>
          ) : (
            <Link to="/signup" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">Sign up</Link>
          )}
        </nav>
      )}
    </header>
  )
}
