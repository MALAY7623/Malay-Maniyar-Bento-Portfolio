import type {
  CapabilityItem,
  DesignCategory,
  DesignProject,
  SiteConfig,
  ThemePalette,
  UgcReel,
} from '../types/portfolio';

// ============================================================================
// DEFAULT THEME PALETTE (Editable live in Admin Dashboard)
// ============================================================================
export const DEFAULT_THEME_PALETTE: ThemePalette = {
  canvasBg: '#EAEAEA',
  workspaceBg: '#F7F7F8',
  primaryAccent: '#8A85E8',
  secondaryAccent: '#B8DCE0',
  highlightAccent: '#FFC966',
  darkSurface: '#4A4A4E',
  obsidianSurface: '#121214',
  lilacBackdrop: '#E8B5F5',
};

// ============================================================================
// DEFAULT SITE CONFIG (Editable live in Admin Dashboard)
// ============================================================================
export const DEFAULT_SITE_CONFIG: SiteConfig = {
  theme: DEFAULT_THEME_PALETTE,
  profile: {
    name: 'Malay Maniyar',
    role: 'Graphic Designer & UGC Creator',
    email: 'Malaymaniyar2020@gmail.com',
    phoneDisplay: '+91 8000350039',
    whatsappUrl: 'https://wa.me/918000350039',
    location: 'India · Working Worldwide',
    availability: 'Available for Q2–Q3 brand & UGC collaborations',
    portraitUrl: '/src/assets/images/malay_portrait_bw_1795170070075.jpg',
    instagramUrl: 'https://instagram.com',
    behanceUrl: 'https://behance.net',
    gumroadUrl: 'https://gumroad.com',
  },
  hero: {
    greetingPrefix: "I'm,",
    displayTitle: 'Portfolio',
    worksLabel: 'Selected Works',
    worksSublabel: 'Design · Short-Form UGC · AI Art',
    showreelLabel: 'Watch Showreel',
    ugcTileEyebrow: 'Motion & Reels',
    ugcTileTitle: 'UGC Videos',
    ugcTileSubtitle: 'Short-Form & Ad Reels',
    brandTileEyebrow: 'Visual Systems',
    brandTileTitle: 'Brand & Print',
    brandTileSubtitle: 'Identity, Posters & E-Books',
    clientsTileTitle: 'Clients',
    clientsTileSubtitle: 'Capabilities & Scope',
    aiTileEyebrow: 'Generative & Retouch',
    aiTileTitle: 'AI & Editorial',
    aiTileSubtitle: 'Visuals & Art Direction',
  },
  showreel: {
    title: '2026 Creative Showreel — UGC & Visual Direction',
    client: 'Selected Brand Collaborations',
    durationSeconds: 45,
    thumbnailUrl: '/src/assets/images/showreel_hero_cover_1795169922241.jpg',
    videoUrl: '',
    hookLine: 'Kinetic design systems paired with thumb-stopping short-form storytelling.',
    campaignBrief:
      'A 45-second curated reel highlighting high-converting UGC hooks, tactile brand stationery, Swiss grid poster campaigns, and AI-assisted editorial direction crafted for modern D2C brands.',
    hookStrategy:
      'Opens with a 1.5-second tactile visual pattern interrupt—glass prism light refraction cutting directly into kinetic product unboxing beats synced to percussive sound design.',
    editingBreakdown: [
      '0:00–0:03 — Pattern-interrupt prism refraction & headline title slam',
      '0:03–0:18 — Fast-cut 9:16 UGC product hooks & authentic creator voiceover',
      '0:18–0:34 — Swiss poster campaigns, embossed packaging & e-book spreads',
      '0:34–0:45 — AI art direction portraits & direct conversion call-to-action',
    ],
    deliverables: '4K Master Reel · 16:9 Web Cut · 9:16 Vertical Teaser',
  },
  sections: {
    ugcEyebrow: '01. Short-Form Video & Ad Creative',
    ugcHeading: 'UGC Reels Showcase',
    ugcDescription:
      'Scroll-stopping 9:16 hooks, tactile product unboxings, and conversion-focused brand stories. Hover any vertical frame to preview; click to inspect the hook strategy and edit breakdown.',
    designEyebrow: '02. Visual Identity, Print & Editorial Direction',
    designHeading: 'Design Work Gallery',
    designDescription:
      'Selected brand suites, Swiss grid posters, digital e-books, and AI-assisted editorial portraits. Click any piece to inspect palette swatches, tools, and design rationale.',
    footerAboutEyebrow: 'About Malay Maniyar',
    footerAboutHeading: 'Grid precision meets thumb-stopping video craft.',
    footerAboutBio:
      "I'm Malay Maniyar, a multidisciplinary Graphic Designer and UGC Creator who bridges structured Swiss layout grids, editorial print, and fast-paced 9:16 video storytelling. From tactile brand identities and digital e-books to AI-assisted creative direction and performance UGC hooks, every frame is built to feel unmistakably intentional.",
    footerContactEyebrow: "Let's Collaborate",
    footerContactHeading: 'Ready to launch your next campaign or visual system?',
    copyrightText: '© 2026 Malay Maniyar. Crafted with editorial discipline.',
    footerTagline: 'Graphic Design · UGC Video · AI Art Direction',
  },
  retouching: {
    title: 'Editorial Portrait Retouching & Grade',
    subtitle:
      'Drag the handle across the portrait (or use Left/Right arrow keys) to compare the ungraded flat capture against frequency-separated skin retouching, micro-contrast sculpting, and warm-amber split grading.',
    imageUrl: '/src/assets/images/retouch_editorial_portrait_1795169926979.jpg',
    workflowSummary: 'Skin Texture Preservation · Dodge & Burn · Color Grading',
    toolsSummary: 'Photoshop · AI Studio',
  },
};

