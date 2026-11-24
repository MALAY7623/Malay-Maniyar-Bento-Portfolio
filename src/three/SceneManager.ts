import * as THREE from 'three';
import type { ThemePalette } from '../types/portfolio';
import type { ThemeMode } from '../utils/themeMode';
import { computeScrollChoreography, type AssemblyTargetPose } from '../utils/threeScrollChoreography';
import { acquireSafeWebGL2Context } from '../utils/webglCapabilities';
import {
  getResponsiveSceneProfile,
  type ResponsiveSceneProfile,
} from '../utils/responsiveSceneConfig';
import { createProceduralTextureBundle } from './proceduralTextures';
import { createEditorialSculptureRig, type StageAccentColors } from './sculpturalModels';
import { LightingManager } from './LightingManager';
import { CameraController } from './CameraController';
import { ScrollAnimationController } from './ScrollAnimationController';
import { mountCanvas2dFallbackStage, type FallbackStageLiveState } from './canvas2dFallbackStage';

export interface SceneManagerLiveState extends FallbackStageLiveState {
  themeMode: ThemeMode;
  siteTheme: ThemePalette;
}

export interface MountedSceneHandle {
  updatePalette: (colors: StageAccentColors) => void;
  dispose: () => void;
}

function getNormalizedScrollProgress(): number {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return Math.max(0, Math.min(1, window.scrollY / maxScroll));
}

function dampGroupTransform(
  group: THREE.Group,
  target: AssemblyTargetPose,
  scaleMultiplier: number,
  lambda: number,
  dt: number,
): void {
  group.position.x = THREE.MathUtils.damp(group.position.x, target.position.x, lambda, dt);
  group.position.y = THREE.MathUtils.damp(group.position.y, target.position.y, lambda, dt);
  group.position.z = THREE.MathUtils.damp(group.position.z, target.position.z, lambda, dt);
  group.rotation.x = THREE.MathUtils.damp(group.rotation.x, target.rotation.x, lambda, dt);
  group.rotation.y = THREE.MathUtils.damp(group.rotation.y, target.rotation.y, lambda, dt);
  group.rotation.z = THREE.MathUtils.damp(group.rotation.z, target.rotation.z, lambda, dt);
  const nextScale = THREE.MathUtils.damp(
    group.scale.x,
    target.scale * scaleMultiplier,
    lambda,
    dt,
  );
  group.scale.setScalar(nextScale);
}

/**
 * Orchestrates the complete Three.js + GSAP ScrollTrigger editorial 3D stage:
 * - Safe WebGL2 pre-check & acquisition (zero Three.js errors on legacy GPUs)
 * - Automatic 2D Canvas scroll-choreography fallback on unsupported/lost WebGL2
 * - Modular LightingManager, CameraController, ScrollAnimationController & ResponsiveSceneProfile
 * - Visibility-aware rendering pause & software-WebGL afterDraw(tick) pacing
 */
