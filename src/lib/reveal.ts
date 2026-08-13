import type { Variants } from "framer-motion";
import { prefersReducedMotion } from "./motionPref";

const EASE = [0.22, 1, 0.36, 1] as const;

// §14: under reduced motion, drop the slide/scale and use a plain opacity
// cross-fade — comprehension is preserved, vestibular motion is not.
const reduced = prefersReducedMotion();

// Stagger container: children reveal one after another once it enters view.
export function revealContainer(stagger = 0.07, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

// Standard list item: fades up into place.
export const revealItem: Variants = {
  hidden: { opacity: 0, y: reduced ? 0 : 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

// Block: fades up with a subtle scale — used for card grids like socials.
export const revealBlock: Variants = {
  hidden: { opacity: 0, y: reduced ? 0 : 20, scale: reduced ? 1 : 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

// Shared viewport config so everything triggers consistently.
export const revealViewport = { once: true, amount: 0.2 } as const;

/**
 * Motion props for a stagger container that is gated on page readiness.
 * While `ready` is false (preloader still up) the section is pinned to its
 * hidden state; once ready, `whileInView` takes over so it reveals when the
 * user actually scrolls to it.
 */
export function revealProps(ready: boolean, stagger = 0.07, delayChildren = 0) {
  return {
    variants: revealContainer(stagger, delayChildren),
    initial: "hidden" as const,
    ...(ready
      ? { whileInView: "show" as const, viewport: revealViewport }
      : { animate: "hidden" as const }),
  };
}
