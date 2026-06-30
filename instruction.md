# Ordering System Menu Management — Integration into `asian-le-website-admin`

## Context

Add ordering system menu management to the existing `asian-le-website-admin` project at `D:\Projects\asian-le-website-admin`. Do not create a new project.

The website admin already has categories and menu items. This integration adds:
- Option groups and options (structured modifier system, same as POS)
- New fields on `MenuItem`: `kitchenType`, `optionGroupIds`, `availability`, `isSoldOut` (replace the old `options?: string[]`)
- Store settings page: store hours + pause ordering toggle
- Publish menu workflow (version bump to signal customer website to refetch)

Follow the **website admin's existing patterns** throughout — not the POS admin patterns.

---

## Existing project conventions to follow

- **No `src/` prefix** — all code lives at root: `app/`, `components/`, `stores/`, `lib/`, `types/`, `contexts/`
- **`@/` alias maps to `./` (root)** — e.g. `import { db } from "@/lib/firebase"`
- **Stores**: fetch-based pattern (`fetchX()`, `addX()`, `updateX()`, `deleteX()`, `reset()`). No `subscribe()` / `onSnapshot` pattern. Data is fetched on login via `AuthContext`.
- **Types**: global declarations in `types/global.d.ts`. Enums in `types/enum.ts`.
- **No Radix UI** — use plain HTML/CSS modals matching the existing modal components
- **No `cn()` helper** — use plain Tailwind class strings or template literals
- **Firebase**: import `db`, `auth`, `storage` from `@/lib/firebase`
- **Auth**: use `useAuth()` from `@/contexts/AuthContext`
- **Images**: Firebase Storage via `storage` from `@/lib/firebase`
- **Modal pattern**: Each modal is a standalone component receiving `isOpen`, `onClose`, and entity props. Handles its own loading/saving state.
- **Row/card pattern**: `*Row.tsx` component in `components/menu/*/` for list item display

---

## Type changes

### `types/enum.ts` — add new enums

```typescript
export enum DayOfWeek {
  // ...keep existing
}

export enum KitchenType {
  DeepFry = "Deep Fry",
  StirFry = "Stir Fry",
  Other = "Other",
  Both = "Both",
  Drink = "Drink",
}
```

### `types/global.d.ts` — update and extend

Update `MenuItem` (replace `options?: string[]` with structured option groups, add new fields):

```typescript
interface OptionGroupId {
  optionGroupId: string;
  order: number;
}

interface MenuItemAvailability {
  enabled: boolean;
  // schedule?: future time-window fields — do not implement yet
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: ImageItem;
  optionGroupIds?: OptionGroupId[];  // replaces options?: string[]
  categoryIds?: string[];
  kitchenType: KitchenType;
  availability: MenuItemAvailability;
  isSoldOut: boolean;
  createdAt: Date;
}

interface OptionGroup {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  multipleOptionQuantity: boolean;
  optionIds?: string[];
  itemIds?: string[];
  defaultOptionId?: string;
  createdAt: Date;
}

interface ItemOption {
  id: string;
  name: string;
  price: number;
  groupIds?: string[];
  createdAt: Date;
}

interface DayHours {
  isOpen: boolean;
  open: string;   // "11:00"
  close: string;  // "21:00"
}

interface StoreSettings {
  pauseOrdering: boolean;
  timezone: string;  // e.g. "America/Edmonton"
  hours: {
    mon: DayHours;
    tue: DayHours;
    wed: DayHours;
    thu: DayHours;
    fri: DayHours;
    sat: DayHours;
    sun: DayHours;
  };
}

interface MenuVersion {
  version: number;
  lastUpdated: Date | null;
}
```

Add `import type { KitchenType } from "@/types/enum";` at the top of `global.d.ts`.

---

## New Firestore collections

| Collection | Notes |
|---|---|
| `optionGroups` | new |
| `options` | new |
| `menuVersion/versionDoc` | single document — `{ version: number, lastUpdated: Timestamp }` |
| `settings/store` | single document — `StoreSettings` shape |

Existing collections (`categories`, `menuItems`, `gallery`, etc.) are unchanged.

---

## New stores

All stores go in `stores/`. New stores must mirror the fetch-based pattern of `categoriesStore.ts` and `menuItemsStore.ts` exactly: `fetchX()`, `addX()`, `updateX()`, `deleteX()`, `reset()` methods, `loading` + `error` state.

### `stores/optionGroupsStore.ts`

Firestore collection: `optionGroups`. Fields: `name`, `minSelection`, `maxSelection`, `multipleOptionQuantity`, `optionIds`, `itemIds`, `defaultOptionId`, `createdAt`.

Methods:
- `fetchOptionGroups()`
- `addOptionGroup(data: Omit<OptionGroup, "id" | "createdAt">)`
- `updateOptionGroup(id: string, data: Partial<OptionGroup>)`
- `deleteOptionGroup(id: string)`
- `reset()`

### `stores/optionsStore.ts`

Firestore collection: `options`. Fields: `name`, `price`, `groupIds`, `createdAt`.