// Backwards-compatible exports for existing references
export const PROFILE = {
  ...DEFAULT_SITE_CONFIG.profile,
  socials: [
    { label: 'Instagram', href: DEFAULT_SITE_CONFIG.profile.instagramUrl },
    { label: 'Behance', href: DEFAULT_SITE_CONFIG.profile.behanceUrl },
    { label: 'Gumroad', href: DEFAULT_SITE_CONFIG.profile.gumroadUrl },
  ],
};

export const FEATURED_SHOWREEL: UgcReel = {
  id: 'showreel-2026',
  title: DEFAULT_SITE_CONFIG.showreel.title,
  client: DEFAULT_SITE_CONFIG.showreel.client,
  platform: 'Ad Creative',
  durationSeconds: DEFAULT_SITE_CONFIG.showreel.durationSeconds,
  aspectRatio: '16:9',
  thumbnailUrl: DEFAULT_SITE_CONFIG.showreel.thumbnailUrl,
  videoUrl: DEFAULT_SITE_CONFIG.showreel.videoUrl || undefined,
  accentColor: DEFAULT_THEME_PALETTE.primaryAccent,
  hookLine: DEFAULT_SITE_CONFIG.showreel.hookLine,
  campaignBrief: DEFAULT_SITE_CONFIG.showreel.campaignBrief,
  hookStrategy: DEFAULT_SITE_CONFIG.showreel.hookStrategy,
  editingBreakdown: DEFAULT_SITE_CONFIG.showreel.editingBreakdown,
  deliverables: DEFAULT_SITE_CONFIG.showreel.deliverables,
};

