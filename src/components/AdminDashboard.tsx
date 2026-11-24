import React, { useEffect, useState } from 'react';
import {
  Check,
  CloudUpload,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Inbox,
  LayoutGrid,
  LogOut,
  Mail,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import { DEFAULT_THEME_PALETTE, DESIGN_CATEGORIES } from '../data/portfolioData';
import {
  deleteCapability,
  deleteCustomSection,
  deleteDesignProject,
  deleteInquiry,
  deleteUgcReel,
  saveCapability,
  saveCustomSection,
  saveDesignProject,
  saveSiteConfig,
  saveUgcReel,
  seedDefaultPortfolioToCloud,
  updateInquiryStatus,
} from '../services/portfolioStore';
import type {
  CapabilityItem,
  CustomSection,
  CustomSectionAccent,
  CustomSectionItem,
  CustomSectionLayout,
  CustomSectionPlacement,
  DesignAspectClass,
  DesignProject,
  InquiryStatus,
  ProjectInquiryRecord,
  SiteConfig,
  ThemePalette,
  UgcPlatform,
  UgcReel,
} from '../types/portfolio';
import { compressImageFileToDataUrl } from '../utils/cmsUtils';

type AdminTab =
  | 'palette'
  | 'content'
  | 'new-sections'
  | 'ugc'
  | 'design'
  | 'capabilities'
  | 'inquiries';

interface AdminDashboardProps {
  adminEmail: string;
  isUsingCloudDefaults: boolean;
  siteConfig: SiteConfig;
  ugcReels: UgcReel[];
  designProjects: DesignProject[];
  capabilities: CapabilityItem[];
  customSections: CustomSection[];
  inquiries: ProjectInquiryRecord[];
  onViewLiveSite: () => void;
  onSignOut: () => void;
}

const PALETTE_FIELDS: { key: keyof ThemePalette; label: string; hint: string }[] = [
  { key: 'canvasBg', label: 'Outer Canvas', hint: 'Page backdrop behind rounded workspace' },
  { key: 'workspaceBg', label: 'Workspace Surface', hint: 'Main rounded container background' },
  { key: 'primaryAccent', label: 'Primary Accent', hint: 'Hero card, Brand tile & progress bar' },
  { key: 'secondaryAccent', label: 'Secondary Accent', hint: 'UGC Videos tile & mint highlights' },
  { key: 'highlightAccent', label: 'Highlight Accent', hint: 'AI & Editorial tile & Start CTA' },
  { key: 'darkSurface', label: 'Charcoal Tile', hint: 'Clients bento tile surface' },
  { key: 'obsidianSurface', label: 'Obsidian Surface', hint: 'Showreel frame, sphere & footer' },
  { key: 'lilacBackdrop', label: 'Portrait Backdrop', hint: 'Circular frame behind portrait' },
];

const EMPTY_CUSTOM_SECTION: Omit<CustomSection, 'id'> = {
  layout: 'feature-banner',
  placement: 'after-hero',
  accentTheme: 'white',
  eyebrow: 'Featured Update',
  heading: '',
  body: '',
  imageUrl: '',
  ctaLabel: '',
  ctaUrl: '',
  items: [],
  isVisible: true,
  sortOrder: 0,
};

const EMPTY_UGC_REEL: Omit<UgcReel, 'id'> = {
  title: '',
  client: '',
  platform: 'Instagram Reels',
  durationSeconds: 20,
  aspectRatio: '9:16',
  thumbnailUrl: '/src/assets/images/ugc_app_hook_1795169920625.jpg',
  videoUrl: '',
  accentColor: '#8A85E8',
  hookLine: '',
  campaignBrief: '',
  hookStrategy: '',
  editingBreakdown: ['0:00–0:03 — Opening hook', '0:03–0:15 — Product demo & B-roll'],
  deliverables: '9:16 Reels Cut · Subtitled Export',
  sortOrder: 0,
};

const EMPTY_DESIGN_PROJECT: Omit<DesignProject, 'id'> = {
  title: '',
  subtitle: '',
  category: 'Brand Identity',
  year: '2026',
  client: '',
  imageUrl: '/src/assets/images/design_brand_identity_1795169924996.jpg',
  aspectClass: 'aspect-[4/3]',
  palette: [
    { name: 'Primary', hex: '#8A85E8' },
    { name: 'Highlight', hex: '#FFC966' },
    { name: 'Obsidian', hex: '#121214' },
  ],
  tools: ['Photoshop', 'Canva'],
  rationale: '',
  deliverables: 'Visual Suite · Print & Social Exports',
  sortOrder: 0,
};

const EMPTY_CAPABILITY: Omit<CapabilityItem, 'id'> = {
  number: '04',
  title: '',
  summary: '',
  deliverables: ['Strategy & Direction', 'Production & Delivery'],
  accentBg: '#8A85E8',
  accentText: '#FFFFFF',
  sortOrder: 0,
};

function ImageField({
  label,
  value,
  onChange,
  onNotify,
  maxWidth = 1100,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  onNotify: (msg: string, isError?: boolean) => void;
  maxWidth?: number;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, maxWidth, 0.78);
      onChange(dataUrl);
      onNotify('Image optimized and ready to save.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Image upload failed.', true);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-[#111111]">{label}</label>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image URL (/src/assets/... or https://...) or upload"
          className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white border border-black/12 text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[var(--periwinkle)]"
        />
        <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#ECECEE] hover:bg-[#111111] hover:text-white text-xs font-bold text-[#111111] transition-colors cursor-pointer whitespace-nowrap shrink-0">
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{uploading ? 'Optimizing...' : 'Upload Photo'}</span>
          <input type="file" accept="image/*" onChange={handleFile} className="sr-only" />
        </label>
      </div>
      {value && (
        <div className="w-24 h-16 rounded-xl overflow-hidden border border-black/10 bg-[#EAEAEA]">
          <img src={value} alt={label} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

export function AdminDashboard({
  adminEmail,
  isUsingCloudDefaults,
  siteConfig,
  ugcReels,
  designProjects,
  capabilities,
  customSections,
  inquiries,
  onViewLiveSite,
  onSignOut,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('palette');
  const [draftConfig, setDraftConfig] = useState<SiteConfig>(siteConfig);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);

  // Structured New Content Builder State
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = useState<Omit<CustomSection, 'id'>>(EMPTY_CUSTOM_SECTION);

  // UGC Editor State
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [reelDraft, setReelDraft] = useState<Omit<UgcReel, 'id'>>(EMPTY_UGC_REEL);

  // Design Editor State
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [designDraft, setDesignDraft] = useState<Omit<DesignProject, 'id'>>(EMPTY_DESIGN_PROJECT);

  // Capability Editor State
  const [editingCapId, setEditingCapId] = useState<string | null>(null);
  const [capDraft, setCapDraft] = useState<Omit<CapabilityItem, 'id'>>(EMPTY_CAPABILITY);

  useEffect(() => {
    setDraftConfig(siteConfig);
  }, [siteConfig]);

  const notify = (text: string, isError = false) => {
    setToast({ text, isError });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3600);
  };

  const handleSeedCloud = async () => {
    setSaving(true);
    try {
      await seedDefaultPortfolioToCloud();
      notify('Default portfolio synced to Firestore cloud database.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to sync defaults.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSiteConfig = async () => {
    setSaving(true);
    try {
      await saveSiteConfig(draftConfig);
      notify('Website settings and palette saved live.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save changes.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPalette = () => {
    setDraftConfig((prev) => ({ ...prev, theme: { ...DEFAULT_THEME_PALETTE } }));
    notify('Default palette loaded — click Save Palette to publish.');
  };

  // --- Custom Sections CRUD ---
  const handleEditSection = (sec: CustomSection) => {
    setEditingSectionId(sec.id);
    setSectionDraft({
      layout: sec.layout,
      placement: sec.placement,
      accentTheme: sec.accentTheme,
      eyebrow: sec.eyebrow,
      heading: sec.heading,
      body: sec.body,
      imageUrl: sec.imageUrl,
      ctaLabel: sec.ctaLabel,
      ctaUrl: sec.ctaUrl,
      items: sec.items ? sec.items.map((i) => ({ ...i })) : [],
      isVisible: sec.isVisible,
      sortOrder: sec.sortOrder ?? 0,
    });
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionDraft.heading.trim()) {
      notify('Please enter a heading for the new section.', true);
      return;
    }
    setSaving(true);
    try {
      await saveCustomSection(
        { ...sectionDraft, id: editingSectionId || undefined },
        sectionDraft.sortOrder,
      );
      setEditingSectionId(null);
      setSectionDraft({ ...EMPTY_CUSTOM_SECTION, sortOrder: customSections.length });
      notify(editingSectionId ? 'Structured section updated live.' : 'New structured section published.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save section.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSectionVisibility = async (sec: CustomSection) => {
    setSaving(true);
    try {
      await saveCustomSection({ ...sec, isVisible: !sec.isVisible }, sec.sortOrder);
      notify(sec.isVisible ? 'Section hidden from public visitors.' : 'Section is now live.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not toggle visibility.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    setSaving(true);
    try {
      await deleteCustomSection(id);
      if (editingSectionId === id) {
        setEditingSectionId(null);
        setSectionDraft(EMPTY_CUSTOM_SECTION);
      }
      notify('Structured section removed.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete section.', true);
    } finally {
      setSaving(false);
    }
  };

  // --- UGC Reels CRUD ---
  const handleSaveReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelDraft.title.trim()) {
      notify('Please provide a reel title.', true);
      return;
    }
    setSaving(true);
    try {
      await saveUgcReel(
        { ...reelDraft, id: editingReelId || undefined },
        reelDraft.sortOrder ?? ugcReels.length,
      );
      setEditingReelId(null);
      setReelDraft({ ...EMPTY_UGC_REEL, sortOrder: ugcReels.length });
      notify(editingReelId ? 'UGC Reel updated.' : 'New UGC Reel added.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save UGC reel.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReel = async (id: string) => {
    setSaving(true);
    try {
      await deleteUgcReel(id);
      if (editingReelId === id) {
        setEditingReelId(null);
        setReelDraft(EMPTY_UGC_REEL);
      }
      notify('UGC Reel deleted.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to delete reel.', true);
    } finally {
      setSaving(false);
    }
  };

  // --- Design Projects CRUD ---
  const handleSaveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designDraft.title.trim()) {
      notify('Please provide a project title.', true);
      return;
    }
    setSaving(true);
    try {
      await saveDesignProject(
        { ...designDraft, id: editingDesignId || undefined },
        designDraft.sortOrder ?? designProjects.length,
      );
      setEditingDesignId(null);
      setDesignDraft({ ...EMPTY_DESIGN_PROJECT, sortOrder: designProjects.length });
      notify(editingDesignId ? 'Design project updated.' : 'New design project added.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save design project.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDesign = async (id: string) => {
    setSaving(true);
    try {
      await deleteDesignProject(id);
      if (editingDesignId === id) {
        setEditingDesignId(null);
        setDesignDraft(EMPTY_DESIGN_PROJECT);
      }
      notify('Design project deleted.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to delete project.', true);
    } finally {
      setSaving(false);
    }
  };

  // --- Capabilities CRUD ---
  const handleSaveCapability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capDraft.title.trim()) {
      notify('Please enter a capability title.', true);
      return;
    }
    setSaving(true);
    try {
      await saveCapability(
        { ...capDraft, id: editingCapId || undefined },
        capDraft.sortOrder ?? capabilities.length,
      );
      setEditingCapId(null);
      setCapDraft({ ...EMPTY_CAPABILITY, sortOrder: capabilities.length });
      notify(editingCapId ? 'Capability updated.' : 'New capability added.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save capability.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCapability = async (id: string) => {
    setSaving(true);
    try {
      await deleteCapability(id);
      if (editingCapId === id) {
        setEditingCapId(null);
        setCapDraft(EMPTY_CAPABILITY);
      }
      notify('Capability deleted.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to delete capability.', true);
    } finally {
      setSaving(false);
    }
  };

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'palette', label: 'Color Palette', icon: <Palette className="w-4 h-4" /> },
    { id: 'content', label: 'Site & Hero', icon: <Type className="w-4 h-4" /> },
    {
      id: 'new-sections',
      label: 'New Content Builder',
      icon: <LayoutGrid className="w-4 h-4" />,
      badge: customSections.length || undefined,
    },
    { id: 'ugc', label: 'UGC Reels', icon: <Film className="w-4 h-4" />, badge: ugcReels.length },
    {
      id: 'design',
      label: 'Design Work',
      icon: <ImageIcon className="w-4 h-4" />,
      badge: designProjects.length,
    },
    {
      id: 'capabilities',
      label: 'Capabilities',
      icon: <Sparkles className="w-4 h-4" />,
      badge: capabilities.length,
    },
    {
      id: 'inquiries',
      label: 'Inquiries',
      icon: <Inbox className="w-4 h-4" />,
      badge: inquiries.filter((i) => i.status === 'new').length || undefined,
    },
  ];

  const updateSectionItem = (index: number, patch: Partial<CustomSectionItem>) => {
    setSectionDraft((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], ...patch };
      return { ...prev, items: nextItems };
    });
  };

  return (
    <div className="py-5 sm:py-8 space-y-6">
      {/* Admin Studio Top Header */}
      <div
        className="rounded-[26px] text-white p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--obsidian)' }}
      >
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold text-white/70">Admin Content &amp; Theme Studio</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] leading-tight">
            Portfolio Control Panel
          </h1>
          <p className="text-xs text-white/75 truncate">
            Signed in as <span className="font-mono text-white">{adminEmail}</span> · Changes sync
            live across phone &amp; PC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isUsingCloudDefaults && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSeedCloud}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--apricot)] text-[#111111] text-xs font-extrabold cursor-pointer hover:opacity-95 whitespace-nowrap"
            >
              <CloudUpload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sync Defaults to Cloud</span>
            </button>
          )}
          <button
            type="button"
            onClick={onViewLiveSite}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>View Live Site</span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {toast && (
        <div
          role="status"
          className={`rounded-2xl px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3 border ${
            toast.isError
              ? 'bg-[#FFF2F2] border-[#E5484D]/30 text-[#A31B1F]'
              : 'bg-[#EEFBF2] border-[#28965A]/30 text-[#15623A]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            {toast.text}
          </span>
        </div>
      )}

      {/* Responsive Studio Tabs */}
      <div
        role="tablist"
        aria-label="Admin sections"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-[#ECECEE] rounded-2xl"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                active
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'text-[#4A4A50] hover:text-[#111111] hover:bg-white/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-black/8 text-[#111111]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          TAB 1: COLOR PALETTE STUDIO
          ==================================================================== */}
      {activeTab === 'palette' && (
        <div className="rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-[#111111]">
                Website Color Palette
              </h2>
              <p className="text-xs sm:text-sm text-[#55555B] mt-1">
                Customize all 8 core editorial surfaces and accent colors. Saving updates every page
                and bento card immediately.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetPalette}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#ECECEE] hover:bg-[#dfdfE4] text-xs font-bold text-[#111111] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveSiteConfig}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-[#2a2a2f] text-white text-xs font-bold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save Palette'}</span>
              </button>
            </div>
          </div>

          {/* Live Mini Bento Preview */}
          <div
            className="rounded-2xl p-4 sm:p-5 border border-black/10"
            style={{ backgroundColor: draftConfig.theme.canvasBg }}
          >
            <div
              className="rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
              style={{ backgroundColor: draftConfig.theme.workspaceBg }}
            >
              <div
                className="rounded-xl p-3 text-white text-xs font-bold"
                style={{ backgroundColor: draftConfig.theme.primaryAccent }}
              >
                Hero &amp; Brand
              </div>
              <div
                className="rounded-xl p-3 text-[#111111] text-xs font-bold"
                style={{ backgroundColor: draftConfig.theme.secondaryAccent }}
              >
                UGC Videos
              </div>
              <div
                className="rounded-xl p-3 text-[#111111] text-xs font-bold"
                style={{ backgroundColor: draftConfig.theme.highlightAccent }}
              >
                AI &amp; Editorial
              </div>
              <div
                className="rounded-xl p-3 text-white text-xs font-bold"
                style={{ backgroundColor: draftConfig.theme.obsidianSurface }}
              >
                Dark Surface
              </div>
            </div>
          </div>

          {/* 8 Swatch Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PALETTE_FIELDS.map(({ key, label, hint }) => (
              <div
                key={key}
                className="rounded-2xl border border-black/[0.08] bg-[#F7F7F8] p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={`color-${key}`} className="text-xs font-bold text-[#111111]">
                    {label}
                  </label>
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={draftConfig.theme[key]}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, [key]: e.target.value.toUpperCase() },
                      }))
                    }
                    className="w-8 h-8 rounded-lg border border-black/15 cursor-pointer bg-transparent"
                  />
                </div>
                <input
                  type="text"
                  value={draftConfig.theme[key]}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, [key]: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 font-mono text-xs text-[#111111]"
                />
                <p className="text-[11px] text-[#66666D] leading-snug">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: SITE, PROFILE, HERO, SHOWREEL, RETOUCHING & FOOTER COPY
          ==================================================================== */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Save Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white border border-black/[0.06] p-4 sm:px-6">
            <p className="text-xs sm:text-sm font-semibold text-[#111111]">
              Edit every text block, image, social link, showreel, and footer detail across your
              website.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSiteConfig}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#2a2a2f] text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save All Website Content'}</span>
            </button>
          </div>

          {/* Profile & Contact */}
          <div className="rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-5">
            <h2 className="text-lg font-extrabold text-[#111111]">Profile, Contact &amp; Portrait</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(
                [
                  ['name', 'Display Name'],
                  ['role', 'Role / Tagline'],
                  ['email', 'Public Email'],
                  ['phoneDisplay', 'Phone / WhatsApp Display'],
                  ['whatsappUrl', 'WhatsApp Link'],
                  ['location', 'Location Text'],
                  ['availability', 'Availability Line'],
                  ['instagramUrl', 'Instagram URL'],
                  ['behanceUrl', 'Behance URL'],
                  ['gumroadUrl', 'Gumroad URL'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-[#111111] mb-1">{label}</label>
                  <input
                    type="text"
                    value={draftConfig.profile[field]}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, [field]: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs text-[#111111]"
                  />
                </div>
              ))}
            </div>

            <ImageField
              label="Hero Portrait Photo"
              value={draftConfig.profile.portraitUrl}
              onChange={(url) =>
                setDraftConfig((prev) => ({
                  ...prev,
                  profile: { ...prev.profile, portraitUrl: url },
                }))
              }
              onNotify={notify}
              maxWidth={900}
            />
          </div>

          {/* Hero Bento Labels */}
          <div className="rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-5">
            <h2 className="text-lg font-extrabold text-[#111111]">Hero Bento Headlines &amp; Tiles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(
                [
                  ['greetingPrefix', 'Greeting Prefix (e.g. I’m,)'],
                  ['displayTitle', 'Main Big Headline (e.g. Portfolio)'],
                  ['worksLabel', 'Top Right Label'],
                  ['worksSublabel', 'Top Right Sublabel'],
                  ['showreelLabel', 'Showreel Button Label'],
                  ['ugcTileTitle', 'Mint Tile Title'],
                  ['ugcTileSubtitle', 'Mint Tile Subtitle'],
                  ['brandTileTitle', 'Periwinkle Tile Title'],
                  ['brandTileSubtitle', 'Periwinkle Tile Subtitle'],
                  ['clientsTileTitle', 'Charcoal Tile Title'],
                  ['clientsTileSubtitle', 'Charcoal Tile Subtitle'],
                  ['aiTileTitle', 'Apricot Tile Title'],
                  ['aiTileSubtitle', 'Apricot Tile Subtitle'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-[#111111] mb-1">{label}</label>
                  <input
                    type="text"
                    value={draftConfig.hero[field]}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, [field]: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs text-[#111111]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Featured Showreel */}
          <div className="rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-5">
            <h2 className="text-lg font-extrabold text-[#111111]">Featured Showreel Video</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Showreel Title</label>
                <input
                  type="text"
                  value={draftConfig.showreel.title}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      showreel: { ...prev.showreel, title: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Video MP4 URL (Optional)
                </label>
                <input
                  type="text"
                  value={draftConfig.showreel.videoUrl}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      showreel: { ...prev.showreel, videoUrl: e.target.value },
                    }))
                  }
                  placeholder="https://.../showreel.mp4"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Duration (sec)</label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={draftConfig.showreel.durationSeconds}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      showreel: { ...prev.showreel, durationSeconds: Number(e.target.value) || 45 },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Deliverables</label>
                <input
                  type="text"
                  value={draftConfig.showreel.deliverables}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      showreel: { ...prev.showreel, deliverables: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
            </div>
            <ImageField
              label="Showreel Cover Thumbnail"
              value={draftConfig.showreel.thumbnailUrl}
              onChange={(url) =>
                setDraftConfig((prev) => ({
                  ...prev,
                  showreel: { ...prev.showreel, thumbnailUrl: url },
                }))
              }
              onNotify={notify}
            />
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Campaign Brief</label>
              <textarea
                rows={3}
                value={draftConfig.showreel.campaignBrief}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    showreel: { ...prev.showreel, campaignBrief: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>
          </div>

          {/* Section Headings, Retouching & Footer */}
          <div className="rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-5">
            <h2 className="text-lg font-extrabold text-[#111111]">
              Section Headings, Retouching Study &amp; Footer Bio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">UGC Section Heading</label>
                <input
                  type="text"
                  value={draftConfig.sections.ugcHeading}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, ugcHeading: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Design Section Heading</label>
                <input
                  type="text"
                  value={draftConfig.sections.designHeading}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, designHeading: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#111111] mb-1">UGC Intro Description</label>
                <textarea
                  rows={2}
                  value={draftConfig.sections.ugcDescription}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, ugcDescription: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#111111] mb-1">Design Intro Description</label>
                <textarea
                  rows={2}
                  value={draftConfig.sections.designDescription}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, designDescription: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Retouching Title</label>
                <input
                  type="text"
                  value={draftConfig.retouching.title}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      retouching: { ...prev.retouching, title: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Retouching Tools</label>
                <input
                  type="text"
                  value={draftConfig.retouching.toolsSummary}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      retouching: { ...prev.retouching, toolsSummary: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <ImageField
                  label="Before / After Retouching Image"
                  value={draftConfig.retouching.imageUrl}
                  onChange={(url) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      retouching: { ...prev.retouching, imageUrl: url },
                    }))
                  }
                  onNotify={notify}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Footer Bio Heading</label>
                <input
                  type="text"
                  value={draftConfig.sections.footerAboutHeading}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, footerAboutHeading: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Footer CTA Heading</label>
                <input
                  type="text"
                  value={draftConfig.sections.footerContactHeading}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, footerContactHeading: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#111111] mb-1">Footer About Bio</label>
                <textarea
                  rows={3}
                  value={draftConfig.sections.footerAboutBio}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, footerAboutBio: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Copyright Line</label>
                <input
                  type="text"
                  value={draftConfig.sections.copyrightText}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, copyrightText: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Footer Tagline</label>
                <input
                  type="text"
                  value={draftConfig.sections.footerTagline}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      sections: { ...prev.sections, footerTagline: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: STRUCTURED NEW CONTENT BUILDER (PHONE + PC OPTIMIZED)
          ==================================================================== */}
      {activeTab === 'new-sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Builder Form */}
          <form
            onSubmit={handleSaveSection}
            className="lg:col-span-7 rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#111111]">
                  {editingSectionId ? 'Edit Structured Section' : 'Add New Structured Content'}
                </h2>
                <p className="text-xs text-[#55555B] mt-0.5">
                  Automatically formatted in clean responsive grids for both phone &amp; PC screens.
                </p>
              </div>
              {editingSectionId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSectionId(null);
                    setSectionDraft(EMPTY_CUSTOM_SECTION);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#ECECEE] text-xs font-bold cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Layout Template</label>
                <select
                  value={sectionDraft.layout}
                  onChange={(e) =>
                    setSectionDraft((prev) => ({
                      ...prev,
                      layout: e.target.value as CustomSectionLayout,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs font-semibold"
                >
                  <option value="feature-banner">Feature Banner (Split 7/5)</option>
                  <option value="bento-cards">Bento Cards Grid (1–3 Cols)</option>
                  <option value="media-spotlight">Media Spotlight (Split 6/6)</option>
                  <option value="editorial-quote">Editorial Statement / Quote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Page Placement</label>
                <select
                  value={sectionDraft.placement}
                  onChange={(e) =>
                    setSectionDraft((prev) => ({
                      ...prev,
                      placement: e.target.value as CustomSectionPlacement,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs font-semibold"
                >
                  <option value="after-hero">Right After Hero Bento</option>
                  <option value="after-ugc">After UGC Reels</option>
                  <option value="after-design">After Design Work</option>
                  <option value="after-capabilities">Before Footer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Surface Color</label>
                <select
                  value={sectionDraft.accentTheme}
                  onChange={(e) =>
                    setSectionDraft((prev) => ({
                      ...prev,
                      accentTheme: e.target.value as CustomSectionAccent,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs font-semibold"
                >
                  <option value="white">Crisp White</option>
                  <option value="periwinkle">Primary Accent</option>
                  <option value="mint">Secondary Accent</option>
                  <option value="apricot">Highlight Accent</option>
                  <option value="charcoal">Obsidian Dark</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Eyebrow Label</label>
                <input
                  type="text"
                  value={sectionDraft.eyebrow}
                  onChange={(e) => setSectionDraft((prev) => ({ ...prev, eyebrow: e.target.value }))}
                  placeholder="e.g. Case Study · New Release"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Order Priority</label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={sectionDraft.sortOrder}
                  onChange={(e) =>
                    setSectionDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Main Heading *</label>
              <input
                type="text"
                required
                value={sectionDraft.heading}
                onChange={(e) => setSectionDraft((prev) => ({ ...prev, heading: e.target.value }))}
                placeholder="e.g. Creative Retainer Packages for D2C Brands"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Body Copy</label>
              <textarea
                rows={3}
                value={sectionDraft.body}
                onChange={(e) => setSectionDraft((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Add structured copy, details, or story..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <ImageField
              label="Section Hero / Visual Image (Optional)"
              value={sectionDraft.imageUrl}
              onChange={(url) => setSectionDraft((prev) => ({ ...prev, imageUrl: url }))}
              onNotify={notify}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  CTA Button Label (Optional)
                </label>
                <input
                  type="text"
                  value={sectionDraft.ctaLabel}
                  onChange={(e) => setSectionDraft((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                  placeholder="e.g. Book This Package"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  CTA Link (Blank opens Inquiry Drawer)
                </label>
                <input
                  type="text"
                  value={sectionDraft.ctaUrl}
                  onChange={(e) => setSectionDraft((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                  placeholder="https://... or leave blank for Project Drawer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
            </div>

            {/* Structured Sub-Cards (up to 6) */}
            <div className="space-y-3 pt-3 border-t border-black/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#111111]">
                    Structured Cards / Highlights ({sectionDraft.items.length}/6)
                  </p>
                  <p className="text-[11px] text-[#66666D]">
                    Ideal for Bento Cards, Pricing Tiers, Process Steps, or Testimonials.
                  </p>
                </div>
                {sectionDraft.items.length < 6 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSectionDraft((prev) => ({
                        ...prev,
                        items: [
                          ...prev.items,
                          { title: '', description: '', imageUrl: '', badge: `0${prev.items.length + 1}` },
                        ],
                      }))
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ECECEE] hover:bg-[#111111] hover:text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Card</span>
                  </button>
                )}
              </div>

              {sectionDraft.items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#F7F7F8] border border-black/10 p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#55555B]">
                      Card #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSectionDraft((prev) => ({
                          ...prev,
                          items: prev.items.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-xs text-[#C52929] font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={item.badge}
                      onChange={(e) => updateSectionItem(idx, { badge: e.target.value })}
                      placeholder="Label (e.g. 01)"
                      className="px-3 py-2 rounded-xl bg-white border border-black/10 text-xs"
                    />
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateSectionItem(idx, { title: e.target.value })}
                      placeholder="Card Title"
                      className="sm:col-span-2 px-3 py-2 rounded-xl bg-white border border-black/10 text-xs"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => updateSectionItem(idx, { description: e.target.value })}
                    placeholder="Card description..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs"
                  />
                  <input
                    type="text"
                    value={item.imageUrl}
                    onChange={(e) => updateSectionItem(idx, { imageUrl: e.target.value })}
                    placeholder="Optional card image URL"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sectionDraft.isVisible}
                  onChange={(e) =>
                    setSectionDraft((prev) => ({ ...prev, isVisible: e.target.checked }))
                  }
                  className="w-4 h-4 rounded accent-[#8A85E8]"
                />
                <span>Visible to Public Visitors</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#111111] hover:bg-[#2a2a2f] text-white text-xs font-bold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{editingSectionId ? 'Update Section' : 'Publish New Section'}</span>
              </button>
            </div>
          </form>

          {/* Existing Custom Sections List */}
          <div className="lg:col-span-5 rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-4">
            <h3 className="text-base font-extrabold text-[#111111]">
              Published &amp; Draft Sections ({customSections.length})
            </h3>
            {customSections.length === 0 ? (
              <p className="text-xs text-[#66666D] leading-relaxed">
                No custom sections added yet. Create a Feature Banner, Bento Cards Grid, Media
                Spotlight, or Editorial Quote on the left and it will render cleanly on both mobile
                and desktop.
              </p>
            ) : (
              <div className="space-y-3">
                {customSections.map((sec) => (
                  <div
                    key={sec.id}
                    className="rounded-2xl bg-[#F7F7F8] border border-black/[0.07] p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono text-[#5E58CE]">
                          {sec.layout} · {sec.placement} · {sec.isVisible ? 'Live' : 'Hidden'}
                        </p>
                        <h4 className="text-sm font-bold text-[#111111] truncate">{sec.heading}</h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSectionVisibility(sec)}
                          title={sec.isVisible ? 'Hide section' : 'Show section'}
                          className="p-2 rounded-lg bg-white border border-black/10 hover:bg-[#111111] hover:text-white cursor-pointer"
                        >
                          {sec.isVisible ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec.id)}
                          title="Delete section"
                          className="p-2 rounded-lg bg-white border border-black/10 text-[#C52929] hover:bg-[#C52929] hover:text-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditSection(sec)}
                      className="text-xs font-bold text-[#5E58CE] hover:underline cursor-pointer"
                    >
                      Edit Section
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: UGC REELS MANAGER
          ==================================================================== */}
      {activeTab === 'ugc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveReel}
            className="lg:col-span-7 rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#111111]">
                {editingReelId ? 'Edit UGC Reel' : 'Add New UGC Reel'}
              </h2>
              {editingReelId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingReelId(null);
                    setReelDraft(EMPTY_UGC_REEL);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#ECECEE] text-xs font-bold cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Reel Title *</label>
                <input
                  type="text"
                  required
                  value={reelDraft.title}
                  onChange={(e) => setReelDraft((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Client / Brand *</label>
                <input
                  type="text"
                  required
                  value={reelDraft.client}
                  onChange={(e) => setReelDraft((p) => ({ ...p, client: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Platform</label>
                <select
                  value={reelDraft.platform}
                  onChange={(e) =>
                    setReelDraft((p) => ({ ...p, platform: e.target.value as UgcPlatform }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                >
                  <option value="Instagram Reels">Instagram Reels</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="Ad Creative">Ad Creative</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold mb-1">Duration (s)</label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={reelDraft.durationSeconds}
                    onChange={(e) =>
                      setReelDraft((p) => ({ ...p, durationSeconds: Number(e.target.value) || 15 }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Accent Hex</label>
                  <input
                    type="text"
                    value={reelDraft.accentColor}
                    onChange={(e) => setReelDraft((p) => ({ ...p, accentColor: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <ImageField
              label="Vertical Cover Thumbnail (9:16)"
              value={reelDraft.thumbnailUrl}
              onChange={(url) => setReelDraft((p) => ({ ...p, thumbnailUrl: url }))}
              onNotify={notify}
            />

            <div>
              <label className="block text-xs font-bold mb-1">MP4 Video URL (Optional)</label>
              <input
                type="text"
                value={reelDraft.videoUrl || ''}
                onChange={(e) => setReelDraft((p) => ({ ...p, videoUrl: e.target.value }))}
                placeholder="https://.../reel.mp4"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Hook Teaser Line</label>
              <input
                type="text"
                value={reelDraft.hookLine}
                onChange={(e) => setReelDraft((p) => ({ ...p, hookLine: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Campaign Brief</label>
              <textarea
                rows={2}
                value={reelDraft.campaignBrief}
                onChange={(e) => setReelDraft((p) => ({ ...p, campaignBrief: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Hook Strategy</label>
              <textarea
                rows={2}
                value={reelDraft.hookStrategy}
                onChange={(e) => setReelDraft((p) => ({ ...p, hookStrategy: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Edit Breakdown (one beat per line)
              </label>
              <textarea
                rows={3}
                value={reelDraft.editingBreakdown.join('\n')}
                onChange={(e) =>
                  setReelDraft((p) => ({
                    ...p,
                    editingBreakdown: e.target.value.split('\n').filter((line) => line.trim()),
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#111111] hover:bg-[#2a2a2f] text-white text-xs font-bold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{editingReelId ? 'Update UGC Reel' : 'Add UGC Reel'}</span>
            </button>
          </form>

          <div className="lg:col-span-5 rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-3">
            <h3 className="text-base font-extrabold text-[#111111]">
              Current UGC Reels ({ugcReels.length})
            </h3>
            {ugcReels.map((reel) => (
              <div
                key={reel.id}
                className="rounded-2xl bg-[#F7F7F8] border border-black/[0.07] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.title}
                    className="w-11 h-14 rounded-lg object-cover shrink-0 bg-black/10"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111111] truncate">{reel.title}</p>
                    <p className="text-[11px] text-[#66666D] truncate">
                      {reel.client} · {reel.platform}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReelId(reel.id);
                        setReelDraft({ ...reel });
                      }}
                      className="text-[11px] font-bold text-[#5E58CE] hover:underline mt-0.5 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteReel(reel.id)}
                  aria-label={`Delete ${reel.title}`}
                  className="p-2 rounded-lg bg-white border border-black/10 text-[#C52929] hover:bg-[#C52929] hover:text-white cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: DESIGN WORK MANAGER
          ==================================================================== */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveDesign}
            className="lg:col-span-7 rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#111111]">
                {editingDesignId ? 'Edit Design Project' : 'Add New Design Project'}
              </h2>
              {editingDesignId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDesignId(null);
                    setDesignDraft(EMPTY_DESIGN_PROJECT);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#ECECEE] text-xs font-bold cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={designDraft.title}
                  onChange={(e) => setDesignDraft((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Client</label>
                <input
                  type="text"
                  value={designDraft.client}
                  onChange={(e) => setDesignDraft((p) => ({ ...p, client: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Category</label>
                <select
                  value={designDraft.category}
                  onChange={(e) =>
                    setDesignDraft((p) => ({
                      ...p,
                      category: e.target.value as DesignProject['category'],
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                >
                  {DESIGN_CATEGORIES.filter((c) => c !== 'All Projects').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold mb-1">Year</label>
                  <input
                    type="text"
                    value={designDraft.year}
                    onChange={(e) => setDesignDraft((p) => ({ ...p, year: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Frame Ratio</label>
                  <select
                    value={designDraft.aspectClass}
                    onChange={(e) =>
                      setDesignDraft((p) => ({
                        ...p,
                        aspectClass: e.target.value as DesignAspectClass,
                      }))
                    }
                    className="w-full px-2.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                  >
                    <option value="aspect-[4/3]">4:3 Landscape</option>
                    <option value="aspect-[3/4]">3:4 Poster</option>
                    <option value="aspect-[16/10]">16:10 Wide</option>
                    <option value="aspect-square">1:1 Square</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Subtitle</label>
              <input
                type="text"
                value={designDraft.subtitle}
                onChange={(e) => setDesignDraft((p) => ({ ...p, subtitle: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <ImageField
              label="Artwork Image"
              value={designDraft.imageUrl}
              onChange={(url) => setDesignDraft((p) => ({ ...p, imageUrl: url }))}
              onNotify={notify}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Tools (comma-separated)</label>
                <input
                  type="text"
                  value={designDraft.tools.join(', ')}
                  onChange={(e) =>
                    setDesignDraft((p) => ({
                      ...p,
                      tools: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Deliverables</label>
                <input
                  type="text"
                  value={designDraft.deliverables}
                  onChange={(e) => setDesignDraft((p) => ({ ...p, deliverables: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Design Rationale</label>
              <textarea
                rows={3}
                value={designDraft.rationale}
                onChange={(e) => setDesignDraft((p) => ({ ...p, rationale: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#111111] hover:bg-[#2a2a2f] text-white text-xs font-bold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{editingDesignId ? 'Update Design Project' : 'Add Design Project'}</span>
            </button>
          </form>

          <div className="lg:col-span-5 rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-3">
            <h3 className="text-base font-extrabold text-[#111111]">
              Current Design Projects ({designProjects.length})
            </h3>
            {designProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl bg-[#F7F7F8] border border-black/[0.07] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-14 h-12 rounded-lg object-cover shrink-0 bg-black/10"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111111] truncate">{project.title}</p>
                    <p className="text-[11px] text-[#66666D] truncate">
                      {project.category} · {project.year}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDesignId(project.id);
                        setDesignDraft({ ...project });
                      }}
                      className="text-[11px] font-bold text-[#5E58CE] hover:underline mt-0.5 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDesign(project.id)}
                  aria-label={`Delete ${project.title}`}
                  className="p-2 rounded-lg bg-white border border-black/10 text-[#C52929] hover:bg-[#C52929] hover:text-white cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 6: CAPABILITIES MANAGER
          ==================================================================== */}
      {activeTab === 'capabilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveCapability}
            className="lg:col-span-7 rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#111111]">
                {editingCapId ? 'Edit Capability Card' : 'Add Capability Card'}
              </h2>
              {editingCapId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCapId(null);
                    setCapDraft(EMPTY_CAPABILITY);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#ECECEE] text-xs font-bold cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Badge Number</label>
                <input
                  type="text"
                  value={capDraft.number}
                  onChange={(e) => setCapDraft((p) => ({ ...p, number: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Badge Bg Hex</label>
                <input
                  type="text"
                  value={capDraft.accentBg}
                  onChange={(e) => setCapDraft((p) => ({ ...p, accentBg: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Badge Text Hex</label>
                <input
                  type="text"
                  value={capDraft.accentText}
                  onChange={(e) => setCapDraft((p) => ({ ...p, accentText: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Title *</label>
              <input
                type="text"
                required
                value={capDraft.title}
                onChange={(e) => setCapDraft((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Summary</label>
              <textarea
                rows={3}
                value={capDraft.summary}
                onChange={(e) => setCapDraft((p) => ({ ...p, summary: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Deliverables (one per line)</label>
              <textarea
                rows={3}
                value={capDraft.deliverables.join('\n')}
                onChange={(e) =>
                  setCapDraft((p) => ({
                    ...p,
                    deliverables: e.target.value.split('\n').filter((line) => line.trim()),
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#111111] hover:bg-[#2a2a2f] text-white text-xs font-bold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{editingCapId ? 'Update Capability' : 'Add Capability'}</span>
            </button>
          </form>

          <div className="lg:col-span-5 rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-3">
            <h3 className="text-base font-extrabold text-[#111111]">
              Capabilities ({capabilities.length})
            </h3>
            {capabilities.map((cap, idx) => {
              const capId = cap.id || `cap-${idx + 1}`;
              return (
                <div
                  key={capId}
                  className="rounded-2xl bg-[#F7F7F8] border border-black/[0.07] p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111111] truncate">
                      {cap.number} · {cap.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCapId(capId);
                        setCapDraft({ ...cap });
                      }}
                      className="text-[11px] font-bold text-[#5E58CE] hover:underline mt-0.5 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCapability(capId)}
                    className="p-2 rounded-lg bg-white border border-black/10 text-[#C52929] hover:bg-[#C52929] hover:text-white cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 7: PRIVATE PROJECT INQUIRIES INBOX
          ==================================================================== */}
      {activeTab === 'inquiries' && (
        <div className="rounded-[26px] bg-white border border-black/[0.06] p-5 sm:p-7 space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#111111]">
              Project Inquiries Inbox ({inquiries.length})
            </h2>
            <p className="text-xs text-[#55555B] mt-0.5">
              Private visitor submissions sent via the “Start a Project” drawer. Visible only to
              your admin account.
            </p>
          </div>

          {inquiries.length === 0 ? (
            <div className="rounded-2xl bg-[#F7F7F8] p-8 text-center text-xs text-[#66666D]">
              No project inquiries yet.
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="rounded-2xl bg-[#F7F7F8] border border-black/[0.07] p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-[#111111]">
                        {inq.name}{' '}
                        <span className="font-normal text-xs text-[#55555B]">· {inq.email}</span>
                      </p>
                      <p className="text-[11px] font-mono text-[#5E58CE] mt-0.5">
                        {inq.projectType} · {new Date(inq.createdAtMs).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={inq.status}
                        onChange={async (e) => {
                          try {
                            await updateInquiryStatus(inq.id, e.target.value as InquiryStatus);
                            notify('Inquiry status updated.');
                          } catch (err) {
                            notify(err instanceof Error ? err.message : 'Update failed.', true);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-bold"
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="replied">Replied</option>
                      </select>
                      <a
                        href={`mailto:${inq.email}?subject=Re:%20${encodeURIComponent(inq.projectType)}%20Inquiry`}
                        className="p-2 rounded-xl bg-white border border-black/10 text-[#111111] hover:bg-[#111111] hover:text-white"
                        title="Reply via Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteInquiry(inq.id);
                            notify('Inquiry deleted.');
                          } catch (err) {
                            notify(err instanceof Error ? err.message : 'Delete failed.', true);
                          }
                        }}
                        className="p-2 rounded-xl bg-white border border-black/10 text-[#C52929] hover:bg-[#C52929] hover:text-white cursor-pointer"
                        title="Delete inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#3F3F46] leading-relaxed whitespace-pre-line">
                    {inq.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
