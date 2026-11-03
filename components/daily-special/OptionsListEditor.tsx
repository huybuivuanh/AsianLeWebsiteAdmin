"use client";

import { inputClass } from "@/components/ui/form";

/** Editable list of free-text options (e.g. "medium", "large") for a special item. */
export function OptionsListEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function updateOption(index: number, text: string) {
    const next = [...value];
    next[index] = text;
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-foreground">Options</span>
        <button
          type="button"
          onClick={() => onChange([...value, ""])}
          className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add Option
        </button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((text, index) => (
            <li key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={text}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder="e.g. medium, large"
                className={`${inputClass} flex-1 text-sm`}
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="shrink-0 rounded-lg border border-foreground/20 px-2 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none"
                aria-label="Remove option"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
