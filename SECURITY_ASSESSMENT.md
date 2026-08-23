# Rentora Security Assessment

> **Update after this report:** items 1, 3, and 4 in the "Fix now" list below have been implemented in `firestore.rules` and the corresponding app code (`reviews.js`, `AuthContext.jsx`, `Login.jsx`, `Account.jsx`) — admin/suspension self-escalation is closed, review authenticity is now verified server-side via the security rules, the rating rollup can only move one review at a time, and email verification + password reset now exist. **Item 2 (payment verification) is still open** — see the "no server code" answer below; it needs an architecture decision, not just a rules edit. **You must re-publish `firestore.rules` in the Firebase console for any of this to take effect** — the file changing here doesn't change what's live.

Prepared by: Claude (acting as external reviewer), at the request of the project owner.
Scope: the Rentora web app codebase (React 18 + Vite + Firebase Auth/Firestore + Paystack), as of this session.
Method: (1) direct review of the actual source files, Firestore rules, and configuration in this project — not a generic checklist; (2) web searches against current vulnerability databases (NVD, GitHub Advisories, Snyk, OSV.dev) for the exact dependency versions pinned in `package.json`.

**What this is NOT**: a live penetration test against your deployed Vercel/Firebase instance (I don't have network access to reach it), a check of your actual Firebase Console configuration (App Check, authorized domains, published rules — I can only see the `firestore.rules` *file*, not what's live), or a check of your GitHub repo history for leaked secrets. Those need you — see "Open questions" at the end.

---

## Part 1 — Red team: how I'd actually break in

Playing attacker, using nothing but a browser's DevTools console and a free account, in order of how much damage each gets me.

### 1. Become admin in about 10 seconds (Critical)
`firestore.rules` lets any signed-in user update their **own** user document with no field restriction:
```
allow update: if isSignedIn() && (
  request.auth.uid == userId ||
  (isAdmin() && ...)
);
```
The `request.auth.uid == userId` branch has no `.hasOnly(...)` limit — unlike the admin branch right next to it, which *does* restrict fields. So as a normal renter, I open the console on any page and run:
```js
import { doc, updateDoc } from 'firebase/firestore'
updateDoc(doc(db, 'users', auth.currentUser.uid), { isAdmin: true })
```
Reload. I now have `/admin`: every user's data, every listing, every booking and its payment status, and the power to restrict any account (including yours). The same gap lets a **suspended** user simply write `{ suspended: false }` on themselves and undo the moderation action you took against them.

### 2. Get equipment for free, or get paid for equipment I never delivered (Critical)
Nothing server-side ever checks a Paystack payment actually happened. The flow is: browser calls Paystack, Paystack calls a client-side `callback`, that callback calls `markPaid()`, which is just:
```js
updateDoc(doc(db, 'bookings', id), { paid: true, paymentReference: reference, status: 'confirmed' })
```
The Firestore rule for bookings only checks that I'm the renter or owner on *that* booking — it never checks payment state. So I can skip Paystack entirely and, from the console, create a booking with `totalPrice: 100` for a ₦50,000/day item, then mark it paid myself. I could also directly forge a `boosts` purchase or set `featured: true` on my own listing (the listings rule gives an owner full write access to their own document, and `applyBoost()` writes `featured`/`featuredUntil` from client code with no server check that Paystack was ever actually called).

This is the structural issue underneath both of these: **the app has no backend.** Every "the payment succeeded, so update Firestore" step happens in the customer's own browser, which is not a trusted execution environment. Paystack's own guidance is explicit that client-side confirmation must be paired with server-side verification of the transaction — see "Open questions" below on this.

### 3. Fake reviews, or sabotage a competitor's rating (Medium-High)
The reviews rule only checks `renterId == request.auth.uid` — it never checks that I actually booked, let alone completed a rental, for that listing. I can `addDoc` a glowing 5-star review on my own listing from a second throwaway account, or a 1-star review bombing a competitor, with zero friction. Separately, the listings rule lets *any* signed-in user update `ratingAvg`/`ratingCount` directly (this exists so the review-transaction code can roll up a new average) — but the rule doesn't check the new number is actually a valid increment of a real review, so I can just set a competitor's `ratingAvg: 1, ratingCount: 500` directly.

### 4. Read every booking on the platform (Low-Medium)
`allow read: if isSignedIn();` on the whole `bookings` collection is intentional — the code comment explains it's needed because the date-conflict check has to see other renters' bookings. But the side effect is that any signed-in user (not just admin) can list *every* booking on the platform: every renter's name, every delivery address + GPS pin, every price paid. That's a real information-disclosure gap dressed up as a technical necessity.

