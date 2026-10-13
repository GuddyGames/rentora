import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AddListing from './pages/AddListing'
import MyBookings from './pages/MyBookings'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Messages from './pages/Messages'
import ChatThread from './pages/ChatThread'
import PlanEvent from './pages/PlanEvent'
import Pricing from './pages/Pricing'
import Account from './pages/Account'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminListings from './pages/admin/AdminListings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminBookings from './pages/admin/AdminBookings'
import AdminDisputes from './pages/admin/AdminDisputes'
import AdminAuditLog from './pages/admin/AdminAuditLog'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import RefundPolicy from './pages/RefundPolicy'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-mist">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/plan" element={<ProtectedRoute><PlanEvent /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute requireRole="owner"><Dashboard /></ProtectedRoute>} />
          <Route path="/add-listing" element={<ProtectedRoute requireRole="owner"><AddListing /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute requireRole="renter"><MyBookings /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute><ChatThread /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/listings" element={<ProtectedRoute requireAdmin><AdminListings /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute requireAdmin><AdminBookings /></ProtectedRoute>} />
          <Route path="/admin/disputes" element={<ProtectedRoute requireAdmin><AdminDisputes /></ProtectedRoute>} />
          <Route path="/admin/audit-log" element={<ProtectedRoute requireAdmin><AdminAuditLog /></ProtectedRoute>} />
          <Route path="*" element={
            <div className="mx-auto max-w-xl px-5 py-20 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">404 · Page not found</p>
              <h1 className="mt-3 font-display text-3xl font-semibold text-midnight">We can’t find that page</h1>
              <p className="mt-2 text-sm text-midnight/60">The link may be old, or the page may have moved.</p>
              <a href="/browse" className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 font-semibold text-midnight">Browse equipment</a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
