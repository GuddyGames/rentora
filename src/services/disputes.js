import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const disputesRef = collection(db, 'disputes')

export async function fileDispute({ bookingId, listingTitle, filedBy, filedByName, reason, details, photoBase64 }) {
  return addDoc(disputesRef, {
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

export async function getAllDisputesAdmin() {
  const snap = await getDocs(query(disputesRef, orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function resolveDispute(id, resolutionNote) {
  return updateDoc(doc(db, 'disputes', id), { status: 'resolved', resolutionNote })
}
