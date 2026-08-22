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
- **Admin panel** (`/admin`): platform stats, listing moderation (hide/feature/delete any listing), user moderation (restrict/restore accounts), a payments view across every booking, and a disputes queue. Nobody can sign up as admin — it's not a role choice on the signup form. To make yourself admin: open Firebase console → Firestore → `users` collection → find your own user document (matches your auth uid) → add a field `isAdmin` set to boolean `true`. Reload the app and an "Admin control room" row appears in your Account page.
- **Disputes**: either party can file one from `My Bookings` ("Report an issue") with an optional photo. Admin resolves them from `/admin/disputes`.
- **Delivery/return photos**: owners can attach a condition photo when marking a booking "delivered" or "returned" from the Dashboard — this is the honest, in-house substitute for a real insurance product. It's documentation, not a payout guarantee.
- **Featured listings**: admin-only toggle (`/admin/listings`) — no self-serve "boost" purchase flow yet, see below.

- **Delivery location map**: at checkout, "Preview on map" geocodes the typed address via OpenStreetMap's free Nominatim API (no key, no billing) and shows a pin via an OSM embed. This is a static destination pin, not live GPS tracking — there's no vehicle hardware feed behind it, so it shows where delivery is headed, not where it currently is. Both the owner (Dashboard) and renter (My Bookings) can view it per booking.

## Deliberately not built

A few things came up that need real infrastructure or a legal/financial partner before they can be built honestly — building fake versions would mean promising users protections that don't actually exist:

- **Real insurance / theft-damage coverage** — needs an actual underwriting partner. The delivery/return photo system above is the honest stand-in.
- **Live GPS delivery tracking** (a moving vehicle on a map) — needs physical trackers plus a paid fleet-tracking API (e.g. Verizon Connect); not something to fake in the UI. What's built instead is a static destination-address pin (see above).
- **Fraud/ML detection, automated chargebacks** — Paystack has its own fraud tooling; layering a custom one on top is a large undertaking on its own.

## Left for v2

- Photos/voice notes in chat, push/SMS notifications
- Owner-side coupon management UI
- Self-serve "boost my listing" payment flow (currently admin-only)
- Wallet, live delivery GPS tracking, vendor KYC/BVN verification — these need real financial/compliance/logistics infrastructure and shouldn't be bolted on casually
- A Firestore transaction on booking creation to fully close the double-booking race window
- Native mobile app (this is web-only; works fine as an installable PWA on mobile data in the meantime)

## What's new in this pass

- **Home now has two real modes**: a marketing page when logged out (`HomeGuest.jsx`), and an iOS-glass dashboard when logged in (`HomeDashboard.jsx`) — greeting, live search, quick-action tiles, an upcoming booking preview, and popular listings, all over a drifting blue/gold aurora backdrop (`aurora-bg` in `index.css`).
- **Fixed a real bug**: "List your equipment" used to be a hardcoded link to `/signup` regardless of login state, so a logged-in owner got bounced back to the signup page. Splitting Home into guest/dashboard views fixed this at the root — the dashboard never shows that link at all.
- **In-app notifications** (`services/notifications.js`, `components/NotificationBell.jsx`): a real notification center with a live unread badge in the nav. Fires on: new booking request (to the owner), payment received (to the owner), booking confirmed (to the renter), and delivered (to the renter). **This is in-app only** — it shows up while Rentora is open in a tab. True push (an alert even with the app closed) needs Firebase Cloud Messaging + a service worker, which is separate, bigger infrastructure not built here.
- **Admin presence + messaging**: a lightweight heartbeat (`lastActiveAt`, pinged every 60s while the app is open) drives an "active in the last 2 minutes" indicator in `/admin/users` — this is an approximation, not true instant online/offline (that needs Firebase Realtime Database's disconnect detection). Admin can now open a real chat with any user directly from that page, reusing the existing messaging system.
- **Plan My Event now persists** to `localStorage` — leaving the page and coming back restores your step, answers, and edited checklist. "Start over" clears it deliberately.
- **Shared icon set** (`components/icons.jsx`): consistent stroke-based icons now used across the nav, dashboard quick actions, and Account page, replacing the mismatched emoji that were there as placeholders. Category/event emoji (🎉🪑🎂 etc.) are kept — they're still the clearest way to label dozens of real-world item types.
- **Fixed listing card alignment**: the Featured badge and category badge were both wide enough to collide on a narrow 2-column mobile grid; the price section was wide enough to squeeze titles down to one visible letter. Badges are now icon-first, and the card layout is stacked (title, then location, then price) instead of a cramped side-by-side row.
