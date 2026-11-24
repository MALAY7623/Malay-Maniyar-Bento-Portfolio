/**
 * Pure responsive configuration for the Three.js 3D scroll experience.
 * Adapts FOV, particle density, parallax gain, and camera framing smoothly
 * across Desktop, Tablet, and Mobile viewports while preserving visual identity.
 */

export type ViewportTier = 'desktop' | 'tablet' | 'mobile';

export interface ResponsiveSceneProfile {
  tier: ViewportTier;
  fov: number;
  particleCount: number;
  maxParticles: number;
  parallaxGain: number;
  cameraDistanceOffset: number;
  sculptureScaleMultiplier: number;
  maxPixelRatio: number;
}

export const MAX_STAGE_PARTICLES = 36;

export function resolveViewportTier(width: number): ViewportTier {
  if (!Number.isFinite(width) || width >= 1024) return 'desktop';
  if (width >= 640) return 'tablet';
  return 'mobile';
}

export function getResponsiveSceneProfile(
  viewportWidth: number,
  isSoftwareGl: boolean,
): ResponsiveSceneProfile {
  const tier = resolveViewportTier(viewportWidth);

  if (tier === 'mobile') {
    return {
      tier,
      fov: 48,
      particleCount: 14,
      maxParticles: MAX_STAGE_PARTICLES,
      parallaxGain: 0.25,
      cameraDistanceOffset: 1.5,
      sculptureScaleMultiplier: 0.78,
      maxPixelRatio: 1,
    };
  }

  if (tier === 'tablet') {
    return {
      tier,
      fov: 45,
      particleCount: 22,
      maxParticles: MAX_STAGE_PARTICLES,
      parallaxGain: 0.55,
      cameraDistanceOffset: 0.75,
      sculptureScaleMultiplier: 0.9,
      maxPixelRatio: isSoftwareGl ? 1 : 1.5,
    };
  }

  return {
    tier,
    fov: 42,
    particleCount: MAX_STAGE_PARTICLES,
    maxParticles: MAX_STAGE_PARTICLES,
    parallaxGain: 1.0,
    cameraDistanceOffset: 0,
    sculptureScaleMultiplier: 1.0,
    maxPixelRatio: isSoftwareGl ? 1 : 2,
  };
}
