import React, { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowLeft, ArrowRight, Play, Volume2, VolumeX } from 'lucide-react';
import type { SectionCopyConfig, UgcReel } from '../types/portfolio';
import { formatDuration } from '../utils/portfolioLogic';
import {
  EDITORIAL_EASE,
  REVEAL_VIEWPORT,
  SCROLL_PARALLAX_SPRING,
  SMOOTH_SPRING,
} from '../utils/motionConfig';
import { CornerBracket, ResilientImage } from './BentoPrimitives';

interface UgcReelsSectionProps {
  reels: UgcReel[];
  sectionCopy: SectionCopyConfig;
  onSelectReel: (reel: UgcReel) => void;
}

interface UgcReelCardProps {
  reel: UgcReel;
  index: number;
  onSelect: (reel: UgcReel) => void;
}

function UgcReelCard({ reel, index, onSelect }: UgcReelCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const toggleMute = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.muted = next;
      }
      return next;
    });
  };

  return (
    <motion.article
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.24), ease: EDITORIAL_EASE }}
      className="group relative w-[268px] sm:w-[292px] lg:w-[304px] shrink-0 rounded-[26px] overflow-hidden border border-black/[0.06] dark:border-white/[0.1] shadow-[0_12px_28px_rgba(17,17,17,0.1)] dark:shadow-[0_14px_34px_rgba(0,0,0,0.45)] select-none"
      style={{ backgroundColor: 'var(--obsidian)' }}
    >
      {/* Primary clickable media area (9:16 vertical frame) */}
      <button
        type="button"
        onClick={() => onSelect(reel)}
        data-cursor="media"
        data-cursor-label="Watch"
        data-cursor-tone="obsidian"
        aria-label={`Open ${reel.title} (${reel.platform}, ${formatDuration(reel.durationSeconds)})`}
        className="relative block w-full aspect-[9/16] text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--periwinkle)] overflow-hidden"
      >
        {reel.videoUrl ? (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            poster={reel.thumbnailUrl}
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${isHovered ? 'animate-ugc-preview' : 'transition-transform duration-500'}`}>
            <ResilientImage
              src={reel.thumbnailUrl}
              alt={`${reel.title} vertical UGC video frame`}
              className="w-full h-full object-cover"
              fallbackTitle={reel.title}
              fallbackAccent={reel.accentColor}
            />
          </div>
        )}

        {/* Measured top & bottom legibility scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/5 to-black/85 pointer-events-none"
        />

        {/* Top clean metadata row (unboxed inline typography) */}
        <div className="absolute top-4 left-4 right-14 flex items-center gap-2 text-[11px] font-medium text-white/90 tracking-wide">
          <span>{reel.platform}</span>
          <span aria-hidden="true" className="text-white/45">
            ·
          </span>
          <span className="font-mono tabular-nums">{formatDuration(reel.durationSeconds)}</span>
        </div>

        {/* Center Play indicator */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-80 scale-95'
          }`}
        >
          <span className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/35 flex items-center justify-center text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
            <Play className="w-6 h-6 fill-white translate-x-0.5" />
          </span>
        </div>

        {/* Animated preview progress rail on hover */}
        <div
          aria-hidden="true"
          className="absolute bottom-[102px] left-4 right-4 h-[2px] bg-white/20 overflow-hidden rounded-full"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: reel.accentColor }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={isHovered ? { scaleX: [0, 1] } : { scaleX: 0 }}
            transition={
              isHovered
                ? { duration: Math.max(4, reel.durationSeconds * 0.28), repeat: Infinity, ease: 'linear' }
                : { duration: 0.2 }
            }
          />
        </div>

        {/* Bottom Caption & Hook Teaser */}
        <div className="absolute bottom-0 inset-x-0 p-5 text-white">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white/70 truncate">{reel.client}</p>
              <h3 className="text-base font-bold tracking-[-0.015em] leading-snug text-white mt-0.5 line-clamp-2">
                {reel.title}
              </h3>
            </div>
            <CornerBracket className="text-white/80 mt-1" size={14} strokeWidth={2.2} />
          </div>
          <p className="text-xs text-white/75 mt-2 line-clamp-1">
            {isHovered ? (isMuted ? 'Previewing · Sound muted' : 'Previewing · Sound on') : reel.hookLine}
          </p>
        </div>
      </button>

      {/* Sibling accessible Mute / Unmute preview button */}
      <button
        type="button"
        onClick={toggleMute}
        data-cursor="interactive"
        data-cursor-tone="obsidian"
        aria-label={isMuted ? `Unmute preview for ${reel.title}` : `Mute preview for ${reel.title}`}
        aria-pressed={!isMuted}
        className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Volume2 className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </motion.article>
  );
}

