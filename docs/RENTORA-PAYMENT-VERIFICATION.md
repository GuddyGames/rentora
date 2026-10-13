# Rentora server-side Paystack verification

This change adds a callable Cloud Function that checks the transaction directly with Paystack before marking bookings paid. The Paystack secret key stays in Firebase Functions secrets and must never be committed or placed in frontend code.

## Required setup before deploying

1. In the intended Firebase project, set the secret securely:
   `firebase functions:secrets:set PAYSTACK_SECRET_KEY --project YOUR_PROJECT_ID`
2. Set up Google Cloud Workload Identity Federation for GitHub Actions and a narrowly scoped deployment service account.
3. In GitHub repository settings, create an environment named `firebase-deploy`. Add environment secrets `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_DEPLOY_SERVICE_ACCOUNT`.
4. Add the repository/environment variable `FIREBASE_ALLOWED_PROJECTS` containing the exact permitted project ID(s), comma-separated.
5. Enable billing and the APIs required for Cloud Functions deployment. Firebase Functions production deployment generally requires the Blaze plan.
6. Test with a non-production Firebase project first.

## Manual Firebase deployment

From the repository root, after installing Firebase CLI and authenticating locally:

```sh
npm install --prefix functions
firebase functions:secrets:set PAYSTACK_SECRET_KEY --project YOUR_PROJECT_ID
firebase deploy --only functions --project YOUR_PROJECT_ID
```

## Deploy from GitHub Actions

Open Actions → Deploy Rentora Firebase Functions → Run workflow. Enter the exact Firebase project ID and type `DEPLOY`. The workflow checks the allowlist and deploys Functions only. It does not deploy Firestore rules or the Vercel frontend.

## Security limitation that must be addressed

The existing app still creates booking documents and computes prices in the browser. This function verifies that Paystack reports a successful NGN transaction for the amount stored on those booking documents, but it does not independently recompute rental pricing from trusted listing data. Before treating this as fully fraud-resistant, move booking creation, price calculation, and coupon validation into trusted server code and review all booking status transitions. Do not deploy this as a claim of complete payment security until that work is complete.
