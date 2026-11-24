export type CursorVariant =
  | 'default'
  | 'bento'
  | 'tile'
  | 'action'
  | 'media'
  | 'drag'
  | 'interactive'
  | 'hidden';

export type CursorTone =
  | 'neutral'
  | 'periwinkle'
  | 'mint'
  | 'apricot'
  | 'obsidian'
  | 'charcoal';

export interface CursorIntent {
  variant: CursorVariant;
  label: string;
  tone: CursorTone;
}

export interface CursorVelocityDeformation {
  scaleX: number;
  scaleY: number;
  angleDeg: number;
}

export interface CursorVisualSpec {
  width: number;
  height: number;
  borderRadius: number;
  ringOpacity: number;
  dotScale: number;
  showCorners: boolean;
  borderColor: string;
  surfaceBg: string;
  textColor: string;
}

/**
 * Minimal node interface so cursor target resolution can be tested deterministically in Node
 * without requiring a browser DOM.
 */
export interface CursorInspectableNode {
  tagName?: string;
  getAttribute?: (name: string) => string | null;
  parentElement?: CursorInspectableNode | null;
}

const VALID_VARIANTS = new Set<CursorVariant>([
  'default',
  'bento',
  'tile',
  'action',
  'media',
  'drag',
  'interactive',
  'hidden',
]);

const VALID_TONES = new Set<CursorTone>([
  'neutral',
  'periwinkle',
  'mint',
  'apricot',
  'obsidian',
  'charcoal',
]);

const TEXT_INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const INTERACTIVE_TAGS = new Set(['A', 'BUTTON']);

export const DEFAULT_CURSOR_INTENT: CursorIntent = {
  variant: 'default',
  label: '',
  tone: 'neutral',
};

function parseVariant(raw: string | null | undefined): CursorVariant | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase() as CursorVariant;
  return VALID_VARIANTS.has(normalized) ? normalized : null;
}

function parseTone(raw: string | null | undefined): CursorTone | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase() as CursorTone;
  return VALID_TONES.has(normalized) ? normalized : null;
}

/**
 * Walks up from the hovered node to resolve the most specific semantic cursor intent.
 * Prioritizes native form fields (hiding the custom cursor for clean text editing),
 * then explicit `data-cursor` bento annotations, and falls back to generic buttons/links.
 */
export function resolveCursorIntent(startNode: CursorInspectableNode | null): CursorIntent {
  let node: CursorInspectableNode | null = startNode;
  let fallbackInteractive = false;
  let inheritedTone: CursorTone | null = null;
  let depth = 0;

  while (node && depth < 32) {
    depth += 1;
    const tag = node.tagName ? node.tagName.toUpperCase() : '';
    const getAttr = node.getAttribute?.bind(node);

    // Never interfere with text entry or form controls
    if (
      TEXT_INPUT_TAGS.has(tag) ||
      getAttr?.('contenteditable') === 'true' ||
      getAttr?.('data-cursor') === 'hidden'
    ) {
      return { variant: 'hidden', label: '', tone: 'neutral' };
    }

    const attrTone = parseTone(getAttr?.('data-cursor-tone'));
    if (attrTone && !inheritedTone) {
      inheritedTone = attrTone;
    }

    const explicitVariant = parseVariant(getAttr?.('data-cursor'));
    if (explicitVariant) {
      const label = (getAttr?.('data-cursor-label') || '').trim();
      return {
        variant: explicitVariant,
        label,
        tone: attrTone ?? inheritedTone ?? 'neutral',
      };
    }

    if (
      INTERACTIVE_TAGS.has(tag) ||
      getAttr?.('role') === 'button' ||
      getAttr?.('role') === 'tab' ||
      getAttr?.('role') === 'link'
    ) {
      fallbackInteractive = true;
    }

    if (getAttr?.('role') === 'slider') {
      return {
        variant: 'drag',
        label: 'Drag',
        tone: inheritedTone ?? 'apricot',
      };
    }

    node = node.parentElement ?? null;
  }

  if (fallbackInteractive) {
    return {
      variant: 'interactive',
      label: '',
      tone: inheritedTone ?? 'neutral',
    };
  }

  return DEFAULT_CURSOR_INTENT;
}

