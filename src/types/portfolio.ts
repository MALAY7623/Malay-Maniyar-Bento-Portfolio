export type NavSectionId = 'about' | 'contact' | 'design-work' | 'ugc-reels' | 'clients';

export type DesignCategory =
  | 'All Projects'
  | 'Brand Identity'
  | 'Posters & Campaigns'
  | 'Digital E-Books'
  | 'AI Visuals & Portraits';

export type UgcPlatform = 'Instagram Reels' | 'YouTube Shorts' | 'Ad Creative';

export interface ThemePalette {
  canvasBg: string;
  workspaceBg: string;
  primaryAccent: string;
  secondaryAccent: string;
  highlightAccent: string;
  darkSurface: string;
  obsidianSurface: string;
  lilacBackdrop: string;
}

export interface ProfileConfig {
  name: string;
  role: string;
  email: string;
  phoneDisplay: string;
  whatsappUrl: string;
  location: string;
  availability: string;
  portraitUrl: string;
  instagramUrl: string;
  behanceUrl: string;
  gumroadUrl: string;
}

export interface HeroCopyConfig {
  greetingPrefix: string;
  displayTitle: string;
  worksLabel: string;
  worksSublabel: string;
  showreelLabel: string;
  ugcTileEyebrow: string;
  ugcTileTitle: string;
  ugcTileSubtitle: string;
  brandTileEyebrow: string;
  brandTileTitle: string;
  brandTileSubtitle: string;
  clientsTileTitle: string;
  clientsTileSubtitle: string;
  aiTileEyebrow: string;
  aiTileTitle: string;
  aiTileSubtitle: string;
}

export interface ShowreelConfig {
  title: string;
  client: string;
  durationSeconds: number;
  thumbnailUrl: string;
  videoUrl: string;
  hookLine: string;
  campaignBrief: string;
  hookStrategy: string;
  editingBreakdown: string[];
  deliverables: string;
}

export interface SectionCopyConfig {
  ugcEyebrow: string;
  ugcHeading: string;
  ugcDescription: string;
  designEyebrow: string;
  designHeading: string;
  designDescription: string;
  footerAboutEyebrow: string;
  footerAboutHeading: string;
  footerAboutBio: string;
  footerContactEyebrow: string;
  footerContactHeading: string;
  copyrightText: string;
  footerTagline: string;
}

export interface RetouchingConfig {
  title: string;
  subtitle: string;
  imageUrl: string;
  workflowSummary: string;
  toolsSummary: string;
}

export interface SiteConfig {
  theme: ThemePalette;
  profile: ProfileConfig;
  hero: HeroCopyConfig;
  showreel: ShowreelConfig;
  sections: SectionCopyConfig;
  retouching: RetouchingConfig;
}

export interface UgcReel {
  id: string;
  title: string;
  client: string;
  platform: UgcPlatform;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9';
  thumbnailUrl: string;
  videoUrl?: string;
  accentColor: string;
  hookLine: string;
  campaignBrief: string;
  hookStrategy: string;
  editingBreakdown: string[];
  deliverables: string;
  sortOrder?: number;
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export type DesignAspectClass =
  | 'aspect-[4/3]'
  | 'aspect-[3/4]'
  | 'aspect-[16/10]'
  | 'aspect-square';

export interface DesignProject {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<DesignCategory, 'All Projects'>;
  year: string;
  client: string;
  imageUrl: string;
  aspectClass: DesignAspectClass;
  columnSpan?: 'default' | 'wide';
  palette: ColorSwatch[];
  tools: string[];
  rationale: string;
  deliverables: string;
  sortOrder?: number;
}

export interface ClientBrand {
  id: string;
  name: string;
  sector: string;
  hoverColor: string;
  monogram: string;
}

export interface CapabilityItem {
  id?: string;
  number: string;
  title: string;
  summary: string;
  deliverables: string[];
  accentBg: string;
  accentText: string;
  sortOrder?: number;
}

export type CustomSectionLayout =
  | 'feature-banner'
  | 'bento-cards'
  | 'media-spotlight'
  | 'editorial-quote';

export type CustomSectionPlacement =
  | 'after-hero'
  | 'after-ugc'
  | 'after-design'
  | 'after-capabilities';

export type CustomSectionAccent = 'white' | 'periwinkle' | 'mint' | 'apricot' | 'charcoal';

export interface CustomSectionItem {
  title: string;
  description: string;
  imageUrl: string;
  badge: string;
}

export interface CustomSection {
  id: string;
  layout: CustomSectionLayout;
  placement: CustomSectionPlacement;
  accentTheme: CustomSectionAccent;
  eyebrow: string;
  heading: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  items: CustomSectionItem[];
  isVisible: boolean;
  sortOrder: number;
}

export type ProjectInquiryType = 'UGC Video' | 'Graphic Design' | 'Both';
export type InquiryStatus = 'new' | 'reviewed' | 'replied';

export interface InquiryFormData {
  name: string;
  email: string;
  projectType: ProjectInquiryType;
  message: string;
}

export interface ProjectInquiryRecord extends InquiryFormData {
  id: string;
  status: InquiryStatus;
  createdAtMs: number;
}

export interface InquiryValidationErrors {
  name?: string;
  email?: string;
  projectType?: string;
  message?: string;
}

export interface SectionMetric {
  id: NavSectionId;
  offsetTop: number;
}
