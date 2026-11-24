import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type {
  CustomSection,
  CustomSectionAccent,
  CustomSectionPlacement,
} from '../types/portfolio';
import { filterAndSortCustomSections } from '../utils/cmsUtils';
import { EDITORIAL_EASE, REVEAL_VIEWPORT } from '../utils/motionConfig';
import { CornerBracket, ResilientImage } from './BentoPrimitives';

interface CustomSectionsRendererProps {
  sections: CustomSection[];
  placement: CustomSectionPlacement;
  onOpenInquiry?: () => void;
}

interface AccentThemeStyle {
  bgStyle: string;
  textClass: string;
  mutedTextClass: string;
  eyebrowClass: string;
  cardBgClass: string;
  cardBorderClass: string;
  ctaClass: string;
  bracketClass: string;
}

function getAccentStyles(accent: CustomSectionAccent): AccentThemeStyle {
  switch (accent) {
    case 'periwinkle':
      return {
        bgStyle: 'var(--periwinkle)',
        textClass: 'text-white',
        mutedTextClass: 'text-white/90',
        eyebrowClass: 'text-white/85',
        cardBgClass: 'bg-white/12 border-white/20 text-white',
        cardBorderClass: 'border-white/20',
        ctaClass: 'bg-white text-[#111111] hover:bg-[#F7F7F8]',
        bracketClass: 'text-white/90',
      };
    case 'mint':
      return {
        bgStyle: 'var(--mint)',
        textClass: 'text-[#111111]',
        mutedTextClass: 'text-[#111111]/80',
        eyebrowClass: 'text-[#111111]/75',
        cardBgClass: 'bg-white/75 border-black/[0.08] text-[#111111]',
        cardBorderClass: 'border-black/[0.08]',
        ctaClass: 'bg-[#111111] text-white hover:bg-[#2a2a2f]',
        bracketClass: 'text-[#111111]',
      };
    case 'apricot':
      return {
        bgStyle: 'var(--apricot)',
        textClass: 'text-[#111111]',
        mutedTextClass: 'text-[#111111]/80',
        eyebrowClass: 'text-[#111111]/75',
        cardBgClass: 'bg-white/75 border-black/[0.08] text-[#111111]',
        cardBorderClass: 'border-black/[0.08]',
        ctaClass: 'bg-[#111111] text-white hover:bg-[#2a2a2f]',
        bracketClass: 'text-[#111111]',
      };
    case 'charcoal':
      return {
        bgStyle: 'var(--obsidian)',
        textClass: 'text-white',
        mutedTextClass: 'text-white/80',
        eyebrowClass: 'text-white/70',
        cardBgClass: 'bg-white/[0.07] border-white/15 text-white',
        cardBorderClass: 'border-white/15',
        ctaClass: 'bg-[var(--apricot)] text-[#111111] hover:opacity-95',
        bracketClass: 'text-white/80',
      };
    case 'white':
    default:
      return {
        bgStyle: 'var(--surface-card)',
        textClass: 'text-[var(--ink)]',
        mutedTextClass: 'text-[var(--ink-secondary)]',
        eyebrowClass: 'text-[var(--periwinkle)]',
        cardBgClass: 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--ink)]',
        cardBorderClass: 'border-[var(--border-subtle)]',
        ctaClass: 'bg-[var(--ink)] text-[var(--workspace-bg)] hover:opacity-90',
        bracketClass: 'text-[var(--ink)]/60',
      };
  }
}

function SectionCta({
  label,
  url,
  className,
  onOpenInquiry,
}: {
  label: string;
  url: string;
  className: string;
  onOpenInquiry?: () => void;
}) {
  if (!label.trim()) return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl || trimmedUrl === '#contact-drawer') {
    return (
      <button
        type="button"
        onClick={onOpenInquiry}
        className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 ${className}`}
      >
        <span>{label}</span>
        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
      </button>
    );
  }

  const isExternal = /^https?:\/\//i.test(trimmedUrl);
  return (
    <a
      href={trimmedUrl}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-[0.98] whitespace-nowrap shrink-0 ${className}`}
    >
      <span>{label}</span>
      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
    </a>
  );
}

