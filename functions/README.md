# Cloud Functions — order confirmation call & status notifications

Two features live here:

1. **Unconfirmed-order nag call**: a scheduled function runs every minute and,
   while any order has sat with `status: "New"` for more than 30 seconds,
   places one automated Twilio call to the restaurant covering all such orders.
   It keeps calling each minute until none remain — the order is confirmed,
   cancelled, or ages past 5 minutes (after which it is marked
   `confirmationCallStatus: "exhausted"` and left alone).
   - Pacing: the every-minute schedule is the cadence; `MIN_SECONDS_BETWEEN_CALLS`
     (60s) is the floor guard so the phone isn't re-dialled mid-ring; the
     `confirmationCallLog` hourly cap (60) is a last-resort backstop against a
     bug or order-creation spam, not a normal operating limit.
2. **Order-status notifications**: when an order's status changes to
   `"InProgress"` (confirmed) or `"ReadyForPickup"`, the customer gets one
   SMS + one email for that milestone.

## One-time setup

```bash
npm install
firebase login
firebase use asianlewebsite   # already set as default in .firebaserc
```

Set the secrets (each prompts for its value, stored in Secret Manager —
never committed, never in a client-exposed env var):

```bash
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_FROM_NUMBER   # the Twilio-owned "from" number, E.164
firebase functions:secrets:set RESEND_API_KEY
```

Set the restaurant's phone number (who the confirmation call goes to) from
the admin app's **Settings** page — that's a regular Firestore field on
`settings/store`, not a secret.

Set the email "from" address in `functions/.env` (`RESEND_FROM_EMAIL`) — this
one is **not** a secret, it's committed to the repo. It defaults to
`onboarding@resend.dev`, which only delivers to the Resend account owner's
own inbox (sandbox mode). Once you've verified a real domain in Resend,
update it to an address on that domain (e.g. `orders@yourdomain.com`) or
customer emails will silently fail to send.

## Deploy

```bash
npm run deploy
# equivalent to: firebase deploy --only functions
```

## Local testing

```bash
npm run shell
```
The Firebase Functions shell lets you call functions directly against the
emulator without waiting for the every-minute schedule — e.g.
`nagUnconfirmedOrders()` runs one scan immediately.

## Files

| File | Purpose |
|---|---|
| `src/nagUnconfirmedOrders.ts` | Scheduled (every 1 min) — scans for orders still `"New"`, places one alert call covering all of them, ages stale ones out to `"exhausted"`. |
| `src/twilio.ts` | Builds the TwiML script and places the alert call (25s ring timeout). |
| `src/rateLimit.ts` | `confirmationCallLog` collection — min-interval helper + hourly backstop cap. Defensive only, not a normal operating limit. |
| `src/onOrderStatusChanged.ts` | Firestore trigger on `orders/{orderId}` update — fires the SMS + email for `InProgress`/`ReadyForPickup` transitions. |
| `src/orderStatusSms.ts` | Twilio SMS body text + send call for order-status texts. |
| `src/orderStatusEmail.ts` | Resend email subject/body + send call for order-status emails. |
| `src/secrets.ts` | Central `defineSecret`/`defineString` declarations, shared across functions that need them. |
