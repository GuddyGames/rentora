import { collection, doc, addDoc, updateDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export const BOOST_PLANS = [
  { id: 'boost-30', days: 30, price: 5000, label: '30 days' },
  { id: 'boost-90', days: 90, price: 12000, label: '90 days' },
]

// Applies the boost to every currently-active listing this owner has, then
// records the purchase for admin visibility. Uses a one-time Paystack charge
// (the same Inline flow already used at checkout) rather than a recurring
// subscription — simpler and equally honest about what it actually does.
export async function applyBoost({ ownerId, planId, paymentReference }) {
  const plan = BOOST_PLANS.find((p) => p.id === planId)
  if (!plan) throw new Error('Unknown boost plan')

  const featuredUntil = Date.now() + plan.days * 24 * 60 * 60 * 1000

  const listingsSnap = await getDocs(
    query(collection(db, 'listings'), where('ownerId', '==', ownerId), where('active', '==', true))
  )
  await Promise.all(
    listingsSnap.docs.map((d) => updateDoc(doc(db, 'listings', d.id), { featured: true, featuredUntil }))
  )

  await addDoc(collection(db, 'boosts'), {
    ownerId,
    planId,
    days: plan.days,
    price: plan.price,
    paymentReference,
    listingsAffected: listingsSnap.size,
    featuredUntil,
    createdAt: serverTimestamp(),
  })

  return { listingsAffected: listingsSnap.size, featuredUntil }
}