export function mountEditorialSceneManager(
  container: HTMLDivElement,
  liveStateRef: { current: SceneManagerLiveState },
  onReady: () => void,
): MountedSceneHandle {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  liveStateRef.current.reducedMotion = motionQuery.matches;
  const handleMotionPrefChange = (e: MediaQueryListEvent) => {
    liveStateRef.current.reducedMotion = e.matches;
  };
  motionQuery.addEventListener('change', handleMotionPrefChange);

  const scrollController = new ScrollAnimationController();

  // Safely probe and acquire WebGL2 BEFORE constructing THREE.WebGLRenderer
  const targetCanvas = document.createElement('canvas');
  const acquired = acquireSafeWebGL2Context(targetCanvas);

  if (!acquired) {
    const unmountFallback = mountCanvas2dFallbackStage(
      container,
      liveStateRef,
      () => scrollController.getProgress(),
    );
    onReady();
    return {
      updatePalette: () => {
        // 2D fallback reads liveStateRef directly on every frame
      },
      dispose: () => {
        motionQuery.removeEventListener('change', handleMotionPrefChange);
        scrollController.dispose();
        unmountFallback();
      },
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
      () => scrollController.getProgress(),
    );
    onReady();
    return {
      updatePalette: () => {},
      dispose: () => {
        motionQuery.removeEventListener('change', handleMotionPrefChange);
        scrollController.dispose();
        unmountFallback();
      },
    };
  }

  let responsiveProfile: ResponsiveSceneProfile = getResponsiveSceneProfile(
    window.innerWidth,
    isSoftwareGl,
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, responsiveProfile.maxPixelRatio),
  );
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.setAttribute('data-testid', 'three-scroll-canvas');
  renderer.domElement.setAttribute('data-renderer-mode', 'webgl2');
  renderer.domElement.setAttribute('data-viewport-tier', responsiveProfile.tier);

  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const initialAccentColors: StageAccentColors = {
    primaryAccent: liveStateRef.current.siteTheme.primaryAccent,
    secondaryAccent: liveStateRef.current.siteTheme.secondaryAccent,
    highlightAccent: liveStateRef.current.siteTheme.highlightAccent,
    isDarkMode: liveStateRef.current.themeMode === 'dark',
  };
  const initialBgHex =
    liveStateRef.current.themeMode === 'dark'
      ? '#08080A'
      : liveStateRef.current.siteTheme.canvasBg;

  const lightingManager = new LightingManager(
    scene,
    renderer,
    initialAccentColors,
    initialBgHex,
    isSoftwareGl,
  );

  const cameraController = new CameraController(
    window.innerWidth,
    window.innerHeight,
    responsiveProfile,
    liveStateRef.current.reducedMotion,
  );

  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const textures = createProceduralTextureBundle(maxAnisotropy);
  const rig = createEditorialSculptureRig(initialAccentColors, textures, isSoftwareGl);
  rig.particleMesh.count = responsiveProfile.particleCount;
  scene.add(rig.prismGroup, rig.cinemaGroup, rig.totemGroup, rig.particleMesh);

  // Seed initial poses cleanly so first rendered frame never pops
  const initialProgress = scrollController.getProgress();
  const initialPose = computeScrollChoreography(
    initialProgress,
    0,
    0,
    0,
    liveStateRef.current.stagePreview,
    liveStateRef.current.reducedMotion,
  );
  cameraController.seedPosition(initialPose.cameraPosition, initialPose.cameraLookAt);

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
    renderer.compile(scene, cameraController.camera);
  }
  onReady();

  // Pointer parallax, responsive resize & tab-visibility listeners
  const handlePointerMove = (event: PointerEvent) => {
    liveStateRef.current.pointerX = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    liveStateRef.current.pointerY = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
  };

  const handleResize = () => {
    const w = window.innerWidth;
    const h = Math.max(1, window.innerHeight);
    responsiveProfile = getResponsiveSceneProfile(w, isSoftwareGl);
    cameraController.updateResponsiveProfile(w, h, responsiveProfile);
    rig.particleMesh.count = responsiveProfile.particleCount;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, responsiveProfile.maxPixelRatio));
    renderer.setSize(w, h);
    renderer.domElement.setAttribute('data-viewport-tier', responsiveProfile.tier);
    scrollController.refresh();
  };

  let isDocumentHidden = document.visibilityState === 'hidden';
  const handleVisibilityChange = () => {
    isDocumentHidden = document.visibilityState === 'hidden';
  };

  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Exponentially damped render loop with software-WebGL afterDraw(tick) pacing
  let disposed = false;
  let frameId = 0;
  let lastTime = performance.now();
  let elapsedSim = 0;
  let dampedScroll = initialProgress;
  let dampedPointerX = 0;
  let dampedPointerY = 0;
  let dampedPrismSpread = initialPose.prism.orbitSpread;
  let dampedCinemaSpread = initialPose.cinema.orbitSpread;
  let dampedTotemSpread = initialPose.totem.orbitSpread;

  const afterDraw = (cb: () => void) => {
    const context = renderer.getContext() as WebGL2RenderingContext;
    if (typeof context.fenceSync === 'function') {
      const sync = context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE, 0);
      context.flush();
      const poll = () => {
        if (disposed) {
          if (sync) context.deleteSync(sync);
          return;
        }
        const state = sync ? context.getSyncParameter(sync, context.SYNC_STATUS) : context.SIGNALED;
        if (state === context.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) context.deleteSync(sync);
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

    if (!state.disabled && !isDocumentHidden) {
      if (!state.isPaused && !state.reducedMotion) {
        elapsedSim += dt;
      }

      const targetScroll = scrollController.getProgress();
      dampedScroll = THREE.MathUtils.damp(dampedScroll, targetScroll, 6.2, dt);

      const parallaxGain = responsiveProfile.parallaxGain;
      dampedPointerX = THREE.MathUtils.damp(dampedPointerX, state.pointerX * parallaxGain, 4.5, dt);
      dampedPointerY = THREE.MathUtils.damp(dampedPointerY, state.pointerY * parallaxGain, 4.5, dt);

      const pose = computeScrollChoreography(
        dampedScroll,
        elapsedSim,
        dampedPointerX,
        dampedPointerY,
        state.stagePreview,
        state.reducedMotion || state.isPaused,
      );

      // Update camera via CameraController + GSAP ScrollTrigger dolly/roll signal
      const signal = scrollController.signal;
      cameraController.update(
        pose.cameraPosition,
        pose.cameraLookAt,
        state.reducedMotion ? 0 : signal.cameraDolly,
        state.reducedMotion ? 0 : signal.cameraRoll,
        dt,
      );

      // Update studio lighting & horizon fog atmosphere dynamically
      const targetHex = state.themeMode === 'dark' ? '#08080A' : state.siteTheme.canvasBg;
      lightingManager.updateAtmosphere(
        targetHex,
        dampedScroll,
        cameraController.camera.position.y,
        signal.lightWarmth,
        dt,
      );

      // Update composite 3-assembly sculptural choreography
      const scaleMult = responsiveProfile.sculptureScaleMultiplier;
      dampGroupTransform(rig.prismGroup, pose.prism, scaleMult, 5.0, dt);
      dampGroupTransform(rig.cinemaGroup, pose.cinema, scaleMult, 5.0, dt);
      dampGroupTransform(rig.totemGroup, pose.totem, scaleMult, 5.0, dt);

      dampedPrismSpread = THREE.MathUtils.damp(dampedPrismSpread, pose.prism.orbitSpread, 4.6, dt);
      dampedCinemaSpread = THREE.MathUtils.damp(
        dampedCinemaSpread,
        pose.cinema.orbitSpread,
        4.6,
        dt,
      );
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

      renderer.domElement.setAttribute('data-chapter', String(signal.chapterIndex));
      renderer.render(scene, cameraController.camera);
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

  return {
    updatePalette: (colors: StageAccentColors) => {
      rig.updatePalette(colors);
      lightingManager.updatePalette(colors);
    },
    dispose: () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost, false);
      motionQuery.removeEventListener('change', handleMotionPrefChange);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      fallbackCleanup?.();
      scrollController.dispose();
      cameraController.dispose();
      lightingManager.dispose();
      rig.dispose();
      textures.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
