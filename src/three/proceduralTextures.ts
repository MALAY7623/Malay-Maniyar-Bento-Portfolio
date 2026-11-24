import * as THREE from 'three';

export interface ProceduralTextureBundle {
  brushedRoughness: THREE.CanvasTexture;
  ceramicBump: THREE.CanvasTexture;
  dialAlbedo: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates an anisotropic directional brushed-metal roughness map (linear space).
 */
function createBrushedMetalRoughnessMap(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#383838';
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 1) {
      const lum = 44 + Math.floor(((Math.sin(y * 0.73) + Math.cos(y * 1.91)) * 0.5 + 0.5) * 38);
      ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
      ctx.fillRect(0, y, 256, 1);
    }

    // Subtle fine machining streaks
    for (let i = 0; i < 180; i += 1) {
      const y = (i * 47) % 256;
      const alpha = 0.04 + (i % 5) * 0.015;
      ctx.fillStyle = i % 2 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
      ctx.fillRect(0, y, 256, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a subtle tactile ceramic / archival print micro-stipple bump map (linear space).
 */
function createCeramicBumpMap(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    // Deterministic pseudo-random tactile stipple
    let seed = 1337;
    const nextRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 4200; i += 1) {
      const x = Math.floor(nextRand() * 256);
      const y = Math.floor(nextRand() * 256);
      const v = 112 + Math.floor(nextRand() * 34);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a crisp Swiss editorial concentric aperture dial texture (sRGB albedo).
 */
function createStudioDialAlbedo(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#18181D';
    ctx.fillRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;

    // Concentric precision rings
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    [220, 178, 128, 72].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 36 radial precision graduation ticks
    for (let i = 0; i < 36; i += 1) {
      const angle = (i / 36) * Math.PI * 2;
      const isMajor = i % 3 === 0;
      const rInner = isMajor ? 186 : 198;
      const rOuter = 216;
      ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.28)';
      ctx.lineWidth = isMajor ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
      ctx.lineTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
      ctx.stroke();
    }

    // Center four-point editorial star mark
    ctx.fillStyle = '#FFC966';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 26);
    ctx.quadraticCurveTo(cx + 4, cy - 4, cx + 26, cy);
    ctx.quadraticCurveTo(cx + 4, cy + 4, cx, cy + 26);
    ctx.quadraticCurveTo(cx - 4, cy + 4, cx - 26, cy);
    ctx.quadraticCurveTo(cx - 4, cy - 4, cx, cy - 26);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a soft radial contact shadow texture for grounding 3D assemblies.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, 'rgba(10, 10, 14, 0.55)');
    grad.addColorStop(0.45, 'rgba(10, 10, 14, 0.22)');
    grad.addColorStop(1, 'rgba(10, 10, 14, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextureBundle(maxAnisotropy: number): ProceduralTextureBundle {
  const brushedRoughness = createBrushedMetalRoughnessMap(maxAnisotropy);
  const ceramicBump = createCeramicBumpMap(maxAnisotropy);
  const dialAlbedo = createStudioDialAlbedo(maxAnisotropy);
  const contactShadow = createContactShadowTexture();

  return {
    brushedRoughness,
    ceramicBump,
    dialAlbedo,
    contactShadow,
    dispose: () => {
      brushedRoughness.dispose();
      ceramicBump.dispose();
      dialAlbedo.dispose();
      contactShadow.dispose();
    },
  };
}
