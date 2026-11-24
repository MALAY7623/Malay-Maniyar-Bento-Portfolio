import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Send, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { DesignProject } from '../types/portfolio';
import { EDITORIAL_EASE, SMOOTH_SPRING } from '../utils/motionConfig';
import { ResilientImage } from './BentoPrimitives';

interface ArtworkLightboxModalProps {
  project: DesignProject | null;
  onClose: () => void;
  onStartProject: () => void;
}

export function ArtworkLightboxModal({
  project,
  onClose,
  onStartProject,
}: ArtworkLightboxModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ x: 50, y: 50 });
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  useEffect(() => {
    if (!project) return;
    setIsZoomed(false);
    setPanOrigin({ x: 50, y: 50 });
    setCopiedHex(null);
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    setPanOrigin({ x, y });
  };

  const handleCopySwatch = (hex: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(hex).catch(() => {});
    }
    setCopiedHex(hex);
    window.setTimeout(() => {
      setCopiedHex((prev) => (prev === hex ? null : prev));
    }, 1600);
  };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="artwork-lightbox-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/82 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={SMOOTH_SPRING}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl rounded-[28px] bg-[var(--workspace-bg)] text-[var(--ink)] border border-[var(--border-subtle)] overflow-hidden shadow-2xl my-auto theme-surface"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <span>{project.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{project.client}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{project.year}</span>
                </div>
                <h2
                  id="artwork-lightbox-title"
                  className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--ink)] truncate mt-0.5"
                >
                  {project.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsZoomed((prev) => !prev)}
                  aria-label={isZoomed ? 'Zoom out artwork' : 'Zoom in artwork'}
                  aria-pressed={isZoomed}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-elevated)] hover:opacity-85 text-xs font-semibold text-[var(--ink)] border border-[var(--border-subtle)] transition-all cursor-pointer"
                >
                  {isZoomed ? (
                    <>
                      <ZoomOut className="w-4 h-4" aria-hidden="true" />
                      <span>1× Fit</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-4 h-4" aria-hidden="true" />
                      <span>Zoom 1.75×</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close artwork lightbox"
                  className="w-10 h-10 rounded-full bg-[var(--ink)] hover:opacity-85 text-[var(--workspace-bg)] flex items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)]"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Body Split: High-Res Zoomable Artwork + Palette, Tools & Rationale */}
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Artwork Canvas */}
              <div
                onMouseMove={handleMouseMove}
                onClick={() => setIsZoomed((prev) => !prev)}
                className={`lg:col-span-7 bg-[#0E0E11] relative min-h-[320px] sm:min-h-[460px] flex items-center justify-center overflow-hidden ${
                  isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
              >
                <div
                  className="w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                  style={{
                    transform: isZoomed ? 'scale(1.75)' : 'scale(1)',
                    transformOrigin: `${panOrigin.x}% ${panOrigin.y}%`,
                  }}
                >
                  <ResilientImage
                    src={project.imageUrl}
                    alt={`${project.title} high-resolution view`}
                    className="w-full h-full max-h-[68vh] object-contain"
                    fallbackTitle={project.title}
                    fallbackAccent={project.palette[0]?.hex || '#8A85E8'}
                  />
                </div>
              </div>

              {/* Editorial Specs Panel */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6 bg-[var(--surface-card)]">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--periwinkle)] mb-2">Design Rationale</h3>
                    <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">{project.rationale}</p>
                  </div>

                  {/* Click-to-Copy Color Palette Swatches */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-xs font-semibold text-[var(--ink)]">Color Palette</h3>
                      <span className="text-[11px] text-[var(--ink-muted)]">Click swatch to copy hex</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {project.palette.map((swatch) => {
                        const isCopied = copiedHex === swatch.hex;
                        return (
                          <button
                            key={swatch.hex}
                            type="button"
                            onClick={() => handleCopySwatch(swatch.hex)}
                            className="flex items-center gap-2.5 p-2 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--surface-subtle)] text-left transition-colors cursor-pointer"
                            aria-label={`Copy color ${swatch.name} ${swatch.hex}`}
                          >
                            <span
                              className="w-8 h-8 rounded-lg shrink-0 border border-black/15 dark:border-white/15"
                              style={{ backgroundColor: swatch.hex }}
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[var(--ink)] truncate">
                                {swatch.name}
                              </p>
                              <p className="font-mono text-[11px] text-[var(--ink-muted)] flex items-center gap-1">
                                {isCopied ? (
                                  <>
                                    <Check className="w-3 h-3 text-[var(--periwinkle)]" aria-hidden="true" />
                                    <span className="text-[var(--periwinkle)] font-semibold">Copied</span>
                                  </>
                                ) : (
                                  swatch.hex
                                )}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tools & Deliverables (Clean Unboxed Inline Metadata) */}
                  <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--ink-muted)]">
                    <div>
                      <span className="font-semibold text-[var(--ink)]">Tools Used: </span>
                      <span>{project.tools.join(' · ')}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[var(--ink)]">Deliverables: </span>
                      <span>{project.deliverables}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartProject();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--periwinkle)] hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Request Similar Design</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-[var(--surface-elevated)] hover:opacity-85 text-[var(--ink)] border border-[var(--border-subtle)] text-xs font-semibold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
