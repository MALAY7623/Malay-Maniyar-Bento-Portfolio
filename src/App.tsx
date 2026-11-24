/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AnimatePresence, MotionConfig, motion, useScroll, useSpring } from 'motion/react';
import { Check } from 'lucide-react';
import {
  CAPABILITIES,
  DEFAULT_SITE_CONFIG,
  DESIGN_PROJECTS,
  UGC_REELS,
} from './data/portfolioData';
import { auth, ensureFreshAdminToken, isAuthorizedAdminUser, signOutAdmin } from './lib/firebase';
import {
  saveSiteConfig,
  subscribeCapabilities,
  subscribeCustomSections,
  subscribeDesignProjects,
  subscribeInquiries,
  subscribeSiteConfig,
  subscribeUgcReels,
} from './services/portfolioStore';
import type {
  CapabilityItem,
  CustomSection,
  DesignCategory,
  DesignProject,
  NavSectionId,
  ProjectInquiryRecord,
  SiteConfig,
  UgcReel,
} from './types/portfolio';
import { computeActiveSection } from './utils/portfolioLogic';
import {
  resolveSectionByArrowKey,
  shouldHandleGlobalArrowNavigation,
} from './utils/keyboardNavigation';
import {
  applyThemeToRoot,
  resolveInitialThemeMode,
  THEME_STORAGE_KEY,
  toggleThemeMode,
  type ThemeMode,
} from './utils/themeMode';
import { SCROLL_PARALLAX_SPRING, SNAPPY_SPRING } from './utils/motionConfig';
import { useGsapSectionMotion } from './utils/useGsapSectionMotion';
import { VerticalNavRail } from './components/VerticalNavRail';
import { HeroBento } from './components/HeroBento';
import { UgcReelsSection } from './components/UgcReelsSection';
import { DesignWorkSection } from './components/DesignWorkSection';
import { ClientsSection } from './components/ClientsSection';
import { AboutContactFooter } from './components/AboutContactFooter';
import { CustomSectionsRenderer } from './components/CustomSectionsRenderer';
import { SectionDivider } from './components/SectionDivider';

