import LegalPage from '../components/LegalPage'

export default function RefundPolicy() {
  return (
    <LegalPage title="Cancellation & Refund Policy" updated="August 2026">
      <h2>Refundable deposits</h2>
      <p>
        Where a listing shows a refundable deposit, it's meant to be returned to the renter after the owner
        confirms the equipment came back in the condition it was delivered in. Rentora's delivery/return
        photo feature exists to document that condition on both ends — use it.
      </p>

      <h2>Cancelling a booking</h2>
      <p>
        A renter can request cancellation of a <strong>pending</strong> booking (one the owner hasn't
        confirmed yet) at any time with no penalty. Once an owner has confirmed a booking, cancellation
        terms are between renter and owner — check with the owner directly through in-app messaging before
        assuming a refund.
      </p>

      <h2>Disputed charges</h2>
      <p>
        If you believe you were charged incorrectly, or equipment wasn't delivered as booked, use "Report an
        issue" on that booking. An admin will review it. We can't issue refunds directly through Paystack
        automatically yet — every refund is currently handled case-by-case by an admin after reviewing the
        dispute. This is a known limitation, not a policy choice to avoid refunds.
      </p>

      <h2>What this policy doesn't cover yet</h2>
      <p>
        We don't currently have an automated refund system, an insurance product, or a guaranteed
        compensation scheme for damaged equipment. What exists today is: refundable deposits (owner-managed),
        delivery/return photo documentation, and an admin-reviewed dispute process. We'd rather tell you
        plainly what's not built yet than imply protection that doesn't exist.
      </p>
    </LegalPage>
  )
}