/**
 * Computes subtle organic velocity-based squash & stretch for the physics follower ring.
 * Keeps deformation gentle and bounded so high-speed sweeps feel tactile, never rubbery.
 */
export function computeVelocityDeformation(vx: number, vy: number): CursorVelocityDeformation {
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) {
    return { scaleX: 1, scaleY: 1, angleDeg: 0 };
  }

  const speed = Math.hypot(vx, vy);
  if (speed < 45) {
    return { scaleX: 1, scaleY: 1, angleDeg: 0 };
  }

  // Softly ramp deformation up to a crisp editorial cap (max +18% elongation)
  const intensity = Math.min(1, (speed - 45) / 1800);
  const stretch = intensity * 0.18;
  const scaleX = Number((1 + stretch).toFixed(4));
  const scaleY = Number((1 - stretch * 0.65).toFixed(4));
  const angleDeg = Number(((Math.atan2(vy, vx) * 180) / Math.PI).toFixed(2));

  return { scaleX, scaleY, angleDeg };
}

interface TonePalette {
  border: string;
  bentoSurface: string;
  tileSurface: string;
  tileText: string;
  actionSurface: string;
  actionText: string;
}

const TONE_PALETTES: Record<CursorTone, TonePalette> = {
  neutral: {
    border: 'rgba(17, 17, 17, 0.34)',
    bentoSurface: 'rgba(17, 17, 17, 0.04)',
    tileSurface: 'rgba(255, 255, 255, 0.58)',
    tileText: '#111111',
    actionSurface: 'rgba(18, 18, 20, 0.78)',
    actionText: '#FFFFFF',
  },
  periwinkle: {
    border: 'rgba(255, 255, 255, 0.74)',
    bentoSurface: 'rgba(255, 255, 255, 0.12)',
    tileSurface: 'rgba(255, 255, 255, 0.18)',
    tileText: '#FFFFFF',
    actionSurface: 'rgba(255, 255, 255, 0.86)',
    actionText: '#111111',
  },
  mint: {
    border: 'rgba(17, 17, 17, 0.42)',
    bentoSurface: 'rgba(17, 17, 17, 0.05)',
    tileSurface: 'rgba(255, 255, 255, 0.44)',
    tileText: '#111111',
    actionSurface: 'rgba(18, 18, 20, 0.78)',
    actionText: '#FFFFFF',
  },
  apricot: {
    border: 'rgba(17, 17, 17, 0.44)',
    bentoSurface: 'rgba(17, 17, 17, 0.06)',
    tileSurface: 'rgba(255, 255, 255, 0.42)',
    tileText: '#111111',
    actionSurface: 'rgba(18, 18, 20, 0.78)',
    actionText: '#FFFFFF',
  },
  obsidian: {
    border: 'rgba(255, 255, 255, 0.65)',
    bentoSurface: 'rgba(255, 255, 255, 0.1)',
    tileSurface: 'rgba(255, 255, 255, 0.16)',
    tileText: '#FFFFFF',
    actionSurface: 'rgba(255, 255, 255, 0.86)',
    actionText: '#111111',
  },
  charcoal: {
    border: 'rgba(255, 255, 255, 0.68)',
    bentoSurface: 'rgba(255, 255, 255, 0.12)',
    tileSurface: 'rgba(255, 255, 255, 0.18)',
    tileText: '#FFFFFF',
    actionSurface: 'rgba(255, 255, 255, 0.86)',
    actionText: '#111111',
  },
};

