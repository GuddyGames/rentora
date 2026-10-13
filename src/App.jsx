import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import MobileTabBar from './components/MobileTabBar'
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
  const location = useLocation()
  return (
    <div className="flex min-h-screen flex-col bg-mist pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Navbar />
      <div key={location.pathname} className="route-screen flex min-w-0 flex-1 flex-col">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/browse"
          element={
            <ProtectedRoute>
              <Browse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listing/:id"
          element={
            <ProtectedRoute>
              <ListingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <PlanEvent />
            </ProtectedRoute>
          }
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireRole="owner">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-listing"
          element={
            <ProtectedRoute requireRole="owner">
              <AddListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute requireRole="renter">
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <ChatThread />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/listings"
          element={
            <ProtectedRoute requireAdmin>
              <AdminListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute requireAdmin>
              <AdminBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDisputes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-log"
          element={
            <ProtectedRoute requireAdmin>
              <AdminAuditLog />
            </ProtectedRoute>
          }
        />
      </Routes>
      </div>
      <MobileTabBar />
      <Footer />
    </div>
  )
}
