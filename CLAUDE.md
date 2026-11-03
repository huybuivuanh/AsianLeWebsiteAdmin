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

`AuthContext` (`contexts/AuthContext.tsx`) wraps the whole app. On login/session restore it starts a live Firestore listener for every Zustand store. On logout it stops the listeners (before signing out) and resets the stores. The `(main)` layout (`app/(main)/layout.tsx`) redirects unauthenticated users to `/login`.

When adding a new store, register it in `stores/allStores.ts` (used by `AuthContext` via `listenToAllStores` / `resetAllStores`). That is the single place where data is loaded on auth.

### Zustand stores (`stores/`)

Each Firestore collection maps 1:1 to a Zustand store. Every store follows the same pattern:
- `loading`, `error`, state array
- `listen` — `onSnapshot` on the collection; maps docs and sets state on every change, returns the unsubscribe function
- `add*` / `update*` / `delete*` — write to Firestore only. Don't re-fetch afterwards: the listener updates state (instantly for local writes, and also for changes made by other staff or the website)
- `reset` — clears state on logout

**Changes that touch two collections** (e.g. a category and the `categoryIds` on its menu items, a day special and its items' `dayOfWeekIds`, an option group and its options' `groupIds`) go through `stores/linkedWrites.ts`, never two store calls in a row. Each function there is one Firestore batch, so both sides change together or not at all, and the listeners pick up the result. Add new cross-collection changes there too.

### Pages & components

Pages live in `app/(main)/<section>/page.tsx`; single-column pages are under the `app/(main)/(standard)/` route group (no effect on URLs). They consume the relevant Zustand store and wire modal open/close state. Modals live in `components/<section>/` and receive `open`, `onClose`, and an async action prop — they own their own form state and call `onClose()` after the action resolves.

Build modals and forms from the shared pieces in `components/ui/`, not hand-written markup:
- `Modal` (`ui/Modal.tsx`) handles the backdrop, Escape key and ARIA. Use `layout="form"` for short forms and `layout="panel"` (with `ModalToolbar` / `ModalBody` / `ModalFooter`) for long pick/sort lists. Pass `busy={submitting}` so it can't be closed mid-save.
- `Field`, `Input`, `Textarea`, `Select`, `CheckboxField`, `FormError`, `FormActions` (`ui/form.tsx`).
- `Button` and `primaryButtonClass` / `secondaryButtonClass` (`ui/Button.tsx`).

Gallery and Updates share `components/image-items/` (`ImageGrid`, `AddImageItemModal`, `EditImageItemModal`).

### Helpers (`lib/`)

Non-React helpers live in `lib/`, with kebab-case file names (e.g. `image-upload.ts`, `store-settings.ts`). There is no separate `utils/` folder.

### Global types (`types/global.d.ts`)

All shared interfaces are declared globally here (no import needed). Add new Firestore entity shapes here. `types/enum.ts` holds enums (imported explicitly where needed).

### Sections with sub-navigation

`/menu` and `/daily-special` each have their own `layout.tsx` that renders the section sidebar (`MenuSidebar.tsx`, `DailySpecialSidebar.tsx`, co-located). `app/(main)/layout.tsx` only handles the auth redirect and the navbar; `(standard)/layout.tsx` is the centered column for everything else.

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
