import { deleteField } from "firebase/firestore";

/**
 * Firestore patch fields when an option is removed from a group and it was the default.
 */
export function patchClearDefaultIfOptionRemoved(
  group: OptionGroup,
  removedOptionId: string | undefined,
): Record<string, unknown> {
  if (removedOptionId && group.defaultOptionId === removedOptionId) {
    return { defaultOptionId: deleteField() };
  }
  return {};
}

/**
 * Firestore patch when optionIds is replaced and the current default is no longer in the list.
 */
export function patchClearDefaultIfNotInOptionIds(
  group: OptionGroup,
  nextOptionIds: string[],
): Record<string, unknown> {
  const def = group.defaultOptionId;
  if (def && !nextOptionIds.includes(def)) {
    return { defaultOptionId: deleteField() };
  }
  return {};
}
