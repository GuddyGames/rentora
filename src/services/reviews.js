import {
  collection,
  getDoc,
  getDocs,
  query,
  orderBy,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// Reviews are keyed by booking ID. Creating the review and updating the
// listing aggregate in one transaction prevents duplicate submissions from
// incrementing the rating more than once.
export async function addReview({ listingId, bookingId, renterId, renterName, rating, text }) {
  const reviewRef = doc(db, 'listings', listingId, 'reviews', bookingId)
  const listingRef = doc(db, 'listings', listingId)
  const numericRating = Number(rating)
  const reviewText = typeof text === 'string' ? text.trim() : ''

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error('Choose a rating from 1 to 5.')
  }
  if (reviewText.length > 1000) throw new Error('Review text must be 1,000 characters or fewer.')

  await runTransaction(db, async (tx) => {
    const [reviewSnap, listingSnap] = await Promise.all([
      tx.get(reviewRef),
      tx.get(listingRef),
    ])
    if (reviewSnap.exists()) throw new Error('You have already reviewed this booking.')
    if (!listingSnap.exists()) throw new Error('This listing no longer exists.')

    const data = listingSnap.data()
    const prevCount = Number(data.ratingCount) || 0
    const prevAvg = Number(data.ratingAvg) || 0
    const newCount = prevCount + 1
    const newAvg = (prevAvg * prevCount + numericRating) / newCount

    tx.set(reviewRef, {
      bookingId,
      renterId,
      renterName: typeof renterName === 'string' ? renterName.slice(0, 120) : 'Renter',
      rating: numericRating,
      text: reviewText,
      createdAt: serverTimestamp(),
    })
    tx.update(listingRef, {
      ratingAvg: newAvg,
      ratingCount: newCount,
      lastReviewId: bookingId,
    })
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
