import React, { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { Check, Copy, Play, Upload, Users } from 'lucide-react';
import { FALLBACK_PORTRAIT_URL } from '../data/portfolioData';
import type { DesignCategory, NavSectionId, SiteConfig } from '../types/portfolio';
import { formatDuration } from '../utils/portfolioLogic';
import { compressImageFileToDataUrl } from '../utils/cmsUtils';
import { EDITORIAL_EASE, SCROLL_PARALLAX_SPRING } from '../utils/motionConfig';
import {
  CornerBracket,
  IridescentSphere,
  ResilientImage,
  RotatingStampBadge,
  TiltBentoCard,
} from './BentoPrimitives';

interface HeroBentoProps {
  config: SiteConfig;
  isAdmin: boolean;
  onPortraitChange: (dataUrl: string) => Promise<void> | void;
  copiedEmail: boolean;
  onCopyEmail: () => void;
  onOpenShowreel: () => void;
  onNavigate: (sectionId: NavSectionId) => void;
  onNavigateDesignCategory: (category: DesignCategory) => void;
  onOpenAdminAccess?: () => void;
}

export function HeroBento({
  config,
  isAdmin,
  onPortraitChange,
  copiedEmail,
  onCopyEmail,
  onOpenShowreel,
  onNavigate,
  onNavigateDesignCategory,
  onOpenAdminAccess,
}: HeroBentoProps) {
  const heroRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const smoothScrollProgress = useSpring(scrollYProgress, SCROLL_PARALLAX_SPRING);

  // Silky scroll-linked parallax separation between left & right bento columns
  const leftColumnY = useTransform(smoothScrollProgress, [0, 1], [0, -28]);
  const rightTopY = useTransform(smoothScrollProgress, [0, 1], [0, -14]);
  const rightBottomY = useTransform(smoothScrollProgress, [0, 1], [0, 22]);

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPortrait(true);
    setPortraitError(null);
    try {
      const compressed = await compressImageFileToDataUrl(file, 900, 0.82);
      await onPortraitChange(compressed);
    } catch (err) {
      setPortraitError(err instanceof Error ? err.message : 'Could not update profile picture.');
    } finally {
      setUploadingPortrait(false);
      event.target.value = '';
    }
  };

  const { profile, hero, showreel, theme } = config;

  return (
    <section
      id="about"
      ref={heroRef}
      tabIndex={-1}
      aria-label="Hero Portfolio Overview"
      className="pt-4 pb-10 sm:pt-6 sm:pb-14 lg:pt-8 lg:pb-16 outline-none"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-stretch">
        {/* ============================================================
            LEFT TALL PRIMARY ACCENT HERO CARD (5 columns, full height)
            ============================================================ */}
        <motion.div
          style={prefersReducedMotion ? undefined : { y: leftColumnY }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: EDITORIAL_EASE }}
          className="lg:col-span-5 flex"
        >
          <TiltBentoCard maxTilt={3} className="w-full flex">
            <div
              data-cursor="bento"
              data-cursor-tone="periwinkle"
              className="relative w-full min-h-[540px] lg:min-h-[610px] rounded-[28px] text-white p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-[0_12px_32px_rgba(17,17,17,0.12)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
              style={{ backgroundColor: 'var(--periwinkle)' }}
            >
              {/* Top-Right Architectural Notched Cutout Corner */}
              <div
                aria-hidden="true"
                className="absolute top-0 right-0 w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-bl-[26px] z-20 flex items-center justify-center theme-surface"
                style={{ backgroundColor: 'var(--workspace-bg)' }}
              >
                <CornerBracket
                  className="text-[var(--ink)]/80 translate-x-1 -translate-y-1"
                  size={20}
                  strokeWidth={2.3}
                />
                {/* Inverted smooth inner fillets connecting notch to hero card */}
                <svg
                  className="absolute -left-5 top-0 w-5 h-5 pointer-events-none"
                  style={{ color: 'var(--workspace-bg)' }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M0 0 H20 V20 A20 20 0 0 0 0 0 Z" />
                </svg>
                <svg
                  className="absolute right-0 -bottom-5 w-5 h-5 pointer-events-none"
                  style={{ color: 'var(--workspace-bg)' }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M0 0 H20 V20 A20 20 0 0 0 0 0 Z" />
                </svg>
              </div>

              {/* Portrait Area + Admin-only Quick Replace Photo Control */}
              <div className="relative z-10 flex flex-col items-start gap-6 pt-2">
                <div className="relative group/avatar">
                  <div
                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-full p-1.5 shadow-[0_10px_28px_rgba(17,17,17,0.14)] overflow-hidden ring-4 ring-white/20"
                    style={{ backgroundColor: 'var(--lilac-backdrop)' }}
                  >
                    <div
                      className="w-full h-full rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--lilac-backdrop)' }}
                    >
                      <ResilientImage
                        src={profile.portraitUrl || FALLBACK_PORTRAIT_URL}
                        fallbackSrc={FALLBACK_PORTRAIT_URL}
                        alt={`${profile.name} — ${profile.role} portrait`}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover/avatar:scale-105"
                        fallbackTitle={profile.name}
                        fallbackAccent={theme.lilacBackdrop}
                        priority
                      />
                    </div>
                  </div>

                  {isAdmin && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelected}
                        className="sr-only"
                        aria-label="Upload custom portrait photo"
                      />
                      <button
                        type="button"
                        disabled={uploadingPortrait}
                        onClick={() => fileInputRef.current?.click()}
                        title="Replace Photo (Saves to Cloud)"
                        className="absolute bottom-1 right-1 inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full bg-white text-[#111111] text-[11px] font-semibold shadow-md transition-all duration-200 cursor-pointer hover:bg-[#121214] hover:text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:opacity-0 sm:group-hover/avatar:opacity-100 focus-visible:opacity-100"
                        aria-label="Replace portrait photo"
                      >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">
                          {uploadingPortrait ? 'Saving...' : 'Replace Photo'}
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {portraitError && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-white bg-black/35 px-3 py-1.5 rounded-xl max-w-xs"
                  >
                    {portraitError}
                  </p>
                )}

                {/* Bold White Stacked Greeting */}
                <div className="space-y-2.5 max-w-md">
                  <h1
                    data-gsap="hero-clip"
                    className="text-4xl sm:text-[2.85rem] xl:text-[3.15rem] font-extrabold tracking-[-0.035em] leading-[1.03] text-white [text-wrap:balance]"
                  >
                    {hero.greetingPrefix}
                    <br />
                    {profile.name}
                  </h1>
                  <p
                    data-gsap="hero-clip"
                    className="text-base sm:text-lg font-medium text-white/90 tracking-[-0.01em]"
                  >
                    {profile.role}
                  </p>
                </div>
              </div>

              {/* Bottom Utility Row: Clickable Copy Email Pill + Rotating Circular Stamp */}
              <div className="relative z-10 flex items-end justify-between gap-2.5 pt-8">
                <button
                  type="button"
                  onClick={onCopyEmail}
                  data-cursor="action"
                  data-cursor-label={copiedEmail ? 'Copied' : 'Copy'}
                  data-cursor-tone="periwinkle"
                  className="group inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white text-[#111111] text-[11px] sm:text-[13px] font-semibold shadow-[0_6px_18px_rgba(17,17,17,0.12)] hover:bg-[#F7F7F8] active:scale-[0.98] transition-all cursor-pointer max-w-[calc(100%-76px)] sm:max-w-[calc(100%-98px)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label={`Copy email address ${profile.email}`}
                >
                  <span className="truncate">{profile.email}</span>
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--periwinkle) 16%, transparent)',
                      color: 'var(--periwinkle)',
                    }}
                  >
                    {copiedEmail ? (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </span>
                  {copiedEmail && (
                    <span className="sr-only" role="status">
                      Email copied to clipboard
                    </span>
                  )}
                </button>

                <RotatingStampBadge onRapidTapTrigger={onOpenAdminAccess} />
              </div>
            </div>
          </TiltBentoCard>
        </motion.div>

        {/* ============================================================
            RIGHT ASYMMETRICAL BENTO AREA (7 columns)
            ============================================================ */}
        <div className="lg:col-span-7 flex flex-col gap-4 xl:gap-5">
          {/* Top Display Headline Row */}
          <motion.div
            style={prefersReducedMotion ? undefined : { y: rightTopY }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: EDITORIAL_EASE }}
            className="flex items-start justify-between gap-4 px-1 pt-1"
          >
            <div className="flex items-start gap-2.5 sm:gap-4">
              <h2
                data-gsap="hero-clip"
                className="text-[3.25rem] sm:text-[4.5rem] xl:text-[5.25rem] font-extrabold tracking-[-0.045em] leading-[0.92] transition-colors duration-300"
                style={{ color: 'var(--ink)' }}
              >
                {hero.displayTitle}
              </h2>
              <span
                className="mt-1.5 sm:mt-2.5 transition-colors duration-300"
                style={{ color: 'var(--ink)' }}
                aria-hidden="true"
              >
                <CornerBracket size={24} strokeWidth={2.6} />
              </span>
            </div>

            <div
              className="hidden sm:flex flex-col items-end text-right pt-2 text-xs leading-relaxed transition-colors duration-300"
              style={{ color: 'var(--ink-secondary)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                {hero.worksLabel}
              </span>
              <span>{hero.worksSublabel}</span>
            </div>
          </motion.div>

          {/* Middle Row: Featured Showreel + Right Stacked Category Tiles */}
          <motion.div
            style={prefersReducedMotion ? undefined : { y: rightTopY }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: EDITORIAL_EASE }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-4 xl:gap-5 flex-1"
          >
            {/* Center Featured Showreel Card (7 cols) */}
            <TiltBentoCard maxTilt={4} className="sm:col-span-7 flex">
              <button
                type="button"
                onClick={onOpenShowreel}
                data-cursor="media"
                data-cursor-label="Play"
                data-cursor-tone="obsidian"
                className="group relative w-full min-h-[270px] sm:min-h-[300px] rounded-[26px] overflow-hidden text-left cursor-pointer border border-transparent dark:border-white/[0.1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)] shadow-[0_8px_24px_rgba(17,17,17,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
                style={{ backgroundColor: 'var(--obsidian)' }}
                aria-label="Play Creative Showreel Video"
              >
                <ResilientImage
                  src={showreel.thumbnailUrl}
                  alt={`${profile.name} Showreel cover preview`}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  fallbackTitle={showreel.title}
                  fallbackAccent={theme.primaryAccent}
                  priority
                />

                {/* Measured gradient scrim for crisp legibility */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10 transition-opacity duration-300 group-hover:opacity-90"
                />

                {/* Top-right subtle bracket */}
                <div className="absolute top-4 right-4 text-white/90">
                  <CornerBracket size={16} strokeWidth={2.2} />
                </div>

                {/* Central Translucent Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full bg-black/45 border border-white/45 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.32)] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:bg-black/60">
                    <Play className="w-7 h-7 fill-white translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>

                {/* Bottom Clean Editorial Label */}
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-2 text-white">
                  <div>
                    <p className="text-sm font-bold tracking-tight leading-snug">
                      {hero.showreelLabel}
                    </p>
                    <p className="text-xs text-white/80">
                      UGC &amp; Art Direction · {formatDuration(showreel.durationSeconds)}
                    </p>
                  </div>
                </div>
              </button>
            </TiltBentoCard>

            {/* Right Stacked Project Category Tiles (5 cols) */}
            <div className="sm:col-span-5 flex flex-col gap-4 xl:gap-5">
              {/* Top Secondary Accent Tile: UGC Videos */}
              <TiltBentoCard maxTilt={5} className="flex-1 flex">
                <button
                  type="button"
                  onClick={() => onNavigate('ugc-reels')}
                  data-cursor="tile"
                  data-cursor-tone="mint"
                  className="group relative w-full min-h-[138px] rounded-[24px] text-[#111111] p-5 sm:p-6 flex flex-col justify-between text-left transition-opacity hover:opacity-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
                  style={{ backgroundColor: 'var(--mint)' }}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-[11px] font-semibold text-[#111111]/70">
                      {hero.ugcTileEyebrow}
                    </span>
                    <CornerBracket className="text-[#111111]" size={16} strokeWidth={2.2} />
                  </div>
                  <div className="pt-4">
                    <h3 className="text-xl sm:text-[22px] font-extrabold tracking-[-0.025em] leading-tight">
                      {hero.ugcTileTitle}
                    </h3>
                    <p className="text-xs sm:text-[13px] font-medium text-[#111111]/75 mt-1">
                      {hero.ugcTileSubtitle}
                    </p>
                  </div>
                </button>
              </TiltBentoCard>

              {/* Middle Primary Accent Tile: Brand & Print */}
              <TiltBentoCard maxTilt={5} className="flex-1 flex">
                <button
                  type="button"
                  onClick={() => onNavigateDesignCategory('All Projects')}
                  data-cursor="tile"
                  data-cursor-tone="periwinkle"
                  className="group relative w-full min-h-[138px] rounded-[24px] text-white p-5 sm:p-6 flex flex-col justify-between text-left transition-opacity hover:opacity-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
                  style={{ backgroundColor: 'var(--periwinkle)' }}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-[11px] font-semibold text-white/80">
                      {hero.brandTileEyebrow}
                    </span>
                    <CornerBracket className="text-white" size={16} strokeWidth={2.2} />
                  </div>
                  <div className="pt-4">
                    <h3 className="text-xl sm:text-[22px] font-extrabold tracking-[-0.025em] leading-tight">
                      {hero.brandTileTitle}
                    </h3>
                    <p className="text-xs sm:text-[13px] font-medium text-white/85 mt-1">
                      {hero.brandTileSubtitle}
                    </p>
                  </div>
                </button>
              </TiltBentoCard>
            </div>
          </motion.div>

          {/* Bottom Row: Charcoal Clients Tile + Split Obsidian/Apricot AI & Editorial Tile */}
          <motion.div
            style={prefersReducedMotion ? undefined : { y: rightBottomY }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: EDITORIAL_EASE }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-4 xl:gap-5"
          >
            {/* Left Dark Charcoal Card: Clients */}
            <TiltBentoCard maxTilt={5} className="sm:col-span-4 flex">
              <button
                type="button"
                onClick={() => onNavigate('clients')}
                aria-label="Jump to Capabilities"
                data-cursor="tile"
                data-cursor-tone="charcoal"
                className="group relative w-full min-h-[146px] rounded-[24px] text-white p-5 sm:p-6 flex flex-col justify-between text-left border border-transparent dark:border-white/[0.1] transition-all duration-300 hover:opacity-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)]"
                style={{ backgroundColor: 'var(--charcoal)' }}
              >
                <div className="flex items-start justify-between w-full">
                  <span className="w-9 h-9 rounded-xl bg-white/12 flex items-center justify-center text-white">
                    <Users className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <CornerBracket className="text-white/90" size={16} strokeWidth={2.2} />
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-extrabold tracking-[-0.02em] leading-tight">
                    {hero.clientsTileTitle}
                  </h3>
                  <p className="text-xs text-white/75 mt-1">{hero.clientsTileSubtitle}</p>
                </div>
              </button>
            </TiltBentoCard>

            {/* Right Split Card: Obsidian Iridescent Sphere + Highlight Accent AI & Editorial */}
            <TiltBentoCard maxTilt={4.5} className="sm:col-span-8 flex">
              <button
                type="button"
                onClick={() => onNavigateDesignCategory('AI Visuals & Portraits')}
                data-cursor="tile"
                data-cursor-tone="apricot"
                className="group relative w-full min-h-[146px] rounded-[24px] overflow-hidden grid grid-cols-12 text-left cursor-pointer border border-transparent dark:border-white/[0.1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)] shadow-[0_6px_18px_rgba(17,17,17,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.4)]"
              >
                {/* Left Obsidian Half with Animated 3D Iridescent Sphere */}
                <div
                  className="col-span-5 min-h-[146px]"
                  style={{ backgroundColor: 'var(--obsidian)' }}
                >
                  <IridescentSphere />
                </div>

                {/* Right Highlight Accent Half */}
                <div
                  className="col-span-7 transition-opacity group-hover:opacity-95 text-[#111111] p-5 sm:p-6 flex flex-col justify-between"
                  style={{ backgroundColor: 'var(--apricot)' }}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-[11px] font-semibold text-[#111111]/70">
                      {hero.aiTileEyebrow}
                    </span>
                    <CornerBracket className="text-[#111111]" size={16} strokeWidth={2.2} />
                  </div>
                  <div className="pt-4">
                    <h3 className="text-xl sm:text-[22px] font-extrabold tracking-[-0.025em] leading-tight">
                      {hero.aiTileTitle}
                    </h3>
                    <p className="text-xs sm:text-[13px] font-medium text-[#111111]/75 mt-1">
                      {hero.aiTileSubtitle}
                    </p>
                  </div>
                </div>
              </button>
            </TiltBentoCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

