# Cloud Functions — order confirmation call & status notifications

Two features live here:

1. **Confirmation call** (`docs/confirm-call-spec.md`): if a new order sits
   with `status: "New"` for 30 seconds, an automated Twilio call is placed
   to the restaurant.
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
emulator without waiting for a real order or the real 30s delay.

## Files

| File | Purpose |
|---|---|
| `src/onOrderCreated.ts` | Firestore trigger on `orders/{orderId}` create — enqueues the delayed confirm-call check via Cloud Tasks. |
| `src/checkOrderConfirmed.ts` | Cloud Tasks target — checks the order is still `"New"`, then places the call. Owns idempotency + the rate-limit guardrail. |
| `src/twilio.ts` | Builds the TwiML script and places the confirmation call. |
| `src/rateLimit.ts` | Hourly call cap safeguard (`confirmationCallLog` collection) — defensive only, not a normal operating limit. |
| `src/onOrderStatusChanged.ts` | Firestore trigger on `orders/{orderId}` update — fires the SMS + email for `InProgress`/`ReadyForPickup` transitions. |
| `src/orderStatusSms.ts` | Twilio SMS body text + send call for order-status texts. |
| `src/orderStatusEmail.ts` | Resend email subject/body + send call for order-status emails. |
| `src/secrets.ts` | Central `defineSecret`/`defineString` declarations, shared across functions that need them. |
