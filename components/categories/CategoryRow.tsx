"use client";

type CategoryRowProps = {
  category: FoodCategory;
  onEdit: (category: FoodCategory) => void;
  onDelete: (category: FoodCategory) => void;
  deleting?: boolean;
};

export function CategoryRow({
  category,
  onEdit,
  onDelete,
  deleting = false,
}: CategoryRowProps) {
  return (
    <li className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <span className="font-bold text-foreground">{category.name}</span>
        {category.description && (
          <p className="mt-1 text-sm text-foreground/70">{category.description}</p>
        )}
        {category.itemIds && category.itemIds.length > 0 && (
          <p className="mt-1 text-xs text-foreground/50">
            {category.itemIds.length} item(s)
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(category)}
          disabled={deleting}
          className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          disabled={deleting}
          className="rounded-md border border-red-500/30 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
