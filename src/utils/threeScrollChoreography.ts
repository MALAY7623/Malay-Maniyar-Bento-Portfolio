/**
 * Pure scroll-linked choreography math for the Three.js editorial 3D stage.
 * Maps normalized scroll progress (0..1), scroll velocity, and pointer offsets
 * into smooth camera waypoints and per-assembly target transforms.
 */

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface AssemblyTargetPose {
  position: Vec3Tuple;
  rotation: Vec3Tuple;
  scale: number;
  orbitSpread: number;
}

export interface ScrollStageChoreography {
  scrollProgress: number;
  activeChapterIndex: number;
  cameraPosition: Vec3Tuple;
  cameraLookAt: Vec3Tuple;
  prism: AssemblyTargetPose;
  cinema: AssemblyTargetPose;
  totem: AssemblyTargetPose;
  particleDriftY: number;
  particleTwist: number;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Exponential frame-rate independent damping scalar matching THREE.MathUtils.damp.
 */
export function dampValue(current: number, target: number, lambda: number, dt: number): number {
  if (!Number.isFinite(dt) || dt <= 0) return current;
  const clampedDt = Math.min(dt, 0.1);
  return lerp(current, target, 1 - Math.exp(-lambda * clampedDt));
}

/**
 * Computes deterministic 3D stage target poses from scroll depth (0..1),
 * elapsed time (seconds), normalized pointer (-1..1), and stagePreview focus mode.
 */
export function computeScrollChoreography(
  rawProgress: number,
  elapsedSec: number,
  pointerX = 0,
  pointerY = 0,
  stagePreview = false,
  reducedMotion = false,
): ScrollStageChoreography {
  const p = clamp01(rawProgress);
  const px = Number.isFinite(pointerX) ? Math.max(-1, Math.min(1, pointerX)) : 0;
  const py = Number.isFinite(pointerY) ? Math.max(-1, Math.min(1, pointerY)) : 0;
  const t = reducedMotion || !Number.isFinite(elapsedSec) ? 0 : elapsedSec;

  // 4 scroll chapters across the portfolio:
  // 0: Hero (0.00 - 0.25), 1: UGC Reels (0.25 - 0.55),
  // 2: Design Work (0.55 - 0.80), 3: Capabilities & Footer (0.80 - 1.00)
  const activeChapterIndex = p < 0.25 ? 0 : p < 0.55 ? 1 : p < 0.8 ? 2 : 3;

  // Stage preview brings the sculptural assemblies slightly closer to center so
  // visitors can admire the full 3D models cleanly; normal portfolio mode frames
  // them gracefully around the margins and negative-space channels.
  const framingSpread = stagePreview ? 0.62 : 1.0;

  // Gentle vertical camera glide along the editorial scroll spine
  const camX = Math.sin(p * Math.PI * 1.4) * 1.15 + px * (stagePreview ? 1.1 : 0.45);
  const camY = lerp(1.2, -5.8, p) + py * (stagePreview ? 0.75 : 0.3);
  const camZ = lerp(9.4, 8.6, smoothstep(0.15, 0.85, p)) - (stagePreview ? 1.0 : 0);

  const lookY = lerp(0.6, -6.2, p);

  // 1. Kinetic Creative Prism Assembly (Hero upper-right -> drifts upward & orbits)
  const prismFocus = 1 - smoothstep(0.12, 0.48, p);
  const prism: AssemblyTargetPose = {
    position: {
      x: lerp(3.45, 4.9, p) * framingSpread + Math.sin(t * 0.45) * 0.16,
      y: lerp(1.55, 3.2, p) + Math.cos(t * 0.55) * 0.14,
      z: lerp(-0.6, -2.4, p) + (stagePreview ? 0.8 : 0),
    },
    rotation: {
      x: 0.24 + p * 1.4 + py * 0.18 + Math.sin(t * 0.35) * 0.08,
      y: -0.45 + p * 3.1 + t * 0.22 + px * 0.25,
      z: 0.12 - p * 0.7,
    },
    scale: lerp(0.86, 1.08, prismFocus) * (stagePreview ? 1.1 : 1),
    orbitSpread: lerp(0.08, 0.42, smoothstep(0.0, 0.4, p)),
  };

  // 2. Editorial Cinema & Film Reel Monolith (Glides in on left flank during UGC Reels)
  const cinemaPresence = smoothstep(0.08, 0.35, p) * (1 - smoothstep(0.62, 0.92, p));
  const cinema: AssemblyTargetPose = {
    position: {
      x: lerp(-4.8, -3.55, cinemaPresence) * framingSpread - Math.cos(t * 0.4) * 0.14,
      y: lerp(-1.4, -2.45, p) + Math.sin(t * 0.5 + 1.2) * 0.16,
      z: lerp(-2.6, -0.35, cinemaPresence) + (stagePreview ? 0.9 : 0),
    },
    rotation: {
      x: -0.15 + (p - 0.35) * 1.35 + py * 0.16,
      y: 0.55 + p * 2.6 + t * 0.18 + px * 0.22,
      z: -0.14 + Math.sin(p * Math.PI) * 0.28,
    },
    scale: lerp(0.78, 1.06, cinemaPresence) * (stagePreview ? 1.08 : 1),
    orbitSpread: lerp(0.06, 0.35, cinemaPresence),
  };

  // 3. Swiss Grid Sculptural Totem (Rises smoothly during Design Work -> Footer)
  const totemPresence = smoothstep(0.45, 0.82, p);
  const totem: AssemblyTargetPose = {
    position: {
      x: lerp(4.75, 3.35, totemPresence) * framingSpread + Math.sin(t * 0.38 + 2.4) * 0.14,
      y: lerp(-6.6, -5.65, totemPresence) + Math.cos(t * 0.48 + 0.8) * 0.15,
      z: lerp(-2.8, -0.45, totemPresence) + (stagePreview ? 0.95 : 0),
    },
    rotation: {
      x: 0.18 - (p - 0.7) * 0.9 + py * 0.15,
      y: -0.6 + p * 2.9 + t * 0.2 + px * 0.22,
      z: 0.08 + Math.cos(p * Math.PI * 1.5) * 0.14,
    },
    scale: lerp(0.8, 1.08, totemPresence) * (stagePreview ? 1.1 : 1),
    orbitSpread: lerp(0.05, 0.32, totemPresence),
  };

  return {
    scrollProgress: p,
    activeChapterIndex,
    cameraPosition: { x: camX, y: camY, z: camZ },
    cameraLookAt: { x: px * 0.25, y: lookY, z: 0 },
    prism,
    cinema,
    totem,
    particleDriftY: lerp(0.6, -6.2, p),
    particleTwist: p * Math.PI * 0.85 + t * 0.04,
  };
}
