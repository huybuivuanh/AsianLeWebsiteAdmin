# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured.

## Environment

Requires a `.env.local` with Firebase config vars:
```
NEXT_PUBLIC_API_KEY
NEXT_PUBLIC_AUTH_DOMAIN
NEXT_PUBLIC_PROJECT_ID
NEXT_PUBLIC_STORAGE_BUCKET
NEXT_PUBLIC_MESSAGING_SENDER_ID
NEXT_PUBLIC_APP_ID
NEXT_PUBLIC_MEASUREMENT_ID
```

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Firebase (Auth, Firestore, Storage) · Zustand

### Auth & data loading

`AuthContext` (`contexts/AuthContext.tsx`) wraps the whole app. On login/session restore it eagerly fetches all Zustand stores. On logout it resets them all. The `(main)` layout (`app/(main)/layout.tsx`) redirects unauthenticated users to `/login`.

When adding a new store, register its `fetch*` and `reset` calls in `AuthContext` alongside the existing ones — this is the single place where data is loaded on auth.

### Zustand stores (`stores/`)

Each Firestore collection maps 1:1 to a Zustand store. Every store follows the same pattern:
- `loading`, `error`, state array
- `fetch*` — `getDocs` the collection, maps docs, sets state
- `add*` / `update*` / `delete*` — write to Firestore, then call `fetch*` to re-sync
- `reset` — clears state on logout

### Pages & components

Pages live in `app/(main)/<section>/page.tsx`. They consume the relevant Zustand store and wire modal open/close state. Modals live in `components/<section>/` and receive `open`, `onClose`, and an async action prop — they own their own form state and call `onClose()` after the action resolves.

### Global types (`types/global.d.ts`)

All shared interfaces are declared globally here (no import needed). Add new Firestore entity shapes here. `types/enum.ts` holds enums (imported explicitly where needed).

### Sections with sub-navigation

`/menu` and `/daily-special` each have a sidebar layout rendered inside `app/(main)/layout.tsx` based on pathname. The sidebars live co-located with their section (`app/(main)/menu/MenuSidebar.tsx`, etc.).

### Firestore collections

| Collection | Store |
|---|---|
| `categories` | `categoriesStore` |
| `menuItems` | `menuItemsStore` |
| `gallery` | `galleryStore` |
| `updates` | `updatesStore` |
| `dailySpecials` | `dailySpecialsStore` |
| `dailySpecialItems` | `dailySpecialItemsStore` |
| `hours` | `hoursStore` |
