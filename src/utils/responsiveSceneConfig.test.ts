import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getResponsiveSceneProfile,
  MAX_STAGE_PARTICLES,
  resolveViewportTier,
} from './responsiveSceneConfig';

test('resolveViewportTier classifies desktop, tablet, and mobile breakpoints accurately', () => {
  assert.equal(resolveViewportTier(1440), 'desktop');
  assert.equal(resolveViewportTier(1024), 'desktop');
  assert.equal(resolveViewportTier(820), 'tablet');
  assert.equal(resolveViewportTier(640), 'tablet');
  assert.equal(resolveViewportTier(390), 'mobile');
});

test('getResponsiveSceneProfile scales particle budget, FOV, and pixel ratio across devices and software GL', () => {
  const desktopGpu = getResponsiveSceneProfile(1440, false);
  const desktopSw = getResponsiveSceneProfile(1440, true);
  const tablet = getResponsiveSceneProfile(768, false);
  const mobile = getResponsiveSceneProfile(390, false);

  assert.equal(desktopGpu.particleCount, MAX_STAGE_PARTICLES);
  assert.equal(desktopGpu.maxPixelRatio, 2);
  assert.equal(desktopSw.maxPixelRatio, 1);

  assert.ok(tablet.particleCount < desktopGpu.particleCount);
  assert.ok(mobile.particleCount < tablet.particleCount);
  assert.ok(mobile.fov > desktopGpu.fov);
  assert.ok(mobile.cameraDistanceOffset > 0);
  assert.equal(mobile.maxPixelRatio, 1);
});
