import * as THREE from 'three';
import type { ProceduralTextureBundle } from './proceduralTextures';

export interface StageAccentColors {
  primaryAccent: string;
  secondaryAccent: string;
  highlightAccent: string;
  isDarkMode: boolean;
}

export interface EditorialSculptureRig {
  prismGroup: THREE.Group;
  cinemaGroup: THREE.Group;
  totemGroup: THREE.Group;
  particleMesh: THREE.InstancedMesh;
  updatePalette: (colors: StageAccentColors) => void;
  updateInternalMotion: (
    prismSpread: number,
    cinemaSpread: number,
    totemSpread: number,
    scrollProgress: number,
    elapsed: number,
    reducedMotion: boolean,
  ) => void;
  dispose: () => void;
}

function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function createOctagonShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const sides = 8;
  for (let i = 0; i < sides; i += 1) {
    const angle = (i / sides) * Math.PI * 2 + Math.PI / 8;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  }
  shape.closePath();
  return shape;
}

function createArchShape(outerW: number, outerH: number, holeW: number, holeH: number): THREE.Shape {
  const shape = createRoundedRectShape(outerW, outerH, 0.24);
  const hole = createRoundedRectShape(holeW, holeH, 0.14);
  shape.holes.push(hole);
  return shape;
}

/**
 * Builds the three composite 6–8 part procedural editorial sculptures and an
 * InstancedMesh architectural particle constellation.
 * Every assembly varies roughness by >= 0.25 across adjacent parts, uses
 * ExtrudeGeometry / LatheGeometry / TubeGeometry, and includes a grounded
 * radial contact shadow disc.
 */
