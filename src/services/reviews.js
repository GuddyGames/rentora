import {
  collection,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../firebase'

// Reviews live in a subcollection under each listing: listings/{id}/reviews/{reviewId}
// — the review's document ID is always the bookingId. That's not just a
// convention: the security rule requires it, both to verify (via get()) that
// this booking is real, completed, and belongs to this renter, and to make a
// second review attempt on the same booking a rules-level "update" (denied)
// rather than a fresh "create".
export async function addReview({ listingId, bookingId, renterId, renterName, rating, text }) {
  const reviewRef = doc(db, 'listings', listingId, 'reviews', bookingId)
  const listingRef = doc(db, 'listings', listingId)

  await setDoc(reviewRef, {
    bookingId,
    renterId,
    renterName,
    rating: Number(rating),
    text,
    createdAt: serverTimestamp(),
  })

  // roll the new rating into the listing's running average
  await runTransaction(db, async (tx) => {
    const listingSnap = await tx.get(listingRef)
    if (!listingSnap.exists()) return
    const data = listingSnap.data()
    const prevCount = data.ratingCount || 0
    const prevAvg = data.ratingAvg || 0
    const newCount = prevCount + 1
    const newAvg = (prevAvg * prevCount + Number(rating)) / newCount
    tx.update(listingRef, { ratingAvg: newAvg, ratingCount: newCount })
  })
}

export async function getReviewsForListing(listingId) {
  const q = query(collection(db, 'listings', listingId, 'reviews'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// so a renter only sees "leave a review" on bookings they haven't reviewed yet
export async function hasReviewed(listingId, bookingId) {
  const snap = await getDoc(doc(db, 'listings', listingId, 'reviews', bookingId))
  return snap.exists()
}
