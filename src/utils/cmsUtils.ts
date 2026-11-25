import { DEFAULT_SITE_CONFIG, DEFAULT_THEME_PALETTE } from '../data/portfolioData';
import type {
  CapabilityItem,
  CustomSection,
  CustomSectionAccent,
  CustomSectionLayout,
  CustomSectionPlacement,
  DesignAspectClass,
  DesignProject,
  SiteConfig,
  ThemePalette,
  UgcPlatform,
  UgcReel,
} from '../types/portfolio';
import { normalizeImageUrl } from './imageUrl';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidHexColor(value: string): boolean {
  return typeof value === 'string' && HEX_COLOR_RE.test(value.trim());
}

export function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = (value || '').trim();
  return isValidHexColor(trimmed) ? trimmed.toUpperCase() : fallback;
}

export function truncateString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

/**
 * Guarantees a trimmed string satisfies both Firestore minLen and maxLen bounds,
 * falling back cleanly when shorter than minLen.
 */
export function boundedStringWithFallback(
  value: unknown,
  minLen: number,
  maxLen: number,
  fallback: string,
): string {
  const cleaned = truncateString(value, maxLen);
  return cleaned.length >= minLen ? cleaned : fallback;
}

/**
 * Generates a Firestore-safe document ID matching ^[a-zA-Z0-9_\-]+$ (<= 128 chars).
 */