export function CustomSectionsRenderer({
  sections,
  placement,
  onOpenInquiry,
}: CustomSectionsRendererProps) {
  const visibleSections = filterAndSortCustomSections(sections, placement, false);
  if (visibleSections.length === 0) return null;

  return (
    <div
      className="space-y-6 sm:space-y-8 py-8 sm:py-12 border-t theme-surface"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {visibleSections.map((section) => {
        const theme = getAccentStyles(section.accentTheme);
        const cursorTone =
          section.accentTheme === 'white'
            ? 'neutral'
            : section.accentTheme === 'charcoal'
              ? 'obsidian'
              : section.accentTheme;
        const hasImage = Boolean(section.imageUrl && section.imageUrl.trim().length > 0);
        const hasItems = Array.isArray(section.items) && section.items.length > 0;

        // 1. EDITORIAL QUOTE / ANNOUNCEMENT
        if (section.layout === 'editorial-quote') {
          return (
            <motion.section
              key={section.id}
              data-cursor="bento"
              data-cursor-tone={cursorTone}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={REVEAL_VIEWPORT}
              transition={{ duration: 0.55, ease: EDITORIAL_EASE }}
              style={{ backgroundColor: theme.bgStyle }}
              className={`rounded-[26px] sm:rounded-[28px] border border-[var(--border-subtle)] p-6 sm:p-10 lg:p-12 shadow-[0_8px_24px_rgba(17,17,17,0.04)] ${theme.textClass}`}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                {section.eyebrow ? (
                  <p className={`text-xs font-semibold tracking-[0.02em] ${theme.eyebrowClass}`}>
                    {section.eyebrow}
                  </p>
                ) : (
                  <span />
                )}
                <CornerBracket className={theme.bracketClass} size={18} />
              </div>

              <div className="max-w-3xl space-y-4">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] leading-[1.12] [text-wrap:balance]">
                  {section.heading}
                </h2>
                {section.body && (
                  <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${theme.mutedTextClass}`}>
                    {section.body}
                  </p>
                )}
              </div>

              {section.ctaLabel && (
                <div className="mt-7">
                  <SectionCta
                    label={section.ctaLabel}
                    url={section.ctaUrl}
                    className={theme.ctaClass}
                    onOpenInquiry={onOpenInquiry}
                  />
                </div>
              )}
            </motion.section>
          );
        }

        // 2. BENTO CARDS GRID (Structured 1-col Mobile, 2-col Tablet, 3-col PC)
        if (section.layout === 'bento-cards') {
          const gridCols =
            section.items.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : section.items.length === 1
                ? 'grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

          return (
            <motion.section
              key={section.id}
              data-cursor="bento"
              data-cursor-tone={cursorTone}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={REVEAL_VIEWPORT}
              transition={{ duration: 0.55, ease: EDITORIAL_EASE }}
              style={{ backgroundColor: theme.bgStyle }}
              className={`rounded-[26px] sm:rounded-[28px] border border-[var(--border-subtle)] p-6 sm:p-8 lg:p-10 shadow-[0_8px_24px_rgba(17,17,17,0.04)] ${theme.textClass}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
                <div className="space-y-2 max-w-2xl">
                  {section.eyebrow && (
                    <p className={`text-xs font-semibold tracking-[0.02em] ${theme.eyebrowClass}`}>
                      {section.eyebrow}
                    </p>
                  )}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] leading-tight [text-wrap:balance]">
                    {section.heading}
                  </h2>
                  {section.body && (
                    <p className={`text-sm sm:text-[15px] leading-relaxed whitespace-pre-line ${theme.mutedTextClass}`}>
                      {section.body}
                    </p>
                  )}
                </div>

                {section.ctaLabel && (
                  <SectionCta
                    label={section.ctaLabel}
                    url={section.ctaUrl}
                    className={theme.ctaClass}
                    onOpenInquiry={onOpenInquiry}
                  />
                )}
              </div>

              {hasItems && (
                <div className={`grid ${gridCols} gap-4 xl:gap-5`}>
                  {section.items.map((item, idx) => (
                    <article
                      key={`${section.id}-item-${idx}`}
                      className={`rounded-[22px] border overflow-hidden flex flex-col justify-between ${theme.cardBgClass}`}
                    >
                      {item.imageUrl && (
                        <div className="w-full aspect-[16/10] overflow-hidden bg-black/10">
                          <ResilientImage
                            src={item.imageUrl}
                            alt={item.title || section.heading}
                            className="w-full h-full object-cover"
                            fallbackTitle={item.title || 'Highlight'}
                            fallbackAccent="#8A85E8"
                          />
                        </div>
                      )}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            {item.badge ? (
                              <span className="font-mono text-[11px] font-semibold opacity-75">
                                {item.badge}
                              </span>
                            ) : (
                              <span className="font-mono text-[11px] font-semibold opacity-60">
                                0{idx + 1}
                              </span>
                            )}
                            <CornerBracket className="opacity-60" size={14} />
                          </div>
                          {item.title && (
                            <h3 className="text-lg font-extrabold tracking-[-0.02em] leading-snug">
                              {item.title}
                            </h3>
                          )}
                          {item.description && (
                            <p className="text-xs sm:text-sm opacity-85 leading-relaxed whitespace-pre-line">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </motion.section>
          );
        }

        // 3. MEDIA SPOTLIGHT (Balanced 6/6 Split with Image First on Desktop)
        if (section.layout === 'media-spotlight') {
          return (
            <motion.section
              key={section.id}
              data-cursor="bento"
              data-cursor-tone={cursorTone}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={REVEAL_VIEWPORT}
              transition={{ duration: 0.55, ease: EDITORIAL_EASE }}
              style={{ backgroundColor: theme.bgStyle }}
              className={`rounded-[26px] sm:rounded-[28px] border border-[var(--border-subtle)] overflow-hidden shadow-[0_8px_24px_rgba(17,17,17,0.04)] ${theme.textClass}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                {hasImage && (
                  <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto lg:min-h-[360px] bg-[#121214] overflow-hidden">
                    <ResilientImage
                      src={section.imageUrl}
                      alt={section.heading}
                      className="w-full h-full object-cover"
                      fallbackTitle={section.heading}
                      fallbackAccent="#8A85E8"
                    />
                  </div>
                )}

                <div
                  className={`${
                    hasImage ? 'lg:col-span-6' : 'lg:col-span-12'
                  } p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      {section.eyebrow ? (
                        <p className={`text-xs font-semibold tracking-[0.02em] ${theme.eyebrowClass}`}>
                          {section.eyebrow}
                        </p>
                      ) : (
                        <span />
                      )}
                      <CornerBracket className={theme.bracketClass} size={16} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] leading-tight [text-wrap:balance]">
                      {section.heading}
                    </h2>
                    {section.body && (
                      <p className={`text-sm sm:text-[15px] leading-relaxed whitespace-pre-line ${theme.mutedTextClass}`}>
                        {section.body}
                      </p>
                    )}

                    {hasItems && (
                      <div className={`pt-4 mt-4 border-t ${theme.cardBorderClass} grid grid-cols-1 sm:grid-cols-2 gap-3`}>
                        {section.items.map((item, idx) => (
                          <div key={`${section.id}-hl-${idx}`} className="space-y-0.5">
                            {item.badge && (
                              <span className="font-mono text-[10px] opacity-70">{item.badge}</span>
                            )}
                            <p className="text-sm font-bold leading-snug">{item.title}</p>
                            {item.description && (
                              <p className="text-xs opacity-80 leading-relaxed">{item.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {section.ctaLabel && (
                    <div className="pt-2">
                      <SectionCta
                        label={section.ctaLabel}
                        url={section.ctaUrl}
                        className={theme.ctaClass}
                        onOpenInquiry={onOpenInquiry}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          );
        }

        // 4. FEATURE BANNER (Default structured 7/5 asymmetrical bento highlight)
        return (
          <motion.section
            key={section.id}
            data-cursor="bento"
            data-cursor-tone={cursorTone}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={REVEAL_VIEWPORT}
            transition={{ duration: 0.55, ease: EDITORIAL_EASE }}
            style={{ backgroundColor: theme.bgStyle }}
            className={`rounded-[26px] sm:rounded-[28px] border border-[var(--border-subtle)] p-6 sm:p-8 lg:p-10 shadow-[0_8px_24px_rgba(17,17,17,0.04)] ${theme.textClass}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              <div className={`${hasImage ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
                <div className="flex items-center justify-between gap-4">
                  {section.eyebrow ? (
                    <p className={`text-xs font-semibold tracking-[0.02em] ${theme.eyebrowClass}`}>
                      {section.eyebrow}
                    </p>
                  ) : (
                    <span />
                  )}
                  <CornerBracket className={theme.bracketClass} size={18} />
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] leading-[1.1] [text-wrap:balance]">
                  {section.heading}
                </h2>

                {section.body && (
                  <p className={`text-sm sm:text-[15px] leading-relaxed max-w-2xl whitespace-pre-line ${theme.mutedTextClass}`}>
                    {section.body}
                  </p>
                )}

                {hasItems && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {section.items.map((item, idx) => (
                      <div
                        key={`${section.id}-b-${idx}`}
                        className={`rounded-2xl border p-4 ${theme.cardBgClass}`}
                      >
                        {item.badge && (
                          <p className="font-mono text-[10px] font-semibold opacity-70 mb-1">
                            {item.badge}
                          </p>
                        )}
                        <p className="text-sm font-bold leading-snug">{item.title}</p>
                        {item.description && (
                          <p className="text-xs opacity-80 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.ctaLabel && (
                  <div className="pt-2">
                    <SectionCta
                      label={section.ctaLabel}
                      url={section.ctaUrl}
                      className={theme.ctaClass}
                      onOpenInquiry={onOpenInquiry}
                    />
                  </div>
                )}
              </div>

              {hasImage && (
                <div className="lg:col-span-5">
                  <div className="rounded-[22px] overflow-hidden aspect-[4/3] bg-black/10 shadow-[0_10px_28px_rgba(17,17,17,0.12)]">
                    <ResilientImage
                      src={section.imageUrl}
                      alt={section.heading}
                      className="w-full h-full object-cover"
                      fallbackTitle={section.heading}
                      fallbackAccent="#8A85E8"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
