import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampComparisonPercent,
  computeActiveSection,
  computeSectionReadingProgress,
  filterDesignProjects,
  formatDuration,
  stepComparisonPercent,
  validateInquiryForm,
} from './portfolioLogic';
import type { DesignProject } from '../types/portfolio';

const SAMPLE_PROJECTS: DesignProject[] = [
  {
    id: 'p1',
    title: 'Aura Brand Suite',
    subtitle: 'Identity system',
    category: 'Brand Identity',
    year: '2026',
    client: 'Aura',
    imageUrl: '/sample1.jpg',
    aspectClass: 'aspect-[4/3]',
    palette: [],
    tools: ['Photoshop'],
    rationale: 'Clean system',
    deliverables: 'Brand Guide',
  },
  {
    id: 'p2',
    title: 'Swiss Poster Series',
    subtitle: 'Exhibition campaign',
    category: 'Posters & Campaigns',
    year: '2026',
    client: 'Kunsthalle',
    imageUrl: '/sample2.jpg',
    aspectClass: 'aspect-[3/4]',
    palette: [],
    tools: ['Canva'],
    rationale: 'Bold geometry',
    deliverables: 'A1 Posters',
  },
  {
    id: 'p3',
    title: 'Minimalist Form E-Book',
    subtitle: 'Digital monograph',
    category: 'Digital E-Books',
    year: '2025',
    client: 'Atelier',
    imageUrl: '/sample3.jpg',
    aspectClass: 'aspect-[4/3]',
    palette: [],
    tools: ['Canva'],
    rationale: 'Editorial grid',
    deliverables: 'PDF E-Book',
  },
];

test('filterDesignProjects returns all projects for All Projects and exact category matches', () => {
  assert.equal(filterDesignProjects(SAMPLE_PROJECTS, 'All Projects').length, 3);
  const posters = filterDesignProjects(SAMPLE_PROJECTS, 'Posters & Campaigns');
  assert.equal(posters.length, 1);
  assert.equal(posters[0].id, 'p2');
  assert.equal(filterDesignProjects(SAMPLE_PROJECTS, 'AI Visuals & Portraits').length, 0);
});

test('clampComparisonPercent and stepComparisonPercent enforce [5, 95] boundaries', () => {
  assert.equal(clampComparisonPercent(-10), 5);
  assert.equal(clampComparisonPercent(120), 95);
  assert.equal(clampComparisonPercent(48.6), 49);
  assert.equal(clampComparisonPercent(Number.NaN), 50);
  assert.equal(stepComparisonPercent(50, -5), 45);
  assert.equal(stepComparisonPercent(93, 5), 95);
});

test('formatDuration outputs clean M:SS timestamps', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(15), '0:15');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(-4), '0:00');
});

test('validateInquiryForm rejects invalid inputs and accepts complete inquiries', () => {
  const emptyResult = validateInquiryForm({
    name: '',
    email: 'invalid-email',
    projectType: 'UGC Video',
    message: 'Too short',
  });
  assert.equal(emptyResult.isValid, false);
  assert.ok(emptyResult.errors.name);
  assert.ok(emptyResult.errors.email);
  assert.ok(emptyResult.errors.message);

  const validResult = validateInquiryForm({
    name: 'Aarav Mehta',
    email: 'aarav@vervebotanics.com',
    projectType: 'Both',
    message: 'Looking for 4 short-form UGC reels and matching launch posters for May.',
  });
  assert.equal(validResult.isValid, true);
  assert.deepEqual(validResult.errors, {});
});

test('computeActiveSection tracks active vertical nav item accurately by scroll position', () => {
  const sections = [
    { id: 'about' as const, offsetTop: 0 },
    { id: 'ugc-reels' as const, offsetTop: 900 },
    { id: 'design-work' as const, offsetTop: 2200 },
    { id: 'clients' as const, offsetTop: 3600 },
    { id: 'contact' as const, offsetTop: 4300 },
  ];

  assert.equal(computeActiveSection(0, sections), 'about');
  assert.equal(computeActiveSection(800, sections), 'ugc-reels');
  assert.equal(computeActiveSection(2150, sections), 'design-work');
  assert.equal(computeActiveSection(4200, sections), 'contact');
});

test('cmsUtils hex validation, slug IDs, and siteConfig sanitization enforce Firestore invariants', async () => {
  const {
    createSlugId,
    filterAndSortCustomSections,
    isValidHexColor,
    sanitizeCustomSectionPayload,
    sanitizeSiteConfig,
  } = await import('./cmsUtils');

  assert.equal(isValidHexColor('#8A85E8'), true);
  assert.equal(isValidHexColor('#fff'), false);
  assert.equal(isValidHexColor('rgb(0,0,0)'), false);

  const slug = createSlugId('section', 'New 2026 D2C Retainer Packages!!!');
  assert.match(slug, /^[a-zA-Z0-9_-]{1,128}$/);

  const sanitized = sanitizeSiteConfig({
    theme: {
      canvasBg: 'not-a-hex',
      workspaceBg: '#ffffff',
      primaryAccent: '#123456',
      secondaryAccent: '#B8DCE0',
      highlightAccent: '#FFC966',
      darkSurface: '#4A4A4E',
      obsidianSurface: '#121214',
      lilacBackdrop: '#E8B5F5',
    },
  });
  assert.equal(sanitized.theme.canvasBg, '#EAEAEA');
  assert.equal(sanitized.theme.workspaceBg, '#FFFFFF');
  assert.equal(sanitized.theme.primaryAccent, '#123456');

  const customPayload = sanitizeCustomSectionPayload({
    layout: 'bento-cards',
    placement: 'after-hero',
    accentTheme: 'mint',
    eyebrow: 'Pricing',
    heading: 'Monthly Retainers',
    body: 'Flexible creative production.',
    imageUrl: '',
    ctaLabel: 'Book Now',
    ctaUrl: '',
    items: Array.from({ length: 9 }, (_, i) => ({
      title: `Tier ${i + 1}`,
      description: 'Structured package',
      imageUrl: '',
      badge: `0${i + 1}`,
    })),
    isVisible: true,
    sortOrder: 1,
  });
  assert.equal(customPayload.items.length, 6);

  const filteredPublic = filterAndSortCustomSections(
    [
      { id: 's2', ...customPayload, sortOrder: 5, isVisible: true },
      { id: 's1', ...customPayload, sortOrder: 1, isVisible: true },
      { id: 's3', ...customPayload, sortOrder: 0, isVisible: false },
    ],
    'after-hero',
    false,
  );
  assert.deepEqual(
    filteredPublic.map((s) => s.id),
    ['s1', 's2'],
  );

  const filteredAdmin = filterAndSortCustomSections(
    [
      { id: 's2', ...customPayload, sortOrder: 5, isVisible: true },
      { id: 's3', ...customPayload, sortOrder: 0, isVisible: false },
    ],
    'after-hero',
    true,
  );
  assert.deepEqual(
    filteredAdmin.map((s) => s.id),
    ['s3', 's2'],
  );
});

