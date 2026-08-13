// Single source of truth for the user's reduced-motion preference.
// Apple design guidance (§14): reduced motion means a gentler, non-vestibular
// equivalent — cross-fade instead of slide/spring/parallax — not "no feedback".
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