Methods:
- `fetchOptions()`
- `addOption(data: Omit<ItemOption, "id" | "createdAt">)`
- `updateOption(id: string, data: Partial<ItemOption>)`
- `deleteOption(id: string)`
- `reset()`

### `stores/menuVersionStore.ts`

Firestore document: `menuVersion/versionDoc`.

State: `version: MenuVersion | null`, `loading: boolean`, `error: string | null`.

Methods:
- `fetchMenuVersion()` — one-time get of the document
- `publishMenu()` — increments `version`, sets `lastUpdated` to now
- `reset()`

### `stores/storeSettingsStore.ts`

Firestore document: `settings/store`.

State: `settings: StoreSettings | null`, `loading: boolean`, `error: string | null`.

Default value if document doesn't exist:
```typescript
const defaultHours: DayHours = { isOpen: true, open: "11:00", close: "21:00" };
const DEFAULTS: StoreSettings = {
  pauseOrdering: false,
  timezone: "America/Edmonton",
  hours: {
    mon: defaultHours,
    tue: defaultHours,
    wed: defaultHours,
    thu: defaultHours,
    fri: defaultHours,
    sat: { ...defaultHours, isOpen: false },
    sun: { ...defaultHours, isOpen: false },
  },
};
```

Methods:
- `fetchStoreSettings()` — getDoc, set DEFAULTS if not exists
- `updateSettings(patch: Partial<StoreSettings>)` — setDoc with merge
- `reset()`

---

## `contexts/AuthContext.tsx` — update

Add fetch calls for all new stores on login, and `reset()` calls on logout. Mirror the exact pattern used for the existing stores.

On login (after existing fetch calls):
```typescript
await optionGroupsStore.fetchOptionGroups();
await optionsStore.fetchOptions();
await menuVersionStore.fetchMenuVersion();
await storeSettingsStore.fetchStoreSettings();
```

On logout (after existing reset calls):
```typescript
optionGroupsStore.reset();
optionsStore.reset();
menuVersionStore.reset();
storeSettingsStore.reset();
```

---

## `lib/menu-item-option-groups.ts` — new utility file

Copy this file verbatim from the POS admin (`D:\Projects\asian-le-pos-admin\src\lib\menu-item-option-groups.ts`). It handles normalizing and manipulating the `optionGroupIds` array on menu items.

## `lib/option-group-updates.ts` — new utility file

Copy verbatim from `D:\Projects\asian-le-pos-admin\src\lib\option-group-updates.ts`. Provides helpers for clearing the `defaultOptionId` field when an option is removed.

---

## Folder additions

```
app/(main)/
├── menu/
│   ├── option-groups/
│   │   └── page.tsx        # option groups tab content
│   └── options/
│       └── page.tsx        # options tab content
└── settings/
    └── page.tsx            # store hours + pause ordering

components/
├── menu/
│   ├── option-groups/
│   │   ├── AddOptionGroupModal.tsx
│   │   ├── EditOptionGroupModal.tsx
│   │   ├── OptionGroupRow.tsx          # expandable, shows options + add-option form
│   │   ├── AddOptionToGroupModal.tsx
│   │   └── SortOptionGroupsModal.tsx   # (optional — add if item card needs reorder)
│   └── options/
│       ├── AddOptionModal.tsx
│       ├── EditOptionModal.tsx
│       └── OptionRow.tsx
└── settings/
    └── StoreSettingsForm.tsx
```

---

## `app/(main)/menu/MenuSidebar.tsx` — update

Add links for Option Groups and Options:

```
Categories  →  /menu/categories
Items       →  /menu/items
Option Groups → /menu/option-groups
Options     →  /menu/options
```

Keep the exact same active-state styling as the existing sidebar links.

---

## `components/Navbar.tsx` — update

Add a **Settings** link pointing to `/settings`. Place it after the existing nav items. Keep the same styling.

---

## Menu pages

### `app/(main)/menu/option-groups/page.tsx`

- Heading + "Add Option Group" button
- Lists all option groups from `optionGroupsStore`
- Renders `OptionGroupRow` for each
- Includes `PublishMenuButton` (see below)

### `app/(main)/menu/options/page.tsx`

- Heading + "Add Option" button
- Lists all options from `optionsStore`
- Renders `OptionRow` for each
- Includes `PublishMenuButton`

---

## Publish menu button

Create `components/menu/PublishMenuButton.tsx`. A simple button that calls `menuVersionStore.publishMenu()`. Shows loading state during the call. Display version number and last published time next to it using `formatPriceCAD`-style formatting (just display the date string).

Add `PublishMenuButton` to the top of all four menu pages (categories, items, option-groups, options) so staff can publish after any change.

---

## `app/(main)/settings/page.tsx`

Two sections:

**Section 1 — Ordering status**

Shows current state (accepting / paused). One button toggles `storeSettingsStore.updateSettings({ pauseOrdering: !settings.pauseOrdering })`.

```
[ Pause Ordering ]   or   [ Resume Ordering ]
```

Show clear visual difference — red background for paused state.

**Section 2 — Store hours**

Timezone input (text input defaulting to `settings.timezone`).

