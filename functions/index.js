const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp()

const db = getFirestore()
const paystackSecret = defineSecret('PAYSTACK_SECRET_KEY')

/**
 * Verify a Paystack transaction from Paystack's API before marking any
 * booking paid. The browser is never trusted to assert payment success.
 * One Paystack payment can cover several cart bookings; the verified charge
 * must equal the sum of those pending bookings exactly.
 */
exports.verifyPaystackPayment = onCall(
  { secrets: [paystackSecret], enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in before verifying payment.')

    const reference = request.data && request.data.reference
    const bookingIds = request.data && request.data.bookingIds
    if (typeof reference !== 'string' || reference.length < 8 || reference.length > 120) {
      throw new HttpsError('invalid-argument', 'A valid payment reference is required.')
    }
    if (!Array.isArray(bookingIds) || bookingIds.length < 1 || bookingIds.length > 20 ||
        bookingIds.some((id) => typeof id !== 'string' || id.length > 128) ||
        new Set(bookingIds).size !== bookingIds.length) {
      throw new HttpsError('invalid-argument', 'Invalid booking list.')
    }

    const response = await fetch(
      'https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference),
      { headers: { Authorization: 'Bearer ' + paystackSecret.value(), Accept: 'application/json' } }
    )
    if (!response.ok) {
      throw new HttpsError('unavailable', 'Payment verification service is temporarily unavailable. Your booking has not been confirmed.')
    }

    let result
    try {
      result = await response.json()
    } catch {
      throw new HttpsError('unavailable', 'Payment provider returned an invalid response.')
    }
    const transaction = result && result.data
    if (!result.status || !transaction || transaction.status !== 'success' ||
        transaction.reference !== reference || transaction.currency !== 'NGN') {
      throw new HttpsError('failed-precondition', 'Paystack has not confirmed a successful NGN payment for this reference.')
    }

    const refs = bookingIds.map((id) => db.collection('bookings').doc(id))
    const snapshots = await Promise.all(refs.map((ref) => ref.get()))
    if (snapshots.some((snap) => !snap.exists)) {
      throw new HttpsError('not-found', 'One or more bookings could not be found.')
    }

    const bookings = snapshots.map((snap) => ({ id: snap.id, ...snap.data() }))
    if (bookings.some((booking) => booking.renterId !== request.auth.uid)) {
      throw new HttpsError('permission-denied', 'You cannot verify bookings belonging to another account.')
    }
    if (bookings.some((booking) => booking.status !== 'pending' &&
      !(booking.paid === true && booking.paymentReference === reference))) {
      throw new HttpsError('failed-precondition', 'One or more bookings are no longer awaiting payment.')
    }

    const expectedKobo = bookings.reduce((sum, booking) => {
      const price = Number(booking.totalPrice)
      if (!Number.isFinite(price) || price <= 0) return NaN
      return sum + Math.round(price * 100)
    }, 0)
    if (!Number.isFinite(expectedKobo) || expectedKobo !== Number(transaction.amount)) {
      throw new HttpsError('failed-precondition', 'The verified payment amount does not match the booking total.')
    }

    await db.runTransaction(async (tx) => {
      const current = await Promise.all(refs.map((ref) => tx.get(ref)))
      if (current.some((snap) => !snap.exists)) {
        throw new HttpsError('not-found', 'A booking disappeared during payment verification.')
      }
      for (let i = 0; i < current.length; i += 1) {
        const booking = current[i].data()
        if (booking.renterId !== request.auth.uid) {
          throw new HttpsError('permission-denied', 'Booking ownership changed.')
        }
        if (booking.paid === true && booking.paymentReference === reference) continue
        if (booking.status !== 'pending' || booking.paid === true) {
          throw new HttpsError('failed-precondition', 'A booking has already changed; contact support before paying again.')
        }
      }
      for (let i = 0; i < refs.length; i += 1) {
        const booking = current[i].data()
        if (booking.paid === true && booking.paymentReference === reference) continue
        tx.update(refs[i], {
          paid: true,
          paymentReference: reference,
          status: 'confirmed',
          paymentVerifiedAt: FieldValue.serverTimestamp(),
        })
      }
    })

    return { verified: true, reference, bookingIds, amount: Number(transaction.amount) }
  }
)