test('cmsUtils enforces Firestore minimum string lengths on siteConfig and designProject payloads', async () => {
  const {
    boundedStringWithFallback,
    sanitizeDesignProjectPayload,
    sanitizeSiteConfig,
  } = await import('./cmsUtils');

  assert.equal(boundedStringWithFallback('ab', 5, 180, 'fallback@example.com'), 'fallback@example.com');
  assert.equal(boundedStringWithFallback('hello@site.com', 5, 180, 'fallback@example.com'), 'hello@site.com');

  const safeSite = sanitizeSiteConfig({
    profile: {
      name: 'Malay',
      role: 'Designer',
      email: 'a@b',
      phoneDisplay: '91',
      whatsappUrl: '',
      location: '',
      availability: '',
      portraitUrl: '',
      instagramUrl: '',
      behanceUrl: '',
      gumroadUrl: '',
    },
  });
  assert.ok(safeSite.profile.email.length >= 5);
  assert.ok(safeSite.profile.phoneDisplay.length >= 3);

  const safeDesign = sanitizeDesignProjectPayload({
    title: 'Poster',
    subtitle: '',
    category: 'Brand Identity',
    year: '26',
    client: '',
    imageUrl: '/sample.jpg',
    aspectClass: 'aspect-[4/3]',
    palette: [],
    tools: [],
    rationale: '',
    deliverables: '',
  });
  assert.equal(safeDesign.year, '2026');
});

test('computeSectionReadingProgress tracks depth cleanly from 0% to 100% across sections and bottom bounds', () => {
  const sections = [
    { id: 'about' as const, offsetTop: 24, height: 876 },
    { id: 'ugc-reels' as const, offsetTop: 900, height: 1300 },
    { id: 'design-work' as const, offsetTop: 2200, height: 1400 },
    { id: 'clients' as const, offsetTop: 3600, height: 700 },
    { id: 'contact' as const, offsetTop: 4300, height: 650 },
  ];
  const viewportHeight = 900;
  const documentHeight = 5000; // maxScrollY = 4100
  const viewportOffset = 220;

  // 1. Top of page starts at 0%
  assert.deepEqual(
    computeSectionReadingProgress({
      scrollY: 0,
      viewportHeight,
      documentHeight,
      activeSection: 'about',
      sections,
      viewportOffset,
    }),
    { progress: 0, percent: 0 },
  );

  // 2. Halfway through About section (about spans scrollY 0 -> 680)
  const midAbout = computeSectionReadingProgress({
    scrollY: 340,
    viewportHeight,
    documentHeight,
    activeSection: 'about',
    sections,
    viewportOffset,
  });
  assert.equal(midAbout.percent, 50);

  // 3. Exact handoff into UGC Reels (scrollY = 900 - 220 = 680) resets to 0%
  const startUgc = computeSectionReadingProgress({
    scrollY: 680,
    viewportHeight,
    documentHeight,
    activeSection: 'ugc-reels',
    sections,
    viewportOffset,
  });
  assert.equal(startUgc.percent, 0);

  // 4. Mid UGC Reels (spans scrollY 680 -> 1980, midpoint = 1330)
  const midUgc = computeSectionReadingProgress({
    scrollY: 1330,
    viewportHeight,
    documentHeight,
    activeSection: 'ugc-reels',
    sections,
    viewportOffset,
  });
  assert.equal(midUgc.percent, 50);

  // 5. Reaches 100% cleanly at bottom of document on shorter final section
  const bottomContact = computeSectionReadingProgress({
    scrollY: 4100,
    viewportHeight,
    documentHeight,
    activeSection: 'contact',
    sections,
    viewportOffset,
  });
  assert.deepEqual(bottomContact, { progress: 1, percent: 100 });

  // 6. Edge cases: empty sections, non-scrollable page, negative overscroll
  assert.deepEqual(
    computeSectionReadingProgress({
      scrollY: 100,
      viewportHeight,
      documentHeight,
      activeSection: 'about',
      sections: [],
    }),
    { progress: 0, percent: 0 },
  );
  assert.deepEqual(
    computeSectionReadingProgress({
      scrollY: 0,
      viewportHeight: 900,
      documentHeight: 800,
      activeSection: 'about',
      sections,
    }),
    { progress: 0, percent: 0 },
  );
  assert.deepEqual(
    computeSectionReadingProgress({
      scrollY: -45,
      viewportHeight,
      documentHeight,
      activeSection: 'about',
      sections,
    }),
    { progress: 0, percent: 0 },
  );
});



