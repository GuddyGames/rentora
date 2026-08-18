import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

// Platform-wide stats for the admin dashboard. Pulls full collections client-side —
// fine at MVP scale, would move to a Cloud Function aggregate once listings/bookings
// grow into the thousands.
export async function getPlatformStats() {
  const [usersSnap, listingsSnap, bookingsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'listings')),
    getDocs(collection(db, 'bookings')),
  ])

  const bookings = bookingsSnap.docs.map((d) => d.data())
  const paidBookings = bookings.filter((b) => b.paid)
  const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)

  return {
    totalUsers: usersSnap.size,
    totalOwners: usersSnap.docs.filter((d) => d.data().role === 'owner').length,
    totalRenters: usersSnap.docs.filter((d) => d.data().role === 'renter').length,
    totalListings: listingsSnap.size,
    activeListings: listingsSnap.docs.filter((d) => d.data().active).length,
    totalBookings: bookings.length,
    paidBookings: paidBookings.length,
    totalRevenue,
  }
}

export async function getAllUsersAdmin() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function setUserSuspended(uid, suspended) {
  return updateDoc(doc(db, 'users', uid), { suspended })
}

export async function getAllListingsAdmin() {
  const snap = await getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function setListingActive(id, active) {
  return updateDoc(doc(db, 'listings', id), { active })
}

// featured listings sort first in Browse/Home — the honest, in-house version
// of a "promote with us" ad slot, no external ad broker involved
export async function setListingFeatured(id, featured) {
  return updateDoc(doc(db, 'listings', id), { featured })
}

export async function getAllBookingsAdmin() {
  const snap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getOpenDisputesCount() {
  const snap = await getDocs(query(collection(db, 'disputes'), where('status', '==', 'open')))
  return snap.size
}