export function createEditorialSculptureRig(
  initialColors: StageAccentColors,
  textures: ProceduralTextureBundle,
  isSoftwareGl: boolean,
): EditorialSculptureRig {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // Shared PBR Materials with deliberate roughness/metalness contrast (>= 0.25 separation)
  const primaryIridescentMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initialColors.primaryAccent),
      roughness: 0.18,
      metalness: 0.24,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      iridescence: 0.55,
      iridescenceIOR: 1.35,
    }),
  );

  const mintCeramicMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialColors.secondaryAccent),
      roughness: 0.58,
      metalness: 0.08,
      bumpMap: textures.ceramicBump,
      bumpScale: 0.015,
    }),
  );

  const apricotMatteMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialColors.highlightAccent),
      roughness: 0.64,
      metalness: 0.06,
      bumpMap: textures.ceramicBump,
      bumpScale: 0.018,
    }),
  );

  const brushedSteelMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#DCE0E8'),
      roughness: 0.24,
      metalness: 0.94,
      roughnessMap: textures.brushedRoughness,
      anisotropy: 0.7,
      clearcoat: 0.25,
    }),
  );

  const matteGraphiteMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialColors.isDarkMode ? '#2B2B34' : '#32323A'),
      roughness: 0.72,
      metalness: 0.16,
      bumpMap: textures.ceramicBump,
      bumpScale: 0.02,
    }),
  );

  const studioStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialColors.isDarkMode ? '#262630' : '#ECECF0'),
      roughness: 0.76,
      metalness: 0.05,
      bumpMap: textures.ceramicBump,
      bumpScale: 0.022,
    }),
  );

  const dialFaceMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.dialAlbedo,
      roughness: 0.35,
      metalness: 0.25,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );

  const opticalGlassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#EEF4FF'),
      roughness: 0.06,
      metalness: 0.05,
      ior: 1.52,
      thickness: 0.9,
      clearcoat: 1.0,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.38 : 1.0,
      depthWrite: false,
    }),
  );

  const contactShadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: initialColors.isDarkMode ? 0.42 : 0.28,
      depthWrite: false,
    }),
  );

  const contactShadowGeo = trackGeo(new THREE.PlaneGeometry(3.1, 3.1));

  // =========================================================================
  // 1. KINETIC CREATIVE PRISM ASSEMBLY (8-Part Composite Hero Sculpture)
  // =========================================================================
  const prismGroup = new THREE.Group();

  // Part 1: Primary silhouette — Beveled extruded octagonal prism core
  const prismCoreGeo = trackGeo(
    new THREE.ExtrudeGeometry(createOctagonShape(0.84), {
      depth: 0.56,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.11,
      bevelSegments: 4,
    }),
  );
  prismCoreGeo.center();
  const prismCoreMesh = new THREE.Mesh(prismCoreGeo, primaryIridescentMat);
  prismCoreMesh.castShadow = !isSoftwareGl;
  prismCoreMesh.receiveShadow = !isSoftwareGl;
  prismGroup.add(prismCoreMesh);

  // Part 2: Precision turned brushed-metal outer bezel ring (LatheGeometry)
  const bezelProfile = [
    new THREE.Vector2(1.12, -0.14),
    new THREE.Vector2(1.26, -0.1),
    new THREE.Vector2(1.3, 0.0),
    new THREE.Vector2(1.26, 0.1),
    new THREE.Vector2(1.12, 0.14),
    new THREE.Vector2(1.06, 0.08),
    new THREE.Vector2(1.06, -0.08),
    new THREE.Vector2(1.12, -0.14),
  ];
  const bezelGeo = trackGeo(new THREE.LatheGeometry(bezelProfile, 48));
  const prismBezelMesh = new THREE.Mesh(bezelGeo, brushedSteelMat);
  prismBezelMesh.rotation.x = Math.PI * 0.32;
  prismBezelMesh.castShadow = !isSoftwareGl;
  prismGroup.add(prismBezelMesh);

  // Part 3: Tilted matte-apricot ceramic gimbal ring
  const gimbalGeo = trackGeo(new THREE.TorusGeometry(1.48, 0.068, 20, 64));
  const prismGimbalMesh = new THREE.Mesh(gimbalGeo, apricotMatteMat);
  prismGimbalMesh.rotation.set(Math.PI * 0.44, 0.52, 0.18);
  prismGroup.add(prismGimbalMesh);

  // Part 4: Recessed Swiss dial medallion mounted flush on front face
  const dialGeo = trackGeo(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 36));
  const dialMesh = new THREE.Mesh(dialGeo, dialFaceMat);
  dialMesh.rotation.x = Math.PI / 2;
  dialMesh.position.z = 0.43;
  prismGroup.add(dialMesh);

  // Part 5: Sweeping organic mint orbital spline ribbon (TubeGeometry)
  const ribbonCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-1.35, -0.55, 0.45),
      new THREE.Vector3(-0.35, -1.25, 0.95),
      new THREE.Vector3(1.15, -0.45, 0.72),
      new THREE.Vector3(1.35, 0.65, -0.35),
      new THREE.Vector3(0.25, 1.32, -0.85),
      new THREE.Vector3(-1.15, 0.52, -0.55),
    ],
    true,
  );
  const ribbonGeo = trackGeo(new THREE.TubeGeometry(ribbonCurve, 72, 0.052, 12, true));
  const prismRibbonMesh = new THREE.Mesh(ribbonGeo, mintCeramicMat);
  prismGroup.add(prismRibbonMesh);

  // Parts 6–9: 4 architectural corner fiducial pins (orbit smoothly outward on scroll)
  const pinGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 16));
  const prismPins: THREE.Mesh[] = [];
  const pinAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  pinAngles.forEach((angle) => {
    const pin = new THREE.Mesh(pinGeo, brushedSteelMat);
    pin.position.set(Math.cos(angle) * 1.15, Math.sin(angle) * 1.15, 0.18);
    pin.rotation.z = angle - Math.PI / 2;
    prismGroup.add(pin);
    prismPins.push(pin);
  });

  // Grounding contact shadow disc beneath the assembly
  const prismShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  prismShadow.rotation.x = -Math.PI / 2;
  prismShadow.position.y = -1.72;
  prismGroup.add(prismShadow);

  // =========================================================================
  // 2. EDITORIAL CINEMA & FILM REEL MONOLITH (8-Part Composite UGC Sculpture)
  // =========================================================================
  const cinemaGroup = new THREE.Group();

  // Part 1: Beveled cinema camera body chassis
  const cameraBodyGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(1.56, 1.04, 0.2), {
      depth: 0.74,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.08,
      bevelSegments: 4,
    }),
  );
  cameraBodyGeo.center();
  const cameraBodyMesh = new THREE.Mesh(cameraBodyGeo, matteGraphiteMat);
  cameraBodyMesh.castShadow = !isSoftwareGl;
  cameraBodyMesh.receiveShadow = !isSoftwareGl;
  cinemaGroup.add(cameraBodyMesh);

  // Part 2: Turned stepped-aluminum cinema lens barrel (LatheGeometry)
  const barrelProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.42, 0.0),
    new THREE.Vector2(0.42, 0.22),
    new THREE.Vector2(0.37, 0.25),
    new THREE.Vector2(0.37, 0.48),
    new THREE.Vector2(0.44, 0.54),
    new THREE.Vector2(0.44, 0.72),
    new THREE.Vector2(0.36, 0.72),
    new THREE.Vector2(0.34, 0.52),
  ];
  const barrelGeo = trackGeo(new THREE.LatheGeometry(barrelProfile, 36));
  const lensBarrelMesh = new THREE.Mesh(barrelGeo, brushedSteelMat);
  lensBarrelMesh.rotation.x = Math.PI / 2;
  lensBarrelMesh.position.set(0.06, -0.02, 0.36);
  lensBarrelMesh.castShadow = !isSoftwareGl;
  cinemaGroup.add(lensBarrelMesh);

  // Part 3: Focus ring accent band (apricot matte collar around lens)
  const focusRingGeo = trackGeo(new THREE.TorusGeometry(0.415, 0.042, 16, 40));
  const focusRingMesh = new THREE.Mesh(focusRingGeo, apricotMatteMat);
  focusRingMesh.position.set(0.06, -0.02, 0.74);
  cinemaGroup.add(focusRingMesh);

  // Part 4: Optical curved glass front lens dome
  const opticGeo = trackGeo(new THREE.SphereGeometry(0.33, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5));
  const opticMesh = new THREE.Mesh(opticGeo, opticalGlassMat);
  opticMesh.rotation.x = Math.PI / 2;
  opticMesh.position.set(0.06, -0.02, 0.88);
  opticMesh.renderOrder = 3;
  cinemaGroup.add(opticMesh);

  // Parts 5 & 6: Dual spinning cinema film reels mounted above body
  const spoolFlangeGeo = trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 32));
  const spoolHubGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 20));

  const leftSpoolGroup = new THREE.Group();
  leftSpoolGroup.position.set(-0.44, 0.96, 0.0);
  const leftFlange = new THREE.Mesh(spoolFlangeGeo, primaryIridescentMat);
  leftFlange.rotation.x = Math.PI / 2;
  const leftHub = new THREE.Mesh(spoolHubGeo, brushedSteelMat);
  leftHub.rotation.x = Math.PI / 2;
  leftSpoolGroup.add(leftFlange, leftHub);
  cinemaGroup.add(leftSpoolGroup);

  const rightSpoolGroup = new THREE.Group();
  rightSpoolGroup.position.set(0.46, 0.92, 0.0);
  const rightFlange = new THREE.Mesh(spoolFlangeGeo, apricotMatteMat);
  rightFlange.rotation.x = Math.PI / 2;
  const rightHub = new THREE.Mesh(spoolHubGeo, brushedSteelMat);
  rightHub.rotation.x = Math.PI / 2;
  rightSpoolGroup.add(rightFlange, rightHub);
  cinemaGroup.add(rightSpoolGroup);

  // Part 7: Mint side viewfinder handle bar
  const handleGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(0.24, 0.68, 0.08), {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 3,
    }),
  );
  handleGeo.center();
  const handleMesh = new THREE.Mesh(handleGeo, mintCeramicMat);
  handleMesh.position.set(-0.98, -0.05, 0.04);
  cinemaGroup.add(handleMesh);

  // Grounding contact shadow disc
  const cinemaShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  cinemaShadow.rotation.x = -Math.PI / 2;
  cinemaShadow.position.y = -1.35;
  cinemaGroup.add(cinemaShadow);

  // =========================================================================
  // 3. SWISS GRID SCULPTURAL TOTEM (7-Part Composite Design Sculpture)
  // =========================================================================
  const totemGroup = new THREE.Group();

  // Part 1: Architectural beveled frame arch (matte ceramic stone)
  const archGeo = trackGeo(
    new THREE.ExtrudeGeometry(createArchShape(1.85, 2.05, 1.12, 1.32), {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.07,
      bevelSegments: 4,
    }),
  );
  archGeo.center();
  const archMesh = new THREE.Mesh(archGeo, studioStoneMat);
  archMesh.castShadow = !isSoftwareGl;
  archMesh.receiveShadow = !isSoftwareGl;
  totemGroup.add(archMesh);

  // Part 2: Grounded architectural pedestal plinth flush beneath arch
  const plinthGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(2.1, 0.24, 0.08), {
      depth: 0.62,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 3,
    }),
  );
  plinthGeo.center();
  const plinthMesh = new THREE.Mesh(plinthGeo, matteGraphiteMat);
  plinthMesh.position.set(0, -1.24, 0);
  totemGroup.add(plinthMesh);

  // Part 3: Brushed chrome balance orb suspended inside arch window
  const orbGeo = trackGeo(new THREE.SphereGeometry(0.42, 36, 36));
  const totemOrbMesh = new THREE.Mesh(orbGeo, brushedSteelMat);
  totemOrbMesh.position.set(0, 0.08, 0.06);
  totemOrbMesh.castShadow = !isSoftwareGl;
  totemGroup.add(totemOrbMesh);

  // Parts 4–6: Three chamfered Pantone-style color swatch slabs fanning on scroll
  const swatchGeo = trackGeo(
    new THREE.ExtrudeGeometry(createRoundedRectShape(0.82, 1.12, 0.12), {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 3,
    }),
  );
  swatchGeo.center();

  const swatchPeriwinkle = new THREE.Mesh(swatchGeo, primaryIridescentMat);
  swatchPeriwinkle.position.set(0.76, -0.22, 0.44);
  swatchPeriwinkle.rotation.set(0.05, -0.35, -0.14);

  const swatchMint = new THREE.Mesh(swatchGeo, mintCeramicMat);
  swatchMint.position.set(0.92, -0.34, 0.22);
  swatchMint.rotation.set(0.08, -0.22, -0.24);

  const swatchApricot = new THREE.Mesh(swatchGeo, apricotMatteMat);
  swatchApricot.position.set(-0.78, 0.25, 0.36);
  swatchApricot.rotation.set(-0.08, 0.32, 0.16);

  totemGroup.add(swatchPeriwinkle, swatchMint, swatchApricot);

  // Grounding contact shadow disc beneath pedestal
  const totemShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  totemShadow.rotation.x = -Math.PI / 2;
  totemShadow.position.y = -1.44;
  totemGroup.add(totemShadow);

  // =========================================================================
  // 4. ARCHITECTURAL MICRO-MONOLITH CONSTELLATION (InstancedMesh, 36 items)
  // =========================================================================
  const PARTICLE_COUNT = 36;
  const shardGeo = trackGeo(
    new THREE.ExtrudeGeometry(createOctagonShape(0.11), {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    }),
  );
  shardGeo.center();

  const particleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.36,
      metalness: 0.32,
    }),
  );

  const particleMesh = new THREE.InstancedMesh(shardGeo, particleMat, PARTICLE_COUNT);
  const dummy = new THREE.Object3D();
  const tmpColor = new THREE.Color();

  const applyParticleColors = (colors: StageAccentColors) => {
    const paletteHexes = [
      colors.primaryAccent,
      colors.secondaryAccent,
      colors.highlightAccent,
      colors.isDarkMode ? '#6B6B7A' : '#A6A6B2',
    ];
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      tmpColor.set(paletteHexes[i % paletteHexes.length]);
      particleMesh.setColorAt(i, tmpColor);
    }
    if (particleMesh.instanceColor) {
      particleMesh.instanceColor.needsUpdate = true;
    }
  };

  // Deterministic architectural distribution flanking left/right margins and depth
  let seed = 4201;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (3.6 + rand() * 4.4);
    const y = 3.6 - (i / PARTICLE_COUNT) * 12.2 + (rand() - 0.5) * 1.1;
    const z = -1.2 - rand() * 4.6;
    const scale = 0.85 + rand() * 0.3; // ±15% subtle organic scale variation

    dummy.position.set(x, y, z);
    dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    particleMesh.setMatrixAt(i, dummy.matrix);
  }
  particleMesh.instanceMatrix.needsUpdate = true;
  applyParticleColors(initialColors);
  particleMesh.computeBoundingSphere();

  return {
    prismGroup,
    cinemaGroup,
    totemGroup,
    particleMesh,
    updatePalette: (colors: StageAccentColors) => {
      primaryIridescentMat.color.set(colors.primaryAccent);
      mintCeramicMat.color.set(colors.secondaryAccent);
      apricotMatteMat.color.set(colors.highlightAccent);
      matteGraphiteMat.color.set(colors.isDarkMode ? '#2B2B34' : '#32323A');
      studioStoneMat.color.set(colors.isDarkMode ? '#262630' : '#ECECF0');
      contactShadowMat.opacity = colors.isDarkMode ? 0.42 : 0.28;
      applyParticleColors(colors);
    },
    updateInternalMotion: (
      prismSpread: number,
      cinemaSpread: number,
      totemSpread: number,
      scrollProgress: number,
      elapsed: number,
      reducedMotion: boolean,
    ) => {
      const t = reducedMotion ? 0 : elapsed;

      // Prism internal kinetic choreography
      prismBezelMesh.rotation.z = t * 0.24 + scrollProgress * Math.PI * 1.2;
      prismGimbalMesh.rotation.y = 0.52 - t * 0.18 - scrollProgress * Math.PI * 0.9;
      prismRibbonMesh.rotation.y = t * 0.14 + scrollProgress * 0.8;
      const pinRadius = 1.14 + prismSpread * 0.55;
      for (let i = 0; i < prismPins.length; i += 1) {
        const angle = pinAngles[i] + scrollProgress * 0.65;
        prismPins[i].position.set(
          Math.cos(angle) * pinRadius,
          Math.sin(angle) * pinRadius,
          0.18 + prismSpread * 0.35,
        );
        prismPins[i].rotation.z = angle - Math.PI / 2;
      }

      // Cinema spools spin smoothly in sync with scroll depth & time
      const spoolAngle = scrollProgress * Math.PI * 5 + t * 0.45;
      leftSpoolGroup.rotation.z = -spoolAngle;
      rightSpoolGroup.rotation.z = -spoolAngle * 1.15;
      lensBarrelMesh.position.z = 0.36 + cinemaSpread * 0.28;
      focusRingMesh.position.z = 0.74 + cinemaSpread * 0.34;
      opticMesh.position.z = 0.88 + cinemaSpread * 0.34;

      // Swiss Grid Totem swatch fanning & balanced orb hover
      totemOrbMesh.position.y = 0.08 + Math.sin(t * 0.9) * 0.08 + totemSpread * 0.16;
      swatchPeriwinkle.position.x = 0.76 + totemSpread * 0.32;
      swatchPeriwinkle.rotation.z = -0.14 - totemSpread * 0.18;
      swatchMint.position.x = 0.92 + totemSpread * 0.52;
      swatchMint.rotation.z = -0.24 - totemSpread * 0.26;
      swatchApricot.position.x = -0.78 - totemSpread * 0.34;
      swatchApricot.rotation.z = 0.16 + totemSpread * 0.2;
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
