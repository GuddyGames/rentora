const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore()
const paystackSecretKey = defineSecret('PAYSTACK_SECRET_KEY')

exports.verifyRentoraPayment = onCall(
  { region: 'us-central1', secrets: [paystackSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in before verifying payment.')
    }

    const { bookingIds, reference } = request.data || {}
    if (
      !Array.isArray(bookingIds) ||
      bookingIds.length < 1 ||
      bookingIds.length > 20 ||
      bookingIds.some((id) => typeof id !== 'string' || id.length < 5 || id.length > 150) ||
      typeof reference !== 'string' ||
      reference.length < 5 ||
      reference.length > 150
    ) {
      throw new HttpsError('invalid-argument', 'Invalid booking IDs or payment reference.')
    }
    if (reference !== bookingIds[0]) {
      throw new HttpsError('invalid-argument', 'Payment reference does not match the checkout reference.')
    }

    const refs = bookingIds.map((id) => db.collection('bookings').doc(id))
    const snapshots = await db.getAll(...refs)
    if (snapshots.some((snap) => !snap.exists)) {
      throw new HttpsError('not-found', 'One or more bookings could not be found.')
    }

    const bookings = snapshots.map((snap) => ({ id: snap.id, ...snap.data() }))
    if (bookings.some((booking) => booking.renterId !== request.auth.uid)) {
      throw new HttpsError('permission-denied', 'You can only verify your own bookings.')
    }
    if (bookings.every((booking) => booking.paid === true && booking.paymentReference === reference)) {
      return { success: true, alreadyVerified: true, bookingIds }
    }
    if (bookings.some((booking) => booking.paid === true || booking.status !== 'pending')) {
      throw new HttpsError('failed-precondition', 'Bookings are no longer pending payment.')
    }
    if (bookings.some((booking) => !Number.isFinite(booking.totalPrice) || booking.totalPrice < 0)) {
      throw new HttpsError('failed-precondition', 'Booking total is invalid.')
    }

    const expectedKobo = Math.round(
      bookings.reduce((sum, booking) => sum + booking.totalPrice, 0) * 100,
    )
    if (!Number.isSafeInteger(expectedKobo) || expectedKobo <= 0) {
      throw new HttpsError('failed-precondition', 'Expected payment amount is invalid.')
    }

    let response
    try {
      response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${paystackSecretKey.value()}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(12000),
        },
      )
    } catch (error) {
      console.error('Paystack verification request failed', error?.message)
      throw new HttpsError('unavailable', 'Could not reach Paystack. Please retry shortly.')
    }
    if (!response.ok) {
      console.error('Paystack verification returned HTTP', response.status)
      throw new HttpsError('unavailable', 'Paystack verification is temporarily unavailable.')
    }

    const payload = await response.json()
    const transaction = payload?.data
    if (
      payload?.status !== true ||
      !transaction ||
      transaction.status !== 'success' ||
      transaction.reference !== reference
    ) {
      throw new HttpsError('failed-precondition', 'Paystack has not confirmed this transaction as successful.')
    }
    if (transaction.currency !== 'NGN' || transaction.amount !== expectedKobo) {
      throw new HttpsError(
        'failed-precondition',
        'The verified payment amount or currency does not match the bookings.',
      )
    }
    if (
      request.auth.token.email &&
      transaction.customer?.email &&
      request.auth.token.email.toLowerCase() !== String(transaction.customer.email).toLowerCase()
    ) {
      throw new HttpsError('permission-denied', 'The Paystack customer email does not match your account.')
    }

    const batch = db.batch()
    for (const ref of refs) {
      batch.update(ref, {
        paid: true,
        paymentReference: reference,
        status: 'confirmed',
        paymentVerifiedAt: FieldValue.serverTimestamp(),
      })
    }
    await batch.commit()
    return { success: true, alreadyVerified: false, bookingIds }
  },
)
