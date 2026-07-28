/**
 * sorting - Fast, locale-aware name comparison helpers
 *
 * `String.prototype.localeCompare` re-derives collation data on every call,
 * which is a measurable hot spot under Hermes when sorting large lists on each
 * render. These helpers share a single `Intl.Collator`, keeping the same
 * default-locale ordering while avoiding the per-call setup cost.
 *
 * @module sorting
 */

const nameCollator = new Intl.Collator();

/**
 * Array-sort comparator ordering objects alphabetically by their `name` field.
 *
 * @typeParam T - Any object exposing a string `name`.
 * @param a - First element.
 * @param b - Second element.
 * @returns Negative if `a.name` sorts before `b.name`, positive if after, `0` if equal.
 */
export function byName<T extends { name: string }>(a: T, b: T): number {
  return nameCollator.compare(a.name, b.name);
}
