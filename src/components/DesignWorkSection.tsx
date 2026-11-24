import React, { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { MoveHorizontal } from 'lucide-react';
import { DESIGN_CATEGORIES } from '../data/portfolioData';
import type {
  DesignCategory,
  DesignProject,
  RetouchingConfig,
  SectionCopyConfig,
} from '../types/portfolio';
import {
  clampComparisonPercent,
  filterDesignProjects,
  stepComparisonPercent,
} from '../utils/portfolioLogic';
import {
  EDITORIAL_EASE,
  REVEAL_VIEWPORT,
  SCROLL_PARALLAX_SPRING,
  SMOOTH_SPRING,
  SNAPPY_SPRING,
} from '../utils/motionConfig';
import { CornerBracket, ResilientImage, TiltBentoCard } from './BentoPrimitives';

interface DesignWorkSectionProps {
  projects: DesignProject[];
  sectionCopy: SectionCopyConfig;
  retouching: RetouchingConfig;
  activeCategory: DesignCategory;
  onSelectCategory: (category: DesignCategory) => void;
  onSelectProject: (project: DesignProject) => void;
}

/**
 * Interactive Before / After Photo Retouching & Color-Grading Comparison Card.
 */
function BeforeAfterSliderCard({ retouching }: { retouching: RetouchingConfig }) {
  const [splitPercent, setSplitPercent] = useState(52);
  const [isDragging, setIsDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = (clientX: number) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const rawPercent = ((clientX - rect.left) / rect.width) * 100;
    setSplitPercent(clampComparisonPercent(rawPercent));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromClientX(event.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setSplitPercent((prev) => stepComparisonPercent(prev, -5));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setSplitPercent((prev) => stepComparisonPercent(prev, 5));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 0.6, ease: EDITORIAL_EASE }}
      className="rounded-[26px] border overflow-hidden shadow-[0_8px_24px_rgba(17,17,17,0.04)] dark:shadow-[0_12px_34px_rgba(0,0,0,0.4)] theme-surface"
      style={{
        backgroundColor: 'var(--surface-card)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Interactive Comparison Viewport (7 cols) */}
        <div
          ref={frameRef}
          role="slider"
          tabIndex={0}
          aria-label="Before and after retouching comparison slider"
          aria-valuemin={5}
          aria-valuemax={95}
          aria-valuenow={splitPercent}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
          data-cursor="drag"
          data-cursor-label="Drag"
          data-cursor-tone="apricot"
          className="lg:col-span-7 relative aspect-[4/3] lg:aspect-auto lg:min-h-[370px] overflow-hidden cursor-ew-resize select-none touch-none focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--periwinkle)]"
          style={{ backgroundColor: 'var(--obsidian)' }}
        >
          {/* AFTER Layer (Full Retouched & Color Graded) */}
          <ResilientImage
            src={retouching.imageUrl}
            alt="Retouched and color-graded editorial portrait (After)"
            className="absolute inset-0 w-full h-full object-cover"
            fallbackTitle="Retouched Portrait (After)"
            fallbackAccent="#FFC966"
          />

          {/* BEFORE Layer (Clipped to left side — flat raw camera exposure before grade/retouch) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
          >
            <ResilientImage
              src={retouching.imageUrl}
              alt="Unretouched flat RAW portrait (Before)"
              className="w-full h-full object-cover"
              style={{
                filter: 'saturate(0.48) contrast(0.84) brightness(0.92) hue-rotate(-8deg)',
              }}
              fallbackTitle="RAW Portrait (Before)"
              fallbackAccent="#4A4A4E"
            />
          </div>

          {/* Crisp Before / After Scrim Labels */}
          <div
            aria-hidden="true"
            className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/55 backdrop-blur-sm text-[11px] font-semibold text-white tracking-wide"
          >
            Before · Raw Flat
          </div>
          <div
            aria-hidden="true"
            className="absolute top-4 right-4 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#111111] tracking-wide"
            style={{ backgroundColor: 'var(--apricot)' }}
          >
            After · Retouched
          </div>

          {/* Vertical Split Divider & Tactile Handle */}
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_16px_rgba(0,0,0,0.65)] pointer-events-none"
            style={{ left: `${splitPercent}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-[#111111] shadow-[0_6px_20px_rgba(0,0,0,0.35)] flex items-center justify-center">
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Editorial Breakdown Side Panel (5 cols) */}
        <div
          data-cursor="bento"
          data-cursor-tone="neutral"
          className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6 theme-surface"
          style={{ backgroundColor: 'var(--surface-card)' }}
        >
          <div className="space-y-3">
            <div
              className="flex items-center justify-between text-xs"
              style={{ color: 'var(--ink-muted)' }}
            >
              <span>Interactive Retouching Study</span>
              <span
                className="font-mono tabular-nums font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                {splitPercent}% / {100 - splitPercent}%
              </span>
            </div>
            <h3
              className="text-2xl font-extrabold tracking-[-0.03em] leading-tight"
              style={{ color: 'var(--ink)' }}
            >
              {retouching.title}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--ink-secondary)' }}
            >
              {retouching.subtitle}
            </p>
          </div>

          <div
            className="space-y-4 pt-4 border-t"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
              style={{ color: 'var(--ink-secondary)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                Workflow:
              </span>
              <span>{retouching.workflowSummary}</span>
            </div>
            <div
              className="flex items-center justify-between text-xs"
              style={{ color: 'var(--ink-secondary)' }}
            >
              <span>Tools: {retouching.toolsSummary}</span>
              <button
                type="button"
                onClick={() => setSplitPercent(50)}
                className="font-semibold hover:text-[var(--ink)] transition-colors duration-200 cursor-pointer"
                style={{ color: 'var(--periwinkle)' }}
              >
                Reset 50/50
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DesignWorkSection({
  projects,
  sectionCopy,
  retouching,
  activeCategory,
  onSelectCategory,
  onSelectProject,
}: DesignWorkSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const filteredProjects = filterDesignProjects(projects, activeCategory);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const smoothScrollProgress = useSpring(scrollYProgress, SCROLL_PARALLAX_SPRING);

  // Silky vertical parallax difference between left and right masonry columns
  const columnOddY = useTransform(smoothScrollProgress, [0, 1], [16, -18]);
  const columnEvenY = useTransform(smoothScrollProgress, [0, 1], [-12, 18]);

  const leftColumn = filteredProjects.filter((_, idx) => idx % 2 === 0);
  const rightColumn = filteredProjects.filter((_, idx) => idx % 2 === 1);

  const renderProjectCard = (project: DesignProject, idx: number) => (
    <motion.div
      key={project.id}
      layout="position"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{
        layout: SMOOTH_SPRING,
        opacity: { duration: 0.55, delay: Math.min(idx * 0.05, 0.2), ease: EDITORIAL_EASE },
        y: { duration: 0.55, delay: Math.min(idx * 0.05, 0.2), ease: EDITORIAL_EASE },
      }}
    >
      <TiltBentoCard maxTilt={3.5}>
        <button
          type="button"
          onClick={() => onSelectProject(project)}
          data-cursor="action"
          data-cursor-label="Inspect"
          data-cursor-tone="neutral"
          aria-label={`Inspect ${project.title} in lightbox`}
          className="group block w-full text-left rounded-[24px] border overflow-hidden shadow-[0_8px_24px_rgba(17,17,17,0.04)] hover:shadow-[0_14px_34px_rgba(17,17,17,0.1)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.55)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)] theme-surface"
          style={{
            backgroundColor: 'var(--surface-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className={`relative w-full ${project.aspectClass} overflow-hidden`}
            style={{ backgroundColor: 'var(--surface-elevated)' }}
          >
            <ResilientImage
              src={project.imageUrl}
              alt={`${project.title} — ${project.subtitle}`}
              className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              fallbackTitle={project.title}
              fallbackAccent={project.palette[0]?.hex || '#8A85E8'}
            />
            <div
              aria-hidden="true"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/85 dark:bg-[#121214]/85 backdrop-blur-sm text-[#111111] dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
            >
              <CornerBracket size={14} strokeWidth={2.2} />
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {/* Unboxed clean inline metadata */}
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--ink-muted)' }}
            >
              <span>{project.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{project.year}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{project.client}</span>
            </div>

            <div className="flex items-start justify-between gap-3 mt-1.5">
              <div>
                <h3
                  className="text-lg sm:text-xl font-bold tracking-[-0.02em] leading-snug"
                  style={{ color: 'var(--ink)' }}
                >
                  {project.title}
                </h3>
                <p
                  className="text-sm mt-1 leading-relaxed"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {project.subtitle}
                </p>
              </div>
              <CornerBracket
                className="text-[var(--ink)]/55 group-hover:text-[var(--ink)] mt-1"
                size={16}
              />
            </div>
          </div>
        </button>
      </TiltBentoCard>
    </motion.div>
  );

  return (
    <section
      id="design-work"
      ref={sectionRef}
      aria-labelledby="design-work-heading"
      className="py-12 sm:py-16 border-t theme-surface"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Header + Interactive Category Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
        <div className="space-y-2 max-w-xl">
          <p className="text-xs font-semibold tracking-[0.02em]" style={{ color: 'var(--periwinkle)' }}>
            {sectionCopy.designEyebrow}
          </p>
          <h2
            id="design-work-heading"
            className="text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] [text-wrap:balance]"
            style={{ color: 'var(--ink)' }}
          >
            {sectionCopy.designHeading}
          </h2>
          <p
            className="text-sm sm:text-[15px] leading-relaxed"
            style={{ color: 'var(--ink-secondary)' }}
          >
            {sectionCopy.designDescription}
          </p>
        </div>

        {/* Interactive Filter Controls with smooth sliding layoutId pill */}
        <div
          role="tablist"
          aria-label="Filter design work by category"
          className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl self-start lg:self-end theme-surface"
          style={{ backgroundColor: 'var(--surface-elevated)' }}
        >
          {DESIGN_CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectCategory(category)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--periwinkle)] ${
                  isActive
                    ? 'text-[var(--workspace-bg)]'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="design-category-pill"
                    transition={SNAPPY_SPRING}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-xl shadow-sm"
                    style={{ backgroundColor: 'var(--ink)' }}
                  />
                )}
                <span className="relative z-10">{category}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Result Count Line */}
      <div
        className="mb-6 flex items-center justify-between text-xs"
        style={{ color: 'var(--ink-muted)' }}
      >
        <span data-testid="design-work-count" className="font-mono tabular-nums">
          Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} · {activeCategory}
        </span>
      </div>

      {/* 2-Column Offset Parallax Masonry Grid */}
      {filteredProjects.length === 0 ? (
        <div
          className="rounded-[24px] border p-12 text-center theme-surface"
          style={{
            backgroundColor: 'var(--surface-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
            No artworks match this filter yet.
          </p>
          <button
            type="button"
            onClick={() => onSelectCategory('All Projects')}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--ink)',
              color: 'var(--workspace-bg)',
            }}
          >
            Show All Projects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-start">
          <motion.div
            style={prefersReducedMotion ? undefined : { y: columnOddY }}
            className="flex flex-col gap-5 lg:gap-6"
          >
            {leftColumn.map((project, idx) => renderProjectCard(project, idx))}
          </motion.div>

          <motion.div
            style={prefersReducedMotion ? undefined : { y: columnEvenY }}
            className="flex flex-col gap-5 lg:gap-6 md:pt-8"
          >
            {rightColumn.map((project, idx) => renderProjectCard(project, idx + 1))}
          </motion.div>
        </div>
      )}

      {/* Featured Interactive Before / After Retouching & Color Grading Card */}
      <div className="mt-10 sm:mt-14">
        <BeforeAfterSliderCard retouching={retouching} />
      </div>
    </section>
  );
}

