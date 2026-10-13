# Rentora production setup

Rentora's React client can be deployed to Vercel, but payment verification and private availability checks must run in Firebase Cloud Functions. Never put a Paystack **secret** key in a `VITE_*` variable.

## 1. Configure Firebase

1. Create or select the Firebase project used by this app.
2. Enable Authentication → Email/Password. Enable Google only if you intend to offer it.
3. Enable Cloud Firestore.
4. Copy the web app's public Firebase configuration into the Vercel environment variables (and local `.env` for development): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`.
5. Set `VITE_PAYSTACK_PUBLIC_KEY` to the Paystack **public** key for the intended environment.

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

The `verifyPaystackPayment` callable function asks Paystack's API to verify the reference and checks the transaction status, NGN currency, total amount, and booking ownership before marking bookings paid. `checkListingAvailability` returns only aggregate availability; it does not disclose other renters' booking records.

**Important:** Cloud Functions deployment requires a Firebase project with billing/Blaze enabled. Do not accept real payments until the function is deployed and tested with Paystack test keys. If the function is not deployed, checkout will fail closed rather than pretend that a payment succeeded.

## 3. Deploy the React client

Deploy the repository root to Vercel using the existing Vite settings. Add the Firebase web configuration and Paystack public key to Vercel Project → Settings → Environment Variables, then redeploy.

## 4. Verify before launch

- Test renter and owner signup, email/password login, Google login if enabled, and password reset.
- Confirm a new listing starts pending and only an admin can approve or feature it.
- Confirm a user cannot read another user's booking, edit their own role, forge `paid`, or mark a booking confirmed from browser tools.
- Test payment success, failure, closing the Paystack modal, repeated verification, and mismatched amounts with Paystack test transactions.
- Test overlapping date ranges and quantities, including two customers attempting to reserve the last units.
- Verify the deployed Firestore rules match this repository. Updating the file alone does not publish rules.
- Check the GitHub Actions build result and manually test the deployed Vercel URL on a phone.

The availability check is a submit-time check, not an inventory reservation lock. For high traffic or scarce inventory, introduce a server-side transactional reservation/expiry flow before launch.
