import { motion, useReducedMotion } from 'motion/react';
import { EDITORIAL_EASE, REVEAL_VIEWPORT } from '../utils/motionConfig';

interface SectionDividerProps {
  /** Optional subtle editorial index label (e.g. "01 · UGC REELS") */
  label?: string;
  /** Optional CSS variable accent color for the central four-point star */
  accentVar?: 'periwinkle' | 'mint' | 'apricot';
  className?: string;
}

const ACCENT_MAP: Record<NonNullable<SectionDividerProps['accentVar']>, string> = {
  periwinkle: 'var(--periwinkle)',
  mint: 'var(--mint)',
  apricot: 'var(--apricot)',
};

/**
 * Subtle, editorial horizontal divider separating bento grid segments in the
 * main workspace area. Draws crisp hairlines smoothly from the center with a
 * signature Swiss four-point star mark and micro registration ticks.
 */
export function SectionDivider({
  label,
  accentVar = 'periwinkle',
  className = '',
}: SectionDividerProps) {
  const prefersReducedMotion = useReducedMotion();
  const accentColor = ACCENT_MAP[accentVar];

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label ? `${label} section divider` : undefined}
      data-testid="section-divider"
      className={`relative py-4 sm:py-5 flex items-center gap-3 sm:gap-4 select-none ${className}`}
    >
      {/* Left registration tick + animated hairline */}
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full shrink-0 opacity-60"
        style={{ backgroundColor: 'var(--border-strong)' }}
      />
      <motion.span
        aria-hidden="true"
        initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={REVEAL_VIEWPORT}
        transition={{ duration: 0.75, ease: EDITORIAL_EASE }}
        className="h-px flex-1 origin-right"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--border-subtle) 18%, var(--border-strong) 100%)',
        }}
      />

      {/* Central architectural four-point star emblem + optional subtle mono caption */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.88 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={REVEAL_VIEWPORT}
        transition={{ duration: 0.55, delay: 0.08, ease: EDITORIAL_EASE }}
        className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border theme-surface shrink-0"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <span
          aria-hidden="true"
          className="text-[11px] leading-none"
          style={{ color: accentColor }}
        >
          ✦
        </span>
        {label && (
          <span
            className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase"
            style={{ color: 'var(--ink-muted)' }}
          >
            {label}
          </span>
        )}
        <span
          aria-hidden="true"
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: 'var(--border-strong)' }}
        />
      </motion.div>

      {/* Right animated hairline + registration tick */}
      <motion.span
        aria-hidden="true"
        initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={REVEAL_VIEWPORT}
        transition={{ duration: 0.75, ease: EDITORIAL_EASE }}
        className="h-px flex-1 origin-left"
        style={{
          background:
            'linear-gradient(90deg, var(--border-strong) 0%, var(--border-subtle) 82%, transparent 100%)',
        }}
      />
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full shrink-0 opacity-60"
        style={{ backgroundColor: 'var(--border-strong)' }}
      />
    </div>
  );
}