### 5. Run up your Firebase bill (Low, but real)
`getPlatformStats()`, `getAllListings()`, `getAllUsersAdmin()`, `getAllBookingsAdmin()`, and `hasConflict()` all pull entire collections client-side with no pagination or limit. Nothing stops me from calling these in a loop. At current scale this costs you fractions of a cent; it's the kind of thing that becomes a real "denial of wallet" problem once you have thousands of documents and no query limits.

---

## Part 2 — OWASP Top 10 (2021)

| # | Category | Finding |
|---|---|---|
| **A01** | Broken Access Control | **Critical.** This is the headline issue — see red-team #1–4 above. Firestore rules are the *only* access control layer (no backend), and several rules don't restrict fields the way they clearly meant to. |
| **A02** | Cryptographic Failures | No custom crypto in the app — auth/session tokens are entirely Firebase Auth's, which is reasonable to trust. Firebase config values (`apiKey` etc.) are exposed in the client bundle; this is **expected and fine** for Firebase — the API key isn't a secret, security is enforced by rules, not by hiding the key. Worth confirming you understand this isn't a leak; it's how Firebase web apps work. |
| **A03** | Injection | Low risk. No SQL, no `dangerouslySetInnerHTML`, no `eval`/`new Function` anywhere in the codebase (checked directly). Firestore's query API isn't injectable the way SQL string-concatenation is. Images are always re-encoded through `<canvas>.toDataURL()` before storage, which incidentally strips any embedded payload from a malicious "image" file. |
| **A04** | Insecure Design | The payment-trust and review-authenticity issues above are design gaps, not implementation bugs — the architecture has no place for a server to be the source of truth on "did this really happen." |
| **A05** | Security Misconfiguration | No Content-Security-Policy header anywhere (`index.html` has none, `vercel.json` doesn't set any). No `firestore.indexes.json` issue, but worth confirming the *deployed* rules actually match this file — this conversation has repeatedly hit cases where local code and live Firebase config drifted apart. |
| **A06** | Vulnerable/Outdated Components | See Part 4 — mostly fine, one real finding on `react-router-dom`. |
| **A07** | Identification & Auth Failures | No email verification is sent at signup (`createUserWithEmailAndPassword` is called with no follow-up `sendEmailVerification`), so anyone can register with an email they don't own. No password-reset ("forgot password") flow exists at all — a locked-out user has no self-service recovery path. Password minimum is 6 characters, client-side only (`minLength={6}` — Firebase Auth also enforces a 6-char server-side minimum by default, so this isn't purely client trust, but 6 is short by modern standards). |
| **A08** | Software & Data Integrity Failures | The Paystack success callback is trusted blindly (see red-team #2) — this is the textbook version of this OWASP category: trusting client-reported state for a security-relevant decision. |
| **A09** | Security Logging & Monitoring | None. No audit log of admin actions (who restricted which account, who deleted which listing), beyond Firestore's own internal history if you dig for it. If someone exploits #1 above, you'd have no record of it happening. |
| **A10** | Server-Side Request Forgery | Not applicable — no server-side code exists to make outbound requests on your behalf. |

## Part 3 — STRIDE

| Threat | Relevant finding |
|---|---|
| **S**poofing | Signup with an unverified/unowned email (A07). Google Sign-In itself is solid (delegated to Firebase/Google). |
| **T**ampering | The big one — client-side `totalPrice`, `paid`, `featured`, `ratingAvg` are all tamperable because rules don't validate the *values* being written, only who's writing. |
| **R**epudiation | No audit trail (A09) — if a dispute happens ("the admin never restricted my account, someone else did it"), you have no logs to check. |
| **I**nformation Disclosure | All bookings readable by any signed-in user (red-team #4); Firebase config in the bundle is expected/fine (A02). |
| **D**enial of Service | Unbounded collection reads (red-team #5); no rate limiting on booking/dispute/message creation, so a script could spam disputes or messages. |
| **E**levation of Privilege | The critical one — self-granting `isAdmin: true` (red-team #1). |

## Part 4 — Dependency check (sourced)

I checked the exact versions pinned in `package.json` against NVD/GitHub Advisories/Snyk — not a generic "keep things updated" note.

- **`firebase: ^10.12.2`** — I found one real CVE affecting this SDK: **CVE-2024-11023**, a session-data-manipulation issue via the `FIREBASE_DEFAULTS` cookie's `_authTokenSyncURL` field, fixed in **10.9.0**. Since your pin is `^10.12.2` (already above the fix version), a normal `npm install` today would not pull a vulnerable release. No other direct CVEs found for the `firebase` npm package in this version range. It is, however, meaningfully behind current (latest is 12.x) — that's a staleness note, not an active vulnerability.
- **`react-router-dom: ^6.24.1`** — this is the one real finding. There's been a cluster of 2026 CVEs in React Router: an open-redirect-to-XSS issue (CVE-2026-22029, high), a follow-up open-redirect bypass via backslash handling in `<Link>`/`useNavigate` (CVE-2026-53669), and several others. Netlify's own security bulletin says the fix for the 6.x line is **react-router-dom 6.30.2 or later**. Your caret range (`^6.24.1`) *would* pick up 6.30.2+ on a fresh install, but I can't confirm what's actually resolved in your `package-lock.json` since I don't have it. **Most of the other 2026 React Router CVEs (RSC Server Functions, `deserializeErrors` SSR hydration, RSC CSRF bypass) don't apply to this app** — Rentora uses the plain `<Routes>/<Route>` declarative API, not React Router's data-router/RSC features, so that attack surface isn't present here. The open-redirect one is worth a version check regardless, since it applies to any `react-router-dom` app using `<Link>`/`navigate()`.
- **Vite** — pinned as `"latest"` (risky for reproducibility on its own, separate from security — this is exactly what caused the Rollup-binary install failures earlier in this project). Several CVEs this year (CVE-2026-39363, -39364, -39365, -53571) are all **arbitrary file read via the Vite *dev server*** (`npm run dev`), fixed across the 6.4.2/7.3.2/8.0.5+ releases. These do **not** affect your production Vercel deployment (Vercel serves a static pre-built `dist/`, no Vite dev server process runs there) — the exposure is local: if you ever run `vite --host` to expose your dev server to your phone over the same network, and that network isn't trusted, this class of bug matters. Worth pinning Vite to an exact recent version instead of `"latest"` for this reason and for build reproducibility.
- No CSP, no `helmet`-equivalent — not a dependency issue, a missing-header issue already noted under A05.

## Part 5 — Prioritized fix list

**Fix now (exploitable today, by any signed-up user, with just DevTools):**
1. Lock down the `users` self-update rule so a user can update their own profile *except* `isAdmin` and `suspended`.
2. Add server-side Paystack verification before trusting a payment — see the open question on this below, since it changes your architecture.
3. Restrict the reviews `create` rule to require a real, completed booking for that listing/renter pair.
4. Restrict who can write `ratingAvg`/`ratingCount` more tightly, or move the rollup into a transaction validated by rules against the actual review count.

**Fix soon:**
5. Add email verification at signup.
6. Add a password-reset flow.
7. Add pagination/limits to the admin/stat queries that currently pull full collections.
8. Add a minimal audit log collection for admin actions.
9. Pin Vite to an exact version; bump `react-router-dom` to confirm it's on 6.30.2+.

**Worth doing:**
10. Add a CSP header via `vercel.json`.
11. Reconsider the "any signed-in user can read all bookings" rule — maybe an aggregated availability collection instead, so raw booking documents (names, addresses) aren't broadly readable.

---

## Open questions I can't answer myself

1. **Is the `firestore.rules` file in this project actually what's published in the Firebase console right now?** This conversation has hit drift between local files and live config more than once. Worth checking Firebase Console → Firestore → Rules before assuming any of the above is even what's currently enforced.
2. **Do you have any server code at all** — a Cloud Function, a Vercel serverless function, anything — or is this purely client + Firestore + Paystack's client SDK? The payment-trust finding (#2 in the red team section) is fixable two ways depending on the answer: (a) add a Cloud Function that verifies the transaction with Paystack's server-side `/transaction/verify` endpoint before marking a booking paid, or (b) if you truly want to stay serverless, this risk can only be reduced, not eliminated.
3. **Is Firebase App Check enabled?** It wouldn't fix any of the above (App Check verifies the *app*, not the *user's intent*), but it's worth knowing if it's on.
4. **Are you using Paystack test keys or live keys right now?** Changes how urgent the payment-trust fix is.
5. **Has `.env` ever been committed to git history**, even before you added it to `.gitignore`? If yes, those Firebase/Paystack keys should be rotated regardless of anything above (not because the Firebase key is secret, but because rotating is cheap insurance).
6. Do you want me to actually implement fixes 1–4 now, or would you rather review this list first?