// ============================================================================
// DEFAULT UGC REELS (Editable/Addable/Deletable live in Admin Dashboard)
// ============================================================================
export const UGC_REELS: UgcReel[] = [
  {
    id: 'ugc-app-launch',
    title: 'App Launch 15s Hook Ad',
    client: 'Flow Productivity',
    platform: 'Instagram Reels',
    durationSeconds: 15,
    aspectRatio: '9:16',
    thumbnailUrl: '/src/assets/images/ugc_app_hook_1795169920625.jpg',
    videoUrl: '',
    accentColor: '#B8DCE0',
    hookLine: '“Stop planning your mornings across four scattered apps.”',
    campaignBrief:
      'Paid social acquisition creative built for Flow’s mobile launch. Designed to feel native to morning routine content while spotlighting the app’s 3-second daily schedule view.',
    hookStrategy:
      'Natural daylight cafe framing + immediate first-person problem callout within 1.8 seconds, followed by a clean screen-interaction close-up that proves utility without heavy jargon.',
    editingBreakdown: [
      '0:00–0:02 — Handheld cafe framing & bold kinetic caption hook',
      '0:02–0:09 — Over-the-shoulder phone interaction with subtle tap SFX',
      '0:09–0:15 — Split-beat benefit summary & clean end-card CTA',
    ],
    deliverables: '3 Hook Variations · 9:16 Paid Social Cut · Subtitled & Clean Exports',
    sortOrder: 0,
  },
  {
    id: 'ugc-product-unboxing',
    title: 'Product Unboxing & Aesthetic B-Roll',
    client: 'Aethel Botanicals',
    platform: 'Instagram Reels',
    durationSeconds: 24,
    aspectRatio: '9:16',
    thumbnailUrl: '/src/assets/images/ugc_product_unboxing_1795169920921.jpg',
    videoUrl: '',
    accentColor: '#FFC966',
    hookLine: 'Tactile ASMR unboxing bathed in natural afternoon shadows.',
    campaignBrief:
      'Sensory product launch reel showcasing Aethel’s molded-pulp sustainable tray and amber glass botanical serums. Built for high save-rate organic discovery and retargeting ads.',
    hookStrategy:
      'Crisp paper-tray lift audio paired with golden dappled foliage shadows immediately slows thumb scroll, letting packaging craft communicate luxury before text appears.',
    editingBreakdown: [
      '0:00–0:04 — Overhead travertine reveal & tactile ASMR box sound',
      '0:04–0:14 — Macro glass pipette drop & botanical ingredient callouts',
      '0:14–0:24 — Warm color-graded product hero lockup & subtle typography',
    ],
    deliverables: 'Organic Reel · Paid Retargeting Cut · 12 Stills Pack',
    sortOrder: 1,
  },
  {
    id: 'ugc-lifestyle-story',
    title: 'Lifestyle Brand Storytelling Reel',
    client: 'Kinetik Audio',
    platform: 'YouTube Shorts',
    durationSeconds: 32,
    aspectRatio: '9:16',
    thumbnailUrl: '/src/assets/images/ugc_lifestyle_story_1795169922403.jpg',
    videoUrl: '',
    accentColor: '#8A85E8',
    hookLine: 'City noise out. Architectural calm in.',
    campaignBrief:
      'Narrative short-form film for Kinetik’s matte silver noise-cancelling headphones, demonstrating seamless transition from bustling street ambiance into focused creative flow.',
    hookStrategy:
      'Audio contrast hook: starts with raw ambient street chatter for 2 seconds, then snaps to deep low-pass silence the exact frame the earcups seal—instantly dramatizing ANC performance.',
    editingBreakdown: [
      '0:00–0:03 — Street soundscape drop to crisp ANC silence on beat',
      '0:03–0:20 — Golden-hour architectural tracking shots on 35mm look',
      '0:20–0:32 — Minimalist spec callouts & rhythmic match-cut outro',
    ],
    deliverables: 'YouTube Short · Instagram Reels Cut · Custom Sound Design',
    sortOrder: 2,
  },
  {
    id: 'ugc-tech-review',
    title: 'Tech & Gadget Review Short',
    client: 'Mono Studio Gear',
    platform: 'YouTube Shorts',
    durationSeconds: 28,
    aspectRatio: '9:16',
    thumbnailUrl: '/src/assets/images/ugc_tech_review_1795169928439.jpg',
    videoUrl: '',
    accentColor: '#B8DCE0',
    hookLine: '3 desk upgrades that quietly doubled my editing speed.',
    campaignBrief:
      'Creator-led desk review breaking down tactile mechanical acoustics, broadcast vocal clarity, and studio monitoring headphones in a crisp, zero-fluff 28-second pacing.',
    hookStrategy:
      'Opens with a rapid three-item visual checklist over warm walnut desk cinematography, establishing instant authority and holding retention through numbered micro-reveals.',
    editingBreakdown: [
      '0:00–0:04 — Tactile mechanical keystroke sound hook & 3-part tease',
      '0:04–0:19 — Tight B-roll inserts synced to concise voiceover insights',
      '0:19–0:28 — Honest verdict frame & pinned link callout',
    ],
    deliverables: 'YouTube Shorts Master · TikTok / Reels Vertical Cut',
    sortOrder: 3,
  },
  {
    id: 'ugc-promo-edit',
    title: 'Social Media Promo Edit',
    client: 'Prism Creative Studio',
    platform: 'Ad Creative',
    durationSeconds: 18,
    aspectRatio: '9:16',
    thumbnailUrl: '/src/assets/images/showreel_hero_cover_1795169922241.jpg',
    videoUrl: '',
    accentColor: '#FFC966',
    hookLine: 'Design-forward motion typography built for paid social feeds.',
    campaignBrief:
      'High-tempo promotional creative combining studio product cinematography with Swiss editorial title cards for a seasonal studio drop campaign.',
    hookStrategy:
      'High-contrast color-block flash frames matched to typography cuts maintain a 1.2-second visual cadence—engineered specifically for silent autoplay feeds.',
    editingBreakdown: [
      '0:00–0:03 — Kinetic Swiss grid headline reveal over prism refraction',
      '0:03–0:12 — Rapid product & palette card cutaways in OpenShot',
      '0:12–0:18 — Clean geometric offer lockup & direct swipe-up prompt',
    ],
    deliverables: 'Paid Ad Cut (9:16 & 4:5) · Static Story Carousel Frames',
    sortOrder: 4,
  },
];

