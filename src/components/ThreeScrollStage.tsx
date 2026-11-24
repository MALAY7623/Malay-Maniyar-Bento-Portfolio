import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Eye, EyeOff, Pause, Play } from 'lucide-react';
import type { ThemePalette } from '../types/portfolio';
import type { ThemeMode } from '../utils/themeMode';
import { computeScrollChoreography } from '../utils/threeScrollChoreography';
import { acquireSafeWebGL2Context } from '../utils/webglCapabilities';
import { createProceduralTextureBundle } from '../three/proceduralTextures';
import { createEditorialSculptureRig, type EditorialSculptureRig } from '../three/sculpturalModels';
import { mountCanvas2dFallbackStage } from '../three/canvas2dFallbackStage';

interface ThreeScrollStageProps {
  themeMode: ThemeMode;
  siteTheme: ThemePalette;
  disabled?: boolean;
  stagePreview: boolean;
  onToggleStagePreview: () => void;
}

// Module-scope pre-allocated scratch vectors (zero GC allocations in animation loop)
const _camLookAt = new THREE.Vector3(0, 0.6, 0);
const _bgColor = new THREE.Color();
const _targetBgColor = new THREE.Color();

function getNormalizedScrollProgress(): number {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return Math.max(0, Math.min(1, window.scrollY / maxScroll));
}

