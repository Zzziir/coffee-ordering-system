/** Minimal class combiner — joins truthy class strings. */
export function clsx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