export function createSlugId(prefix: string, label: string): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'item';
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${safePrefix}-${slug || 'entry'}-${suffix}`.slice(0, 120);
}

export function sanitizeThemePalette(raw: Partial<ThemePalette> | undefined): ThemePalette {
  const src = raw || {};
  return {
    canvasBg: normalizeHexColor(src.canvasBg || '', DEFAULT_THEME_PALETTE.canvasBg),
    workspaceBg: normalizeHexColor(src.workspaceBg || '', DEFAULT_THEME_PALETTE.workspaceBg),
    primaryAccent: normalizeHexColor(src.primaryAccent || '', DEFAULT_THEME_PALETTE.primaryAccent),
    secondaryAccent: normalizeHexColor(
      src.secondaryAccent || '',
      DEFAULT_THEME_PALETTE.secondaryAccent,
    ),
    highlightAccent: normalizeHexColor(
      src.highlightAccent || '',
      DEFAULT_THEME_PALETTE.highlightAccent,
    ),
    darkSurface: normalizeHexColor(src.darkSurface || '', DEFAULT_THEME_PALETTE.darkSurface),
    obsidianSurface: normalizeHexColor(
      src.obsidianSurface || '',
      DEFAULT_THEME_PALETTE.obsidianSurface,
    ),
    lilacBackdrop: normalizeHexColor(src.lilacBackdrop || '', DEFAULT_THEME_PALETTE.lilacBackdrop),
  };
}

export function sanitizeSiteConfig(raw: Partial<SiteConfig>): SiteConfig {
  const d = DEFAULT_SITE_CONFIG;
  const p = raw.profile || d.profile;
  const h = raw.hero || d.hero;
  const s = raw.showreel || d.showreel;
  const sec = raw.sections || d.sections;
  const r = raw.retouching || d.retouching;

  const duration = Number(s.durationSeconds);
  const safeDuration = Number.isFinite(duration)
    ? Math.min(600, Math.max(1, Math.round(duration)))
    : d.showreel.durationSeconds;

  return {
    theme: sanitizeThemePalette(raw.theme),
    profile: {
      name: boundedStringWithFallback(p.name, 1, 100, d.profile.name),
      role: boundedStringWithFallback(p.role, 1, 140, d.profile.role),
      email: boundedStringWithFallback(p.email, 5, 180, d.profile.email),
      phoneDisplay: boundedStringWithFallback(p.phoneDisplay, 3, 40, d.profile.phoneDisplay),
      whatsappUrl: truncateString(p.whatsappUrl, 300),
      location: truncateString(p.location, 120),
      availability: truncateString(p.availability, 160),
      portraitUrl:
        normalizeImageUrl(truncateString(p.portraitUrl, 260000)) || d.profile.portraitUrl,
      instagramUrl: truncateString(p.instagramUrl, 300),
      behanceUrl: truncateString(p.behanceUrl, 300),
      gumroadUrl: truncateString(p.gumroadUrl, 300),
    },
    hero: {
      greetingPrefix: truncateString(h.greetingPrefix, 40) || d.hero.greetingPrefix,
      displayTitle: truncateString(h.displayTitle, 60) || d.hero.displayTitle,
      worksLabel: truncateString(h.worksLabel, 80),
      worksSublabel: truncateString(h.worksSublabel, 120),
      showreelLabel: truncateString(h.showreelLabel, 80) || d.hero.showreelLabel,
      ugcTileEyebrow: truncateString(h.ugcTileEyebrow, 60),
      ugcTileTitle: truncateString(h.ugcTileTitle, 80) || d.hero.ugcTileTitle,
      ugcTileSubtitle: truncateString(h.ugcTileSubtitle, 120),
      brandTileEyebrow: truncateString(h.brandTileEyebrow, 60),
      brandTileTitle: truncateString(h.brandTileTitle, 80) || d.hero.brandTileTitle,
      brandTileSubtitle: truncateString(h.brandTileSubtitle, 120),
      clientsTileTitle: truncateString(h.clientsTileTitle, 80) || d.hero.clientsTileTitle,
      clientsTileSubtitle: truncateString(h.clientsTileSubtitle, 120),
      aiTileEyebrow: truncateString(h.aiTileEyebrow, 60),
      aiTileTitle: truncateString(h.aiTileTitle, 80) || d.hero.aiTileTitle,
      aiTileSubtitle: truncateString(h.aiTileSubtitle, 120),
    },
    showreel: {
      title: truncateString(s.title, 140) || d.showreel.title,
      client: truncateString(s.client, 100) || d.showreel.client,
      durationSeconds: safeDuration,
      thumbnailUrl: normalizeImageUrl(truncateString(s.thumbnailUrl, 260000)),
      videoUrl: truncateString(s.videoUrl, 2000),
      hookLine: truncateString(s.hookLine, 240),
      campaignBrief: truncateString(s.campaignBrief, 1200),
      hookStrategy: truncateString(s.hookStrategy, 1200),
      editingBreakdown: (Array.isArray(s.editingBreakdown) ? s.editingBreakdown : [])
        .map((step) => truncateString(step, 300))
        .filter(Boolean)
        .slice(0, 10),
      deliverables: truncateString(s.deliverables, 300),
    },
    sections: {
      ugcEyebrow: truncateString(sec.ugcEyebrow, 100),
      ugcHeading: truncateString(sec.ugcHeading, 120) || d.sections.ugcHeading,
      ugcDescription: truncateString(sec.ugcDescription, 500),
      designEyebrow: truncateString(sec.designEyebrow, 100),
      designHeading: truncateString(sec.designHeading, 120) || d.sections.designHeading,
      designDescription: truncateString(sec.designDescription, 500),
      footerAboutEyebrow: truncateString(sec.footerAboutEyebrow, 100),
      footerAboutHeading:
        truncateString(sec.footerAboutHeading, 160) || d.sections.footerAboutHeading,
      footerAboutBio: truncateString(sec.footerAboutBio, 1200),
      footerContactEyebrow: truncateString(sec.footerContactEyebrow, 100),
      footerContactHeading:
        truncateString(sec.footerContactHeading, 160) || d.sections.footerContactHeading,
      copyrightText: truncateString(sec.copyrightText, 180),
      footerTagline: truncateString(sec.footerTagline, 180),
    },
    retouching: {
      title: truncateString(r.title, 140) || d.retouching.title,
      subtitle: truncateString(r.subtitle, 400),
      imageUrl: normalizeImageUrl(truncateString(r.imageUrl, 260000)),
      workflowSummary: truncateString(r.workflowSummary, 240),
      toolsSummary: truncateString(r.toolsSummary, 180),
    },
  };
}

export function sanitizeUgcReelPayload(reel: Omit<UgcReel, 'id'>, sortOrder = 0) {
  const validPlatforms: UgcPlatform[] = ['Instagram Reels', 'YouTube Shorts', 'Ad Creative'];
  const platform = validPlatforms.includes(reel.platform) ? reel.platform : 'Instagram Reels';
  const duration = Number(reel.durationSeconds);

  return {
    title: truncateString(reel.title, 140) || 'Untitled Reel',
    client: truncateString(reel.client, 100) || 'Brand Client',
    platform,
    durationSeconds: Number.isFinite(duration) ? Math.min(600, Math.max(1, Math.round(duration))) : 15,
    aspectRatio: reel.aspectRatio === '16:9' ? ('16:9' as const) : ('9:16' as const),
    thumbnailUrl:
      normalizeImageUrl(truncateString(reel.thumbnailUrl, 260000)) ||
      '/src/assets/images/ugc_app_hook_1795169920625.jpg',
    videoUrl: truncateString(reel.videoUrl || '', 2000),
    accentColor: normalizeHexColor(reel.accentColor, '#8A85E8'),
    hookLine: truncateString(reel.hookLine, 240),
    campaignBrief: truncateString(reel.campaignBrief, 1200),
    hookStrategy: truncateString(reel.hookStrategy, 1200),
    editingBreakdown: (Array.isArray(reel.editingBreakdown) ? reel.editingBreakdown : [])
      .map((line) => truncateString(line, 300))
      .filter(Boolean)
      .slice(0, 10),
    deliverables: truncateString(reel.deliverables, 300),
    sortOrder: Math.min(1000, Math.max(0, Math.round(Number(reel.sortOrder ?? sortOrder) || 0))),
  };
}

export function sanitizeDesignProjectPayload(project: Omit<DesignProject, 'id'>, sortOrder = 0) {
  const validCategories = [
    'Brand Identity',
    'Posters & Campaigns',
    'Digital E-Books',
    'AI Visuals & Portraits',
  ] as const;
  const category = validCategories.includes(project.category)
    ? project.category
    : 'Brand Identity';

  const validAspects: DesignAspectClass[] = [
    'aspect-[4/3]',
    'aspect-[3/4]',
    'aspect-[16/10]',
    'aspect-square',
  ];
  const aspectClass = validAspects.includes(project.aspectClass)
    ? project.aspectClass
    : 'aspect-[4/3]';

  return {
    title: truncateString(project.title, 140) || 'Untitled Project',
    subtitle: truncateString(project.subtitle, 240),
    category,
    year: boundedStringWithFallback(project.year, 4, 12, '2026'),
    client: truncateString(project.client, 100),
    imageUrl:
      normalizeImageUrl(truncateString(project.imageUrl, 260000)) ||
      '/src/assets/images/design_brand_identity_1795169924996.jpg',
    aspectClass,
    palette: (Array.isArray(project.palette) ? project.palette : [])
      .slice(0, 6)
      .map((swatch) => ({
        name: truncateString(swatch.name, 40) || 'Swatch',
        hex: normalizeHexColor(swatch.hex, '#8A85E8'),
      })),
    tools: (Array.isArray(project.tools) ? project.tools : [])
      .map((tool) => truncateString(tool, 40))
      .filter(Boolean)
      .slice(0, 8),
    rationale: truncateString(project.rationale, 1400),
    deliverables: truncateString(project.deliverables, 300),
    sortOrder: Math.min(1000, Math.max(0, Math.round(Number(project.sortOrder ?? sortOrder) || 0))),
  };
}

export function sanitizeCapabilityPayload(cap: Omit<CapabilityItem, 'id'>, sortOrder = 0) {
  return {
    number: truncateString(cap.number, 6) || '01',
    title: truncateString(cap.title, 120) || 'Creative Capability',
    summary: truncateString(cap.summary, 600),
    deliverables: (Array.isArray(cap.deliverables) ? cap.deliverables : [])
      .map((d) => truncateString(d, 160))
      .filter(Boolean)
      .slice(0, 8),
    accentBg: normalizeHexColor(cap.accentBg, '#8A85E8'),
    accentText: normalizeHexColor(cap.accentText, '#FFFFFF'),
    sortOrder: Math.min(1000, Math.max(0, Math.round(Number(cap.sortOrder ?? sortOrder) || 0))),
  };
}

export function sanitizeCustomSectionPayload(
  section: Omit<CustomSection, 'id'>,
  sortOrder = 0,
) {
  const validLayouts: CustomSectionLayout[] = [
    'feature-banner',
    'bento-cards',
    'media-spotlight',
    'editorial-quote',
  ];
  const validPlacements: CustomSectionPlacement[] = [
    'after-hero',
    'after-ugc',
    'after-design',
    'after-capabilities',
  ];
  const validAccents: CustomSectionAccent[] = [
    'white',
    'periwinkle',
    'mint',
    'apricot',
    'charcoal',
  ];

  return {
    layout: validLayouts.includes(section.layout) ? section.layout : 'feature-banner',
    placement: validPlacements.includes(section.placement) ? section.placement : 'after-hero',
    accentTheme: validAccents.includes(section.accentTheme) ? section.accentTheme : 'white',
    eyebrow: truncateString(section.eyebrow, 100),
    heading: truncateString(section.heading, 160) || 'New Highlight Section',
    body: truncateString(section.body, 2000),
    imageUrl: normalizeImageUrl(truncateString(section.imageUrl, 260000)),
    ctaLabel: truncateString(section.ctaLabel, 60),
    ctaUrl: truncateString(section.ctaUrl, 500),
    items: (Array.isArray(section.items) ? section.items : [])
      .slice(0, 6)
      .map((item) => ({
        title: truncateString(item.title, 100),
        description: truncateString(item.description, 400),
        imageUrl: normalizeImageUrl(truncateString(item.imageUrl, 120000)),
        badge: truncateString(item.badge, 40),
      }))
      .filter((item) => item.title.length > 0 || item.description.length > 0),
    isVisible: Boolean(section.isVisible),
    sortOrder: Math.min(
      1000,
      Math.max(0, Math.round(Number(section.sortOrder ?? sortOrder) || 0)),
    ),
  };
}

/**
 * Filter and order custom sections for a specific placement slot.
 */
export function filterAndSortCustomSections(
  sections: CustomSection[],
  placement: CustomSectionPlacement,
  includeHidden = false,
): CustomSection[] {
  return sections
    .filter((section) => section.placement === placement && (includeHidden || section.isVisible))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * Compress an uploaded browser image File into a crisp web data URL safe for Firestore (< 240KB).
 * Automatically steps down quality and dimensions if needed, and preserves PNG/WebP alpha via WebP.
 */
export function compressImageFileToDataUrl(
  file: File,
  maxWidth = 1100,
  quality = 0.8,
): Promise<string> {
  const MAX_FIRESTORE_DATA_URL_LEN = 240000;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, or WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or unsupported image file.'));
      img.onload = () => {
        const prefersAlpha = file.type === 'image/png' || file.type === 'image/webp';
        const widthSteps = Array.from(
          new Set([maxWidth, Math.min(maxWidth, 720), Math.min(maxWidth, 540), 400]),
        );
        const qualitySteps = [quality, 0.72, 0.62, 0.52];

        const encodeAt = (limitWidth: number, q: number, mime: 'image/webp' | 'image/jpeg') => {
          const scale = img.width > limitWidth ? limitWidth / img.width : 1;
          const targetW = Math.max(1, Math.round(img.width * scale));
          const targetH = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          if (mime === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetW, targetH);
          }
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const encoded = canvas.toDataURL(mime, q);
          // Some browsers fall back to image/png if WebP encoding isn't supported
          if (mime === 'image/webp' && !encoded.startsWith('data:image/webp')) {
            return null;
          }
          return encoded;
        };

        const mimeOrder: ('image/webp' | 'image/jpeg')[] = prefersAlpha
          ? ['image/webp', 'image/jpeg']
          : ['image/jpeg'];

        for (const mime of mimeOrder) {
          for (const limitW of widthSteps) {
            for (const q of qualitySteps) {
              const candidate = encodeAt(limitW, q, mime);
              if (candidate && candidate.length <= MAX_FIRESTORE_DATA_URL_LEN) {
                resolve(candidate);
                return;
              }
            }
          }
        }

        reject(
          new Error(
            'Image is still too large after optimization. Please try a smaller photo or paste an image link.',
          ),
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