export function ThreeScrollStage({
  themeMode,
  siteTheme,
  disabled = false,
  stagePreview,
  onToggleStagePreview,
}: ThreeScrollStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<EditorialSculptureRig | null>(null);
  const fogRef = useRef<THREE.FogExp2 | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(true);
  const [webglReady, setWebglReady] = useState(false);

  // Mutable live refs so React state updates never tear down the WebGL context
  const liveStateRef = useRef({
    themeMode,
    siteTheme,
    stagePreview,
    isPaused,
    disabled,
    pointerX: 0,
    pointerY: 0,
    reducedMotion: false,
  });

  liveStateRef.current.themeMode = themeMode;
  liveStateRef.current.siteTheme = siteTheme;
  liveStateRef.current.stagePreview = stagePreview;
  liveStateRef.current.isPaused = isPaused;
  liveStateRef.current.disabled = disabled;

  // Synchronize materials & scene atmosphere smoothly on theme or CMS palette updates
  useEffect(() => {
    const isDark = themeMode === 'dark';
    rigRef.current?.updatePalette({
      primaryAccent: siteTheme.primaryAccent,
      secondaryAccent: siteTheme.secondaryAccent,
      highlightAccent: siteTheme.highlightAccent,
      isDarkMode: isDark,
    });

    if (rimLightRef.current) {
      rimLightRef.current.color.set(siteTheme.primaryAccent);
    }
    if (keyLightRef.current) {
      keyLightRef.current.intensity = isDark ? 2.15 : 2.35;
    }
  }, [themeMode, siteTheme]);

  // Mount WebGL renderer ONCE in an isolated empty ref container
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    liveStateRef.current.reducedMotion = motionQuery.matches;
    const handleMotionPrefChange = (e: MediaQueryListEvent) => {
      liveStateRef.current.reducedMotion = e.matches;
    };
    motionQuery.addEventListener('change', handleMotionPrefChange);

    // Safely probe and acquire WebGL2 BEFORE touching THREE.WebGLRenderer.
    // On legacy/blocklisted GPUs (e.g., Intel Direct3D9Ex), WebGL2 returns null cleanly
    // so Three.js never logs WebGL context creation errors and our 2D Canvas stage takes over.
    const targetCanvas = document.createElement('canvas');
    const acquired = acquireSafeWebGL2Context(targetCanvas);

    if (!acquired) {
      const unmountFallback = mountCanvas2dFallbackStage(
        container,
        liveStateRef,
        getNormalizedScrollProgress,
      );
      setWebglReady(true);
      return () => {
        motionQuery.removeEventListener('change', handleMotionPrefChange);
        unmountFallback();
      };
    }

    const { gl, isSoftwareGl } = acquired;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: targetCanvas,
        context: gl,
        antialias: !isSoftwareGl,
        alpha: true,
      });
    } catch {
      const unmountFallback = mountCanvas2dFallbackStage(
        container,
        liveStateRef,
        getNormalizedScrollProgress,
      );
      setWebglReady(true);
      return () => {
        motionQuery.removeEventListener('change', handleMotionPrefChange);
        unmountFallback();
      };
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.setAttribute('data-testid', 'three-scroll-canvas');
    renderer.domElement.setAttribute('data-renderer-mode', 'webgl2');

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialBgHex =
      liveStateRef.current.themeMode === 'dark'
        ? '#08080A'
        : liveStateRef.current.siteTheme.canvasBg;
    _bgColor.set(initialBgHex);
    scene.background = _bgColor;
    const fog = new THREE.FogExp2(initialBgHex, 0.036);
    scene.fog = fog;
    fogRef.current = fog;

    // Mandatory Procedural Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRenderTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.1,
      60,
    );
    camera.position.set(0, 1.2, 9.4);

    // Warm/Cool Studio 3-Point Lighting Rig (<= 1 shadow caster, tight shadow frustum)
    const hemiLight = new THREE.HemisphereLight('#D4E2FF', '#282634', 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFF4E2', 2.25);
    keyLight.position.set(6, 9, 8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const rimLight = new THREE.DirectionalLight(liveStateRef.current.siteTheme.primaryAccent, 1.15);
    rimLight.position.set(-7, 2, -5);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Procedural Textures & Composite 3-Assembly Editorial Sculptural Rig
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const textures = createProceduralTextureBundle(maxAnisotropy);
    const rig = createEditorialSculptureRig(
      {
        primaryAccent: liveStateRef.current.siteTheme.primaryAccent,
        secondaryAccent: liveStateRef.current.siteTheme.secondaryAccent,
        highlightAccent: liveStateRef.current.siteTheme.highlightAccent,
        isDarkMode: liveStateRef.current.themeMode === 'dark',
      },
      textures,
      isSoftwareGl,
    );
    rigRef.current = rig;

    scene.add(rig.prismGroup, rig.cinemaGroup, rig.totemGroup, rig.particleMesh);

    // Seed initial poses cleanly at mount so first frame never jumps
    const initialPose = computeScrollChoreography(
      getNormalizedScrollProgress(),
      0,
      0,
      0,
      liveStateRef.current.stagePreview,
      liveStateRef.current.reducedMotion,
    );
    camera.position.set(
      initialPose.cameraPosition.x,
      initialPose.cameraPosition.y,
      initialPose.cameraPosition.z,
    );
    _camLookAt.set(
      initialPose.cameraLookAt.x,
      initialPose.cameraLookAt.y,
      initialPose.cameraLookAt.z,
    );
    camera.lookAt(_camLookAt);

    rig.prismGroup.position.set(
      initialPose.prism.position.x,
      initialPose.prism.position.y,
      initialPose.prism.position.z,
    );
    rig.cinemaGroup.position.set(
      initialPose.cinema.position.x,
      initialPose.cinema.position.y,
      initialPose.cinema.position.z,
    );
    rig.totemGroup.position.set(
      initialPose.totem.position.x,
      initialPose.totem.position.y,
      initialPose.totem.position.z,
    );

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    setWebglReady(true);

    // Pointer parallax & window resize listeners
    const handlePointerMove = (event: PointerEvent) => {
      liveStateRef.current.pointerX = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      liveStateRef.current.pointerY = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = Math.max(1, window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Exponentially damped 60fps loop with software-WebGL afterDraw(tick) pacing
    let disposed = false;
    let frameId = 0;
    let lastTime = performance.now();
    let elapsedSim = 0;
    let dampedScroll = getNormalizedScrollProgress();
    let dampedPointerX = 0;
    let dampedPointerY = 0;
    let dampedPrismSpread = initialPose.prism.orbitSpread;
    let dampedCinemaSpread = initialPose.cinema.orbitSpread;
    let dampedTotemSpread = initialPose.totem.orbitSpread;

    const dampGroupTransform = (
      group: THREE.Group,
      target: ReturnType<typeof computeScrollChoreography>['prism'],
      lambda: number,
      dt: number,
    ) => {
      group.position.x = THREE.MathUtils.damp(group.position.x, target.position.x, lambda, dt);
      group.position.y = THREE.MathUtils.damp(group.position.y, target.position.y, lambda, dt);
      group.position.z = THREE.MathUtils.damp(group.position.z, target.position.z, lambda, dt);
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, target.rotation.x, lambda, dt);
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, target.rotation.y, lambda, dt);
      group.rotation.z = THREE.MathUtils.damp(group.rotation.z, target.rotation.z, lambda, dt);
      const nextScale = THREE.MathUtils.damp(group.scale.x, target.scale, lambda, dt);
      group.scale.setScalar(nextScale);
    };

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min(0.06, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const state = liveStateRef.current;

      if (!state.disabled) {
        if (!state.isPaused && !state.reducedMotion) {
          elapsedSim += dt;
        }

        // Smooth scroll progress & pointer parallax via exponential damping
        const targetScroll = getNormalizedScrollProgress();
        dampedScroll = THREE.MathUtils.damp(dampedScroll, targetScroll, 6.2, dt);
        dampedPointerX = THREE.MathUtils.damp(dampedPointerX, state.pointerX, 4.5, dt);
        dampedPointerY = THREE.MathUtils.damp(dampedPointerY, state.pointerY, 4.5, dt);

        // Smooth theme background + fog color blend
        const targetHex = state.themeMode === 'dark' ? '#08080A' : state.siteTheme.canvasBg;
        _targetBgColor.set(targetHex);
        _bgColor.lerp(_targetBgColor, 1 - Math.exp(-7 * dt));
        fog.color.copy(_bgColor);

        const pose = computeScrollChoreography(
          dampedScroll,
          elapsedSim,
          dampedPointerX,
          dampedPointerY,
          state.stagePreview,
          state.reducedMotion || state.isPaused,
        );

        // Damped camera glide
        camera.position.x = THREE.MathUtils.damp(camera.position.x, pose.cameraPosition.x, 4.8, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, pose.cameraPosition.y, 4.8, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, pose.cameraPosition.z, 4.8, dt);

        _camLookAt.x = THREE.MathUtils.damp(_camLookAt.x, pose.cameraLookAt.x, 5.2, dt);
        _camLookAt.y = THREE.MathUtils.damp(_camLookAt.y, pose.cameraLookAt.y, 5.2, dt);
        _camLookAt.z = THREE.MathUtils.damp(_camLookAt.z, pose.cameraLookAt.z, 5.2, dt);
        camera.lookAt(_camLookAt);

        // Damped 3-assembly choreography
        dampGroupTransform(rig.prismGroup, pose.prism, 5.0, dt);
        dampGroupTransform(rig.cinemaGroup, pose.cinema, 5.0, dt);
        dampGroupTransform(rig.totemGroup, pose.totem, 5.0, dt);

        dampedPrismSpread = THREE.MathUtils.damp(dampedPrismSpread, pose.prism.orbitSpread, 4.6, dt);
        dampedCinemaSpread = THREE.MathUtils.damp(dampedCinemaSpread, pose.cinema.orbitSpread, 4.6, dt);
        dampedTotemSpread = THREE.MathUtils.damp(dampedTotemSpread, pose.totem.orbitSpread, 4.6, dt);

        rig.updateInternalMotion(
          dampedPrismSpread,
          dampedCinemaSpread,
          dampedTotemSpread,
          dampedScroll,
          elapsedSim,
          state.reducedMotion || state.isPaused,
        );

        // Particle field vertical parallax & subtle twist
        rig.particleMesh.position.y = THREE.MathUtils.damp(
          rig.particleMesh.position.y,
          pose.particleDriftY * 0.28,
          4.2,
          dt,
        );
        rig.particleMesh.rotation.y = THREE.MathUtils.damp(
          rig.particleMesh.rotation.y,
          pose.particleTwist,
          3.8,
          dt,
        );

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    let fallbackCleanup: (() => void) | null = null;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (disposed || fallbackCleanup) return;
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      fallbackCleanup = mountCanvas2dFallbackStage(
        container,
        liveStateRef,
        getNormalizedScrollProgress,
      );
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost, false);
      motionQuery.removeEventListener('change', handleMotionPrefChange);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      rigRef.current = null;
      fogRef.current = null;
      keyLightRef.current = null;
      rimLightRef.current = null;
      fallbackCleanup?.();
      rig.dispose();
      textures.dispose();
      envRenderTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (disabled) return null;

  const isDark = themeMode === 'dark';
  const dockBg = isDark ? 'rgba(20, 20, 26, 0.94)' : 'rgba(255, 255, 255, 0.94)';
  const dockBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(17, 17, 17, 0.12)';
  const dockText = isDark ? '#F5F5F7' : '#111111';
  const dockMuted = isDark ? '#A1A1AA' : '#55555B';

  return (
    <>
      {/* Isolated Full-Bleed WebGL Canvas Container (Zero React children inside) */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden"
      />

      {/* Compact Collapsible Bottom-Right 3D Stage Dock (No backdrop-filter over WebGL) */}
      {webglReady && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1.5">
          <button
            type="button"
            data-testid="three-dock-toggle"
            onClick={() => setDockCollapsed((prev) => !prev)}
            aria-expanded={!dockCollapsed}
            aria-label={dockCollapsed ? 'Expand 3D scroll stage controls' : 'Collapse 3D scroll stage controls'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border shadow-md transition-transform duration-200 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: dockBg,
              borderColor: dockBorder,
              color: dockText,
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--periwinkle)' }}
              aria-hidden="true"
            />
            <span>3D Stage</span>
            {dockCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {!dockCollapsed && (
            <div
              role="region"
              aria-label="Three.js 3D scroll stage controls"
              className="flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-lg"
              style={{
                backgroundColor: dockBg,
                borderColor: dockBorder,
                color: dockText,
              }}
            >
              <button
                type="button"
                data-testid="three-stage-preview-btn"
                onClick={onToggleStagePreview}
                aria-pressed={stagePreview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                style={
                  stagePreview
                    ? { backgroundColor: 'var(--periwinkle)', color: '#FFFFFF' }
                    : { color: dockText }
                }
              >
                {stagePreview ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Show Portfolio</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Inspect 3D</span>
                  </>
                )}
              </button>

              <span
                aria-hidden="true"
                className="w-px h-4"
                style={{ backgroundColor: dockBorder }}
              />

              <button
                type="button"
                data-testid="three-motion-toggle-btn"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-pressed={isPaused}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                style={{ color: isPaused ? 'var(--periwinkle)' : dockMuted }}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