export function UgcReelsSection({ reels, sectionCopy, onSelectReel }: UgcReelsSectionProps) {
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const [desktopOffsetStep, setDesktopOffsetStep] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: stickyContainerRef,
    offset: ['start start', 'end end'],
  });

  const smoothScrollProgress = useSpring(scrollYProgress, SCROLL_PARALLAX_SPRING);

  // Silky scroll-linked horizontal slide across desktop viewport
  const scrollX = useTransform(smoothScrollProgress, [0, 1], ['0%', '-36%']);

  const handleManualScroll = (direction: 'prev' | 'next') => {
    if (mobileTrackRef.current) {
      const delta = direction === 'next' ? 320 : -320;
      mobileTrackRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
    setDesktopOffsetStep((prev) => {
      const maxSteps = Math.max(0, reels.length - 3);
      const next = direction === 'next' ? Math.min(maxSteps, prev + 1) : Math.max(0, prev - 1);
      return next;
    });
  };

  return (
    <section
      id="ugc-reels"
      tabIndex={-1}
      aria-labelledby="ugc-reels-heading"
      className="py-10 sm:py-14 outline-none theme-surface"
    >
      {/* Desktop Sticky Horizontal Scroll Wrapper */}
      <div ref={stickyContainerRef} className="lg:h-[185vh] relative">
        <div className="lg:sticky lg:top-8 lg:min-h-[82vh] flex flex-col justify-center">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-2 max-w-xl">
              <p className="text-xs font-semibold tracking-[0.02em]" style={{ color: 'var(--periwinkle)' }}>
                {sectionCopy.ugcEyebrow}
              </p>
              <h2
                id="ugc-reels-heading"
                className="text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] [text-wrap:balance]"
                style={{ color: 'var(--ink)' }}
              >
                {sectionCopy.ugcHeading}
              </h2>
              <p
                className="text-sm sm:text-[15px] leading-relaxed"
                style={{ color: 'var(--ink-secondary)' }}
              >
                {sectionCopy.ugcDescription}
              </p>
            </div>

            {/* Clean Track Navigation Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleManualScroll('prev')}
                aria-label="Scroll UGC reels left"
                className="w-10 h-10 rounded-full border theme-surface text-[var(--ink)] bg-[var(--surface-card)] border-[var(--border-strong)] hover:bg-[var(--ink)] hover:text-[var(--workspace-bg)] transition-colors duration-200 flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)]"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleManualScroll('next')}
                aria-label="Scroll UGC reels right"
                className="w-10 h-10 rounded-full border theme-surface text-[var(--ink)] bg-[var(--surface-card)] border-[var(--border-strong)] hover:bg-[var(--ink)] hover:text-[var(--workspace-bg)] transition-colors duration-200 flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)]"
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Desktop Scroll-Linked Horizontal Track */}
          <div className="hidden lg:block overflow-hidden -mx-2 px-2 py-2">
            <motion.div
              style={prefersReducedMotion ? undefined : { x: scrollX }}
              animate={{ translateX: -desktopOffsetStep * 180 }}
              transition={SMOOTH_SPRING}
              className="flex gap-5 will-change-transform"
              data-testid="ugc-desktop-track"
            >
              {reels.map((reel, index) => (
                <UgcReelCard key={reel.id} reel={reel} index={index} onSelect={onSelectReel} />
              ))}
            </motion.div>
          </div>

          {/* Mobile & Tablet Touch-Friendly Horizontal Track */}
          <div
            ref={mobileTrackRef}
            className="lg:hidden flex gap-4 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1 snap-x snap-mandatory"
          >
            {reels.map((reel, index) => (
              <div key={reel.id} className="snap-start">
                <UgcReelCard reel={reel} index={index} onSelect={onSelectReel} />
              </div>
            ))}
          </div>

          {/* Quiet Scroll Guidance Metadata */}
          <div
            className="mt-5 flex items-center justify-between text-xs"
            style={{ color: 'var(--ink-muted)' }}
          >
            <span>
              {reels.length} Selected Vertical {reels.length === 1 ? 'Cut' : 'Cuts'} · 9:16 Aspect Ratio
            </span>
            <span className="hidden lg:inline">Keep scrolling to glide through reels</span>
          </div>
        </div>
      </div>
    </section>
  );
}

