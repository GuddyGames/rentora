import {
  collection,
  addDoc,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const notificationsRef = collection(db, 'notifications')

// This is an in-app notification center — it only shows up while someone has
// Rentora open. Real push (an alert that fires even with the app closed)
// needs Firebase Cloud Messaging plus a service worker, which is a separate,
// bigger piece of infrastructure — flagging that rather than pretending this
// does the same thing.
export async function createNotification({ userId, type, title, body, link }) {
  return addDoc(notificationsRef, {
    userId,
    type, // 'booking_placed' | 'booking_confirmed' | 'booking_delivered' | 'payment_received' | 'message' | 'dispute'
    title,
    body,
    link: link || null,
    read: false,
    createdAt: serverTimestamp(),
  })
}

// live subscription so the bell badge updates without a page reload
export function listenToNotifications(userId, onUpdate) {
  const q = query(notificationsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(30))
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function markNotificationRead(id) {
  return updateDoc(doc(db, 'notifications', id), { read: true })
}

export async function markAllRead(userId) {
  const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false))
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }))
  return batch.commit()
}
