import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../firebase'

// Reviews live in a subcollection under each listing: listings/{id}/reviews/{reviewId}
export async function addReview({ listingId, bookingId, renterId, renterName, rating, text }) {
  const reviewsRef = collection(db, 'listings', listingId, 'reviews')
  const listingRef = doc(db, 'listings', listingId)

  await addDoc(reviewsRef, {
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
  const q = query(collection(db, 'listings', listingId, 'reviews'), where('bookingId', '==', bookingId))
  const snap = await getDocs(q)
  return !snap.empty
}
