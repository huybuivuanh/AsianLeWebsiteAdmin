# Asian Le Website Admin

Admin dashboard for managing the Asian Le restaurant website. Built with Next.js and Firebase.

## Features

- **Orders**: view the day's online orders, update their status, print receipts
- **Menu**: categories, items, option groups and options (add, edit, delete, reorder, weekly availability)
- **Daily Specials**: special days with time ranges and the items offered on them
- **Gallery**: restaurant photos shown on the website
- **Updates**: news and announcement images
- **Store Info**: opening-hours text shown on the website
- **Settings**: pause online ordering, store and reservation hours, holidays, wait time, phone number
- **Authentication**: staff-only access with Firebase Auth

Cloud Functions in `functions/` handle the order confirmation call, customer SMS/email
status updates, and mirroring online orders to the POS. See `functions/README.md`.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Firebase](https://firebase.google.com): Firestore, Auth, Storage, Cloud Functions
- [Zustand](https://zustand-demo.pmnd.rs): client state management
- [Tailwind CSS v4](https://tailwindcss.com)

## Getting Started

Copy `.env.example` to `.env.local` and fill in the Firebase config, then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying Firestore rules

Security rules live in `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

## Project Structure

```
app/
  (main)/              # Signed-in area (redirects to /login when logged out)
    (standard)/        # Single-column pages: home, orders, gallery, updates, store-info, settings
    menu/              # Menu section, with its own sidebar layout
    daily-special/     # Daily-special section, with its own sidebar layout
  login/
components/
  ui/                  # Shared building blocks: Modal, Button, form fields
  <section>/           # Components for one section (menu, daily-special, orders, ...)
  image-items/         # Shared by Gallery and Updates
stores/                # One Zustand store per Firestore collection, kept live with onSnapshot
  allStores.ts         # Starts / stops every store's listener on login / logout
  linkedWrites.ts      # Changes that touch two collections, done as one batch
contexts/              # AuthContext
lib/                   # Firebase setup, helpers (image upload, orders, dates, ...)
types/                 # Global types (global.d.ts) and enums
functions/             # Firebase Cloud Functions (separate npm project)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
