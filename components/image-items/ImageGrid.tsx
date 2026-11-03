"use client";

import Image from "next/image";
import { RowActions, rowCardClass } from "@/components/menu/RowParts";

/** Photo tiles for the Gallery and Updates pages. Images are shown whole
 * (object-contain) so wide or tall pictures aren't cropped. */
export function ImageGrid({
  items,
  deletingId,
  onEdit,
  onDelete,
}: {
  items: ImageItem[];
  deletingId: string | null;
  onEdit: (item: ImageItem) => void;
  onDelete: (item: ImageItem) => void;
}) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const deleting = deletingId === item.id;
        return (
          <li
            key={item.id}
            className={`${rowCardClass} overflow-hidden ${deleting ? "opacity-50" : ""}`}
          >
            <div className="relative aspect-square bg-foreground/[0.04]">
              <Image
                src={item.url}
                alt={item.name}
                fill
                sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 340px"
                className="object-contain"
              />
            </div>
            <div className="flex items-center gap-2 border-t border-foreground/10 py-2 pl-3 pr-1.5">
              <p
                className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
                title={item.name}
              >
                {item.name}
              </p>
              <RowActions
                name={item.name}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
                deleting={deleting}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
