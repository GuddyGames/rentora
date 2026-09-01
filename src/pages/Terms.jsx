import LegalPage from '../components/LegalPage'

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="August 2026">
      <h2>What Rentora is</h2>
      <p>
        Rentora is a marketplace connecting people who own event equipment (canopies, chairs, sound systems,
        etc.) with people who want to rent it. Rentora is not the owner of any listed equipment and is not
        a party to the rental agreement between renter and owner — we provide the platform, booking, and
        payment flow.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You must provide accurate information when signing up</li>
        <li>You're responsible for activity on your account</li>
        <li>Accounts found to violate these terms may be restricted or removed by an admin, with the reason logged</li>
      </ul>

      <h2>Listings (for owners)</h2>
      <ul>
        <li>Listings must accurately describe the equipment, its condition, and price</li>
        <li>New listings are reviewed before appearing publicly</li>
        <li>You're responsible for the equipment's safety and condition when delivered</li>
        <li>You must honor confirmed bookings — repeated cancellations may result in account restriction</li>
      </ul>

      <h2>Bookings (for renters)</h2>
      <ul>
        <li>A booking is a commitment to pay the listed price for the listed dates</li>
        <li>Refundable deposits, where listed, are held by the owner and released after the equipment is returned in the condition it was delivered in</li>
        <li>You're responsible for equipment while it's in your possession</li>
      </ul>

      <h2>Payments</h2>
      <p>
        Payments are processed by Paystack. Rentora does not store your card details. Refund eligibility for
        a specific booking is governed by our Cancellation & Refund Policy.
      </p>

      <h2>Disputes</h2>
      <p>
        If something goes wrong with a booking, use the "Report an issue" option on that booking to notify
        an admin. Admins review disputes and reports and may restrict accounts, remove listings, or take
        other action as appropriate — every such action is logged.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        Rentora provides the platform "as is." We do our best to verify listings through review and, for
        some vendors, manual verification, but we can't guarantee every listing's accuracy or every renter's
        or owner's conduct. Use the reporting tools if something seems wrong.
      </p>
    </LegalPage>
  )
}
