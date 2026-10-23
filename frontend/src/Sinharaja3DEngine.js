import * as THREE from "three";

/**
 * SINHARAJA 3D ENGINE (Three.js WebGL Renderer)
 * High-quality genuine 3D First-Person exploration for Sinharaja Rainforest.
 * Replaces the 2D Canvas pseudo-perspective while preserving 100% of game state,
 * UI callbacks, audio synthesizer, and survival mechanics.
 */
export class Sinharaja3DEngine {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.cb = callbacks || {};
    this.chapter = this.cb.chapter || 1;

    // World state & survival metrics
    this.health = 100;
    this.sanity = 100;
    this.battery = 100;
    this.torchOn = true;
    this.torchIntensity = 1.0; // 0.5 (low), 1.0 (medium), 1.6 (high)
    this.uvUnlocked = false;
    this.uvMode = false;
    this.stormActive = false;
    this.saltCount = 3;
    this.herbCount = 1;
    this.balmCount = 1;
    this.repellentTimer = 0;
    this.bleeding = false;
    this.teaBuffTimer = 0;
    this.gingerTeaCount = 2;
    this.temperature = 100;
    this.feathersCollected = 0;
    this.magpieCharmActive = false;
    this.flareGunFound = false;
    this.flareFired = false;
    this.attachedLeeches = 0;
    this.venomToxicity = 0;
    this.noiseLevel = 15;
    this.crankCooldown = 0;
    this.elapsedTime = 0;
    this.hasKey = false;
    this.hasSample = false;
    this.hasGears = false;
    this.hasEmf = false;
    this.emfProximity = 0;
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.paused = false;

    // Chapter 1 Tasks
    this.tasks = {
      diaryFound: false,
      keyFound: false,
      sampleFound: false,
      helipadReached: false,
    };

    // NPC State
    this.npc = {
      x: 340,
      y: 400,
      name: "ගුණදාස මාමා (Old Ranger Gunadasa)",
      helped: false,
    };

    this.kudawaDoorOpen = false;
    this.doorSwingAngle = 0;

    // Player Physics & First-Person Controller State
    // Coordinates: x (East-West), y (Altitude/Up), z (North-South)
    // Kudawa cabin center is at x: 520, z: 720
    this.player = {
      x: 520,
      y: 1.7, // Standing eye height above ground
      z: 720,
      vy: 0,  // Vertical velocity for gravity and jump
      radius: 0.75,
      speed: 4.8,
      sprintMultiplier: 1.65,
      crouchMultiplier: 0.5,
      stamina: 100,
      isSprinting: false,
      isCrouching: false,
      isGrounded: true,
      isMoving: false,
      yaw: Math.PI, // Facing South toward doorway
      pitch: 0,
      targetYaw: Math.PI,
      targetPitch: 0,
      standHeight: 1.7,
      crouchHeight: 1.05,
      curEyeHeight: 1.7,
      inShelter: true,
      inCave: false,
      inMud: false,
    };

    this.keys = {};
    this.pointerLocked = false;
    this.activeCrosshairTarget = null;
    this.statsUpdateTimer = 0;
    this.lightningTimer = 0;
    this.footstepDist = 0;
    this.headBob = 0;

    // Bind event handlers for clean disposal
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onPointerLockError = this._onPointerLockError.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onCanvasClick = this._onCanvasClick.bind(this);
    this._onWheel = this._onWheel.bind(this);

    // Initialize Subsystems
    this.initAudio();
    this.initThree();
    this.build3DWorld();
    this.setupInputs();

