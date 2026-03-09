"use client";

import { useEffect } from "react";
import { useCategoriesStore } from "@/stores/categoriesStore";

export default function FoodCategoryPage() {
  const { categories, loading, error, fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
        Food Category
      </h1>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className="text-foreground/70 text-sm sm:text-base">
          No categories yet. Add data in Firestore to see them here.
        </p>
      ) : (
        <ul className="space-y-2">
          {categories
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((cat) => (
              <li
                key={cat.id}
                className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3"
              >
                <span className="font-medium text-foreground">{cat.name}</span>
                {cat.description && (
                  <p className="mt-1 text-sm text-foreground/70">
                    {cat.description}
                  </p>
                )}
                {cat.itemIds && cat.itemIds.length > 0 && (
                  <p className="mt-1 text-xs text-foreground/50">
                    {cat.itemIds.length} item(s)
                  </p>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
