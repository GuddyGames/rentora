import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

function conversationId(listingId, renterId) {
  return `${listingId}_${renterId}`
}

export async function getOrCreateConversation({ listingId, listingTitle, ownerId, ownerName, renterId, renterName }) {
  const id = conversationId(listingId, renterId)
  const ref = doc(db, 'conversations', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      listingId,
      listingTitle,
      ownerId,
      ownerName,
      renterId,
      renterName,
      participantIds: [ownerId, renterId],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
    })
  }
  return id
}

// Admin support conversations reuse the same owner/renter "slot" fields
// purely as generic participant-A/participant-B labels — that's what lets
// the existing Messages/ChatThread UI display these with zero changes,
// since they just ask "which of these two names isn't me".
export async function getOrCreateAdminConversation({ adminId, adminName, targetUserId, targetUserName }) {
  const id = `admin_${targetUserId}`
  const ref = doc(db, 'conversations', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      listingId: null,
      listingTitle: 'Rentora support',
      ownerId: adminId,
      ownerName: adminName,
      renterId: targetUserId,
      renterName: targetUserName,
      isAdminConversation: true,
      participantIds: [adminId, targetUserId],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
    })
  }
  return id
}

export async function sendMessage(conversationId, { senderId, senderName, text }) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  })
}

// live listener — returns an unsubscribe function
export function listenToMessages(conversationId, onUpdate, onError) {
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    (snap) => onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError && onError(err)
  )
}

export async function getConversation(conversationId) {
  const snap = await getDoc(doc(db, 'conversations', conversationId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getConversationsForUser(uid) {
  const q = query(collection(db, 'conversations'), where('participantIds', 'array-contains', uid), orderBy('lastMessageAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
