import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, Moon, ShieldCheck, Sun, X } from 'lucide-react';
import type { NavSectionId } from '../types/portfolio';
import type { ThemeMode } from '../utils/themeMode';
import { EDITORIAL_EASE, SNAPPY_SPRING } from '../utils/motionConfig';

interface VerticalNavRailProps {
  activeSection: NavSectionId;
  sectionProgress: number;
  onNavigate: (sectionId: NavSectionId) => void;
  brandName: string;
  isAdmin: boolean;
  activeView: 'portfolio' | 'admin';
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onOpenAdmin: () => void;
}

const NAV_ITEMS: { id: NavSectionId; label: string; isBrandTop?: boolean }[] = [
  { id: 'about', label: 'About Me', isBrandTop: true },
  { id: 'contact', label: 'Contact' },
  { id: 'design-work', label: 'Design Work' },
  { id: 'ugc-reels', label: 'UGC Reels' },
  { id: 'clients', label: 'Clients' },
];

const NAV_SECTION_LABELS: Record<NavSectionId, string> = {
  about: 'About Me',
  'ugc-reels': 'UGC Reels',
  'design-work': 'Design Work',
  clients: 'Clients',
  contact: 'Contact',
};

const RING_SIZE = 36;
const RING_STROKE = 2;
const RING_RADIUS = (RING_SIZE - RING_STROKE * 2) / 2 - 1;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function SectionReadingProgressRing({
  activeSection,
  progress,
}: {
  activeSection: NavSectionId;
  progress: number;
}) {
  const clamped = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const percent = Math.round(clamped * 100);
  const dashOffset = RING_CIRCUMFERENCE * (1 - clamped);
  const sectionLabel = NAV_SECTION_LABELS[activeSection] ?? 'Portfolio';

  return (
    <div
      role="progressbar"
      aria-label="Current section reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${sectionLabel}: ${percent}%`}
      data-testid="section-reading-progress"
      data-section={activeSection}
      data-progress={percent}
      title={`${sectionLabel} · ${percent}% read`}
      className="relative flex items-center justify-center w-9 h-9 select-none"
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="block overflow-visible"
        aria-hidden="true"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={1.5}
          opacity={0.75}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="var(--periwinkle)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          className="transition-[stroke-dashoffset] duration-150 ease-out motion-reduce:transition-none"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mono text-[8.5px] font-medium tabular-nums tracking-tight leading-none"
        style={{ color: 'var(--ink-muted)' }}
      >
        {percent}%
      </span>
    </div>
  );
}

