"use client";

type CategoryRowProps = {
  category: FoodCategory;
};

export function CategoryRow({ category }: CategoryRowProps) {
  return (
    <li className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3">
      <span className="font-bold text-foreground">{category.name}</span>
      {category.description && (
        <p className="mt-1 text-sm text-foreground/70">{category.description}</p>
      )}
      {category.itemIds && category.itemIds.length > 0 && (
        <p className="mt-1 text-xs text-foreground/50">
          {category.itemIds.length} item(s)
        </p>
      )}
    </li>
  );
}
