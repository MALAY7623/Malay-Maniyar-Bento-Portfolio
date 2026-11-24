/**
 * Pure WebGL2 capability classification & safe context acquisition helpers.
 * Prevents Three.js WebGLRenderer from ever logging console errors on
 * legacy/blocklisted GPUs (e.g. Intel HD Graphics Direct3D9Ex vs_3_0/ps_3_0)
 * where WebGL2 context creation is unavailable.
 */

const SOFTWARE_RENDERER_PATTERN =
  /SwiftShader|llvmpipe|softpipe|Software|Basic Render|WARP|Direct3D9|ps_3_0|vs_3_0/i;

export function isSoftwareRendererString(rendererName: string): boolean {
  if (!rendererName) return true;
  return SOFTWARE_RENDERER_PATTERN.test(rendererName);
}

export function selectWebGL2ContextAttempts(isSoftwareGl: boolean): WebGLContextAttributes[] {
  if (isSoftwareGl) {
    return [
      { alpha: true, antialias: false, powerPreference: 'default', depth: true, stencil: false },
      { alpha: true, antialias: false, depth: true },
    ];
  }
  return [
    {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      depth: true,
      stencil: false,
    },
    { alpha: true, antialias: true, powerPreference: 'default', depth: true, stencil: false },
    { alpha: true, antialias: false, powerPreference: 'default', depth: true },
  ];
}

export interface AcquiredWebGL2Result {
  gl: WebGL2RenderingContext;
  isSoftwareGl: boolean;
  rendererName: string;
}

function readRendererName(gl: WebGL2RenderingContext): string {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    return String(gl.getParameter(param) || '');
  } catch {
    return '';
  }
}

function tryGetWebGL2(
  canvas: HTMLCanvasElement,
  attrs: WebGLContextAttributes,
): WebGL2RenderingContext | null {
  try {
    const ctx = canvas.getContext('webgl2', attrs);
    if (!ctx) return null;
    if (typeof WebGL2RenderingContext !== 'undefined' && !(ctx instanceof WebGL2RenderingContext)) {
      return null;
    }
    if (typeof ctx.isContextLost === 'function' && ctx.isContextLost()) {
      return null;
    }
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Safely probes WebGL2 support and acquires a ready-to-use WebGL2 context for
 * the target canvas. Returns null cleanly (without invoking THREE.WebGLRenderer)
 * when WebGL2 is unavailable or blocklisted on the user's GPU.
 */
export function acquireSafeWebGL2Context(
  targetCanvas: HTMLCanvasElement,
): AcquiredWebGL2Result | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  if (typeof WebGL2RenderingContext === 'undefined') {
    return null;
  }

  // Step 1: Lightweight probe to detect WebGL2 availability & software renderer string
  const probeCanvas = document.createElement('canvas');
  probeCanvas.width = 1;
  probeCanvas.height = 1;
  const probeGl = tryGetWebGL2(probeCanvas, {
    alpha: true,
    antialias: false,
    powerPreference: 'default',
  });

  if (!probeGl) {
    return null;
  }

  const rendererName = readRendererName(probeGl);
  const isSoftwareGl = isSoftwareRendererString(rendererName);
  try {
    probeGl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    // Ignore probe cleanup errors
  }

  // Step 2: Acquire the real WebGL2 context using ordered safe attribute attempts
  const attempts = selectWebGL2ContextAttempts(isSoftwareGl);
  for (const attrs of attempts) {
    const gl = tryGetWebGL2(targetCanvas, attrs);
    if (gl) {
      return { gl, isSoftwareGl, rendererName };
    }
  }

  return null;
}
