declare global {
  interface FoodCategory {
    id?: string;
    name: string;
    description: string;
    itemIds?: string[];
    order: number;
    createdAt: Date;
  }

  interface MenuItem {
    id?: string;
    name: string;
    description: string;
    price: number;
    image: string;
    createdAt: Date;
  }
}

export {};