Table/grid with one row per day (Monday–Sunday):
- Day label
- "Open" checkbox → `hours.mon.isOpen`
- Open time → `<input type="time">` value `hours.mon.open`
- Close time → `<input type="time">` value `hours.mon.close`
- Time inputs disabled when `isOpen` is false

Save button → `storeSettingsStore.updateSettings({ hours: editedHours, timezone: editedTimezone })`. Keep local edit state inside the component. Do not call `updateSettings` on every keystroke.

Use a matching style to the existing `store-info` page.

---

## `app/(main)/menu/items/` — update existing

### `EditMenuItemModal.tsx` and `AddMenuItemModal.tsx`

Remove the old `options?: string[]` field.

Add new fields:

**Kitchen Type** (required select):
```tsx
<select value={kitchenType} onChange={...}>
  {Object.values(KitchenType).map(kt => <option key={kt} value={kt}>{kt}</option>)}
</select>
```

**Availability toggle** (checkbox):
```
[ ] Available for ordering
```
Maps to `availability: { enabled: boolean }`.

**Sold out toggle** (checkbox):
```
[ ] Sold out
```
Maps to `isSoldOut: boolean`.

Default values on create: `availability: { enabled: true }`, `isSoldOut: false`, `kitchenType: KitchenType.Other`.

### `MenuItemRow.tsx`

Show additional info:
- Kitchen type label
- Availability badge: amber "Unavailable" if `!availability.enabled`
- Sold out badge: red "Sold out" if `isSoldOut`
- Option groups count (e.g. "2 option groups") if `optionGroupIds?.length > 0`

---

## Option group components

### `OptionGroupRow.tsx`

Expandable row. Collapsed: shows name, min/max selection, option count.

Expanded: lists options in this group (resolved from `optionsStore` by `optionIds`). Each option shows name + price + Remove button.

Action buttons on the row: Edit, Delete, Add Option (opens `AddOptionToGroupModal`).

Delete: confirm, then:
1. Remove this group's ID from all `menuItems` that reference it (update each item's `optionGroupIds`)
2. Remove this group's ID from all `options` that reference it (update each option's `groupIds`)
3. Delete the option group document

### `AddOptionGroupModal.tsx`

Fields: Name (required), Min Selection (number, default 0), Max Selection (number, default 1), Multiple Option Quantity (checkbox, default false).

On submit: `optionGroupsStore.addOptionGroup(...)`.

### `EditOptionGroupModal.tsx`

Same fields as Add. Pre-populated from the group prop.

### `AddOptionToGroupModal.tsx`

Two-mode modal:
- **Create new option**: Name + Price fields. Creates a new option document and links it to the group bidirectionally (update group's `optionIds`, set option's `groupIds`).
- **Add existing option**: Searchable list of existing options from `optionsStore` (exclude ones already in the group). On select, links bidirectionally.

Toggle between modes with a tab or toggle button.

---

## Option components

### `OptionRow.tsx`

Shows: name, price, which groups it belongs to (resolved from `optionGroupsStore`).

Edit and Delete buttons. Delete: confirm, then remove this option's ID from all groups that reference it, then delete the option document.

### `AddOptionModal.tsx`

Fields: Name (required), Price (number, required).

### `EditOptionModal.tsx`

Same fields. Pre-populated from option prop.

---

## `lib/utils.ts` — add helper

Add search helper (used in option group row's option picker):

```typescript
export function matchesQuery(q: string, ...fields: string[]): boolean {
  if (!q.trim()) return true;
  const term = q.trim().toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(term));
}
```

---

## Implementation order

1. Update `types/enum.ts` — add `KitchenType`
2. Update `types/global.d.ts` — add all new interfaces, update `MenuItem`
3. Copy `lib/menu-item-option-groups.ts` and `lib/option-group-updates.ts` from POS admin
4. Add `matchesQuery` to `lib/utils.ts`
5. Create `stores/optionGroupsStore.ts`, `stores/optionsStore.ts`, `stores/menuVersionStore.ts`, `stores/storeSettingsStore.ts`
6. Update `contexts/AuthContext.tsx` — add fetch/reset calls for new stores
7. Update `app/(main)/menu/MenuSidebar.tsx` — add Option Groups and Options links
8. Update `components/Navbar.tsx` — add Settings link
9. Create option group components: `OptionGroupRow`, `AddOptionGroupModal`, `EditOptionGroupModal`, `AddOptionToGroupModal`
10. Create option components: `OptionRow`, `AddOptionModal`, `EditOptionModal`
11. Create `app/(main)/menu/option-groups/page.tsx` and `app/(main)/menu/options/page.tsx`
12. Create `components/menu/PublishMenuButton.tsx`
13. Add `PublishMenuButton` to all four menu pages
14. Update `AddMenuItemModal.tsx` and `EditMenuItemModal.tsx` — remove `options`, add `kitchenType`, `availability`, `isSoldOut`
15. Update `MenuItemRow.tsx` — show new fields
16. Create `components/settings/StoreSettingsForm.tsx`
17. Create `app/(main)/settings/page.tsx`
