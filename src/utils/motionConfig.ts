/**
 * Unified silky motion constants used across all Framer Motion transitions,
 * scroll-linked parallax springs, modals, drawers, and tactile bento hovers.
 */

export const EDITORIAL_EASE = [0.22, 1, 0.36, 1] as const;

export const SMOOTH_SPRING = {
  type: 'spring' as const,
  stiffness: 240,
  damping: 28,
  mass: 0.78,
};

export const SNAPPY_SPRING = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 30,
  mass: 0.6,
};

export const SCROLL_PARALLAX_SPRING = {
  stiffness: 120,
  damping: 26,
  mass: 0.32,
  restDelta: 0.0005,
};

export const REVEAL_VIEWPORT = {
  once: true,
  amount: 0.12 as const,
};
