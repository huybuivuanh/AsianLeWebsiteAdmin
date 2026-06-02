# Asian Le Website Admin

Admin dashboard for managing the Asian Le restaurant website. Built with Next.js and Firebase.

## Features

- **Menu** — manage categories and menu items (add, edit, delete, reorder)
- **Daily Specials** — manage daily special days and their items
- **Gallery** — manage restaurant photo gallery
- **Updates** — post news and announcements
- **Store Info** — manage restaurant details
- **Authentication** — protected routes with Firebase Auth

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Firebase](https://firebase.google.com) — Firestore database + Auth
- [Zustand](https://zustand-demo.pmnd.rs) — client state management
- [Tailwind CSS v4](https://tailwindcss.com)

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  (main)/         # Protected admin pages
    menu/         # Menu categories & items
    daily-special/
    gallery/
    store-info/
    updates/
  login/          # Auth page
components/       # UI components per feature
stores/           # Zustand stores
contexts/         # AuthContext
lib/              # Firebase config, utilities
types/            # Shared TypeScript types
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
