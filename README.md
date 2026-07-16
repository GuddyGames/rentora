# Rentora — event equipment rental MVP

React + Vite + Tailwind, Firebase (Auth + Firestore), Paystack checkout.

## Setup

```bash
npm install
cp .env.example .env
```

1. Create a Firebase project at console.firebase.google.com
2. Enable **Authentication** → Email/Password and Google providers
3. Enable **Firestore Database** (start in production mode, not test mode)
4. Copy your Firebase web config into `.env`
5. Deploy `firestore.rules` from the Firebase console (Firestore → Rules tab — paste the file's contents) so listings/bookings/reviews/messages are actually locked down, not left in test mode
6. The first time you run each new query (browse by category, my-bookings, dashboard, messages) Firestore will throw a console error with a link to auto-create the composite index it needs — click through those links once. `firestore.indexes.json` lists all of them if you'd rather deploy via the Firebase CLI (`firebase deploy --only firestore:indexes`)
7. Sign up for Paystack (paystack.com), grab your **test** public key, add it to `VITE_PAYSTACK_PUBLIC_KEY` in `.env`

```bash
npm run dev
```

Deploy to Vercel as usual — `vercel --prod`, and add the same env vars in the Vercel project settings.

## How it works

- **Images**: stored as compressed base64 strings directly on the Firestore document (see `src/utils/compressImage.js`) — no Firebase Storage bucket needed, so no Storage billing.
- **Booking conflicts**: checked at submit time in `src/services/bookings.js` (`hasConflict`) by comparing date ranges against existing pending/confirmed bookings for that listing, and re-checked again at checkout. Good enough at MVP volume; not airtight against two people racing to book the same second — a Firestore transaction would close that gap later.
- **Roles**: a user picks `renter` or `owner` at signup, stored on their `users/{uid}` doc. Owners get `/dashboard` and `/add-listing`; renters get `/my-bookings`. `ProtectedRoute` enforces this.
- **Cart & checkout**: cart lives in `localStorage` via `src/context/CartContext.jsx` (fine here — this is a real deployed app, not a Claude artifact sandbox). Checkout creates one `bookings` doc per cart item, then runs a single Paystack charge for the combined total.
- **Coupons**: looked up from a `coupons/{CODE}` Firestore doc shaped `{ percentOff, active }`. No management UI yet — add codes by hand in the console.
- **Reviews**: stored in a `listings/{id}/reviews` subcollection, tied to a specific `bookingId` so a renter can only review a booking once. Submitting one rolls a running average into `ratingAvg`/`ratingCount` on the listing via a Firestore transaction.
- **Messaging**: one conversation per (listing, renter) pair, id'd as `{listingId}_{renterId}`. Text-only for now — no photos/voice notes. `src/services/chat.js` handles it with `onSnapshot` for live updates.
- **Event checklist**: `src/utils/eventChecklist.js` is a rule-of-thumb generator (not a real AI model) — guest count and event type map to suggested categories and quantities. `PlanEvent.jsx` then pulls live average pricing per category from Firestore so the estimate reflects what's actually listed.
- **Payments**: Paystack Inline JS, loaded via CDN script in `index.html`. A booking is created as `pending` first, then marked `paid`/`confirmed` on successful checkout.

## Left for v2

- Photos/voice notes in chat, push/SMS notifications
- Owner-side coupon management UI
- Wallet, live delivery GPS tracking, vendor KYC/BVN verification, admin panel — these need real financial/compliance/logistics infrastructure and shouldn't be bolted on casually
- A Firestore transaction on booking creation to fully close the double-booking race window
- Native mobile app (this is web-only; works fine as an installable PWA on mobile data in the meantime)
