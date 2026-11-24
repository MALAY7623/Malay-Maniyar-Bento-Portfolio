import type {
  DesignCategory,
  DesignProject,
  InquiryFormData,
  InquiryValidationErrors,
  NavSectionId,
  SectionMetric,
} from '../types/portfolio';

export const MIN_SLIDER_PERCENT = 5;
export const MAX_SLIDER_PERCENT = 95;

/**
 * Filter design projects by selected category.
 * Returns all projects when 'All Projects' is selected.
 */
export function filterDesignProjects(
  projects: DesignProject[],
  category: DesignCategory,
): DesignProject[] {
  if (category === 'All Projects') {
    return projects;
  }
  return projects.filter((project) => project.category === category);
}

/**
 * Clamp the interactive before/after comparison slider percentage.
 */
export function clampComparisonPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 50;
  }
  return Math.min(MAX_SLIDER_PERCENT, Math.max(MIN_SLIDER_PERCENT, Math.round(value)));
}

/**
 * Step comparison percentage cleanly for keyboard ArrowLeft / ArrowRight controls.
 */
export function stepComparisonPercent(current: number, delta: number): number {
  return clampComparisonPercent(current + delta);
}

/**
 * Format seconds into clean M:SS duration string (e.g., 15 -> "0:15", 74 -> "1:14").
 */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Validate Start a Project inquiry form fields strictly without silent fallbacks.
 */
export function validateInquiryForm(data: InquiryFormData): {
  isValid: boolean;
  errors: InquiryValidationErrors;
} {
  const errors: InquiryValidationErrors = {};
  const trimmedName = data.name.trim();
  const trimmedEmail = data.email.trim();
  const trimmedMessage = data.message.trim();

  if (trimmedName.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail) {
    errors.email = 'Please enter your email address so Malay can reply.';
  } else if (!emailPattern.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!['UGC Video', 'Graphic Design', 'Both'].includes(data.projectType)) {
    errors.projectType = 'Please choose a project type.';
  }

  if (trimmedMessage.length < 12) {
    errors.message = 'Share a few details about your project (at least 12 characters).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Compute which vertical navigation section is currently active based on scroll position.
 */
export function computeActiveSection(
  scrollY: number,
  sections: SectionMetric[],
  viewportOffset = 180,
): NavSectionId {
  if (sections.length === 0) {
    return 'about';
  }

  const ordered = [...sections].sort((a, b) => a.offsetTop - b.offsetTop);
  const targetY = scrollY + viewportOffset;
  let activeId: NavSectionId = ordered[0].id;

  for (const section of ordered) {
    if (targetY >= section.offsetTop) {
      activeId = section.id;
    } else {
      break;
    }
  }

  return activeId;
}

export interface SectionReadingProgressParams {
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
  activeSection: NavSectionId;
  sections: SectionMetric[];
  viewportOffset?: number;
}

export interface SectionReadingProgressResult {
  progress: number;
  percent: number;
}

/**
 * Compute reading depth (0..1 and 0..100%) within the currently active portfolio section.
 * Aligns section handoff thresholds with computeActiveSection(scrollY, sections, viewportOffset)
 * and smoothly reaches 100% when scrolled to the bottom of the document.
 */
export function computeSectionReadingProgress({
  scrollY,
  viewportHeight,
  documentHeight,
  activeSection,
  sections,
  viewportOffset = 220,
}: SectionReadingProgressParams): SectionReadingProgressResult {
  if (sections.length === 0) {
    return { progress: 0, percent: 0 };
  }

  const safeScrollY = Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0;
  const safeViewportH = Number.isFinite(viewportHeight) ? Math.max(0, viewportHeight) : 0;
  const safeDocumentH = Number.isFinite(documentHeight) ? Math.max(0, documentHeight) : 0;
  const maxScrollY = Math.max(0, safeDocumentH - safeViewportH);

  if (maxScrollY <= 0) {
    return { progress: 0, percent: 0 };
  }

  const ordered = [...sections].sort((a, b) => a.offsetTop - b.offsetTop);
  const activeIndex = ordered.findIndex((section) => section.id === activeSection);
  if (activeIndex === -1) {
    return { progress: 0, percent: 0 };
  }

  if (safeScrollY >= maxScrollY - 1) {
    return { progress: 1, percent: 100 };
  }

  const currentSection = ordered[activeIndex];
  const nextSection = activeIndex < ordered.length - 1 ? ordered[activeIndex + 1] : null;

  const startScrollY =
    activeIndex === 0 ? 0 : Math.max(0, currentSection.offsetTop - viewportOffset);

  const rawEndScrollY = nextSection
    ? Math.max(startScrollY + 1, nextSection.offsetTop - viewportOffset)
    : Math.max(startScrollY + 1, maxScrollY);

  const effectiveEndScrollY =
    maxScrollY > startScrollY ? Math.min(rawEndScrollY, maxScrollY) : rawEndScrollY;

  const span = Math.max(1, effectiveEndScrollY - startScrollY);
  const rawProgress = (safeScrollY - startScrollY) / span;
  const clamped = Math.min(1, Math.max(0, rawProgress));

  return {
    progress: clamped,
    percent: Math.round(clamped * 100),
  };
}

