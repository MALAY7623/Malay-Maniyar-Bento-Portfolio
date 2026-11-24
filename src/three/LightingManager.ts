import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { StageAccentColors } from './sculpturalModels';

const _bgColor = new THREE.Color();
const _targetBgColor = new THREE.Color();
const _accentColor = new THREE.Color();
const _accentPrimary = new THREE.Color();
const _accentSecondary = new THREE.Color();
const _accentHighlight = new THREE.Color();

/**
 * Manages studio PBR lighting, RoomEnvironment IBL reflections,
 * dynamic scroll-reactive chapter accent lighting, and horizon-matched fog.
 */
export class LightingManager {
  public readonly hemiLight: THREE.HemisphereLight;
  public readonly keyLight: THREE.DirectionalLight;
  public readonly rimLight: THREE.DirectionalLight;
  public readonly chapterPointLight: THREE.PointLight;
  public readonly fog: THREE.FogExp2;

  private readonly envRenderTarget: THREE.WebGLRenderTarget;
  private isDarkMode: boolean;

  constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    initialColors: StageAccentColors,
    initialBgHex: string,
    isSoftwareGl: boolean,
  ) {
    this.isDarkMode = initialColors.isDarkMode;

    _bgColor.set(initialBgHex);
    scene.background = _bgColor;
    this.fog = new THREE.FogExp2(initialBgHex, 0.034);
    scene.fog = this.fog;

    // Procedural Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Cool sky / warm-neutral ground hemisphere fill (no flat white AmbientLight)
    this.hemiLight = new THREE.HemisphereLight('#D4E2FF', '#282634', 0.96);
    scene.add(this.hemiLight);

    // Warm studio directional key light (single shadow caster with tight frustum)
    this.keyLight = new THREE.DirectionalLight('#FFF4E2', initialColors.isDarkMode ? 2.15 : 2.35);
    this.keyLight.position.set(6, 9, 8);
    this.keyLight.castShadow = !isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 30;
    this.keyLight.shadow.camera.left = -8;
    this.keyLight.shadow.camera.right = 8;
    this.keyLight.shadow.camera.top = 8;
    this.keyLight.shadow.camera.bottom = -8;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    scene.add(this.keyLight);

    // Brand-accent directional rim light
    this.rimLight = new THREE.DirectionalLight(initialColors.primaryAccent, 1.25);
    this.rimLight.position.set(-7, 2.5, -5);
    scene.add(this.rimLight);

    // Scroll-reactive unshadowed accent point light that travels with the camera spine
    this.chapterPointLight = new THREE.PointLight(initialColors.primaryAccent, 2.2, 22, 1.6);
    this.chapterPointLight.position.set(2.5, 1.5, 4.5);
    scene.add(this.chapterPointLight);

    this.updatePalette(initialColors);
  }

  public updatePalette(colors: StageAccentColors): void {
    this.isDarkMode = colors.isDarkMode;
    _accentPrimary.set(colors.primaryAccent);
    _accentSecondary.set(colors.secondaryAccent);
    _accentHighlight.set(colors.highlightAccent);

    this.rimLight.color.copy(_accentPrimary);
    this.keyLight.intensity = colors.isDarkMode ? 2.15 : 2.35;
    this.hemiLight.intensity = colors.isDarkMode ? 0.85 : 1.02;
  }

  /**
   * Smoothly evolves background color, fog density, rim light orbit, and
   * chapter accent glow as scroll progresses from Hero -> Reels -> Design -> Capabilities -> Contact.
   */
  public updateAtmosphere(
    targetBgHex: string,
    scrollProgress: number,
    cameraY: number,
    lightWarmth: number,
    dt: number,
  ): void {
    _targetBgColor.set(targetBgHex);
    const blend = 1 - Math.exp(-7 * dt);
    _bgColor.lerp(_targetBgColor, blend);
    this.fog.color.copy(_bgColor);
    this.fog.density = THREE.MathUtils.damp(
      this.fog.density,
      this.isDarkMode ? 0.032 + scrollProgress * 0.008 : 0.034 + scrollProgress * 0.006,
      4.5,
      dt,
    );

    // Travel accent point light smoothly along scroll depth and blend brand palette across chapters
    if (scrollProgress < 0.45) {
      const t = Math.min(1, scrollProgress / 0.45);
      _accentColor.copy(_accentPrimary).lerp(_accentSecondary, t);
    } else {
      const t = Math.min(1, (scrollProgress - 0.45) / 0.55);
      _accentColor.copy(_accentSecondary).lerp(_accentHighlight, t);
    }
    this.chapterPointLight.color.lerp(_accentColor, blend);
    this.chapterPointLight.position.x = THREE.MathUtils.damp(
      this.chapterPointLight.position.x,
      Math.cos(scrollProgress * Math.PI * 2) * 4.2,
      4.0,
      dt,
    );
    this.chapterPointLight.position.y = THREE.MathUtils.damp(
      this.chapterPointLight.position.y,
      cameraY + 0.8,
      4.5,
      dt,
    );
    this.chapterPointLight.intensity = THREE.MathUtils.damp(
      this.chapterPointLight.intensity,
      (this.isDarkMode ? 2.8 : 1.9) + lightWarmth * 0.65,
      4.0,
      dt,
    );

    // Subtle rim light sweep across scroll chapters
    this.rimLight.position.x = -7 + Math.sin(scrollProgress * Math.PI) * 3.5;
    this.rimLight.position.y = 2.5 - scrollProgress * 5.0;
  }

  public dispose(): void {
    this.envRenderTarget.dispose();
  }
}
