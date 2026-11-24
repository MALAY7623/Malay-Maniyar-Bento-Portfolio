import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SITE_CONFIG } from '../data/portfolioData';
import {
  buildRootThemeVariables,
  DARK_MODE_SURFACE_TOKENS,
  resolveInitialThemeMode,
  toggleThemeMode,
} from './themeMode';

test('resolveInitialThemeMode defaults to light and honors persisted dark preference', () => {
  assert.equal(resolveInitialThemeMode(null), 'light');
  assert.equal(resolveInitialThemeMode(undefined), 'light');
  assert.equal(resolveInitialThemeMode('light'), 'light');
  assert.equal(resolveInitialThemeMode('unexpected'), 'light');
  assert.equal(resolveInitialThemeMode('dark'), 'dark');
});

test('toggleThemeMode alternates cleanly between light and dark', () => {
  assert.equal(toggleThemeMode('light'), 'dark');
  assert.equal(toggleThemeMode('dark'), 'light');
});

test('buildRootThemeVariables maps light mode to CMS palette and dark mode to high-contrast dark surfaces', () => {
  const customTheme = {
    ...DEFAULT_SITE_CONFIG.theme,
    primaryAccent: '#7C74E8',
    highlightAccent: '#FFD166',
  };

  const lightVars = buildRootThemeVariables('light', customTheme);
  assert.equal(lightVars['--canvas-bg'], customTheme.canvasBg);
  assert.equal(lightVars['--workspace-bg'], customTheme.workspaceBg);
  assert.equal(lightVars['--surface-card'], '#FFFFFF');
  assert.equal(lightVars['--ink'], '#111111');
  assert.equal(lightVars['--periwinkle'], '#7C74E8');

  const darkVars = buildRootThemeVariables('dark', customTheme);
  assert.equal(darkVars['--canvas-bg'], DARK_MODE_SURFACE_TOKENS.canvasBg);
  assert.equal(darkVars['--workspace-bg'], DARK_MODE_SURFACE_TOKENS.workspaceBg);
  assert.equal(darkVars['--surface-card'], DARK_MODE_SURFACE_TOKENS.surfaceCard);
  assert.equal(darkVars['--ink'], DARK_MODE_SURFACE_TOKENS.ink);
  // Preserves CMS brand accents across dark mode
  assert.equal(darkVars['--periwinkle'], '#7C74E8');
  assert.equal(darkVars['--apricot'], '#FFD166');
  assert.notEqual(darkVars['--canvas-bg'], lightVars['--canvas-bg']);
  assert.notEqual(darkVars['--ink'], lightVars['--ink']);
});