    this.running = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  // ── Web Audio Synthesizer (Zero external dependency) ──────────────────────
  initAudio() {
    this.muted = false;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    } catch (e) {}
  }

  setMuted(muted) {
    this.muted = muted;
  }

  playSfx(type) {
    if (this.muted || !this.audioCtx) return;
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();
    const t = this.audioCtx.currentTime;

    if (type === "step" || type === "step_wood") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(type === "step_wood" ? 110 : 80, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } else if (type === "step_mud") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(65, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.12);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (type === "jump") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.15);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === "land") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.18);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } else if (type === "pickup") {
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + i * 0.06);
        gain.gain.setValueAtTime(0.12, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.2);
      });
    } else if (type === "door_open" || type === "door_creak") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.linearRampToValueAtTime(145, t + 0.18);
      osc.frequency.linearRampToValueAtTime(70, t + 0.35);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    } else if (type === "door_close") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.15);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === "thunder") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 1.4);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 1.4);
    } else if (type === "heal") {
      [330, 440, 550, 660].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + i * 0.08);
        gain.gain.setValueAtTime(0.14, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.25);
      });
    } else if (type === "salt") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === "balm") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.linearRampToValueAtTime(440, t + 0.2);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } else if (type === "radio_static") {
      const bufSize = this.audioCtx.sampleRate * 0.5;
      const buf = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buf;
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.5);
      noise.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start(t);
      noise.stop(t + 0.5);
    } else if (type === "uv_toggle") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.linearRampToValueAtTime(1320, t + 0.1);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (type === "click") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
    }
  }

  // ── Terrain Heightmap Sampling Function ───────────────────────────────────
  getTerrainHeight(x, z) {
    // Cabin interior & immediate perimeter is kept flat at y = 0
    const inCabin = (x >= 520 - 12 && x <= 520 + 12 && z >= 720 - 10 && z <= 720 + 10);
    if (inCabin) return 0.0;

    const dist = Math.hypot(x - 520, z - 720);
    if (dist <= 18) {
      // Smooth blend transition out of cabin entrance
      const factor = Math.max(0, (dist - 12) / 6);
      const rawElevation = Math.sin(x * 0.05) * 0.8 + Math.cos(z * 0.04) * 0.7;
      return Math.max(-0.2, rawElevation) * factor;
    }

    // Rainforest rolling terrain
    const elevation = Math.sin(x * 0.05) * 0.8 + Math.cos(z * 0.04) * 0.7;
    return Math.max(-0.2, elevation);
  }

  // ── Three.js WebGL Scene Setup ────────────────────────────────────────────
  initThree() {
    const width = this.canvas.width || window.innerWidth;
    const height = this.canvas.height || window.innerHeight;

    // 1. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // 2. 3D Scene & Sinharaja Nocturnal Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#020704");
    this.scene.fog = new THREE.FogExp2("#030c06", 0.018);

    // 3. True Perspective Camera
    this.camera = new THREE.PerspectiveCamera(74, width / height, 0.1, 800);
    this.camera.position.set(this.player.x, this.player.y, this.player.z);
    this.camera.rotation.order = "YXZ";

    // 4. Raycaster for Precise Crosshair Targeting from Center Screen (0, 0)
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 7.5; // Max 7.5m interaction reach
    this.centerScreen = new THREE.Vector2(0, 0);

    // 5. Environmental Lighting (Nocturnal Rain Forest)
    this.ambientLight = new THREE.AmbientLight(0x0a1f12, 0.55);
    this.scene.add(this.ambientLight);

    // Moon directional rim light piercing through canopy
    this.moonLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    this.moonLight.position.set(400, 250, 500);
    this.scene.add(this.moonLight);

    // 6. Tactical Maglite Flashlight (SpotLight attached to Player Camera)
    // Three intensity levels: Low (1.8), Medium (4.5), High (8.0)
    this.flashlight = new THREE.SpotLight(0xfff8db, 4.5, 42, Math.PI / 6, 0.42, 1.2);
    this.flashlight.position.set(0.25, -0.22, -0.15); // Tactical weapon/torch viewmodel offset
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.camera.near = 0.2;
    this.flashlight.shadow.camera.far = 45;
    this.flashlight.shadow.bias = -0.001;

    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -5);
    this.camera.add(this.flashlightTarget);
    this.camera.add(this.flashlight);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.camera);

    // 7. Interactive 3D Meshes Collection & Obstacle Colliders
    this.interactableMeshes = [];
    this.colliders = [];
  }

  // ── Build Kudawa Outpost 3D World (Chapter 1) ─────────────────────────────
  build3DWorld() {
    // ── A. Terrain (Sinharaja Wet Forest Floor) ──
    const terrainGeo = new THREE.PlaneGeometry(600, 600, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);

    // Match exact height calculation
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, this.getTerrainHeight(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x142b15,
      roughness: 0.92,
      metalness: 0.08,
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.position.set(0, 0, 0); // World origin
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // ── B. Kudawa Outpost 3D Cabin Architecture ──
    const cabinOriginX = 520;
    const cabinOriginZ = 720;
    const cabinW = 18;
    const cabinD = 14;
    const cabinH = 4.2;

    // 1. Polished Timber Floorboards inside cabin
    const floorGeo = new THREE.PlaneGeometry(cabinW, cabinD);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d2516,
      roughness: 0.55,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(cabinOriginX, 0.02, cabinOriginZ);
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // 2. Timber Ceiling
    const ceilGeo = new THREE.PlaneGeometry(cabinW + 1, cabinD + 1);
    ceilGeo.rotateX(Math.PI / 2);
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x24160d,
      roughness: 0.85,
    });
    const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
    ceilMesh.position.set(cabinOriginX, cabinH, cabinOriginZ);
    this.scene.add(ceilMesh);

    // 3. Kudawa Cabin Log Walls Material
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2b190f,
      roughness: 0.82,
      metalness: 0.08,
    });

    // North Wall (Back)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, 0.5), wallMat);
    northWall.position.set(cabinOriginX, cabinH / 2, cabinOriginZ - cabinD / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.scene.add(northWall);
    this.colliders.push({ type: "box", minX: cabinOriginX - cabinW / 2, maxX: cabinOriginX + cabinW / 2, minZ: cabinOriginZ - cabinD / 2 - 0.35, maxZ: cabinOriginZ - cabinD / 2 + 0.35 });

    // West Wall (Left)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, cabinH, cabinD), wallMat);
    westWall.position.set(cabinOriginX - cabinW / 2, cabinH / 2, cabinOriginZ);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.scene.add(westWall);
    this.colliders.push({ type: "box", minX: cabinOriginX - cabinW / 2 - 0.35, maxX: cabinOriginX - cabinW / 2 + 0.35, minZ: cabinOriginZ - cabinD / 2, maxZ: cabinOriginZ + cabinD / 2 });

    // East Wall (Right)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, cabinH, cabinD), wallMat);
    eastWall.position.set(cabinOriginX + cabinW / 2, cabinH / 2, cabinOriginZ);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);
    this.colliders.push({ type: "box", minX: cabinOriginX + cabinW / 2 - 0.35, maxX: cabinOriginX + cabinW / 2 + 0.35, minZ: cabinOriginZ - cabinD / 2, maxZ: cabinOriginZ + cabinD / 2 });

    // South Wall Left Section (with door opening in center)
    const doorGapW = 2.4;
    const sideW = (cabinW - doorGapW) / 2;
    const southWallL = new THREE.Mesh(new THREE.BoxGeometry(sideW, cabinH, 0.5), wallMat);
    southWallL.position.set(cabinOriginX - cabinW / 2 + sideW / 2, cabinH / 2, cabinOriginZ + cabinD / 2);
    southWallL.castShadow = true;
    southWallL.receiveShadow = true;
    this.scene.add(southWallL);
    this.colliders.push({ type: "box", minX: cabinOriginX - cabinW / 2, maxX: cabinOriginX - doorGapW / 2, minZ: cabinOriginZ + cabinD / 2 - 0.35, maxZ: cabinOriginZ + cabinD / 2 + 0.35 });

    // South Wall Right Section
    const southWallR = new THREE.Mesh(new THREE.BoxGeometry(sideW, cabinH, 0.5), wallMat);
    southWallR.position.set(cabinOriginX + cabinW / 2 - sideW / 2, cabinH / 2, cabinOriginZ + cabinD / 2);
    southWallR.castShadow = true;
    southWallR.receiveShadow = true;
    this.scene.add(southWallR);
    this.colliders.push({ type: "box", minX: cabinOriginX + doorGapW / 2, maxX: cabinOriginX + cabinW / 2, minZ: cabinOriginZ + cabinD / 2 - 0.35, maxZ: cabinOriginZ + cabinD / 2 + 0.35 });

    // Lintel above door
    const lintelH = 1.4;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorGapW, lintelH, 0.5), wallMat);
    lintel.position.set(cabinOriginX, cabinH - lintelH / 2, cabinOriginZ + cabinD / 2);
    this.scene.add(lintel);

    // 4. Operable 3D Kudawa Cabin Door Leaf (Hinged at left jamb)
    const doorLeafGeo = new THREE.BoxGeometry(doorGapW, cabinH - lintelH, 0.12);
    doorLeafGeo.translate(doorGapW / 2, (cabinH - lintelH) / 2, 0); // Shift pivot to door hinge
    const doorLeafMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e1b,
      roughness: 0.65,
    });
    this.doorPivot = new THREE.Object3D();
    this.doorPivot.position.set(cabinOriginX - doorGapW / 2, 0, cabinOriginZ + cabinD / 2);
    const doorMesh = new THREE.Mesh(doorLeafGeo, doorLeafMat);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    this.doorPivot.add(doorMesh);
    this.scene.add(this.doorPivot);

    // Register Door for 3D Raycasting
    doorMesh.userData = {
      isDoor: true,
      title: "කුඩව මුරපොළ දොරටුව (Outpost Door)",
      prompt: "[E] දොර අරින්න / වහන්න (Toggle Door)",
      action: () => this.toggleCabinDoor(),
    };
    this.interactableMeshes.push(doorMesh);

    // Doorway Barrier Collider when door is closed
    this.doorCollider = {
      type: "box",
      isDoorBarrier: true,
      minX: cabinOriginX - doorGapW / 2,
      maxX: cabinOriginX + doorGapW / 2,
      minZ: cabinOriginZ + cabinD / 2 - 0.4,
      maxZ: cabinOriginZ + cabinD / 2 + 0.4,
    };
    this.colliders.push(this.doorCollider);

    // 5. Cabin Interior Hanging Lantern
    const lanternLight = new THREE.PointLight(0xfbbf24, 2.2, 18, 1.4);
    lanternLight.position.set(cabinOriginX, cabinH - 0.8, cabinOriginZ);
    lanternLight.castShadow = true;
    this.scene.add(lanternLight);

    const lanternMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.22, 0.45, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lanternMesh.position.set(cabinOriginX, cabinH - 0.8, cabinOriginZ);
    this.scene.add(lanternMesh);

    // 6. 3D Ranger Workbench (North-West Room Corner)
    const tableW = 4.2;
    const tableD = 1.8;
    const tableH = 1.0;
    const tableX = cabinOriginX - 4.5;
    const tableZ = cabinOriginZ - cabinD / 2 + 1.8;

    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(tableW, 0.14, tableD),
      new THREE.MeshStandardMaterial({ color: 0x5d3c27, roughness: 0.45 })
    );
    tableTop.position.set(tableX, tableH, tableZ);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.scene.add(tableTop);
    this.colliders.push({ type: "box", minX: tableX - tableW / 2, maxX: tableX + tableW / 2, minZ: tableZ - tableD / 2, maxZ: tableZ + tableD / 2 });

    // Table Legs
    const legGeo = new THREE.BoxGeometry(0.12, tableH, 0.12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x27160c, roughness: 0.8 });
    [
      [-tableW / 2 + 0.15, -tableD / 2 + 0.15],
      [tableW / 2 - 0.15, -tableD / 2 + 0.15],
      [-tableW / 2 + 0.15, tableD / 2 - 0.15],
      [tableW / 2 - 0.15, tableD / 2 - 0.15],
    ].forEach(([dx, dz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(tableX + dx, tableH / 2, tableZ + dz);
      leg.castShadow = true;
      this.scene.add(leg);
    });

    // ── C. Interactive 3D Props on Table ──
    // 1. Outpost Radio Dispatch
    const radioMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.42, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 })
    );
    radioMesh.position.set(tableX - 1.1, tableH + 0.22, tableZ);
    radioMesh.castShadow = true;
    radioMesh.userData = {
      id: "outpost_radio",
      title: "සන්නිවේදන ගුවන්විදුලි යන්ත්‍රය (Radio Dispatch)",
      prompt: "[E] සංඥාවට සවන් දෙන්න",
      action: () => {
        this.playSfx("radio_static");
        this.cb.onTriggerStory({
          title: "1987 නොවැම්බර් 14 රේන්ජර් පණිවිඩ සටහන",
          text: "'(ස්ටැටික් හඬ... අකුණු ගසන හඬ...) HQ... මෙහෙ කුඩව මුරපොළ 01... මහා වැස්ස සහ සුළඟ නිසා ගඟ පිටාර ගලලා. මහාචාර්ය ඩග්ලස් ලෙන් දොරටුව දෙසට ගියා. ආපසු ආවේ නෑ... (සංඥාව ඇනහිටී)'",
          speaker: "1987 RANGER DISPATCH",
          avatar: "radio",
        });
      },
    };
    this.scene.add(radioMesh);
    this.interactableMeshes.push(radioMesh);

    // 2. Douglas Voice Reel (Chapter 1 Clue)
    const reelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.25 })
    );
    reelMesh.position.set(tableX, tableH + 0.12, tableZ);
    reelMesh.castShadow = true;
    reelMesh.userData = {
      id: "outpost_douglas_reel",
      title: "මහාචාර්ය ඩග්ලස්ගේ හඬ පටය (Douglas Voice Reel)",
      prompt: "[E] හඬ පටය පරීක්ෂා කරන්න",
      action: () => {
        this.playSfx("pickup");
        if (this.cb.onOpenDouglasTape) {
          this.cb.onOpenDouglasTape();
        } else {
          this.cb.onTriggerStory({
            title: "මහාචාර්ය ඩග්ලස්ගේ හඬ පටය (1987)",
            text: "'මම මහාචාර්ය ඩග්ලස්... ලෙන් දොරටුවේ රහස් කේතය [හිරු, ගඟ, සිංහයා]. ගඟේ ජල මට්ටම ඉහළ යාමට පෙර ගලවා ගැනීමේ හෙලිපෑඩ් වෙත ළඟා විය යුතුයි...'",
            speaker: "PROF. DOUGLAS (1987)",
            avatar: "radio",
          });
        }
      },
    };
    this.scene.add(reelMesh);
    this.interactableMeshes.push(reelMesh);

    // 3. Leech Repellent Balm Bottle
    const balmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 })
    );
    balmMesh.position.set(tableX + 1.1, tableH + 0.15, tableZ);
    balmMesh.castShadow = true;
    balmMesh.userData = {
      id: "outpost_balm_bottle",
      title: "ඖෂධීය ලේ මැක්කන් විකර්ෂක තෙල් (Leech Balm)",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      action: (obj) => {
        if (!obj.userData.picked) {
          obj.userData.picked = true;
          this.balmCount += 2;
          this.playSfx("pickup");
          this.scene.remove(balmMesh);
          const idx = this.interactableMeshes.indexOf(balmMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.cb.onNotify("🌿 ලේ මැක්කන් විකර්ෂක තෙල් බෝතලය ලබාගත්තා! [B] මඟින් ආලේප කරන්න.");
          if (this.cb.onAutosave) this.cb.onAutosave();
        }
      },
    };
    this.scene.add(balmMesh);
    this.interactableMeshes.push(balmMesh);

    // ── D. 3D Rainforest Trees & Foliage Surrounding Outpost ──
    const treeTrunkGeo = new THREE.CylinderGeometry(0.45, 0.75, 14, 8);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x2e1d13, roughness: 0.9 });
    const canopyGeo = new THREE.DodecahedronGeometry(4.5, 1);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0e2e13, roughness: 0.8 });

    // Ring of towering Dipterocarp trees around the outpost
    const treePositions = [
      [500, 680], [540, 685], [490, 750], [550, 760],
      [470, 710], [570, 715], [460, 660], [580, 660],
      [510, 800], [535, 800], [450, 780], [590, 780],
    ];

    treePositions.forEach(([tx, tz]) => {
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunk.position.y = 7;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.y = 14;
      canopy.castShadow = true;
      treeGroup.add(canopy);

      const ty = this.getTerrainHeight(tx, tz);
      treeGroup.position.set(tx, ty, tz);
      this.scene.add(treeGroup);
      this.colliders.push({ type: "circle", x: tx, z: tz, radius: 0.9 });
    });

    // ── E. Dynamic Storm Raindrop Particles ──
    const rainCount = 1400;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3 + 0] = cabinOriginX + (Math.random() - 0.5) * 80;
      rainPos[i * 3 + 1] = Math.random() * 25;
      rainPos[i * 3 + 2] = cabinOriginZ + (Math.random() - 0.5) * 80;
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);
  }

  // ── Input & 360° First-Person Pointer Lock Controls ───────────────────────
  setupInputs() {
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    this.canvas.addEventListener("click", this._onCanvasClick);
    document.addEventListener("pointerlockchange", this._onPointerLockChange);
    document.addEventListener("pointerlockerror", this._onPointerLockError);
    window.addEventListener("mousemove", this._onMouseMove);
    this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
  }

  _onKeyDown(e) {
    // If a modal or paused, do not capture movement inputs
    if (this.paused) return;

    // Filter out if user is typing in an input or textarea
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea") return;

    this.keys[e.key.toLowerCase()] = true;

    // Space -> Jump (when grounded) / Leech removal
    if (e.code === "Space") {
      e.preventDefault();
      if (this.player.isGrounded && !this.player.isCrouching && this.player.stamina >= 8) {
        this.player.vy = 5.6; // Launch upward
        this.player.isGrounded = false;
        this.player.stamina = Math.max(0, this.player.stamina - 8);
        this.playSfx("jump");
      } else if (this.attachedLeeches > 0) {
        this.throwSalt();
      }
    }

    // C -> Toggle Crouch
    if (e.key.toLowerCase() === "c") {
      this.player.isCrouching = !this.player.isCrouching;
      this.playSfx("step");
    }

    // F -> Flashlight Toggle
    if (e.key.toLowerCase() === "f") {
      this.toggleTorch();
    }

    // T -> Adjust Flashlight Intensity (Low -> Med -> High)
    if (e.key.toLowerCase() === "t") {
      this.cycleTorchIntensity();
    }

    // E -> Interact with Raycasted Object
    if (e.key.toLowerCase() === "e") {
      this.interactTarget();
    }

    // H -> Heal Herb
    if (e.key.toLowerCase() === "h") {
      this.useHerb();
    }

    // Quick items
    if (e.key === "1") this.throwSalt();
    if (e.key === "2") this.useHerb();
    if (e.key === "3") this.toggleTorch();
    if (e.key === "4") this.interactTarget();
    // B -> Balm
    if (e.key.toLowerCase() === "b") this.useBalm();
    // R -> Crank Dynamo
    if (e.key.toLowerCase() === "r") this.crankDynamo();
    // U -> UV Mode
    if (e.key.toLowerCase() === "u") this.toggleUv();
    // Z -> Zoom
    if (e.key.toLowerCase() === "z") {
      this.targetZoom = this.targetZoom === 1.0 ? 0.75 : 1.0;
    }
    // Escape -> Pause
    if (e.key === "Escape" && this.cb.onTogglePause) {
      this.cb.onTogglePause();
    }
  }

  _onKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  _onCanvasClick(e) {
    // Check if click was on modal or UI element above canvas
    if (this.paused) return;
    if (e.target !== this.canvas) return;

    if (document.pointerLockElement !== this.canvas) {
      try {
        this.canvas.requestPointerLock();
      } catch (err) {}
    } else {
      // Clicking while locked interacts with focused crosshair object
      this.interactTarget();
    }
  }

  _onPointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.canvas;
  }

  _onPointerLockError() {
    this.pointerLocked = false;
  }

  _onMouseMove(e) {
    if (this.pointerLocked && !this.paused) {
      const sens = 0.0022;
      this.player.targetYaw -= (e.movementX || 0) * sens;
      this.player.targetPitch -= (e.movementY || 0) * sens;
      // Clamp pitch (-80 deg to +80 deg)
      this.player.targetPitch = Math.max(-1.4, Math.min(1.4, this.player.targetPitch));
    }
  }

  _onWheel(e) {
    if (this.paused) return;
    e.preventDefault();
    if (e.deltaY > 0) {
      this.targetZoom = Math.max(0.72, this.targetZoom - 0.08);
    } else {
      this.targetZoom = Math.min(1.15, this.targetZoom + 0.08);
    }
  }

  // ── Survival Mechanics & Gameplay Actions ─────────────────────────────────
  toggleCabinDoor() {
    this.kudawaDoorOpen = !this.kudawaDoorOpen;
    if (this.kudawaDoorOpen) {
      this.playSfx("door_open");
      this.cb.onNotify("🚪 කුඩව මුරපොළේ දොර විවෘත කළා. වර්ෂාව ඇතුළට ඇසෙයි.");
    } else {
      this.playSfx("door_close");
      this.cb.onNotify("🚪 කුඩව මුරපොළේ දොර වැසුවා.");
    }
  }

  toggleTorch() {
    this.torchOn = !this.torchOn;
    this.updateFlashlight();
    this.playSfx("click");
    this.cb.onNotify(this.torchOn ? "💡 විදුලි පන්දම දැල්වීය (Flashlight ON)" : "🌑 විදුලි පන්දම නිවා දැමීය (Flashlight OFF)");
  }

  cycleTorchIntensity() {
    if (!this.torchOn) {
      this.torchOn = true;
      this.torchIntensity = 0.5;
    } else if (this.torchIntensity === 0.5) {
      this.torchIntensity = 1.0;
    } else if (this.torchIntensity === 1.0) {
      this.torchIntensity = 1.6;
    } else {
      this.torchIntensity = 0.5;
    }
    this.updateFlashlight();
    this.playSfx("click");
    const label = this.torchIntensity === 0.5 ? "අඩු (Low)" : (this.torchIntensity === 1.0 ? "මධ්‍යම (Medium)" : "උපරිම (High / Turbo)");
    this.cb.onNotify(`🔦 විදුලි පන්දමේ දීප්තිය: ${label}`);
  }

  updateFlashlight() {
    if (!this.torchOn || this.battery <= 0) {
      this.flashlight.visible = false;
      return;
    }
    this.flashlight.visible = true;
    const baseIntensity = this.uvMode ? 3.0 : 4.5;
    this.flashlight.intensity = baseIntensity * this.torchIntensity;
    this.flashlight.distance = this.uvMode ? 28 : (38 * Math.sqrt(this.torchIntensity));
  }

  interactTarget() {
    if (this.activeCrosshairTarget && this.activeCrosshairTarget.action) {
      this.activeCrosshairTarget.action(this.activeCrosshairTarget);
      return true;
    }
    return false;
  }

  throwSalt() {
    if (this.saltCount <= 0) {
      this.cb.onNotify("⚠️ ලුණු කුඩු අවසන්! කඳවුරෙන් සොයාගන්න.");
      return;
    }
    this.saltCount--;
    this.playSfx("salt");
    if (this.attachedLeeches > 0) {
      this.attachedLeeches = 0;
      this.cb.onNotify("🧂 ලුණු කුඩු ඉසීමෙන් ලේ මැක්කන් ගැලවී ගියා!");
    } else {
      this.cb.onNotify("🧂 ලුණු කුඩු අවට භූමියට ඉස්සා.");
    }
  }

  useHerb() {
    if (this.herbCount <= 0) {
      this.cb.onNotify("⚠️ ඖෂධීය පැළෑටි නොමැත!");
      return;
    }
    this.herbCount--;
    this.health = Math.min(100, this.health + 25);
    this.playSfx("heal");
    this.cb.onNotify(`🌿 ඖෂධය භාවිතයෙන් සුවපත් විය! Health: ${this.health}%`);
  }

  useBalm() {
    if (this.balmCount <= 0) {
      this.cb.onNotify("⚠️ ලේ මැක්කන් විකර්ෂක තෙල් අවසන්!");
      return;
    }
    this.balmCount--;
    this.repellentTimer = 90;
    this.bleeding = false;
    this.playSfx("balm");
    this.cb.onNotify("🛡️ ලේ මැක්කන් විකර්ෂක තෙල් ආලේප කළා! (තත්පර 90ක් ආරක්ෂිතයි)");
  }

  crankDynamo() {
    if (this.battery >= 100) {
      this.cb.onNotify("🔋 බැටරිය උපරිම මට්ටමේ පවතී (100%).");
      return;
    }
    if (this.crankCooldown > 0) return;
    this.crankCooldown = 0.45;
    this.battery = Math.min(100, this.battery + 16);
    this.playSfx("step");
    this.noiseLevel = 75;
    this.updateFlashlight();
    this.cb.onNotify("⚙️ ඩයිනමෝ කරකවා බැටරිය ආරෝපණය කළා! (+16%)");
  }

  toggleUv() {
    if (!this.uvUnlocked) {
      this.cb.onNotify("⚠️ UV පෙරහන තවමත් සොයාගෙන නැත! (කැබින් එක පරීක්ෂා කරන්න)");
      return;
    }
    this.uvMode = !this.uvMode;
    this.playSfx("uv_toggle");
    if (this.uvMode) {
      this.flashlight.color.setHex(0xa855f7); // Ultraviolet phosphorescence
      this.cb.onNotify("🟣 UV Blacklight සක්‍රියයි: සැඟවුණු සලකුණු පෙනෙනු ඇත.");
    } else {
      this.flashlight.color.setHex(0xfff8db); // Warm incandescent
      this.cb.onNotify("💡 සාමාන්‍ය විදුලි පන්දම සක්‍රියයි.");
    }
    this.updateFlashlight();
  }

  // ── Physics, Collision, & Player Movement ─────────────────────────────────
  update(dt) {
    if (this.paused) return;
    this.elapsedTime += dt;

    if (this.crankCooldown > 0) this.crankCooldown -= dt;
    if (this.repellentTimer > 0) this.repellentTimer -= dt;

    // Smooth Binoculars Zoom
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1.0, dt * 10);
    this.camera.fov = 74 * this.zoom;
    this.camera.updateProjectionMatrix();

    // Battery Depletion proportional to torch intensity
    if (this.torchOn && this.battery > 0) {
      const drainRate = 0.35 * this.torchIntensity;
      this.battery = Math.max(0, this.battery - dt * drainRate);
      if (this.battery <= 0) {
        this.flashlight.visible = false;
      }
    }

    // Door swing animation (Hinges open to 85 degrees)
    const targetSwing = this.kudawaDoorOpen ? 1.45 : 0;
    this.doorSwingAngle += (targetSwing - this.doorSwingAngle) * Math.min(1.0, dt * 7.5);
    if (this.doorPivot) {
      this.doorPivot.rotation.y = this.doorSwingAngle;
    }

    // Smooth Jitter-Free Mouse Look Interpolation
    this.player.yaw += (this.player.targetYaw - this.player.yaw) * Math.min(1.0, dt * 25);
    this.player.pitch += (this.player.targetPitch - this.player.pitch) * Math.min(1.0, dt * 25);

    // Crouch Height Smooth Transition
    const targetHeight = this.player.isCrouching ? this.player.crouchHeight : this.player.standHeight;
    this.player.curEyeHeight += (targetHeight - this.player.curEyeHeight) * Math.min(1.0, dt * 12);

    // Movement Vector Calculation
    let moveFwd = 0;
    let moveRgt = 0;
    if (this.keys["w"] || this.keys["arrowup"]) moveFwd += 1;
    if (this.keys["s"] || this.keys["arrowdown"]) moveFwd -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) moveRgt += 1;
    if (this.keys["a"] || this.keys["arrowleft"]) moveRgt -= 1;

    const isMoving = moveFwd !== 0 || moveRgt !== 0;
    this.player.isMoving = isMoving;

    // Sprinting handling with stamina drain
    const isSprint = this.keys["shift"] && !this.player.isCrouching && this.player.stamina > 10;
    this.player.isSprinting = isSprint;
    if (isSprint && isMoving) {
      this.player.stamina = Math.max(0, this.player.stamina - dt * 16);
    } else {
      this.player.stamina = Math.min(100, this.player.stamina + dt * 12);
    }

    let curSpeed = this.player.speed;
    if (this.player.isCrouching) {
      curSpeed *= this.player.crouchMultiplier;
    } else if (isSprint) {
      curSpeed *= this.player.sprintMultiplier;
    }

    if (isMoving) {
      const len = Math.hypot(moveFwd, moveRgt);
      const nx = moveRgt / len;
      const nz = -moveFwd / len;

      // Transform by Player Yaw
      const sinY = Math.sin(this.player.yaw);
      const cosY = Math.cos(this.player.yaw);
      const worldDx = (nx * cosY - nz * sinY) * curSpeed * dt;
      const worldDz = (nx * sinY + nz * cosY) * curSpeed * dt;

      // Proposed horizontal positions
      let nextX = this.player.x + worldDx;
      let nextZ = this.player.z + worldDz;

      // ── Obstacle Collision Resolution & Smooth Sliding ──
      const pr = this.player.radius;
      for (let col of this.colliders) {
        if (col.isDoorBarrier && this.kudawaDoorOpen) continue; // Doorway is open!

        if (col.type === "box") {
          const cx = Math.max(col.minX, Math.min(col.maxX, nextX));
          const cz = Math.max(col.minZ, Math.min(col.maxZ, nextZ));
          const dist = Math.hypot(nextX - cx, nextZ - cz);
          if (dist < pr && dist > 0.0001) {
            const push = pr - dist;
            nextX += ((nextX - cx) / dist) * push;
            nextZ += ((nextZ - cz) / dist) * push;
          }
        } else if (col.type === "circle") {
          const dist = Math.hypot(nextX - col.x, nextZ - col.z);
          const minDist = col.radius + pr;
          if (dist < minDist && dist > 0.0001) {
            const push = minDist - dist;
            nextX += ((nextX - col.x) / dist) * push;
            nextZ += ((nextZ - col.z) / dist) * push;
          }
        }
      }

      this.player.x = nextX;
      this.player.z = nextZ;

      // Surface-Aware Footstep Sound Trigger
      this.footstepDist += Math.hypot(worldDx, worldDz);
      const stepInterval = isSprint ? 1.9 : (this.player.isCrouching ? 1.0 : 1.4);
      if (this.footstepDist > stepInterval && this.player.isGrounded) {
        this.footstepDist = 0;
        this.playSfx(this.player.inShelter ? "step_wood" : "step_mud");
      }

      // Head Bobbing calculation
      const bobFreq = isSprint ? 13 : (this.player.isCrouching ? 6 : 8.5);
      this.headBob += dt * bobFreq;
    } else {
      this.headBob = 0;
    }

    // ── Vertical Physics: Gravity, Ground Collision & Jumping ──
    const targetGroundY = this.getTerrainHeight(this.player.x, this.player.z);
    const gravity = 18.0; // Realistic downward acceleration

    if (!this.player.isGrounded) {
      this.player.vy -= gravity * dt;
      this.player.y += this.player.vy * dt;

      // Landing check
      if (this.player.y <= targetGroundY + this.player.curEyeHeight) {
        this.player.y = targetGroundY + this.player.curEyeHeight;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.playSfx("land");
      }
    } else {
      // Firm ground snapping along uneven terrain
      const currentEyeGoal = targetGroundY + this.player.curEyeHeight;
      if (this.player.y > currentEyeGoal + 0.15) {
        // Player walked off a ledge or slope into freefall
        this.player.isGrounded = false;
        this.player.vy = -1.0;
      } else {
        // Smooth elevation follow
        this.player.y += (currentEyeGoal - this.player.y) * Math.min(1.0, dt * 18);
      }
    }

    // Kudawa Cabin Interior detection
    this.player.inShelter = (
      this.player.x >= 520 - 9 &&
      this.player.x <= 520 + 9 &&
      this.player.z >= 720 - 7 &&
      this.player.z <= 720 + 7
    );

    // Update Camera Position & Rotation with Subtle Head Bob
    const bobOffset = (isMoving && this.player.isGrounded) ? Math.sin(this.headBob) * 0.045 : 0;
    this.camera.position.set(this.player.x, this.player.y + bobOffset, this.player.z);
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    // Update Rain Particles
    if (this.rainParticles) {
      const pos = this.rainParticles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= dt * 28;
        if (pos[i] < 0) pos[i] = 25;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // ── 3D Center Crosshair Raycasting ──
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactableMeshes, false);
    if (intersects.length > 0 && intersects[0].distance < 4.5) {
      const hitObj = intersects[0].object;
      this.activeCrosshairTarget = hitObj.userData;
    } else {
      this.activeCrosshairTarget = null;
    }

    // Periodic Stats Reporting to React HUD (15 Hz)
    this.statsUpdateTimer += dt;
    if (this.cb.onStatsUpdate && this.statsUpdateTimer >= 0.066) {
      this.statsUpdateTimer = 0;
      this.cb.onStatsUpdate({
        health: Math.round(this.health),
        sanity: Math.round(this.sanity),
        battery: Math.round(this.battery),
        stamina: Math.round(this.player.stamina),
        torchOn: this.torchOn,
        torchIntensity: this.torchIntensity,
        saltCount: this.saltCount,
        herbCount: this.herbCount,
        balmCount: this.balmCount,
        repellentTimer: Math.round(this.repellentTimer),
        uvUnlocked: this.uvUnlocked,
        uvMode: this.uvMode,
        stormActive: this.stormActive,
        feathersCollected: this.feathersCollected,
        magpieCharmActive: this.magpieCharmActive,
        flareGunFound: this.flareGunFound,
        flareFired: this.flareFired,
        nearCampfire: false,
        nearInteractable: this.activeCrosshairTarget ? {
          id: this.activeCrosshairTarget.id,
          title: this.activeCrosshairTarget.title,
          prompt: this.activeCrosshairTarget.prompt,
        } : null,
        hasKey: this.hasKey,
        hasSample: this.hasSample,
        bleeding: this.bleeding,
        teaBuffTimer: Math.round(this.teaBuffTimer),
        chapter: this.chapter,
        zoom: this.zoom,
        playerX: Math.round(this.player.x),
        playerY: Math.round(this.player.z),
        playerAngle: this.player.yaw,
        elapsedTime: Math.floor(this.elapsedTime),
        inShelter: !!this.player.inShelter,
        inCave: false,
        inMud: !this.player.inShelter,
        temperature: 100,
        gingerTeaCount: this.gingerTeaCount,
        tasks: { ...this.tasks },
      });
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  loop(time) {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);

    // Clean up all DOM and Window Listeners
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    this.canvas.removeEventListener("click", this._onCanvasClick);
    document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    document.removeEventListener("pointerlockerror", this._onPointerLockError);
    window.removeEventListener("mousemove", this._onMouseMove);
    this.canvas.removeEventListener("wheel", this._onWheel);

    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
