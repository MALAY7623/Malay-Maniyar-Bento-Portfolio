/**
 * Graceful HTML5 2D Canvas scroll-choreography stage used automatically on
 * devices where WebGL2 is unavailable or blocklisted (e.g. legacy Intel D3D9Ex).
 * Driven by the exact same `computeScrollChoreography` engine so visitors still
 * experience smooth scroll-linked ambient sculpture motion with zero errors.
 */

import type { ThemePalette } from '../types/portfolio';
import type { ThemeMode } from '../utils/themeMode';
import { computeScrollChoreography, dampValue } from '../utils/threeScrollChoreography';

export interface FallbackStageLiveState {
  themeMode: ThemeMode;
  siteTheme: ThemePalette;
  stagePreview: boolean;
  isPaused: boolean;
  disabled: boolean;
  pointerX: number;
  pointerY: number;
  reducedMotion: boolean;
}

interface ParticleSeed {
  x: number;
  y: number;
  radius: number;
  phase: number;
  accentIndex: 0 | 1 | 2;
  speed: number;
}

const PARTICLE_SEEDS: ParticleSeed[] = Array.from({ length: 28 }, (_, i) => {
  const golden = i * 2.399963229728653;
  return {
    x: 0.06 + ((Math.sin(golden * 1.7 + i) * 0.5 + 0.5) * 0.88),
    y: 0.06 + ((i / 28) * 0.88),
    radius: 3 + (i % 4) * 2.2,
    phase: i * 0.65,
    accentIndex: (i % 3) as 0 | 1 | 2,
    speed: 0.35 + (i % 5) * 0.14,
  };
});

