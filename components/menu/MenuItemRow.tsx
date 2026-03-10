"use client";

import Image from "next/image";

type MenuItemRowProps = {
  item: MenuItem;
};

export function MenuItemRow({ item }: MenuItemRowProps) {
  return (
    <li className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3 flex flex-wrap items-start gap-3">
      {item.image && (
        <Image
          src={item.image}
          alt={item.name}
          width={128}
          height={128}
          sizes="64px"
          className="w-16 h-16 object-cover rounded-md shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <span className="font-medium text-foreground">{item.name}</span>
        {item.description && (
          <p className="mt-1 text-sm text-foreground/70 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="mt-1 text-sm font-medium text-foreground">
          ${Number(item.price ?? 0).toFixed(2)}
        </p>
      </div>
    </li>
  );
}
