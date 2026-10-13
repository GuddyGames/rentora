# Rentora production setup

Rentora's React client can be deployed to Vercel, but payment verification and private availability checks must run in Firebase Cloud Functions. Never put a Paystack **secret** key in a `VITE_*` variable.

## 1. Configure Firebase

1. Since Rentora's Firebase web config is already in Vercel, retrieve the existing production environment variables rather than asking for the project ID again. From the repository root, sign in to the Vercel CLI and link the existing Rentora Vercel project:

   ```bash
   npx vercel login
   npx vercel link
   npx vercel env pull .env.production.local
   ```

   Select the existing Vercel project and production environment. Keep `.env.production.local` private; do not commit it or paste its contents into chat.
2. Read only the Firebase project ID from that downloaded environment file and use it to select the matching Firebase project:

   ```bash
   node -e "const fs=require('fs');const s=fs.readFileSync('.env.production.local','utf8');const m=s.match(/^VITE_FIREBASE_PROJECT_ID=(.*)$/m);if(!m)throw Error('VITE_FIREBASE_PROJECT_ID is missing');console.log(m[1].trim().replace(/^['\"]|['\"]$/g,''))"
   firebase login
   firebase projects:list
   ```

   Compare the printed ID with the project list. Once confirmed, run `firebase use <PROJECT_ID>` from the repository root. Do not deploy if the IDs do not match. The Firebase project ID is already in Vercel; this step makes the Firebase CLI target the same existing project.
3. In that same project, confirm Authentication → Email/Password is enabled. Confirm Google is enabled only if you intend to offer it.
4. Confirm Cloud Firestore is enabled and inspect the existing data before deploying the stricter rules.
5. Because this app was already deployed with its environment configured, **keep the existing Vercel values** unless you discover a missing or incorrect value. Confirm the required names exist: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and `VITE_PAYSTACK_PUBLIC_KEY`. Do not replace working production values just to follow this guide.

Firebase web config values are client identifiers, not server credentials. Do not commit service-account JSON or secret keys.

## 2. Configure trusted payment verification

1. Install the Firebase CLI and authenticate with an account that has access to the Firebase project.
2. From the repository root, select the correct project with `firebase use --add`.
3. Set the Paystack **secret** key as a Firebase Functions secret:

   ```bash
   firebase functions:secrets:set PAYSTACK_SECRET_KEY
   ```

4. Deploy the functions and Firestore policy/indexes:

   ```bash
   firebase deploy --only functions,firestore:rules,firestore:indexes
   ```

Checkout now generates a reference before creating pending bookings, sends it to the server, and stores it on each booking. The `verifyPaystackPayment` callable function asks Paystack's API to verify that same reference and checks it is linked to the submitted bookings, as well as transaction status, NGN currency, total amount, and booking ownership before marking bookings paid. `checkListingAvailability` returns only aggregate availability; it does not disclose other renters' booking records. Booking creation re-reads listing inventory and overlapping reservations inside a Firestore transaction and creates the pending holds in that same transaction, reducing the risk of simultaneous checkouts overselling the last units. Concurrent behavior still needs to be verified against the deployed Firebase project.

**Important:** Cloud Functions deployment requires a Firebase project with billing/Blaze enabled. Do not accept real payments until the function is deployed and tested with Paystack test keys. If the function is not deployed, checkout will fail closed rather than pretend that a payment succeeded.

## 3. Deploy the React client

Deploy the repository root to Vercel using the existing Vite settings. Add the Firebase web configuration and Paystack public key to Vercel Project → Settings → Environment Variables, then redeploy.

## 4. Verify before launch

- Test renter and owner signup, email/password login, Google login if enabled, and password reset.
- Confirm a new listing starts pending and only an admin can approve or feature it.
- Confirm a user cannot read another user's booking, edit their own role, forge `paid`, or mark a booking confirmed from browser tools.
- Test payment success, failure, closing the Paystack modal, repeated verification, a reference not attached to the bookings, and mismatched amounts with Paystack test transactions.
- Test overlapping date ranges and quantities, including two customers attempting to reserve the last units.
- Verify the deployed Firestore rules match this repository. Updating the file alone does not publish rules.
- Check the GitHub Actions build result and manually test the deployed Vercel URL on a phone.

Pending bookings expire in availability calculations after 15 minutes, but there is no scheduled cleanup job yet, so expired records remain in Firestore until separately cleaned up. Test simultaneous checkouts for the last available units in the deployed project before launch; source changes alone do not prove production concurrency behavior.
