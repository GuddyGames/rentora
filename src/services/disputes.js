import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { logAdminAction } from './admin'

const disputesRef = collection(db, 'disputes')

// bookingId is present for a booking dispute, listingId for a plain listing
// report (e.g. "this looks fake") filed by someone who never booked it —
// same collection, same admin queue, distinguished by `kind`.
export async function fileDispute({ bookingId, listingTitle, filedBy, filedByName, reason, details, photoBase64 }) {
  return addDoc(disputesRef, {
    kind: 'booking_dispute',
    bookingId,
    listingTitle,
    filedBy,
    filedByName,
    reason,
    details,
    photoBase64: photoBase64 || null,
    status: 'open', // open -> resolved
    createdAt: serverTimestamp(),
  })
}

export async function reportListing({ listingId, listingTitle, filedBy, filedByName, reason, details }) {
  return addDoc(disputesRef, {
    kind: 'listing_report',
    listingId,
    listingTitle,
    filedBy,
    filedByName,
    reason,
    details,
    status: 'open',
    createdAt: serverTimestamp(),
  })
}

export async function getAllDisputesAdmin() {
  const snap = await getDocs(query(disputesRef, orderBy('createdAt', 'desc'), limit(200)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function resolveDispute(id, resolutionNote, admin) {
  await updateDoc(doc(db, 'disputes', id), { status: 'resolved', resolutionNote })
  if (admin) await logAdminAction(admin, 'resolve_dispute', 'dispute', id, resolutionNote)
}
