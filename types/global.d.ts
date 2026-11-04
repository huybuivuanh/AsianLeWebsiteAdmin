import type {
  DayOfWeek,
  DiscountType,
  KitchenType,
  OrderStatus,
  TakeOutFulfillmentKind,
} from "@/types/enum";

declare global {
  interface FoodCategory {
    id: string;
    name: string;
    description?: string;
    itemIds?: string[];
    order: number;
    createdAt: Date;
  }

  interface ImageItem {
    id?: string;
    name: string;
    url: string;
  }

  interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: ImageItem;
    options?: string[];
    optionGroupIds?: OptionGroupId[];
    categoryIds?: string[];
    kitchenType?: KitchenType;
    availability?: Availability;
    soldOutUntil?: Date;
    createdAt: Date;
  }
  interface DailySpecialItem {
    id: string;
    name: string;
    price: number;
    options?: string[];
    dayOfWeekIds?: string[];
    createdAt: Date;
  }
  interface DailySpecial {
    id: string;
    dayOfWeek: DayOfWeek;
    timeRange: TimeRange;
    itemIds?: string[];
    createdAt: Date;
  }
  interface TimeRange {
    startTime: string;
    endTime: string;
  }
  interface StoreHour {
    id: string;
    days: string;
    time: string;
    order: number;
  }

  interface OptionGroupId {
    optionGroupId: string;
    order: number;
  }

  interface Availability {
    mon?: TimeRange;
    tue?: TimeRange;
    wed?: TimeRange;
    thu?: TimeRange;
    fri?: TimeRange;
    sat?: TimeRange;
    sun?: TimeRange;
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
    availability?: Availability;
    soldOutUntil?: Date;
    createdAt: Date;
  }

  interface DayHours {
    isOpen: boolean;
    open: string;
    close: string;
  }

  /** Open/close times for each weekday — store (online ordering) hours and reservation
   * hours both use this shape. */
  interface WeeklyHours {
    mon: DayHours;
    tue: DayHours;
    wed: DayHours;
    thu: DayHours;
    fri: DayHours;
    sat: DayHours;
    sun: DayHours;
  }

  interface Holiday {
    id: string;
    from: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD — if absent, single day
  }

  interface StoreSettings {
    pausedUntil: Date | null;
    timezone: string;
    waitTime: number;
    /** E.164, e.g. "+13065551234" — who the confirm-call Cloud Function calls. */
    restaurantPhoneNumber: string;
    hours: WeeklyHours;
    /** When tables can be booked online, per weekday. `close` is the LAST bookable time
     * (e.g. 13:00–20:00 = first booking 1 PM, last 8 PM). Holidays and the pause switch
     * apply to reservations too. Missing on docs saved before reservation hours existed. */
    reservationHours?: WeeklyHours;
    holidays: Holiday[];
  }

  // --- Orders (written by the customer-facing website, read here for order
  // history/printing — see that repo's orders-schema.md for the full contract). ---

  interface OrderItemOption {
    name: string;
    price: number;
    quantity: number;
  }

  interface OrderItem {
    menuItemId: string;
    name: string;
    price: number; // per-unit price INCLUDING selected options
    quantity: number;
    options?: OrderItemOption[];
    instructions?: string;
    kitchenType: KitchenType;
  }

  /** Same shape as the website's / POS's Discount. Online orders only get an Amount
   * discount, from rewards points, taken off before tax (taxes are on `taxableSubtotal`). */
  interface OrderDiscount {
    discountType: DiscountType;
    discountValue: number;
    discountAmount: number;
    taxableSubtotal: number;
  }

  interface OrderTaxBreakDown {
    subTotal: number;
    discount?: OrderDiscount;
    pst: number;
    gst: number;
    total: number;
  }

  /** Rewards member linked at checkout (website's `order.loyalty`) — the fields shown here. */
  interface OrderLoyalty {
    memberId: string;
    memberName: string;
    /** Points chosen at checkout; the Orders app takes them on Complete. */
    pointsToRedeem?: number;
    /** Set by the Orders app once the points were actually taken. */
    pointsRedeemed?: number;
    pointsEarned?: number;
    /** Set by the Orders app once `pointsEarned` were added to the member. */
    collectedAt?: Date;
    /** Set when the redeemed/collected points were given back (e.g. order cancelled). */
    reversedAt?: Date;
  }

  type OrderFulfillment =
    | { kind: TakeOutFulfillmentKind.Immediate; readyTimeMinutes?: number }
    | { kind: TakeOutFulfillmentKind.Scheduled; scheduledAt: Date };

  interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    fulfillment: OrderFulfillment;
    customerName: string;
    phoneNumber: string;
    customerEmail: string;
    orderItems: OrderItem[];
    taxBreakDown: OrderTaxBreakDown;
    loyalty?: OrderLoyalty;
    paid: boolean;
    printed: boolean;
    createdAt: Date;
    /** Written only by the confirmOrderCall Cloud Function (functions/), never by this app. */
    confirmationCallStatus?: "placed" | "failed";
    confirmationCallPlacedAt?: Date;
  }
}

export {};
