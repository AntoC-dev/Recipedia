/**
 * Time - Single source of truth for wall-clock timestamps
 *
 * Wraps the one unavoidable call to the platform clock so the rest of the app
 * never touches the `Date` object directly. Business logic and persistence use
 * {@link epochMillis} to obtain a timestamp, which keeps call sites free of
 * `Date`'s footguns (mutation, 0-indexed months, parse/timezone ambiguity) and
 * makes time deterministic in tests by mocking this module instead of the
 * global `Date`.
 *
 * Timestamps are integer milliseconds since the Unix epoch (UTC), suitable for
 * storage as an `INTEGER` column and for numeric ordering.
 */

/**
 * Returns the current time as integer milliseconds since the Unix epoch (UTC).
 *
 * @returns Milliseconds elapsed since 1970-01-01T00:00:00Z
 */
export function epochMillis(): number {
  return Date.now();
}
