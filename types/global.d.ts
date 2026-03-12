import type { DayOfWeek } from "@/types/enum";

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
    categoryIds?: string[];
    createdAt: Date;
  }

  interface DailySpecialItem extends MenuItem {
    options?: string[];
  }

  interface DailySpecial {
    id: string;
    dayOfWeek: DayOfWeek;
    timeRange: TimeRange;
    items?: DailySpecialItem[];
    createdAt: Date;
  }

  interface TimeRange {
    startTime: Date;
    endTime: Date;
  }
}

export {};
