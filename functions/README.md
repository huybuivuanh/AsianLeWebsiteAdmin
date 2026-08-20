# Cloud Functions — order confirmation call

Implements `docs/confirm-call-spec.md`: if a new order sits with
`status: "New"` for 30 seconds, an automated Twilio call is placed to the
restaurant. See that spec for the full design.

## One-time setup

```bash
npm install
firebase login
firebase use asianlewebsite   # already set as default in .firebaserc
```

Set the Twilio secrets (prompts for each value, stored in Secret Manager —
never committed, never in a client-exposed env var):

```bash
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_FROM_NUMBER   # the Twilio-owned "from" number, E.164
```

Set the restaurant's phone number (who gets called) from the admin app's
**Settings** page — this is a regular Firestore field on `settings/store`,
not a secret.

## Deploy

```bash
npm run deploy
# equivalent to: firebase deploy --only functions
```

## Local testing

```bash
npm run shell
```
The Firebase Functions shell lets you call `onOrderCreated({...})` /
`checkOrderConfirmed({...})` directly against the emulator without waiting
for a real order or the real 30s delay.

## Files

| File | Purpose |
|---|---|
| `src/onOrderCreated.ts` | Firestore trigger on `orders/{orderId}` create — enqueues the delayed check via Cloud Tasks. |
| `src/checkOrderConfirmed.ts` | Cloud Tasks target — checks the order is still `"New"`, then places the call. Owns idempotency + the rate-limit guardrail. |
| `src/twilio.ts` | Builds the TwiML script and places the call. |
| `src/rateLimit.ts` | Hourly call cap safeguard (`confirmationCallLog` collection) — defensive only, not a normal operating limit. |
