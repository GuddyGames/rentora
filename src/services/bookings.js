import {
  collection,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { createNotification } from './notifications'

const bookingsRef = collection(db, 'bookings')

// Uber-Eats-style progress pipeline. 'cancelled' is a separate terminal
// state reachable only from 'pending', handled outside this ordered list.
export const STATUS_STEPS = [
  { key: 'pending', label: 'Requested' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'event_active', label: 'Event day' },
  { key: 'returned', label: 'Returned' },
  { key: 'completed', label: 'Completed' },
]

export function nextStatus(currentStatus) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === currentStatus)
  if (idx === -1 || idx === STATUS_STEPS.length - 1) return null
  return STATUS_STEPS[idx + 1].key
}

// Checks existing confirmed/pending bookings for the same listing that overlap
// the requested date range. This is a submit-time check, not a live lock —
// good enough for MVP volume; revisit with a transaction if bookings scale up.
// Checks whether booking `requestedQty` units for this date range would
// exceed the listing's total quantity, accounting for every other
// pending/confirmed booking that overlaps the same dates — not just
// whether *any* other booking exists for the range. A listing with 100
// chairs and one 20-chair booking still has 80 free; this used to block
// on the mere presence of any overlap regardless of how much headroom
// was actually left, which both rejected valid bookings unnecessarily and
// — the real risk — never actually verified enough units existed for
// larger quantities either.
export async function hasConflict(listingId, startDate, endDate, requestedQty = 1, totalQty = 1) {
  const checkAvailability = httpsCallable(getFunctions(), 'checkListingAvailability')
  const result = await checkAvailability({
    listingId,
    startDate,
    endDate,
    requestedQty: Number(requestedQty),
    totalQty: Number(totalQty),
  })
  return result.data?.available !== true
}

export async function updateBookingStatus(booking, status, photoBase64) {
  const updates = { status }
  if (status === 'delivered' && photoBase64) updates.deliveryPhotoBase64 = photoBase64
  if (status === 'returned' && photoBase64) updates.returnPhotoBase64 = photoBase64
  await updateDoc(doc(db, 'bookings', booking.id), updates)

  if (status === 'confirmed') {
    createNotification({
      userId: booking.renterId,
      type: 'booking_confirmed',
      title: 'Booking confirmed',
      body: `Your booking for "${booking.listingTitle}" was confirmed.`,
      link: '/my-bookings',
    }).catch((e) => console.error('notification failed', e))
  }
  if (status === 'delivered') {
    createNotification({
      userId: booking.renterId,
      type: 'booking_delivered',
      title: 'Delivered',
      body: `"${booking.listingTitle}" has reached your delivery address.`,
      link: '/my-bookings',
    }).catch((e) => console.error('notification failed', e))
  }
}

export async function getBookingsForRenter(renterId) {
  const q = query(bookingsRef, where('renterId', '==', renterId), orderBy('createdAt', 'desc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getBookingsForOwner(ownerId) {
  const q = query(bookingsRef, where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
