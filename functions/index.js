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
        tx.set(db.collection('notifications').doc(), {
          userId: booking.ownerId,
          type: 'payment_received',
          title: 'Payment received',
          body: `Payment verified for "${booking.listingTitle}" — ₦${Number(booking.totalPrice).toLocaleString()}.`,
          link: '/dashboard',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        })
        tx.set(db.collection('notifications').doc(), {
          userId: booking.renterId,
          type: 'booking_confirmed',
          title: 'Booking confirmed',
          body: `Your payment for "${booking.listingTitle}" has been verified.`,
          link: '/my-bookings',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        })
      }
    })

    return { verified: true, reference, bookingIds, amount: Number(transaction.amount) }
  }
)


/** Availability lookup without exposing other customers' booking records. */
exports.checkListingAvailability = onCall(async (request) => {
  // Public catalog browsing may check aggregate availability without signing in.
  // The function returns no renter names, addresses, or booking identifiers.
  const { listingId, startDate, endDate, requestedQty = 1, totalQty = 1 } = request.data || {}
  if (typeof listingId !== 'string' || !listingId || typeof startDate !== 'string' ||
      typeof endDate !== 'string' || !Number.isInteger(requestedQty) || !Number.isInteger(totalQty) ||
      requestedQty < 1 || totalQty < 1 || requestedQty > totalQty ||
      !Number.isFinite(Date.parse(startDate)) || !Number.isFinite(Date.parse(endDate)) ||
      Date.parse(startDate) > Date.parse(endDate)) {
    throw new HttpsError('invalid-argument', 'Invalid listing or rental dates.')
  }

  const listingSnap = await db.collection('listings').doc(listingId).get()
  if (!listingSnap.exists || listingSnap.data().active !== true || listingSnap.data().moderationStatus !== 'approved') {
    throw new HttpsError('not-found', 'This listing is not currently available.')
  }
  const actualTotal = Number(listingSnap.data().quantity || 1)
  if (requestedQty > actualTotal || totalQty !== actualTotal) {
    throw new HttpsError('failed-precondition', 'The requested quantity does not match the current listing availability.')
  }

  const snap = await db.collection('bookings')
    .where('listingId', '==', listingId)
    .where('status', 'in', ['pending', 'confirmed', 'preparing', 'delivered', 'event_active'])
    .get()
  const start = Date.parse(startDate)
  const end = Date.parse(endDate)
  const reserved = snap.docs.reduce((sum, doc) => {
    const booking = doc.data()
    if (booking.status === 'pending' && booking.paymentExpiresAt &&
        typeof booking.paymentExpiresAt.toMillis === 'function' &&
        booking.paymentExpiresAt.toMillis() <= Date.now()) return sum
    const from = Date.parse(booking.startDate)
    const to = Date.parse(booking.endDate)
    return Number.isFinite(from) && Number.isFinite(to) && start <= to && end >= from
      ? sum + Number(booking.quantity || 1)
      : sum
  }, 0)
  return { available: reserved + requestedQty <= actualTotal, remaining: Math.max(0, actualTotal - reserved) }
})


/**
 * Create bookings using authoritative listing prices and coupon data. The
 * client supplies only listing IDs, dates, quantities, delivery address, and
 * a coupon code; it cannot choose owner IDs or booking prices.
 */
