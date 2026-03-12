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
    startTime: Date;
    endTime: Date;
  }
}

export {};
