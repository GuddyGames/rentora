import LegalPage from '../components/LegalPage'

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="August 2026">
      <h2>What we collect</h2>
      <p>
        When you create an account: your name, email, and role (renter or owner). When you book or list
        equipment: delivery addresses and approximate map coordinates, phone contact shared through in-app
        messages, photos you upload of equipment or delivery/return condition, and booking history. We do
        not collect or store payment card details — those go directly to Paystack, our payment processor.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To operate bookings — matching renters with owners, processing payments, showing delivery locations</li>
        <li>To send you notifications about your own bookings (confirmed, delivered, etc.)</li>
        <li>To let admins investigate reports and disputes you or others file</li>
        <li>To improve the app — we don't sell your data to third parties or use it for advertising</li>
      </ul>

      <h2>Who can see what</h2>
      <p>
        Your name and rating are visible on listings you own or reviews you leave. Delivery addresses are
        visible to the owner of equipment you've booked with them, and to Rentora admins if a dispute is
        filed. Your email and full profile are not visible to other regular users.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can delete your account at any time from Account settings</li>
        <li>Deleting your account anonymizes your name/email and disables your login — it doesn't retroactively erase past booking or listing records, since those are needed for the other party's own transaction history</li>
        <li>You can ask us to explain or correct data we hold about you</li>
      </ul>

      <h2>Third parties</h2>
      <p>
        We use Firebase (Google) for authentication and data storage, Paystack for payments, and
        OpenStreetMap for delivery-location maps. Each has its own privacy policy governing how they handle
        data passed to them.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy or your data can be sent through the in-app support/report tools.</p>
    </LegalPage>
  )
}
