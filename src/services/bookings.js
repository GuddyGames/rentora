import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
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
export async function hasConflict(listingId, startDate, endDate) {
  const q = query(
    bookingsRef,
    where('listingId', '==', listingId),
    where('status', 'in', ['pending', 'confirmed'])
  )
  const snap = await getDocs(q)
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  return snap.docs.some((d) => {
    const b = d.data()
    const bStart = new Date(b.startDate).getTime()
    const bEnd = new Date(b.endDate).getTime()
    return start <= bEnd && end >= bStart
  })
}

export async function createBooking({ listingId, listingTitle, ownerId, renterId, renterName, startDate, endDate, totalPrice, quantity, deliveryAddress, deliveryLat, deliveryLon }) {
  const ref = await addDoc(bookingsRef, {
    listingId,
    listingTitle,
    ownerId,
    renterId,
    renterName,
    startDate,
    endDate,
    totalPrice,
    quantity: quantity || 1,
    deliveryAddress: deliveryAddress || null,
    deliveryLat: deliveryLat || null,
    deliveryLon: deliveryLon || null,
    status: 'pending', // pending -> confirmed -> completed, or cancelled
    paid: false,
    createdAt: serverTimestamp(),
  })

  createNotification({
    userId: ownerId,
    type: 'booking_placed',
    title: 'New booking request',
    body: `${renterName} wants to book "${listingTitle}" for ${startDate} → ${endDate}.`,
    link: '/dashboard',
  }).catch((e) => console.error('notification failed', e))

  return ref
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

export async function markPaid(booking, reference) {
  await updateDoc(doc(db, 'bookings', booking.id), { paid: true, paymentReference: reference, status: 'confirmed' })
  createNotification({
    userId: booking.ownerId,
    type: 'payment_received',
    title: 'Payment received',
    body: `Payment confirmed for "${booking.listingTitle}" — ₦${Number(booking.totalPrice).toLocaleString()}.`,
    link: '/dashboard',
  }).catch((e) => console.error('notification failed', e))
}

export async function getBookingsForRenter(renterId) {
  const q = query(bookingsRef, where('renterId', '==', renterId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getBookingsForOwner(ownerId) {
  const q = query(bookingsRef, where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
