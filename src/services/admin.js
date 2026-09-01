import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { createNotification } from './notifications'

// Every sensitive admin action writes a record here — who did what, to
// whom, when. Without this, there's no way to answer "who restricted this
// account" after the fact.
export async function logAdminAction(admin, action, targetType, targetId, details) {
  return addDoc(collection(db, 'auditLog'), {
    adminId: admin.uid,
    adminName: admin.name,
    action,
    targetType,
    targetId,
    details: details || null,
    createdAt: serverTimestamp(),
  }).catch((e) => console.error('audit log failed', e))
}

export async function getAuditLog() {
  const snap = await getDocs(query(collection(db, 'auditLog'), orderBy('createdAt', 'desc'), limit(200)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Platform-wide stats for the admin dashboard. Pulls full collections client-side —
// fine at MVP scale, would move to a Cloud Function aggregate once listings/bookings
// grow into the thousands.
// Deliberately NOT capped with limit() like the other admin queries — a
// stats dashboard that silently undercounts once you pass the cap would be
// actively misleading, which is worse than the read-cost concern at this
// scale. The real fix, once volume justifies it, is a Cloud Functions
// aggregate that maintains running counters instead of scanning collections.
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
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(300)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function setUserSuspended(uid, suspended, admin) {
  await updateDoc(doc(db, 'users', uid), { suspended })
  await logAdminAction(admin, suspended ? 'restrict_account' : 'restore_account', 'user', uid)
  createNotification({
    userId: uid,
    type: 'account_status',
    title: suspended ? 'Account restricted' : 'Account restored',
    body: suspended
      ? 'Your Rentora account has been restricted. Contact support if you think this is a mistake.'
      : 'Your Rentora account has been restored.',
  }).catch((e) => console.error('notification failed', e))
}

// Honest verification — a real admin decision (checked the person out
// somehow), not a self-claimed or automatic badge. That's the whole
// difference between this and the fake "Verified" checkmarks some
// marketplaces show with no actual verification behind them.
export async function setUserVerified(uid, verified, admin) {
  await updateDoc(doc(db, 'users', uid), { verified })
  await logAdminAction(admin, verified ? 'verify_vendor' : 'unverify_vendor', 'user', uid)

  // denormalize onto their listings — a listing page showing "✓ Verified"
  // can't (and shouldn't) read another user's profile document directly,
  // same as ownerName already being copied onto each listing at creation
  const listingsSnap = await getDocs(query(collection(db, 'listings'), where('ownerId', '==', uid)))
  await Promise.all(listingsSnap.docs.map((d) => updateDoc(doc(db, 'listings', d.id), { ownerVerified: verified })))
}

export async function getAllListingsAdmin() {
  const snap = await getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(300)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function setListingActive(id, active, admin) {
  await updateDoc(doc(db, 'listings', id), { active })
  await logAdminAction(admin, active ? 'unhide_listing' : 'hide_listing', 'listing', id)
}

// featured listings sort first in Browse/Home — the honest, in-house version
// of a "promote with us" ad slot, no external ad broker involved
export async function setListingFeatured(id, featured, admin) {
  await updateDoc(doc(db, 'listings', id), { featured, featuredUntil: featured ? null : 0 })
  await logAdminAction(admin, featured ? 'feature_listing' : 'unfeature_listing', 'listing', id)
}

export async function getPendingListings() {
  const snap = await getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(300)))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((l) => l.moderationStatus === 'pending')
}

export async function setListingModeration(id, status, admin, ownerId, listingTitle) {
  await updateDoc(doc(db, 'listings', id), { moderationStatus: status })
  await logAdminAction(admin, status === 'approved' ? 'approve_listing' : 'reject_listing', 'listing', id)
  if (ownerId) {
    createNotification({
      userId: ownerId,
      type: 'listing_moderation',
      title: status === 'approved' ? 'Listing approved' : 'Listing rejected',
      body: status === 'approved'
        ? `"${listingTitle}" is now live on Rentora.`
        : `"${listingTitle}" wasn't approved — check it meets the listing guidelines and try again.`,
      link: '/dashboard',
    }).catch((e) => console.error('notification failed', e))
  }
}

export async function getAllBookingsAdmin() {
  const snap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(300)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getOpenDisputesCount() {
  const snap = await getDocs(query(collection(db, 'disputes'), where('status', '==', 'open')))
  return snap.size
}