// ============================================================================
// DEFAULT DESIGN WORK GALLERY (Editable/Addable/Deletable live in Admin)
// ============================================================================
export const DESIGN_CATEGORIES: DesignCategory[] = [
  'All Projects',
  'Brand Identity',
  'Posters & Campaigns',
  'Digital E-Books',
  'AI Visuals & Portraits',
];

export const DESIGN_PROJECTS: DesignProject[] = [
  {
    id: 'design-aura-identity',
    title: 'Aura — Tactile Brand System',
    subtitle: 'Visual identity, cotton stationery & embossed packaging',
    category: 'Brand Identity',
    year: '2026',
    client: 'Aura Atelier',
    imageUrl: '/src/assets/images/design_brand_identity_1795169924996.jpg',
    aspectClass: 'aspect-[4/3]',
    palette: [
      { name: 'Periwinkle Ink', hex: '#8A85E8' },
      { name: 'Cotton White', hex: '#F6F5F0' },
      { name: 'Concrete Slate', hex: '#A5A8AA' },
      { name: 'Obsidian', hex: '#1F2024' },
    ],
    tools: ['Photoshop', 'Canva', 'AI Studio'],
    rationale:
      'Constructed around an architectural 12-column Swiss layout grid, Aura balances blind-embossed linen boxes with cool periwinkle accents so every physical touchpoint feels collectible and calm.',
    deliverables: 'Logo Suite · 48-Page Brand Guidelines · Packaging Die-Lines · Stationery',
    sortOrder: 0,
  },
  {
    id: 'design-zurich-poster',
    title: 'Abstrakte Formen — Exhibition Poster',
    subtitle: 'Swiss modernist print campaign & geometric typography',
    category: 'Posters & Campaigns',
    year: '2026',
    client: 'Design Week Showcase',
    imageUrl: '/src/assets/images/design_poster_campaign_1795169922751.jpg',
    aspectClass: 'aspect-[3/4]',
    palette: [
      { name: 'Periwinkle', hex: '#8A85E8' },
      { name: 'Apricot Warm', hex: '#FFC966' },
      { name: 'Soft Mint', hex: '#B8DCE0' },
      { name: 'Carbon Black', hex: '#111111' },
    ],
    tools: ['Photoshop', 'Canva'],
    rationale:
      'An exploration of kinetic balance using overlapping quarter-circles, strict grotesque hierarchy, and matte ink contrast—engineered to command attention across concrete gallery corridors from 20 meters away.',
    deliverables: 'A1 Print Master · Exhibition Banners · Social Countdown Tiles',
    sortOrder: 1,
  },
  {
    id: 'design-minimalist-ebook',
    title: 'The Minimalist Form — Digital Monograph',
    subtitle: 'Interactive editorial e-book layout & typographic rhythm',
    category: 'Digital E-Books',
    year: '2025',
    client: 'Studio Monograph Press',
    imageUrl: '/src/assets/images/design_ebook_spread_1795169955636.jpg',
    aspectClass: 'aspect-[4/3]',
    palette: [
      { name: 'Limestone', hex: '#DDD5C7' },
      { name: 'Editorial Paper', hex: '#FAF9F6' },
      { name: 'Graphite', hex: '#2E2F33' },
      { name: 'Ink Black', hex: '#111111' },
    ],
    tools: ['Canva', 'Photoshop'],
    rationale:
      'Designed specifically for tablet and digital distribution on Gumroad, pairing generous outer breathing margins with monochrome architectural photography and scannable 2-column reading measures.',
    deliverables: '64-Page Interactive PDF · Tablet Spreads · Gumroad Promo Kit',
    sortOrder: 2,
  },
  {
    id: 'design-editorial-portrait',
    title: 'Chiaroscuro — AI & Retouching Direction',
    subtitle: 'High-fashion skin texture preservation & editorial color grading',
    category: 'AI Visuals & Portraits',
    year: '2026',
    client: 'Editorial Lookbook',
    imageUrl: '/src/assets/images/retouch_editorial_portrait_1795169926979.jpg',
    aspectClass: 'aspect-[4/3]',
    palette: [
      { name: 'Warm Amber Skin', hex: '#C68B59' },
      { name: 'Deep Slate', hex: '#1E2328' },
      { name: 'Muted Shadow', hex: '#3D444A' },
      { name: 'Highlight Cream', hex: '#EED9C4' },
    ],
    tools: ['Photoshop', 'AI Studio'],
    rationale:
      'Focuses on frequency-separation retouching that respects authentic natural skin grain and freckles while sculpting warm key highlights against cool editorial charcoal shadows.',
    deliverables: 'Color-Graded Hero Portraits · Lookbook Plates · LUT Recipe',
    sortOrder: 3,
  },
  {
    id: 'design-prism-campaign',
    title: 'Prism Light — Studio Launch Visuals',
    subtitle: 'Art-directed campaign key visuals & color palette studies',
    category: 'Posters & Campaigns',
    year: '2026',
    client: 'Prism Studio',
    imageUrl: '/src/assets/images/showreel_hero_cover_1795169922241.jpg',
    aspectClass: 'aspect-[16/10]',
    palette: [
      { name: 'Very Peri', hex: '#8A85E8' },
      { name: 'Apricot Swatch', hex: '#F3B27A' },
      { name: 'Studio Slate', hex: '#585A5F' },
      { name: 'Lens Black', hex: '#121214' },
    ],
    tools: ['AI Studio', 'Photoshop', 'OpenShot'],
    rationale:
      'Bridges physical studio craft with generative lighting concepts—combining tactile Pantone swatch decks, glass caustics, and precision optics for cross-channel launch assets.',
    deliverables: 'Hero Campaign Stills · Paid Social Banners · Launch Deck',
    sortOrder: 4,
  },
  {
    id: 'design-aethel-packaging',
    title: 'Aethel — Botanical Packaging Direction',
    subtitle: 'Sustainable molded-pulp tray & apothecary label typography',
    category: 'Brand Identity',
    year: '2025',
    client: 'Aethel Botanicals',
    imageUrl: '/src/assets/images/ugc_product_unboxing_1795169920921.jpg',
    aspectClass: 'aspect-[4/3]',
    palette: [
      { name: 'Amber Glass', hex: '#6E3F1C' },
      { name: 'Molded Pulp', hex: '#E4DFD3' },
      { name: 'Botanical Olive', hex: '#4B5842' },
      { name: 'Charcoal Ink', hex: '#1B1B1D' },
    ],
    tools: ['Photoshop', 'Canva'],
    rationale:
      'Strips away ornamental clutter in favor of honest apothecary typography, tactile uncoated labels, and natural-shadow photography ready for both print catalogs and UGC video hooks.',
    deliverables: 'Label System · Unboxing Insert Cards · Art Direction Guide',
    sortOrder: 5,
  },
];

