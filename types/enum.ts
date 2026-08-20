export enum DayOfWeek {
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
}

export enum KitchenType {
  DeepFry = "Deep Fry",
  StirFry = "Stir Fry",
  Other = "Other",
  Both = "Both",
  Drink = "Drink",
}

// Mirrors the customer-facing website's enums (orders-schema.md) — the `orders`
// collection is written by that site, this admin app only reads/manages it.
export enum OrderStatus {
  New = "New",
  InProgress = "InProgress",
  ReadyForPickup = "ReadyForPickup",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export enum TakeOutFulfillmentKind {
  Immediate = "immediate",
  Scheduled = "scheduled",
}
