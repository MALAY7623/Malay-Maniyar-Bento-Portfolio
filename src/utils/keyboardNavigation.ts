import type { NavSectionId } from '../types/portfolio';

/**
 * Main navigation anchors ordered along the vertical editorial flow of the portfolio.
 */
export const MAIN_NAV_ANCHOR_ORDER: readonly NavSectionId[] = [
  'about',
  'ugc-reels',
  'design-work',
  'clients',
  'contact',
] as const;

export interface KeyboardTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
  closest?: (selector: string) => unknown;
}

export interface GlobalArrowNavGuardContext {
  activeView: 'portfolio' | 'admin';
  hasOpenOverlay: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  target: KeyboardTargetLike | null;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION']);
const INTERACTIVE_WIDGET_ROLES = new Set(['slider', 'tablist', 'tab', 'combobox', 'listbox']);

/**
 * Determines whether a global keyboard arrow event should trigger section-to-section
 * portfolio navigation without interfering with inputs, sliders, tabs, or modals.
 */
export function shouldHandleGlobalArrowNavigation(ctx: GlobalArrowNavGuardContext): boolean {
  if (ctx.activeView !== 'portfolio' || ctx.hasOpenOverlay) {
    return false;
  }

  if (ctx.altKey || ctx.ctrlKey || ctx.metaKey) {
    return false;
  }

  const target = ctx.target;
  if (!target) return true;

  const tag = target.tagName ? target.tagName.toUpperCase() : '';
  if (EDITABLE_TAGS.has(tag) || target.isContentEditable) {
    return false;
  }

  const role = target.getAttribute?.('role')?.toLowerCase() ?? '';
  if (INTERACTIVE_WIDGET_ROLES.has(role)) {
    return false;
  }

  if (
    target.closest?.('[role="slider"], [role="tablist"], [data-keyboard-nav="ignore"], input, textarea, select')
  ) {
    return false;
  }

  return true;
}

/**
 * Resolves the target section anchor when pressing ArrowDown, ArrowUp,
 * ArrowRight, ArrowLeft, Home, or End.
 * Returns null if the key is unrelated or already at the boundary.
 */
export function resolveSectionByArrowKey(
  key: string,
  currentSection: NavSectionId,
  order: readonly NavSectionId[] = MAIN_NAV_ANCHOR_ORDER,
): NavSectionId | null {
  if (order.length === 0) return null;

  const currentIndex = Math.max(0, order.indexOf(currentSection));

  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight': {
      const nextIndex = Math.min(order.length - 1, currentIndex + 1);
      return nextIndex === currentIndex ? null : order[nextIndex];
    }
    case 'ArrowUp':
    case 'ArrowLeft': {
      const prevIndex = Math.max(0, currentIndex - 1);
      return prevIndex === currentIndex ? null : order[prevIndex];
    }
    case 'Home':
      return currentIndex === 0 ? null : order[0];
    case 'End':
      return currentIndex === order.length - 1 ? null : order[order.length - 1];
    default:
      return null;
  }
}