const DARK_NEUTRAL_PALETTE: TonePalette = {
  border: 'rgba(245, 245, 247, 0.52)',
  bentoSurface: 'rgba(255, 255, 255, 0.08)',
  tileSurface: 'rgba(255, 255, 255, 0.14)',
  tileText: '#F5F5F7',
  actionSurface: 'rgba(245, 245, 247, 0.88)',
  actionText: '#111111',
};

/**
 * Returns deterministic dimensions, border radius, and contrast-safe colors
 * for each follower cursor state.
 */
export function getCursorVisualSpec(
  variant: CursorVariant,
  tone: CursorTone,
  isPressed: boolean,
  isDarkMode = false,
): CursorVisualSpec {
  const palette =
    tone === 'neutral' && isDarkMode
      ? DARK_NEUTRAL_PALETTE
      : (TONE_PALETTES[tone] ?? TONE_PALETTES.neutral);
  const pressScale = isPressed ? 0.86 : 1;

  switch (variant) {
    case 'hidden':
      return {
        width: 16,
        height: 16,
        borderRadius: 999,
        ringOpacity: 0,
        dotScale: 0,
        showCorners: false,
        borderColor: palette.border,
        surfaceBg: 'transparent',
        textColor: '#111111',
      };

    case 'bento':
      return {
        width: Math.round(48 * pressScale),
        height: Math.round(48 * pressScale),
        borderRadius: 15,
        ringOpacity: 1,
        dotScale: isPressed ? 0.75 : 1,
        showCorners: true,
        borderColor: palette.border,
        surfaceBg: palette.bentoSurface,
        textColor: palette.tileText,
      };

    case 'tile':
      return {
        width: Math.round(46 * pressScale),
        height: Math.round(46 * pressScale),
        borderRadius: 14,
        ringOpacity: 1,
        dotScale: 0,
        showCorners: true,
        borderColor: palette.border,
        surfaceBg: palette.tileSurface,
        textColor: palette.tileText,
      };

    case 'action':
      return {
        width: Math.round(58 * pressScale),
        height: Math.round(58 * pressScale),
        borderRadius: 999,
        ringOpacity: 1,
        dotScale: 0,
        showCorners: false,
        borderColor: 'rgba(255, 255, 255, 0.28)',
        surfaceBg: palette.actionSurface,
        textColor: palette.actionText,
      };

    case 'media':
      return {
        width: Math.round(62 * pressScale),
        height: Math.round(62 * pressScale),
        borderRadius: 999,
        ringOpacity: 1,
        dotScale: 0,
        showCorners: false,
        borderColor: 'rgba(255, 255, 255, 0.42)',
        surfaceBg: 'rgba(255, 255, 255, 0.84)',
        textColor: '#111111',
      };

    case 'drag':
      return {
        width: Math.round(70 * pressScale),
        height: Math.round(34 * pressScale),
        borderRadius: 999,
        ringOpacity: 1,
        dotScale: 0,
        showCorners: false,
        borderColor: 'rgba(255, 255, 255, 0.34)',
        surfaceBg: 'rgba(18, 18, 20, 0.78)',
        textColor: '#FFFFFF',
      };

    case 'interactive':
      return {
        width: Math.round(36 * pressScale),
        height: Math.round(36 * pressScale),
        borderRadius: 999,
        ringOpacity: 0.92,
        dotScale: isPressed ? 0.7 : 0.85,
        showCorners: false,
        borderColor: palette.border,
        surfaceBg: palette.bentoSurface,
        textColor: palette.actionText,
      };

    case 'default':
    default:
      return {
        width: Math.round(26 * pressScale),
        height: Math.round(26 * pressScale),
        borderRadius: 999,
        ringOpacity: 0.78,
        dotScale: isPressed ? 0.72 : 1,
        showCorners: false,
        borderColor: palette.border,
        surfaceBg: 'rgba(255, 255, 255, 0.08)',
        textColor: '#111111',
      };
  }
}