exports.createPendingBookings = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in to create a booking.')
  const { items, deliveryAddress, deliveryLat = null, deliveryLon = null, couponCode = '', expectedTotal } = request.data || {}
  if (!Array.isArray(items) || items.length < 1 || items.length > 20 ||
      typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 5 ||
      deliveryAddress.length > 500 || !Number.isFinite(Number(expectedTotal)) || Number(expectedTotal) <= 0 ||
      (deliveryLat !== null && (!Number.isFinite(Number(deliveryLat)) || Number(deliveryLat) < -90 || Number(deliveryLat) > 90)) ||
      (deliveryLon !== null && (!Number.isFinite(Number(deliveryLon)) || Number(deliveryLon) < -180 || Number(deliveryLon) > 180))) {
    throw new HttpsError('invalid-argument', 'Please provide valid checkout details.')
  }

  const normalizedItems = []
  const seen = new Set()
  for (const item of items) {
    if (!item || typeof item.listingId !== 'string' || !item.listingId ||
        seen.has(item.listingId) || !Number.isInteger(item.qty) || item.qty < 1 ||
        typeof item.startDate !== 'string' || typeof item.endDate !== 'string' ||
        !Number.isFinite(Date.parse(item.startDate)) || !Number.isFinite(Date.parse(item.endDate)) ||
        Date.parse(item.startDate) > Date.parse(item.endDate)) {
      throw new HttpsError('invalid-argument', 'One or more cart items are invalid.')
    }
    seen.add(item.listingId)
    normalizedItems.push({
      listingId: item.listingId,
      qty: item.qty,
      startDate: item.startDate,
      endDate: item.endDate,
    })
  }

  let discountPercent = 0
  if (typeof couponCode === 'string' && couponCode.trim()) {
    const couponId = couponCode.trim().toUpperCase()
    if (couponId.length > 40) throw new HttpsError('invalid-argument', 'Invalid coupon code.')
    const couponSnap = await db.collection('coupons').doc(couponId).get()
    if (!couponSnap.exists || couponSnap.data().active !== true) {
      throw new HttpsError('failed-precondition', 'The coupon code is no longer valid. Remove it and try again.')
    }
    discountPercent = Number(couponSnap.data().percentOff)
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      throw new HttpsError('failed-precondition', 'The coupon is configured incorrectly. Please contact support.')
    }
  }

  const now = Date.now()
  const expiry = now + 15 * 60 * 1000
  const listings = await Promise.all(normalizedItems.map((item) => db.collection('listings').doc(item.listingId).get()))
  const bookings = []
  let total = 0

  for (let i = 0; i < normalizedItems.length; i += 1) {
    const item = normalizedItems[i]
    const listingSnap = listings[i]
    if (!listingSnap.exists) throw new HttpsError('not-found', 'An item in your cart no longer exists.')
    const listing = listingSnap.data()
    if (listing.active !== true || listing.moderationStatus !== 'approved') {
      throw new HttpsError('failed-precondition', 'An item in your cart is no longer available.')
    }
    if (listing.ownerId === request.auth.uid) {
      throw new HttpsError('failed-precondition', 'You cannot rent your own listing.')
    }
    const pricePerDay = Number(listing.pricePerDay)
    const quantity = Number(listing.quantity || 1)
    if (!Number.isFinite(pricePerDay) || pricePerDay <= 0 || !Number.isInteger(quantity) || quantity < 1 || item.qty > quantity) {
      throw new HttpsError('failed-precondition', 'An item in your cart has invalid pricing or quantity.')
    }

    const start = Date.parse(item.startDate)
    const end = Date.parse(item.endDate)
    const days = Math.floor((end - start) / 86400000) + 1
    if (days < 1 || days > 365) throw new HttpsError('invalid-argument', 'Rental periods must be between 1 and 365 days.')

    const reservationSnap = await db.collection('bookings')
      .where('listingId', '==', item.listingId)
      .where('status', 'in', ['pending', 'confirmed', 'preparing', 'delivered', 'event_active'])
      .get()
    const reservedQty = reservationSnap.docs.reduce((sum, doc) => {
      const booking = doc.data()
      if (booking.status === 'pending' && booking.paymentExpiresAt &&
          typeof booking.paymentExpiresAt.toMillis === 'function' &&
          booking.paymentExpiresAt.toMillis() <= now) return sum
      const bookingStart = Date.parse(booking.startDate)
      const bookingEnd = Date.parse(booking.endDate)
      return Number.isFinite(bookingStart) && Number.isFinite(bookingEnd) &&
        start <= bookingEnd && end >= bookingStart
        ? sum + Number(booking.quantity || 1)
        : sum
    }, 0)
    if (reservedQty + item.qty > quantity) {
      throw new HttpsError('failed-precondition', 'An item in your cart is no longer available for those dates and quantity.')
    }

    const rentalTotal = Math.round(pricePerDay * days * item.qty * (1 - discountPercent / 100))
    const deliveryCost = Math.max(0, Number(listing.deliveryCost) || 0)
    const securityDeposit = Math.max(0, Number(listing.securityDeposit) || 0)
    const bookingTotal = rentalTotal + deliveryCost + securityDeposit * item.qty
    if (!Number.isFinite(bookingTotal) || bookingTotal <= 0) {
      throw new HttpsError('failed-precondition', 'The total for an item in your cart is invalid.')
    }
    total += bookingTotal
    bookings.push({
      ...item,
      ownerId: listing.ownerId,
      ownerName: listing.ownerName || '',
      listingTitle: listing.title || 'Equipment',
      pricePerDay,
      days,
      totalPrice: bookingTotal,
      quantity: item.qty,
      deliveryCost,
      securityDeposit,
      deliveryAddress: deliveryAddress.trim(),
      deliveryLat: deliveryLat === null ? null : Number(deliveryLat),
      deliveryLon: deliveryLon === null ? null : Number(deliveryLon),
    })
  }

  if (Math.round(total * 100) !== Math.round(Number(expectedTotal) * 100)) {
    throw new HttpsError('failed-precondition', 'A listing price, delivery fee, deposit, or coupon changed. Refresh your cart and review the updated total before paying.')
  }

  const refs = bookings.map(() => db.collection('bookings').doc())
  const batch = db.batch()
  for (let i = 0; i < bookings.length; i += 1) {
    const booking = bookings[i]
    batch.set(db.collection('notifications').doc(), {
      userId: booking.ownerId,
      type: 'booking_placed',
      title: 'New booking request',
      body: `${request.auth.token.name || request.auth.token.email || 'A renter'} wants to book "${booking.listingTitle}" for ${booking.startDate} → ${booking.endDate}.`,
      link: '/dashboard',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })
    batch.set(refs[i], {
      listingId: booking.listingId,
      listingTitle: booking.listingTitle,
      ownerId: booking.ownerId,
      renterId: request.auth.uid,
      renterName: request.auth.token.name || request.auth.token.email || 'Renter',
      startDate: booking.startDate,
      endDate: booking.endDate,
      days: booking.days,
      pricePerDay: booking.pricePerDay,
      quantity: booking.quantity,
      deliveryCost: booking.deliveryCost,
      securityDeposit: booking.securityDeposit,
      totalPrice: booking.totalPrice,
      deliveryAddress: booking.deliveryAddress,
      deliveryLat: booking.deliveryLat,
      deliveryLon: booking.deliveryLon,
      status: 'pending',
      paid: false,
      paymentExpiresAt: new Date(expiry),
      createdAt: FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()
  return { bookingIds: refs.map((ref) => ref.id), total: Math.round(total * 100) / 100, expiresAt: expiry }
})
