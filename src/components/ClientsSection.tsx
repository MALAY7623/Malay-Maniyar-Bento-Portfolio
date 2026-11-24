import { motion } from 'motion/react';
import type { CapabilityItem } from '../types/portfolio';
import { EDITORIAL_EASE, REVEAL_VIEWPORT } from '../utils/motionConfig';
import { CornerBracket } from './BentoPrimitives';

interface ClientsSectionProps {
  capabilities: CapabilityItem[];
}

export function ClientsSection({ capabilities }: ClientsSectionProps) {
  return (
    <section
      id="clients"
      tabIndex={-1}
      aria-label="Creative Capabilities"
      className="py-10 sm:py-14 outline-none theme-surface"
    >
      {/* 3-Column Creative Capabilities Bento Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-5">
        {capabilities.map((item, idx) => (
          <motion.article
            key={item.id || `${item.number}-${idx}`}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={REVEAL_VIEWPORT}
            transition={{ duration: 0.55, delay: idx * 0.08, ease: EDITORIAL_EASE }}
            data-cursor="bento"
            data-cursor-tone="neutral"
            className="group rounded-[26px] border p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-[0_6px_18px_rgba(17,17,17,0.03)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] theme-surface"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl font-mono text-xs font-bold tabular-nums"
                  style={{ backgroundColor: item.accentBg, color: item.accentText }}
                >
                  {item.number}
                </span>
                <CornerBracket
                  className="text-[var(--ink)]/45 group-hover:text-[var(--ink)]"
                  size={16}
                />
              </div>

              <h3
                className="text-xl font-extrabold tracking-[-0.025em] leading-snug"
                style={{ color: 'var(--ink)' }}
              >
                {item.title}
              </h3>
              <p
                className="text-sm mt-2.5 leading-relaxed"
                style={{ color: 'var(--ink-secondary)' }}
              >
                {item.summary}
              </p>
            </div>

            <ul
              className="space-y-2 pt-4 border-t text-xs font-medium"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--ink)',
              }}
            >
              {item.deliverables.map((deliverable) => (
                <li key={deliverable} className="flex items-center gap-2 opacity-90">
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.accentBg }}
                  />
                  <span>{deliverable}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
