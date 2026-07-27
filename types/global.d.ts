import type { DayOfWeek, KitchenType } from "@/types/enum";

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
    categoryIds?: string[];
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

  interface MenuItemAvailability {
    start: string; // "11:00" — 24h HH:mm, daily window (e.g. lunch specials)
    end: string; // "14:00"
  }

  interface MenuItemSoldOut {
    since: Date;
    hours?: number;
    indefinite: boolean;
  }

  type DemoCategory = FoodCategory;

  interface DemoMenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: ImageItem;
    optionGroupIds?: OptionGroupId[];
    categoryIds?: string[];
    kitchenType: KitchenType;
    availability?: MenuItemAvailability;
    soldOut?: MenuItemSoldOut;
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
    availability?: MenuItemAvailability;
    soldOut?: MenuItemSoldOut;
    createdAt: Date;
  }

  interface DayHours {
    isOpen: boolean;
    open: string;
    close: string;
  }

  interface Holiday {
    id: string;
    from: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD — if absent, single day
  }

  interface StoreSettings {
    pauseOrdering: boolean;
    timezone: string;
    waitTime: number;
    hours: {
      mon: DayHours;
      tue: DayHours;
      wed: DayHours;
      thu: DayHours;
      fri: DayHours;
      sat: DayHours;
      sun: DayHours;
    };
    holidays: Holiday[];
  }

  interface MenuVersion {
    version: number;
    lastUpdated: Date | null;
  }
}

export {};
