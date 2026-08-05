import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.35 0-2.62-.32-3.73-.9L3 20l1.06-4.24A8.46 8.46 0 0 1 3 11.5 8.5 8.5 0 0 1 11.5 3 8.5 8.5 0 0 1 21 11.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Navbar() {
  const { user, profile } = useAuth()
  const { items } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-mist/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-5">
        <Link to="/" className="shrink-0 font-display text-xl font-semibold tracking-tight text-midnight">
          Rent<span className="text-gold">ora</span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-5 font-body text-sm text-midnight/70 md:flex">
          <Link to="/browse" className="hover:text-gold transition-colors">Browse</Link>
          <Link to="/plan" className="hover:text-gold transition-colors">Plan my event</Link>

          {user && (
            <Link to="/messages" aria-label="Messages" className="hover:text-gold transition-colors">
              <ChatIcon />
            </Link>
          )}
          <Link to="/cart" aria-label="Cart" className="relative hover:text-gold transition-colors">
            <CartIcon />
            {items.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-royal text-[10px] font-semibold text-white">
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
            <>
              <Link to="/login" className="hover:text-gold transition-colors">Log in</Link>
              <Link to="/signup" className="rounded-full bg-gold px-4 py-1.5 font-medium text-midnight hover:brightness-110 transition-all">
                Sign up
              </Link>
            </>
          )}
        </nav>

        {/* mobile: cart badge + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <Link to="/cart" aria-label="Cart" className="relative rounded-full p-2 text-midnight/70 hover:text-gold">
            <CartIcon />
            {items.length > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-royal text-[10px] font-semibold text-white">
                {items.length}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-full p-2 text-midnight/70 hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile dropdown menu */}
      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-black/5 bg-mist px-4 py-3 font-body text-sm text-midnight md:hidden">
          <Link to="/browse" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-black/5">Browse</Link>
          <Link to="/plan" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-black/5">Plan my event</Link>
          {user ? (
            <>
              <Link to="/messages" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-black/5">Messages</Link>
              {profile?.role === 'owner' ? (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-black/5">Dashboard</Link>
              ) : (
                <Link to="/my-bookings" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-black/5">My bookings</Link>
              )}
              <Link to="/account" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-black/5">My account</Link>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-black/5">Log in</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="mt-1 rounded-full bg-gold px-4 py-2 text-center font-medium text-midnight">Sign up</Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
