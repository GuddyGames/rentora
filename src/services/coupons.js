import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Coupons are simple documents at coupons/{CODE} shaped like { percentOff: 10, active: true }.
// Add them by hand in the Firebase console for now — a management UI can come later.
export async function getCoupon(code) {
  if (!code) return null
  const snap = await getDoc(doc(db, 'coupons', code.trim().toUpperCase()))
  if (!snap.exists() || !snap.data().active) return null
  return snap.data()
}
