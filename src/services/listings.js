import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const listingsRef = collection(db, 'listings')

export const CATEGORIES = [
  { name: 'Canopy', icon: '⛺' },
  { name: 'Chairs', icon: '🪑' },
  { name: 'Tables', icon: '🍽️' },
  { name: 'Tent', icon: '🏕️' },
  { name: 'Stage', icon: '🎤' },
  { name: 'Sound & AV', icon: '🔊' },
  { name: 'DJ Equipment', icon: '🎧' },
  { name: 'Lighting', icon: '💡' },
  { name: 'LED Screens', icon: '📺' },
  { name: 'Projectors', icon: '🎥' },
  { name: 'Microphones', icon: '🎙️' },
  { name: 'Decoration', icon: '🎉' },
  { name: 'Cooling Fans', icon: '❄️' },
  { name: 'Generators', icon: '⚡' },
  { name: 'Mobile Toilets', icon: '🚽' },
  { name: 'Party Accessories', icon: '🎈' },
]

// image is stored as a base64 data URL string directly on the document —
// avoids Firebase Storage billing, same pattern used on Konnet. Keep photos
// compressed client-side before calling this (see utils/compressImage).
export async function createListing({ ownerId, ownerName, title, category, description, pricePerDay, quantity, location, imageBase64, securityDeposit, deliveryCost }) {
  return addDoc(listingsRef, {
    ownerId,
    ownerName,
    title,
    category,
    description,
    pricePerDay: Number(pricePerDay),
    quantity: Number(quantity) || 1,
    location,
    imageBase64: imageBase64 || null,
    securityDeposit: Number(securityDeposit) || 0,
    deliveryCost: Number(deliveryCost) || 0,
    ratingAvg: 0,
    ratingCount: 0,
    active: true,
    featured: false,
    createdAt: serverTimestamp(),
  })
}

export async function updateListing(id, updates) {
  return updateDoc(doc(db, 'listings', id), updates)
}

export async function deleteListing(id) {
  return deleteDoc(doc(db, 'listings', id))
}

export async function getListing(id) {
  const snap = await getDoc(doc(db, 'listings', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getAllListings({ category } = {}) {
  let q = query(listingsRef, where('active', '==', true), orderBy('createdAt', 'desc'))
  if (category) {
    q = query(listingsRef, where('active', '==', true), where('category', '==', category), orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  const listings = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // featured listings first, newest-first within each group — sorted
  // client-side so this doesn't need its own composite index
  return listings.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
}

export async function getListingsByOwner(ownerId) {
  const q = query(listingsRef, where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
