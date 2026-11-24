import * as THREE from 'three';
import gsap from 'gsap';
import type { ResponsiveSceneProfile } from '../utils/responsiveSceneConfig';
import type { Vec3Tuple } from '../utils/threeScrollChoreography';

// Module-scope scratch vectors (zero allocations inside animation loop)
const _camLookAt = new THREE.Vector3(0, 0.6, 0);

/**
 * Manages the Three.js PerspectiveCamera with a cinematic GSAP load-in dolly,
 * scroll-driven position/dolly/roll choreography, and non-conflicting additive
 * pointer parallax using frame-rate independent exponential damping.
 */
export class CameraController {
  public readonly camera: THREE.PerspectiveCamera;
  private readonly introState = { dollyZ: 2.2, liftY: 0.45 };
  private introTween: gsap.core.Tween | null = null;
  private profile: ResponsiveSceneProfile;

  constructor(
    initialWidth: number,
    initialHeight: number,
    profile: ResponsiveSceneProfile,
    reducedMotion: boolean,
  ) {
    this.profile = profile;
    this.camera = new THREE.PerspectiveCamera(
      profile.fov,
      initialWidth / Math.max(1, initialHeight),
      0.1,
      65,
    );

    if (reducedMotion) {
      this.introState.dollyZ = 0;
      this.introState.liftY = 0;
    } else {
      // Smooth cinematic opening dolly-in on initial page load
      this.introTween = gsap.to(this.introState, {
        dollyZ: 0,
        liftY: 0,
        duration: 1.45,
        ease: 'power3.out',
      });
    }
  }

  public seedPosition(position: Vec3Tuple, lookAt: Vec3Tuple): void {
    this.camera.position.set(
      position.x,
      position.y + this.introState.liftY,
      position.z + this.profile.cameraDistanceOffset + this.introState.dollyZ,
    );
    _camLookAt.set(lookAt.x, lookAt.y, lookAt.z);
    this.camera.lookAt(_camLookAt);
  }

  public updateResponsiveProfile(
    width: number,
    height: number,
    profile: ResponsiveSceneProfile,
  ): void {
    this.profile = profile;
    this.camera.fov = profile.fov;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  public update(
    targetPosition: Vec3Tuple,
    targetLookAt: Vec3Tuple,
    cameraDollyOffset: number,
    scrollRoll: number,
    dt: number,
  ): void {
    const desiredX = targetPosition.x;
    const desiredY = targetPosition.y + this.introState.liftY;
    const desiredZ =
      targetPosition.z +
      this.profile.cameraDistanceOffset +
      this.introState.dollyZ +
      cameraDollyOffset;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, desiredX, 4.8, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, desiredY, 4.8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, desiredZ, 4.8, dt);

    _camLookAt.x = THREE.MathUtils.damp(_camLookAt.x, targetLookAt.x, 5.2, dt);
    _camLookAt.y = THREE.MathUtils.damp(_camLookAt.y, targetLookAt.y, 5.2, dt);
    _camLookAt.z = THREE.MathUtils.damp(_camLookAt.z, targetLookAt.z, 5.2, dt);

    this.camera.lookAt(_camLookAt);
    this.camera.rotation.z += scrollRoll;
  }

  public dispose(): void {
    this.introTween?.kill();
    this.introTween = null;
  }
}
