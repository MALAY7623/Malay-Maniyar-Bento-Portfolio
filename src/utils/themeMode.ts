import type { ThemePalette } from '../types/portfolio';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'malay-portfolio-theme-mode';

export const DARK_MODE_SURFACE_TOKENS = {
  canvasBg: '#08080A',
  workspaceBg: '#111114',
  surfaceCard: '#18181D',
  surfaceElevated: '#23232B',
  surfaceSubtle: '#1D1D24',
  ink: '#F5F5F7',
  inkSecondary: '#B4B4BE',
  inkMuted: '#8E8E9A',
  borderSubtle: 'rgba(255, 255, 255, 0.09)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  charcoal: '#262630',
  obsidian: '#1B1B22',
} as const;

export const LIGHT_MODE_SURFACE_TOKENS = {
  surfaceCard: '#FFFFFF',
  surfaceElevated: '#ECECEE',
  surfaceSubtle: '#F3F3F6',
  ink: '#111111',
  inkSecondary: '#55555B',
  inkMuted: '#66666D',
  borderSubtle: 'rgba(17, 17, 17, 0.07)',
  borderStrong: 'rgba(17, 17, 17, 0.14)',
} as const;

/**
 * Safely resolves the initial theme mode from persisted storage.
 * Defaults to the signature light editorial theme unless 'dark' was explicitly selected.
 */
export function resolveInitialThemeMode(storedValue: string | null | undefined): ThemeMode {
  if (storedValue === 'dark') return 'dark';
  return 'light';
}

export function toggleThemeMode(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

/**
 * Computes the complete map of root CSS custom properties for Light or Dark mode,
 * preserving custom CMS brand accents while switching canvas, workspace, cards,
 * typography, and borders with WCAG AA contrast.
 */
export function buildRootThemeVariables(
  mode: ThemeMode,
  siteTheme: ThemePalette,
): Record<string, string> {
  if (mode === 'dark') {
    return {
      '--canvas-bg': DARK_MODE_SURFACE_TOKENS.canvasBg,
      '--workspace-bg': DARK_MODE_SURFACE_TOKENS.workspaceBg,
      '--surface-card': DARK_MODE_SURFACE_TOKENS.surfaceCard,
      '--surface-elevated': DARK_MODE_SURFACE_TOKENS.surfaceElevated,
      '--surface-subtle': DARK_MODE_SURFACE_TOKENS.surfaceSubtle,
      '--ink': DARK_MODE_SURFACE_TOKENS.ink,
      '--ink-secondary': DARK_MODE_SURFACE_TOKENS.inkSecondary,
      '--ink-muted': DARK_MODE_SURFACE_TOKENS.inkMuted,
      '--border-subtle': DARK_MODE_SURFACE_TOKENS.borderSubtle,
      '--border-strong': DARK_MODE_SURFACE_TOKENS.borderStrong,
      '--periwinkle': siteTheme.primaryAccent,
      '--mint': siteTheme.secondaryAccent,
      '--apricot': siteTheme.highlightAccent,
      '--charcoal': DARK_MODE_SURFACE_TOKENS.charcoal,
      '--obsidian': DARK_MODE_SURFACE_TOKENS.obsidian,
      '--lilac-backdrop': siteTheme.lilacBackdrop,
    };
  }

  return {
    '--canvas-bg': siteTheme.canvasBg,
    '--workspace-bg': siteTheme.workspaceBg,
    '--surface-card': LIGHT_MODE_SURFACE_TOKENS.surfaceCard,
    '--surface-elevated': LIGHT_MODE_SURFACE_TOKENS.surfaceElevated,
    '--surface-subtle': LIGHT_MODE_SURFACE_TOKENS.surfaceSubtle,
    '--ink': LIGHT_MODE_SURFACE_TOKENS.ink,
    '--ink-secondary': LIGHT_MODE_SURFACE_TOKENS.inkSecondary,
    '--ink-muted': LIGHT_MODE_SURFACE_TOKENS.inkMuted,
    '--border-subtle': LIGHT_MODE_SURFACE_TOKENS.borderSubtle,
    '--border-strong': LIGHT_MODE_SURFACE_TOKENS.borderStrong,
    '--periwinkle': siteTheme.primaryAccent,
    '--mint': siteTheme.secondaryAccent,
    '--apricot': siteTheme.highlightAccent,
    '--charcoal': siteTheme.darkSurface,
    '--obsidian': siteTheme.obsidianSurface,
    '--lilac-backdrop': siteTheme.lilacBackdrop,
  };
}

/**
 * Applies computed theme CSS variables directly to `document.documentElement`
 * and keeps the `.dark` class, `data-theme`, and `color-scheme` synchronized.
 */
export function applyThemeToRoot(
  root: HTMLElement,
  mode: ThemeMode,
  siteTheme: ThemePalette,
): void {
  const vars = buildRootThemeVariables(mode, siteTheme);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
  root.classList.toggle('dark', mode === 'dark');
  root.setAttribute('data-theme', mode);
  root.style.colorScheme = mode;
}