// Code-split heavy non-critical & admin-only bundles off the initial render path
const ThreeScrollStage = lazy(() =>
  import('./components/ThreeScrollStage').then((m) => ({ default: m.ThreeScrollStage })),
);
const PhysicsCursor = lazy(() =>
  import('./components/PhysicsCursor').then((m) => ({ default: m.PhysicsCursor })),
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const AdminAccessGate = lazy(() =>
  import('./components/AdminAccessGate').then((m) => ({ default: m.AdminAccessGate })),
);
const VideoLightboxModal = lazy(() =>
  import('./components/VideoLightboxModal').then((m) => ({ default: m.VideoLightboxModal })),
);
const ArtworkLightboxModal = lazy(() =>
  import('./components/ArtworkLightboxModal').then((m) => ({ default: m.ArtworkLightboxModal })),
);
const ProjectInquiryDrawer = lazy(() =>
  import('./components/ProjectInquiryDrawer').then((m) => ({ default: m.ProjectInquiryDrawer })),
);

const TRACKED_SECTIONS: NavSectionId[] = [
  'about',
  'ugc-reels',
  'design-work',
  'clients',
  'contact',
];

const SECTION_LABELS: Record<NavSectionId, string> = {
  about: 'About Me',
  'ugc-reels': 'UGC Reels',
  'design-work': 'Design Work',
  clients: 'Clients & Capabilities',
  contact: 'Contact',
};

function clearAdminHash() {
  if (window.location.hash.toLowerCase() === '#admin') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const isAdmin = isAuthorizedAdminUser(authUser);

  const [activeView, setActiveView] = useState<'portfolio' | 'admin'>('portfolio');
  const [showAdminGate, setShowAdminGate] = useState(false);

  // Live CMS state (falls back cleanly to defaults until synced to Firestore)
  const [cloudSiteConfig, setCloudSiteConfig] = useState<SiteConfig | null>(null);
  const [cloudReels, setCloudReels] = useState<UgcReel[] | null>(null);
  const [cloudDesigns, setCloudDesigns] = useState<DesignProject[] | null>(null);
  const [cloudCapabilities, setCloudCapabilities] = useState<CapabilityItem[] | null>(null);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [inquiries, setInquiries] = useState<ProjectInquiryRecord[]>([]);

  const siteConfig = cloudSiteConfig ?? DEFAULT_SITE_CONFIG;
  const ugcReels = cloudReels ?? UGC_REELS;
  const designProjects = cloudDesigns ?? DESIGN_PROJECTS;
  const capabilities = cloudCapabilities ?? CAPABILITIES;
  const isUsingCloudDefaults = !cloudSiteConfig;

  const [activeSection, setActiveSection] = useState<NavSectionId>('about');
  const [activeDesignCategory, setActiveDesignCategory] = useState<DesignCategory>('All Projects');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeReel, setActiveReel] = useState<UgcReel | null>(null);
  const [activeArtwork, setActiveArtwork] = useState<DesignProject | null>(null);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isStagePreview, setIsStagePreview] = useState(false);
  const [navAnnouncement, setNavAnnouncement] = useState('');
  const navScrollLockUntilRef = useRef(0);
  const portfolioMainRef = useRef<HTMLElement>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      return resolveInitialThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return 'light';
    }
  });

  // Smooth thin top scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, SCROLL_PARALLAX_SPRING);

  const [isAmbientReady, setIsAmbientReady] = useState(false);

  // Defer ambient 3D stage & physics cursor until after initial Hero first paint
  useEffect(() => {
    let cancelled = false;
    const activate = () => {
      if (!cancelled) setIsAmbientReady(true);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const idleId = w.requestIdleCallback(activate, { timeout: 220 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(idleId);
      };
    }
    const timer = globalThis.setTimeout(activate, 120);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, []);

  // 1. Firebase Auth listener — strictly enforce verified primary admin & fresh JWT claims
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isAuthorizedAdminUser(user)) {
        void signOutAdmin();
        setAuthUser(null);
        setActiveView('portfolio');
        return;
      }
      setAuthUser(user);
      if (user) {
        void ensureFreshAdminToken(false);
      } else {
        setActiveView('portfolio');
      }
    });
    return unsubscribe;
  }, []);

  // 2. Hidden Admin Entry Trigger (#admin URL hash OR Ctrl/Cmd + Shift + A)
  useEffect(() => {
    const openAdminTrigger = () => {
      if (isAdmin) {
        setShowAdminGate(false);
        setActiveView('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setShowAdminGate(true);
      }
    };

    const checkHash = () => {
      if (window.location.hash.toLowerCase() === '#admin') {
        openAdminTrigger();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        openAdminTrigger();
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdmin]);

  // 3. Live Firestore Subscriptions for public portfolio content
  useEffect(() => {
    const unsubConfig = subscribeSiteConfig(setCloudSiteConfig);
    const unsubReels = subscribeUgcReels(setCloudReels);
    const unsubDesigns = subscribeDesignProjects(setCloudDesigns);
    const unsubCaps = subscribeCapabilities(setCloudCapabilities);

    return () => {
      unsubConfig();
      unsubReels();
      unsubDesigns();
      unsubCaps();
    };
  }, []);

  // 4. Custom sections subscription (public only sees visible; admin sees drafts too)
  useEffect(() => {
    const unsubCustom = subscribeCustomSections(isAdmin, setCustomSections);
    return unsubCustom;
  }, [isAdmin]);

  // 5. Admin-only private inquiries subscription
  useEffect(() => {
    if (!isAdmin) {
      setInquiries([]);
      return;
    }
    const unsubInquiries = subscribeInquiries(setInquiries);
    return unsubInquiries;
  }, [isAdmin]);

  // 6. Apply live Light / Dark Mode & Theme Palette CSS variables across the root document element
  useEffect(() => {
    applyThemeToRoot(document.documentElement, themeMode, siteConfig.theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Ignore storage failures in restricted browsing contexts
    }
  }, [themeMode, siteConfig.theme]);

  const handleToggleTheme = useCallback(() => {
    setThemeMode((prev) => toggleThemeMode(prev));
  }, []);

  // Dynamically highlight active vertical nav link on scroll
  useEffect(() => {
    if (activeView !== 'portfolio') return;

    const updateActiveSection = () => {
      if (performance.now() < navScrollLockUntilRef.current) {
        return;
      }
      const metrics = TRACKED_SECTIONS.map((id) => {
        const el = document.getElementById(id);
        return {
          id,
          offsetTop: el ? el.getBoundingClientRect().top + window.scrollY : Number.MAX_SAFE_INTEGER,
        };
      }).filter((item) => item.offsetTop < Number.MAX_SAFE_INTEGER);

      const nextActive = computeActiveSection(window.scrollY, metrics, 220);
      setActiveSection(nextActive);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [activeView]);

  const handleNavigate = useCallback(
    (sectionId: NavSectionId) => {
      navScrollLockUntilRef.current = performance.now() + 720;
      setActiveSection(sectionId);
      if (activeView !== 'portfolio') {
        setActiveView('portfolio');
        clearAdminHash();
        window.setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
        return;
      }
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [activeView],
  );

  // Global Keyboard Support: Arrow keys (and Home/End) navigate between sections
  // and move focus cleanly onto the corresponding main navigation anchor.
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isStagePreview) {
        setIsStagePreview(false);
        return;
      }

      const hasOpenOverlay = Boolean(
        activeReel || activeArtwork || isInquiryOpen || (showAdminGate && !isAdmin),
      );

      if (
        !shouldHandleGlobalArrowNavigation({
          activeView,
          hasOpenOverlay,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          target: event.target instanceof HTMLElement ? event.target : null,
        })
      ) {
        return;
      }

      const nextSection = resolveSectionByArrowKey(event.key, activeSection);
      if (!nextSection) return;

      event.preventDefault();
      handleNavigate(nextSection);

      // Focus the visible main navigation anchor (desktop rail first, then mobile/tablet, else section)
      const desktopAnchor = document.querySelector<HTMLElement>(
        `[data-nav-anchor="${nextSection}"]`,
      );
      const mobileAnchor = document.querySelector<HTMLElement>(
        `[data-nav-anchor-mobile="${nextSection}"]`,
      );
      const sectionEl = document.getElementById(nextSection);

      if (desktopAnchor && desktopAnchor.offsetParent !== null) {
        desktopAnchor.focus({ preventScroll: true });
      } else if (mobileAnchor && mobileAnchor.offsetParent !== null) {
        mobileAnchor.focus({ preventScroll: true });
      } else if (sectionEl) {
        sectionEl.focus({ preventScroll: true });
      }

      setNavAnnouncement(`Navigated to ${SECTION_LABELS[nextSection]} section`);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    activeArtwork,
    activeReel,
    activeSection,
    activeView,
    handleNavigate,
    isAdmin,
    isInquiryOpen,
    isStagePreview,
    showAdminGate,
  ]);

  const handleNavigateDesignCategory = useCallback(
    (category: DesignCategory) => {
      setActiveDesignCategory(category);
      handleNavigate('design-work');
    },
    [handleNavigate],
  );

  const handlePortraitChange = useCallback(
    (dataUrl: string) => {
      if (!isAdmin) return;
      const updated: SiteConfig = {
        ...siteConfig,
        profile: { ...siteConfig.profile, portraitUrl: dataUrl },
      };
      setCloudSiteConfig(updated);
      void saveSiteConfig(updated);
    },
    [isAdmin, siteConfig],
  );

  const handleCopyEmail = useCallback(() => {
    const email = siteConfig.profile.email;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(email).catch(() => {});
    } else {
      const tempInput = document.createElement('textarea');
      tempInput.value = email;
      tempInput.setAttribute('readonly', '');
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.select();
      try {
        document.execCommand('copy');
      } catch {
        // Ignore fallback failure in restricted environments
      }
      document.body.removeChild(tempInput);
    }

    setCopiedEmail(true);
    window.setTimeout(() => {
      setCopiedEmail(false);
    }, 2400);
  }, [siteConfig.profile.email]);

  const featuredShowreelModalItem = useMemo<UgcReel>(
    () => ({
      id: 'showreel-main',
      title: siteConfig.showreel.title,
      client: siteConfig.showreel.client,
      platform: 'Ad Creative',
      durationSeconds: siteConfig.showreel.durationSeconds,
      aspectRatio: '16:9',
      thumbnailUrl: siteConfig.showreel.thumbnailUrl,
      videoUrl: siteConfig.showreel.videoUrl || undefined,
      accentColor: siteConfig.theme.primaryAccent,
      hookLine: siteConfig.showreel.hookLine,
      campaignBrief: siteConfig.showreel.campaignBrief,
      hookStrategy: siteConfig.showreel.hookStrategy,
      editingBreakdown: siteConfig.showreel.editingBreakdown,
      deliverables: siteConfig.showreel.deliverables,
    }),
    [siteConfig.showreel, siteConfig.theme.primaryAccent],
  );

  const handleSignOutAdmin = async () => {
    await signOutAdmin();
    setActiveView('portfolio');
    setShowAdminGate(false);
    clearAdminHash();
  };

  const isAdminPanelOpen = isAdmin && activeView === 'admin';
  useGsapSectionMotion(portfolioMainRef, !isAdminPanelOpen);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="relative min-h-screen p-2.5 sm:p-4 lg:p-6 theme-surface"
        style={{
          backgroundColor: 'var(--canvas-bg)',
          color: 'var(--ink)',
        }}
      >
        {/* Ambient Three.js Scroll-Choreographed 3D Sculpture Studio Backdrop (deferred past Hero FCP) */}
        {isAmbientReady && !isAdminPanelOpen && (
          <Suspense fallback={null}>
            <ThreeScrollStage
              themeMode={themeMode}
              siteTheme={siteConfig.theme}
              disabled={isAdminPanelOpen}
              stagePreview={isStagePreview && !isAdminPanelOpen}
              onToggleStagePreview={() => setIsStagePreview((prev) => !prev)}
            />
          </Suspense>
        )}

        {/* Polite Screen-Reader Live Region for Keyboard Section Navigation */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {navAnnouncement}
        </div>

        {/* Thin Top Scroll Progress Bar */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX, backgroundColor: 'var(--periwinkle)' }}
          className="fixed top-0 left-0 right-0 h-[3px] origin-left z-50 pointer-events-none"
        />

        {/* Editorial Physics-Based Follower Cursor (desktop fine-pointer only, lazy-loaded) */}
        {isAmbientReady && !isAdminPanelOpen && (
          <Suspense fallback={null}>
            <PhysicsCursor disabled={isAdminPanelOpen} isDarkMode={themeMode === 'dark'} />
          </Suspense>
        )}

        {/* Main Rounded Editorial Workspace Container */}
        <div
          className={`relative z-10 max-w-[1380px] mx-auto rounded-[24px] lg:rounded-[32px] shadow-[0_24px_70px_rgba(17,17,17,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.58)] border theme-surface transition-opacity duration-500 ${
            isStagePreview && !isAdminPanelOpen ? 'opacity-10 pointer-events-none select-none' : 'opacity-100'
          }`}
          style={{
            backgroundColor: isAdminPanelOpen
              ? 'var(--workspace-bg)'
              : 'color-mix(in srgb, var(--workspace-bg) 93%, transparent)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex flex-col lg:flex-row">
            {/* Left Sticky Vertical Navigation Rail (Desktop) + Compact Top Header (Mobile) */}
            <VerticalNavRail
              activeSection={activeSection}
              onNavigate={handleNavigate}
              brandName={siteConfig.profile.name}
              isAdmin={isAdmin}
              activeView={activeView}
              themeMode={themeMode}
              onToggleTheme={handleToggleTheme}
              onOpenAdmin={() => {
                if (isAdmin) {
                  setActiveView('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />

          {/* Main Scrollable Content: Either Public Portfolio OR Admin Control Panel */}
          <main ref={portfolioMainRef} className="flex-1 min-w-0 px-4 sm:px-7 lg:px-9 xl:px-11 pb-8">
            {isAdmin && activeView === 'admin' ? (
              <Suspense
                fallback={
                  <div className="py-16 flex items-center justify-center text-sm font-semibold text-[var(--ink-secondary)]">
                    Loading Admin Studio…
                  </div>
                }
              >
                <AdminDashboard
                  adminEmail={authUser?.email || ''}
                  isUsingCloudDefaults={isUsingCloudDefaults}
                  siteConfig={siteConfig}
                  ugcReels={ugcReels}
                  designProjects={designProjects}
                  capabilities={capabilities}
                  customSections={customSections}
                  inquiries={inquiries}
                  onViewLiveSite={() => {
                    setActiveView('portfolio');
                    clearAdminHash();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSignOut={handleSignOutAdmin}
                />
              </Suspense>
            ) : (
              <>
                <HeroBento
                  config={siteConfig}
                  isAdmin={isAdmin}
                  onPortraitChange={handlePortraitChange}
                  copiedEmail={copiedEmail}
                  onCopyEmail={handleCopyEmail}
                  onOpenShowreel={() => setActiveReel(featuredShowreelModalItem)}
                  onNavigate={handleNavigate}
                  onNavigateDesignCategory={handleNavigateDesignCategory}
                />

                <CustomSectionsRenderer
                  sections={customSections}
                  placement="after-hero"
                  onOpenInquiry={() => setIsInquiryOpen(true)}
                />

                <SectionDivider label="01 · UGC Reels" accentVar="mint" />

                <UgcReelsSection
                  reels={ugcReels}
                  sectionCopy={siteConfig.sections}
                  onSelectReel={setActiveReel}
                />

                <CustomSectionsRenderer
                  sections={customSections}
                  placement="after-ugc"
                  onOpenInquiry={() => setIsInquiryOpen(true)}
                />

                <SectionDivider label="02 · Design Work" accentVar="periwinkle" />

                <DesignWorkSection
                  projects={designProjects}
                  sectionCopy={siteConfig.sections}
                  retouching={siteConfig.retouching}
                  activeCategory={activeDesignCategory}
                  onSelectCategory={setActiveDesignCategory}
                  onSelectProject={setActiveArtwork}
                />

                <CustomSectionsRenderer
                  sections={customSections}
                  placement="after-design"
                  onOpenInquiry={() => setIsInquiryOpen(true)}
                />

                <SectionDivider label="03 · Capabilities" accentVar="apricot" />

                <ClientsSection capabilities={capabilities} />

                <CustomSectionsRenderer
                  sections={customSections}
                  placement="after-capabilities"
                  onOpenInquiry={() => setIsInquiryOpen(true)}
                />

                <SectionDivider label="04 · Contact" accentVar="periwinkle" />

                <AboutContactFooter
                  profile={siteConfig.profile}
                  sectionCopy={siteConfig.sections}
                  copiedEmail={copiedEmail}
                  onCopyEmail={handleCopyEmail}
                  onOpenInquiry={() => setIsInquiryOpen(true)}
                />
              </>
            )}
          </main>
        </div>
      </div>

        {/* Floating Copied Email Toast */}
        <AnimatePresence>
          {copiedEmail && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={SNAPPY_SPRING}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-xs font-semibold shadow-xl border border-white/15"
              style={{ backgroundColor: 'var(--obsidian)' }}
            >
              <span
                className="w-5 h-5 rounded-full text-white flex items-center justify-center"
                style={{ backgroundColor: 'var(--periwinkle)' }}
              >
                <Check className="w-3 h-3" aria-hidden="true" />
              </span>
              <span>Copied! {siteConfig.profile.email}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals & Inquiry Drawer (lazy-loaded on demand) */}
        {activeReel && (
          <Suspense fallback={null}>
            <VideoLightboxModal
              reel={activeReel}
              onClose={() => setActiveReel(null)}
              onStartProject={() => setIsInquiryOpen(true)}
            />
          </Suspense>
        )}

        {activeArtwork && (
          <Suspense fallback={null}>
            <ArtworkLightboxModal
              project={activeArtwork}
              onClose={() => setActiveArtwork(null)}
              onStartProject={() => setIsInquiryOpen(true)}
            />
          </Suspense>
        )}

        {isInquiryOpen && (
          <Suspense fallback={null}>
            <ProjectInquiryDrawer
              profile={siteConfig.profile}
              isOpen={isInquiryOpen}
              onClose={() => setIsInquiryOpen(false)}
            />
          </Suspense>
        )}

        {/* Hidden Admin Authentication Gate (only appears via #admin hash or Ctrl/Cmd+Shift+A) */}
        {showAdminGate && !isAdmin && (
          <Suspense fallback={null}>
            <AdminAccessGate
              isOpen={showAdminGate && !isAdmin}
              onClose={() => {
                setShowAdminGate(false);
                clearAdminHash();
              }}
              onAuthenticated={() => {
                setShowAdminGate(false);
                setActiveView('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </Suspense>
        )}
      </div>
    </MotionConfig>
  );
}