// ============================================================================
// DEFAULT CREATIVE CAPABILITIES (Editable live in Admin Dashboard)
// ============================================================================
export const CAPABILITIES: CapabilityItem[] = [
  {
    id: 'cap-ugc',
    number: '01',
    title: 'UGC Video Production & Scripting',
    summary:
      'Scroll-stopping 9:16 short-form ads, product unboxings, and creator-led storytelling engineered for retention and measurable conversion.',
    deliverables: ['Hook scripting & storyboards', '9:16 Reels, Shorts & Paid Ads', 'Kinetic captions & rhythmic edits'],
    accentBg: '#B8DCE0',
    accentText: '#111111',
    sortOrder: 0,
  },
  {
    id: 'cap-brand',
    number: '02',
    title: 'Brand Identity & Layout Grids',
    summary:
      'Swiss-precision visual systems, bold campaign posters, and digital e-books crafted with sharp typographic hierarchy and print-ready finish.',
    deliverables: ['Brand systems & packaging', 'Campaign posters & key visuals', 'Digital e-books & Gumroad kits'],
    accentBg: '#8A85E8',
    accentText: '#FFFFFF',
    sortOrder: 1,
  },
  {
    id: 'cap-ai',
    number: '03',
    title: 'Generative AI Art & Retouching',
    summary:
      'Blending AI-assisted art direction with hands-on Photoshop retouching, authentic skin-texture enhancement, and editorial color grading.',
    deliverables: ['AI concept & campaign visuals', 'Natural skin & portrait retouching', 'Editorial color grading & LUTs'],
    accentBg: '#FFC966',
    accentText: '#111111',
    sortOrder: 2,
  },
];