function drawRegularPolygon(
  ctx: CanvasRenderingContext2D,
  sides: number,
  radius: number,
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 8;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawFourPointStar(ctx: CanvasRenderingContext2D, outerR: number, innerR: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / 4;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function mountCanvas2dFallbackStage(
  container: HTMLDivElement,
  liveStateRef: { current: FallbackStageLiveState },
  getNormalizedScrollProgress: () => number,
): () => void {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('data-testid', 'three-scroll-canvas');
  canvas.setAttribute('data-renderer-mode', 'canvas2d-fallback');
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return () => {
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }

  let width = window.innerWidth;
  let height = Math.max(1, window.innerHeight);

  const resize = () => {
    width = window.innerWidth;
    height = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const handlePointerMove = (event: PointerEvent) => {
    liveStateRef.current.pointerX = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    liveStateRef.current.pointerY = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
  };

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', handlePointerMove, { passive: true });

  let disposed = false;
  let frameId = 0;
  let lastTime = performance.now();
  let elapsedSim = 0;
  let dampedScroll = getNormalizedScrollProgress();
  let dampedPointerX = 0;
  let dampedPointerY = 0;

  // Project pseudo-3D sculpture coordinates cleanly into viewport pixels
  const project = (x: number, y: number, z: number, camX: number, camY: number) => {
    const scaleFactor = Math.min(width, height) * 0.105;
    const perspective = 1 / Math.max(0.55, 1 - z * 0.08);
    return {
      sx: width * 0.5 + (x - camX * 0.7) * scaleFactor * perspective,
      sy: height * 0.5 - (y - camY * 0.75) * scaleFactor * perspective,
      pScale: perspective * (Math.min(width, height) / 900),
    };
  };

  const renderFrame = () => {
    if (disposed) return;

    const now = performance.now();
    const dt = Math.min(0.06, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    const state = liveStateRef.current;

    if (!state.disabled) {
      if (!state.isPaused && !state.reducedMotion) {
        elapsedSim += dt;
      }

      dampedScroll = dampValue(dampedScroll, getNormalizedScrollProgress(), 6.2, dt);
      dampedPointerX = dampValue(dampedPointerX, state.pointerX, 4.5, dt);
      dampedPointerY = dampValue(dampedPointerY, state.pointerY, 4.5, dt);

      const pose = computeScrollChoreography(
        dampedScroll,
        elapsedSim,
        dampedPointerX,
        dampedPointerY,
        state.stagePreview,
        state.reducedMotion || state.isPaused,
      );

      const isDark = state.themeMode === 'dark';
      const primary = state.siteTheme.primaryAccent;
      const secondary = state.siteTheme.secondaryAccent;
      const highlight = state.siteTheme.highlightAccent;
      const bgHex = isDark ? '#08080A' : state.siteTheme.canvasBg;

      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, width, height);

      // Soft studio ambient radial glow
      const glow = ctx.createRadialGradient(
        width * (0.68 + dampedPointerX * 0.04),
        height * (0.32 - dampedPointerY * 0.04),
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85,
      );
      glow.addColorStop(0, isDark ? 'rgba(128, 122, 232, 0.16)' : 'rgba(128, 122, 232, 0.10)');
      glow.addColorStop(0.55, isDark ? 'rgba(181, 214, 214, 0.06)' : 'rgba(249, 200, 102, 0.07)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const paletteTriplet = [primary, secondary, highlight];

      // 1. Floating Architectural Facet Particles
      ctx.save();
      for (const p of PARTICLE_SEEDS) {
        const px = p.x * width + Math.sin(elapsedSim * p.speed + p.phase) * 18 + dampedPointerX * 14;
        const py =
          ((p.y * height - dampedScroll * 220 + height * 2) % height) +
          Math.cos(elapsedSim * p.speed + p.phase) * 10;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(elapsedSim * 0.35 + p.phase);
        ctx.globalAlpha = isDark ? 0.52 : 0.45;
        ctx.fillStyle = paletteTriplet[p.accentIndex];
        drawRegularPolygon(ctx, 6, p.radius);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // 2. Creative Prism Sculpture (Beveled Octagon + Orbital Rings + Concentric Dial)
      {
        const p = project(
          pose.prism.position.x,
          pose.prism.position.y,
          pose.prism.position.z,
          pose.cameraPosition.x,
          pose.cameraPosition.y,
        );
        const radius = 92 * pose.prism.scale * p.pScale;

        ctx.save();
        ctx.translate(p.sx, p.sy);
        ctx.rotate(pose.prism.rotation.z * 0.7);

        // Contact ground shadow
        ctx.save();
        ctx.translate(0, radius * 1.18);
        ctx.scale(1, 0.28);
        const shadowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, radius * 1.1);
        shadowGrad.addColorStop(0, isDark ? 'rgba(0,0,0,0.45)' : 'rgba(17,17,17,0.16)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Outer metallic orbital ring
        ctx.save();
        ctx.rotate(pose.prism.rotation.y * 0.55);
        ctx.strokeStyle = secondary;
        ctx.lineWidth = Math.max(3, radius * 0.085);
        ctx.globalAlpha = 0.86;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.38, radius * 0.92, 0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Primary beveled octagonal prism body
        const bodyGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
        bodyGrad.addColorStop(0, primary);
        bodyGrad.addColorStop(1, isDark ? '#544EA8' : '#A9A4F5');
        ctx.fillStyle = bodyGrad;
        drawRegularPolygon(ctx, 8, radius);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.65)';
        ctx.stroke();

        // Concentric dark dial + 4-point star
        ctx.fillStyle = '#18181D';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = highlight;
        drawFourPointStar(ctx, radius * 0.16, radius * 0.055);
        ctx.fill();

        // Tilted apricot accent ring
        ctx.save();
        ctx.rotate(-0.38 + Math.sin(elapsedSim * 0.7) * 0.15);
        ctx.strokeStyle = highlight;
        ctx.lineWidth = Math.max(3, radius * 0.085);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.42, radius * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      }

      // 3. Cinema Reel Camera Sculpture
      {
        const c = project(
          pose.cinema.position.x,
          pose.cinema.position.y,
          pose.cinema.position.z,
          pose.cameraPosition.x,
          pose.cameraPosition.y,
        );
        const s = 74 * pose.cinema.scale * c.pScale;

        ctx.save();
        ctx.translate(c.sx, c.sy);
        ctx.rotate(pose.cinema.rotation.z * 0.65 + 0.12);

        // Twin top film reels
        ctx.fillStyle = primary;
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.arc(-s * 0.42, -s * 0.85, s * 0.36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(s * 0.25, -s * 0.76, s * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Chamfered obsidian camera body
        ctx.globalAlpha = 0.96;
        ctx.fillStyle = isDark ? '#272730' : '#353540';
        drawRoundedRect(ctx, -s * 0.95, -s * 0.56, s * 1.9, s * 1.15, s * 0.28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Lens barrel + aperture ring
        ctx.fillStyle = '#D6D6DF';
        ctx.beginPath();
        ctx.arc(s * 0.12, 0, s * 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = highlight;
        ctx.lineWidth = Math.max(2.5, s * 0.08);
        ctx.beginPath();
        ctx.arc(s * 0.12, 0, s * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#141418';
        ctx.beginPath();
        ctx.arc(s * 0.12, 0, s * 0.27, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 4. Swiss Grid Totem Monolith
      {
        const t = project(
          pose.totem.position.x,
          pose.totem.position.y,
          pose.totem.position.z,
          pose.cameraPosition.x,
          pose.cameraPosition.y,
        );
        const ts = 68 * pose.totem.scale * t.pScale;

        ctx.save();
        ctx.translate(t.sx, t.sy);
        ctx.rotate(pose.totem.rotation.z * 0.65);

        ctx.fillStyle = isDark ? '#1D1D24' : '#FFFFFF';
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,17,0.12)';
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, -ts * 0.72, -ts * 1.05, ts * 1.44, ts * 2.1, ts * 0.22);
        ctx.fill();
        ctx.stroke();

        // Mini Bento Grid blocks inside the monolith
        ctx.fillStyle = primary;
        drawRoundedRect(ctx, -ts * 0.54, -ts * 0.85, ts * 0.6, ts * 0.95, ts * 0.1);
        ctx.fill();
        ctx.fillStyle = secondary;
        drawRoundedRect(ctx, ts * 0.14, -ts * 0.85, ts * 0.4, ts * 0.42, ts * 0.1);
        ctx.fill();
        ctx.fillStyle = highlight;
        drawRoundedRect(ctx, ts * 0.14, -ts * 0.34, ts * 0.4, ts * 0.44, ts * 0.1);
        ctx.fill();

        ctx.restore();
      }
    }

    frameId = window.requestAnimationFrame(renderFrame);
  };

  renderFrame();

  return () => {
    disposed = true;
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', handlePointerMove);
    if (canvas.parentNode === container) {
      container.removeChild(canvas);
    }
  };
}