function ThemeToggleButton({
  themeMode,
  onToggle,
  testId,
  compact = false,
}: {
  themeMode: ThemeMode;
  onToggle: () => void;
  testId: string;
  compact?: boolean;
}) {
  const isDark = themeMode === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid={testId}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center justify-center rounded-full border theme-surface cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)] ${
        compact ? 'w-9 h-9' : 'w-9 h-9'
      }`}
      style={{
        backgroundColor: 'var(--surface-card)',
        borderColor: 'var(--border-strong)',
        color: 'var(--ink)',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: -65, scale: 0.65 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 65, scale: 0.65 }}
            transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
            className="inline-flex items-center justify-center"
            style={{ color: 'var(--apricot)' }}
          >
            <Sun className="w-4 h-4" aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: 65, scale: 0.65 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -65, scale: 0.65 }}
            transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
            className="inline-flex items-center justify-center"
          >
            <Moon className="w-4 h-4" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function VerticalNavRail({
  activeSection,
  sectionProgress,
  onNavigate,
  brandName,
  isAdmin,
  activeView,
  themeMode,
  onToggleTheme,
  onOpenAdmin,
}: VerticalNavRailProps) {
  return (
    <>
      {/* Desktop Sticky Left Vertical Rail */}
      <aside
        aria-label="Primary portfolio navigation"
        className="hidden lg:flex flex-col items-center justify-between w-[62px] shrink-0 sticky top-6 self-start min-h-[calc(100vh-4rem)] py-6 border-r theme-surface"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {/* Top About Me anchor with four-point star */}
        <button
          type="button"
          data-nav-anchor="about"
          onClick={() => onNavigate('about')}
          title="About Me (Use ↑ / ↓ arrow keys to jump between sections)"
          className={`group flex flex-col items-center gap-3 py-2 px-2 rounded-xl transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)] ${
            activeView === 'portfolio' && activeSection === 'about'
              ? 'text-[var(--ink)] font-bold'
              : 'text-[var(--ink-secondary)] hover:text-[var(--ink)] font-medium'
          }`}
          aria-current={activeView === 'portfolio' && activeSection === 'about' ? 'page' : undefined}
        >
          <span
            className="text-base leading-none transition-transform duration-300 ease-out group-hover:rotate-45"
            style={{
              color:
                activeView === 'portfolio' && activeSection === 'about'
                  ? 'var(--periwinkle)'
                  : 'var(--ink)',
            }}
            aria-hidden="true"
          >
            ✦
          </span>
          <span className="vertical-nav-text text-[13px] tracking-[0.02em] whitespace-nowrap">
            About Me
          </span>
        </button>

        {/* Vertical Section Links */}
        <nav aria-label="Section links" className="flex flex-col items-center gap-7 my-auto py-6">
          {NAV_ITEMS.filter((item) => !item.isBrandTop).map((item) => {
            const isActive = activeView === 'portfolio' && activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-nav-anchor={item.id}
                onClick={() => onNavigate(item.id)}
                title={`${item.label} (Use ↑ / ↓ arrow keys to navigate)`}
                className={`relative flex items-center justify-center py-2 px-2 rounded-lg transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)] ${
                  isActive
                    ? 'text-[var(--ink)] font-bold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium'
                }`}
                aria-current={isActive ? 'location' : undefined}
              >
                <span className="vertical-nav-text text-[13px] tracking-[0.02em] whitespace-nowrap">
                  {item.label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="desktop-nav-indicator"
                    transition={SNAPPY_SPRING}
                    aria-hidden="true"
                    className="absolute -right-[13px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                    style={{ backgroundColor: 'var(--periwinkle)' }}
                  />
                )}
              </button>
            );
          })}

          {/* Admin Menu Link — Rendered ONLY when verified primary admin is authenticated */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              data-testid="desktop-admin-nav-btn"
              className={`relative flex flex-col items-center justify-center gap-2 py-2.5 px-2 rounded-xl transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)] ${
                activeView === 'admin'
                  ? 'text-white font-bold'
                  : 'text-[var(--ink)] bg-[var(--surface-elevated)] hover:opacity-85 font-bold'
              }`}
              style={
                activeView === 'admin' ? { backgroundColor: 'var(--periwinkle)' } : undefined
              }
              aria-current={activeView === 'admin' ? 'page' : undefined}
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="vertical-nav-text text-[12px] tracking-[0.02em] whitespace-nowrap">
                Admin
              </span>
            </button>
          )}
        </nav>

        {/* Bottom Utility Stack: Light/Dark Theme Toggle, Year Marker, and Section Reading Progress Ring */}
        <div className="flex flex-col items-center gap-3.5">
          <ThemeToggleButton
            themeMode={themeMode}
            onToggle={onToggleTheme}
            testId="theme-toggle-desktop"
          />
          <span
            className="vertical-nav-text font-mono text-[11px] tabular-nums select-none"
            style={{ color: 'var(--ink-muted)' }}
          >
            2026
          </span>
          {activeView === 'portfolio' && (
            <SectionReadingProgressRing
              activeSection={activeSection}
              progress={sectionProgress}
            />
          )}
        </div>
      </aside>

      {/* Mobile Compact Sticky Top Navigation (<= 52px height, under 15% mobile viewport cap) */}
      <MobileCompactHeader
        activeSection={activeSection}
        sectionProgress={sectionProgress}
        onNavigate={onNavigate}
        brandName={brandName}
        isAdmin={isAdmin}
        activeView={activeView}
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
        onOpenAdmin={onOpenAdmin}
      />
    </>
  );
}

function MobileCompactHeader({
  activeSection,
  onNavigate,
  brandName,
  isAdmin,
  activeView,
  themeMode,
  onToggleTheme,
  onOpenAdmin,
}: VerticalNavRailProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = (sectionId: NavSectionId) => {
    setMenuOpen(false);
    onNavigate(sectionId);
  };

  const handleSelectAdmin = () => {
    setMenuOpen(false);
    onOpenAdmin();
  };

  return (
    <header
      className="lg:hidden sticky top-0 z-40 border-b rounded-t-[24px] theme-surface"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--workspace-bg) 96%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="px-4 h-[52px] flex items-center justify-between gap-3">
        <button
          type="button"
          data-nav-anchor-mobile="about"
          onClick={() => handleSelect('about')}
          className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-[var(--ink)] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)] rounded-lg"
        >
          <span style={{ color: 'var(--periwinkle)' }} aria-hidden="true">
            ✦
          </span>
          <span>{brandName}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Tablet inline navigation (sm to lg) */}
          <nav
            aria-label="Tablet section navigation"
            className="hidden sm:flex items-center gap-1.5"
          >
            {NAV_ITEMS.filter((item) => !item.isBrandTop).map((item) => {
              const isActive = activeView === 'portfolio' && activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-nav-anchor-mobile={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--periwinkle)] ${
                    isActive
                      ? 'bg-[var(--ink)] text-[var(--workspace-bg)]'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                  }`}
                  aria-current={isActive ? 'location' : undefined}
                >
                  {item.label}
                </button>
              );
            })}

            {isAdmin && (
              <button
                type="button"
                onClick={handleSelectAdmin}
                data-testid="tablet-admin-nav-btn"
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer ${
                  activeView === 'admin'
                    ? 'text-white'
                    : 'bg-[var(--surface-elevated)] text-[var(--ink)] hover:opacity-85'
                }`}
                style={
                  activeView === 'admin' ? { backgroundColor: 'var(--periwinkle)' } : undefined
                }
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Compact Light / Dark Mode Toggle for Mobile & Tablet */}
          <ThemeToggleButton
            themeMode={themeMode}
            onToggle={onToggleTheme}
            testId="theme-toggle-mobile"
            compact
          />

          {/* Mobile Menu Toggle (< sm) — prevents mid-word nav clipping on 390px screens */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer theme-surface"
            style={{
              backgroundColor: 'var(--surface-card)',
              borderColor: 'var(--border-strong)',
              color: 'var(--ink)',
            }}
          >
            {menuOpen ? (
              <>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Close</span>
              </>
            ) : (
              <>
                <Menu className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Menu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Smooth Expandable Mobile Navigation Sheet */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.nav
            aria-label="Mobile section navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: EDITORIAL_EASE }}
            className="sm:hidden overflow-hidden border-t theme-surface"
            style={{
              backgroundColor: 'var(--workspace-bg)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = activeView === 'portfolio' && activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors duration-200 cursor-pointer border ${
                      isActive
                        ? 'text-white border-transparent'
                        : 'text-[var(--ink)]'
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: 'var(--periwinkle)' }
                        : {
                            backgroundColor: 'var(--surface-card)',
                            borderColor: 'var(--border-subtle)',
                          }
                    }
                    aria-current={isActive ? 'location' : undefined}
                  >
                    {item.label}
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleSelectAdmin}
                  data-testid="mobile-admin-nav-btn"
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--obsidian)' }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Admin Control Panel</span>
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
