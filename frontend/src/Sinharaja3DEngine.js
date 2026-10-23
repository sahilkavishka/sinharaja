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

    // Cave Gate and Extraction State
    this.caveGateUnlocked = false;
    this.caveGateOpening = false;
    this.caveGateSlide = 0;
    this.caveGateLeft = null;
    this.caveGateRight = null;
    this.caveGateCollider = null;
    this.leechHazardTimer = 0;
    this.signalRocketActive = false;
    this.signalRocketY = 0;
    this.signalRocketMesh = null;

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
    } else if (type === "hurt") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (type === "flare") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(250, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.6);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    } else if (type === "squelch") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(40, t + 0.14);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    } else if (type === "stone_rumble") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(48, t);
      osc.frequency.linearRampToValueAtTime(32, t + 1.2);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 1.2);
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
    // ── A. Multi-Layer PBR Sinharaja Terrain ──
    const terrainGeo = new THREE.PlaneGeometry(600, 600, 96, 96);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, this.getTerrainHeight(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x122414,
      roughness: 0.88,
      metalness: 0.12,
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.position.set(0, 0, 0);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // ── B. Muddy Rainforest Trail (Leading from Kudawa Outpost toward River & Cave) ──
    // Trail Path points from Cabin Entrance (520, 727) -> East toward River (640, 790)
    const trailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(520, 0.03, 726),
      new THREE.Vector3(518, 0.03, 735),
      new THREE.Vector3(512, 0.03, 750),
      new THREE.Vector3(505, 0.03, 768),
      new THREE.Vector3(500, 0.03, 790),
      new THREE.Vector3(492, 0.03, 815),
      new THREE.Vector3(480, 0.03, 840),
    ]);
    const trailGeo = new THREE.TubeGeometry(trailCurve, 40, 1.4, 8, false);
    trailGeo.scale(1, 0.02, 1); // Flatten into a sunken muddy path
    const trailMat = new THREE.MeshStandardMaterial({
      color: 0x22150c, // Rich damp rainforest mud
      roughness: 0.35,  // High wetness reflection
      metalness: 0.25,
    });
    const trailMesh = new THREE.Mesh(trailGeo, trailMat);
    trailMesh.receiveShadow = true;
    this.scene.add(trailMesh);

    // ── C. Reflective Rain Puddles along the Muddy Trail ──
    const puddleGeo = new THREE.CircleGeometry(1.6, 24);
    puddleGeo.rotateX(-Math.PI / 2);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x07151a,
      roughness: 0.08, // Mirror-like water surface reflecting moonlight
      metalness: 0.85,
      transparent: true,
      opacity: 0.88,
    });
    const puddlePositions = [
      [517, 738, 1.4, 1.1],
      [507, 762, 2.1, 1.5],
      [498, 795, 1.8, 1.2],
      [483, 835, 2.3, 1.6],
      [532, 736, 1.2, 0.9],
    ];
    puddlePositions.forEach(([px, pz, sx, sz]) => {
      const puddle = new THREE.Mesh(puddleGeo, puddleMat);
      puddle.position.set(px, this.getTerrainHeight(px, pz) + 0.04, pz);
      puddle.scale.set(sx, 1, sz);
      puddle.receiveShadow = true;
      this.scene.add(puddle);
    });

    // ── D. Kudawa Outpost 3D Cabin Architecture ──
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
    doorLeafGeo.translate(doorGapW / 2, (cabinH - lintelH) / 2, 0);
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

    doorMesh.userData = {
      isDoor: true,
      title: "කුඩව මුරපොළ දොරටුව (Outpost Door)",
      prompt: "[E] දොර අරින්න / වහන්න (Toggle Door)",
      action: () => this.toggleCabinDoor(),
    };
    this.interactableMeshes.push(doorMesh);

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

    // ── E. Interactive 3D Props on Table ──
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

    // 2. Douglas Voice Reel
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

    // 4. Evidence 1: Douglas Field Notebook / Diary (ලෙයින් පෙඟුණු දිනපොත)
    const diaryGeo = new THREE.BoxGeometry(0.38, 0.08, 0.52);
    const diaryMat = new THREE.MeshStandardMaterial({
      color: 0x5c2c16,
      roughness: 0.65,
      metalness: 0.2,
    });
    const diaryMesh = new THREE.Mesh(diaryGeo, diaryMat);
    diaryMesh.position.set(tableX + 1.6, tableH + 0.1, tableZ - 0.2);
    diaryMesh.rotation.y = 0.25;
    diaryMesh.castShadow = true;
    diaryMesh.userData = {
      id: "ranger_diary",
      title: "මහාචාර්ය ඩග්ලස්ගේ ක්ෂේත්‍ර දිනපොත (Douglas Field Journal - Evidence 01)",
      prompt: "[E] කියවන්න / සාක්ෂිය ලබාගන්න",
      action: (obj) => {
        if (!obj.userData.picked) {
          obj.userData.picked = true;
          this.tasks.diaryFound = true;
          this.playSfx("pickup");
          this.scene.remove(diaryMesh);
          const idx = this.interactableMeshes.indexOf(diaryMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          if (this.cb.onRadioTransmission) {
            this.cb.onRadioTransmission({
              id: "hq_diary_dispatch",
              speaker: "HQ DISPATCH",
              text: "දිනපොතේ හෝඩුවාව ලැබුණා! ඩග්ලස්ගේ කණ්ඩායම ලෙන දෙසට ගොස් ඇත. ගංගා ඉවුරේ සඟවා ඇති පිත්තල යතුර සොයාගන්න. කූඩැලි රැළිවලින් ප්‍රවේශම් වන්න!",
            });
          }
          this.cb.onTriggerStory({
            title: "දිනපොතේ අභිරහස (සාක්ෂි අංක 01)",
            text: "'1987 නොවැම්බර් 14: ඔවුන් ගල් ලෙන තුළට ගියා. ලෙන් දොරටුවේ රහස් සංකේත තුන: [සූර්යයා, ගංගාව, සිංහයා]. දොර විවෘත කිරීමට ගංගා ඉවුරේ සැඟවූ පිත්තල යතුර අවශ්‍යයි!'",
            item: "ලෙයින් පෙඟුණු දිනපොත (Evidence 1)",
            lore: {
              title: "සිංහරාජයේ රහස් දිනපොත",
              desc: "අතුරුදහන් වූ කණ්ඩායමේ ගමන් මාර්ගය හෙළි කරන වැදගත් සාක්ෂියකි.",
            },
          });
          this.cb.onNotify("📖 මහාචාර්ය ඩග්ලස්ගේ දිනපොත ලබාගත්තා! (සාක්ෂි 01/03)");
          if (this.cb.onAutosave) this.cb.onAutosave();
        }
      },
    };
    this.scene.add(diaryMesh);
    this.interactableMeshes.push(diaryMesh);

    // 5. Optical UV Night Filter Lens (UV කාචය)
    const uvGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.06, 16);
    const uvMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      roughness: 0.15,
      metalness: 0.85,
    });
    const uvMesh = new THREE.Mesh(uvGeo, uvMat);
    uvMesh.position.set(tableX - 1.7, tableH + 0.08, tableZ + 0.35);
    uvMesh.castShadow = true;
    uvMesh.userData = {
      id: "uv_lens_item",
      title: "අධෝරක්ත/UV රාත්‍රී පෙරහන (Tactical UV Lens)",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      action: (obj) => {
        if (!obj.userData.picked) {
          obj.userData.picked = true;
          this.uvUnlocked = true;
          this.playSfx("pickup");
          this.scene.remove(uvMesh);
          const idx = this.interactableMeshes.indexOf(uvMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.cb.onNotify("🟣 UV පෙරහන ලබාගත්තා! [U] මඟින් UV Blacklight සක්‍රිය කළ හැක.");
          if (this.cb.onAutosave) this.cb.onAutosave();
        }
      },
    };
    this.scene.add(uvMesh);
    this.interactableMeshes.push(uvMesh);

    // 6. Hot Ceylon Ginger Tea Mug (උණුසුම් ඉඟුරු තේ කෝප්පය)
    const teaGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.22, 12);
    const teaMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.7,
    });
    const teaMesh = new THREE.Mesh(teaGeo, teaMat);
    teaMesh.position.set(tableX - 0.5, tableH + 0.14, tableZ + 0.35);
    teaMesh.castShadow = true;
    teaMesh.userData = {
      id: "ginger_tea_mug",
      title: "උණුසුම් ඉඟුරු තේ (Hot Ceylon Ginger Tea)",
      prompt: "[E] පානය කරන්න (Drink)",
      action: (obj) => {
        if (!obj.userData.drank) {
          obj.userData.drank = true;
          this.sanity = Math.min(100, this.sanity + 30);
          this.player.stamina = 100;
          this.teaBuffTimer = 120;
          this.playSfx("heal");
          this.scene.remove(teaMesh);
          const idx = this.interactableMeshes.indexOf(teaMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.cb.onNotify("☕ උණුසුම් ඉඟුරු තේ පානය කළා! Sanity +30 & සීතල දුරු විය.");
        }
      },
    };
    this.scene.add(teaMesh);
    this.interactableMeshes.push(teaMesh);

    // 7. Emergency Salt Pouch on Bench (ලුණු කුඩු පැකට්ටුව)
    const saltGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const saltMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
    });
    const saltMesh = new THREE.Mesh(saltGeo, saltMat);
    saltMesh.position.set(cabinOriginX + 4.2, 0.4, cabinOriginZ - 3.5);
    saltMesh.castShadow = true;
    saltMesh.userData = {
      id: "salt_pouch_outpost",
      title: "ලුණු කුඩු පැකට්ටුව (Salt Pouch for Leeches)",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      action: (obj) => {
        if (!obj.userData.picked) {
          obj.userData.picked = true;
          this.saltCount += 4;
          this.playSfx("pickup");
          this.scene.remove(saltMesh);
          const idx = this.interactableMeshes.indexOf(saltMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.cb.onNotify("🧂 ලුණු කුඩු ලබාගත්තා! (+4 ලුණු) [1] මඟින් කූඩැල්ලන් ඉවත් කරන්න.");
          if (this.cb.onAutosave) this.cb.onAutosave();
        }
      },
    };
    this.scene.add(saltMesh);
    this.interactableMeshes.push(saltMesh);

    // ── F. 3D Ranger Gunadasa NPC (Standing on porch under overhang) ──
    const npcX = 527.5;
    const npcZ = 730.0;
    const npcY = this.getTerrainHeight(npcX, npcZ);

    const npcGroup = new THREE.Group();
    // Body (Safari Field Jacket)
    const npcBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 1.1, 10),
      new THREE.MeshStandardMaterial({ color: 0x3d4a36, roughness: 0.85 })
    );
    npcBody.position.y = 0.95;
    npcBody.castShadow = true;
    npcGroup.add(npcBody);

    // Head
    const npcHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x8d5b38, roughness: 0.7 })
    );
    npcHead.position.y = 1.65;
    npcHead.castShadow = true;
    npcGroup.add(npcHead);

    // Ranger Brimmed Bush Hat (කාකි තලප්පාව / හැට්ටය)
    const hatBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.40, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a4328, roughness: 0.9 })
    );
    hatBrim.position.y = 1.76;
    npcGroup.add(hatBrim);

    // Bamboo Walking Staff (උණ බට සැරයටිය)
    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 1.7, 8),
      new THREE.MeshStandardMaterial({ color: 0xb5944d, roughness: 0.6 })
    );
    staff.position.set(0.42, 0.85, 0.2);
    staff.castShadow = true;
    npcGroup.add(staff);

    npcGroup.position.set(npcX, npcY, npcZ);
    this.scene.add(npcGroup);
    this.colliders.push({ type: "circle", x: npcX, z: npcZ, radius: 0.75 });

    // Make Gunadasa interactable
    npcBody.userData = {
      id: "gunadasa_npc",
      title: "ගුණදාස මාමා (Old Ranger Gunadasa)",
      prompt: "[E] කතා කරන්න (Talk)",
      action: () => {
        if (!this.npc.helped) {
          this.npc.helped = true;
          this.saltCount += 3;
          this.herbCount += 2;
          this.balmCount += 1;
          this.playSfx("pickup");
          this.cb.onTriggerStory({
            title: "ප්‍රවීණ වන නිලධාරී ගුණදාස මාමා",
            text: "'ආයුබෝවන් මහත්තයා! මම මේ අවුරුදු 40ක් තිස්සේ සිංහරාජයේ රස්සාව කරපු ගුණදාස. 1987 මහා වැස්සේ මහාචාර්ය ඩග්ලස් මේ කැබින් එකෙන් පිටත් වුණේ ලෙන් දොරටුව දෙසට. මම ලුණු කුඩුයි, බෙහෙත් තෙලුයි, ඖෂධ පැළෑටියි දුන්නා. කූඩැල්ලන්ගෙන් පරිස්සම් වෙන්න!'",
            speaker: "OLD RANGER GUNADASA",
            avatar: "ranger",
          });
        } else {
          this.cb.onNotify("🧙‍♂️ ගුණදාස මාමා: 'මහත්තයා, මහාචාර්යවරයාගේ හඬ පටය මේසේ උඩ තියෙනවා. ඒක පරීක්ෂා කරලා කැලේට බහින්න!'");
        }
      },
    };
    this.interactableMeshes.push(npcBody);

    // ── G. Towering Sinharaja Dipterocarp Canopy Trees with Flanged Buttress Roots ──
    const treeTrunkGeo = new THREE.CylinderGeometry(0.55, 1.1, 18, 9);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x22160d, roughness: 0.92 });
    const canopyGeo1 = new THREE.DodecahedronGeometry(5.2, 1);
    const canopyGeo2 = new THREE.DodecahedronGeometry(4.2, 1);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0a240e, roughness: 0.82 });
    const rootGeo = new THREE.ConeGeometry(0.65, 3.2, 5);
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0f, roughness: 0.95 });

    const treePositions = [
      [502, 680], [542, 685], [488, 745], [552, 755],
      [468, 705], [572, 712], [455, 655], [585, 655],
      [508, 805], [538, 805], [445, 775], [595, 775],
      [475, 830], [520, 850], [565, 835], [435, 710],
      [605, 710], [512, 650], [470, 760], [568, 770],
    ];

    treePositions.forEach(([tx, tz]) => {
      const treeGroup = new THREE.Group();

      // Main towering trunk
      const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunk.position.y = 9;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Flanged Buttress Roots at base
      for (let r = 0; r < 4; r++) {
        const root = new THREE.Mesh(rootGeo, rootMat);
        const rAngle = (r / 4) * Math.PI * 2;
        root.position.set(Math.cos(rAngle) * 0.95, 1.4, Math.sin(rAngle) * 0.95);
        root.rotation.z = Math.cos(rAngle) * 0.45;
        root.rotation.x = Math.sin(rAngle) * 0.45;
        root.castShadow = true;
        treeGroup.add(root);
      }

      // Layered Canopy
      const canopy1 = new THREE.Mesh(canopyGeo1, canopyMat);
      canopy1.position.y = 18;
      canopy1.castShadow = true;
      treeGroup.add(canopy1);

      const canopy2 = new THREE.Mesh(canopyGeo2, canopyMat);
      canopy2.position.set(0.6, 21.5, 0.4);
      canopy2.castShadow = true;
      treeGroup.add(canopy2);

      const ty = this.getTerrainHeight(tx, tz);
      treeGroup.position.set(tx, ty, tz);
      this.scene.add(treeGroup);
      this.colliders.push({ type: "circle", x: tx, z: tz, radius: 1.15 });
    });

    // ── H. Fallen Giant Tree Log Bridges & Mud Obstacles ──
    const fallenLogGeo = new THREE.CylinderGeometry(0.7, 0.85, 12, 8);
    fallenLogGeo.rotateZ(Math.PI / 2);
    const fallenLogMat = new THREE.MeshStandardMaterial({
      color: 0x271910,
      roughness: 0.94,
    });
    const log1 = new THREE.Mesh(fallenLogGeo, fallenLogMat);
    const log1Y = this.getTerrainHeight(495, 785);
    log1.position.set(495, log1Y + 0.65, 785);
    log1.rotation.y = 0.42;
    log1.castShadow = true;
    log1.receiveShadow = true;
    this.scene.add(log1);
    this.colliders.push({ type: "box", minX: 490, maxX: 500, minZ: 780, maxZ: 790 });

    // ── I. Wet River Granite Boulders with Moss ──
    const boulderGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const boulderMat = new THREE.MeshStandardMaterial({
      color: 0x3d473d,
      roughness: 0.72,
      metalness: 0.18,
    });
    const boulderCoords = [
      [512, 735, 1.2],
      [502, 765, 1.6],
      [528, 770, 1.4],
      [486, 810, 2.0],
      [475, 735, 1.5],
      [548, 742, 1.3],
    ];
    boulderCoords.forEach(([bx, bz, bScale]) => {
      const bMesh = new THREE.Mesh(boulderGeo, boulderMat);
      const by = this.getTerrainHeight(bx, bz) + bScale * 0.8;
      bMesh.position.set(bx, by, bz);
      bMesh.scale.set(bScale, bScale * 0.85, bScale * 1.1);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      this.scene.add(bMesh);
      this.colliders.push({ type: "circle", x: bx, z: bz, radius: bScale * 1.05 });
    });

    // ── J. Instanced Undergrowth Foliage (Broadleaf Rainforest Ferns & Shrubs) ──
    const fernLeafGeo = new THREE.PlaneGeometry(0.75, 1.8);
    fernLeafGeo.translate(0, 0.9, 0); // Pivot at base
    const fernMat = new THREE.MeshStandardMaterial({
      color: 0x1a451e,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const fernInstances = 180;
    this.fernMesh = new THREE.InstancedMesh(fernLeafGeo, fernMat, fernInstances);
    const dummy = new THREE.Object3D();

    let fIdx = 0;
    for (let f = 0; f < 30; f++) {
      // Clustered fern clumps around trees and trail edges
      const clumpX = 520 + (Math.random() - 0.5) * 85;
      const clumpZ = 720 + (Math.random() - 0.5) * 85;

      // Keep cabin interior clear of ferns
      if (Math.abs(clumpX - 520) < 9 && Math.abs(clumpZ - 720) < 7) continue;

      const clumpY = this.getTerrainHeight(clumpX, clumpZ);
      const frondsPerClump = 6;
      for (let fr = 0; fr < frondsPerClump; fr++) {
        if (fIdx >= fernInstances) break;
        const angle = (fr / frondsPerClump) * Math.PI * 2 + Math.random() * 0.3;
        dummy.position.set(clumpX, clumpY, clumpZ);
        dummy.rotation.set(0.45 + Math.random() * 0.2, angle, 0);
        dummy.scale.set(1.0, 1.0 + Math.random() * 0.4, 1.0);
        dummy.updateMatrix();
        this.fernMesh.setMatrixAt(fIdx++, dummy.matrix);
      }
    }
    this.fernMesh.instanceMatrix.needsUpdate = true;
    this.fernMesh.castShadow = true;
    this.scene.add(this.fernMesh);

    // ── K. Dynamic Storm Raindrop Particles ──
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

    // ── L. Evidence 2: Antique Brass Key on River Boulder [512, 735] ──
    const keyGroup = new THREE.Group();
    const keyStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.2 })
    );
    keyStem.rotation.x = Math.PI / 2;
    keyGroup.add(keyStem);

    const keyRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.025, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.2 })
    );
    keyRing.position.z = -0.22;
    keyGroup.add(keyRing);

    const keyBit = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.2 })
    );
    keyBit.position.set(0.04, 0.05, 0.18);
    keyGroup.add(keyBit);

    const keyBouldY = this.getTerrainHeight(512, 735) + 1.2 * 0.8 + 0.35;
    keyGroup.position.set(512, keyBouldY, 735);
    keyGroup.castShadow = true;

    const keyLight = new THREE.PointLight(0xf59e0b, 1.2, 4.0);
    keyLight.position.set(512, keyBouldY + 0.3, 735);
    this.scene.add(keyLight);

    keyStem.userData = {
      id: "glowing_brass_key",
      title: "දිදුලන පිත්තල යතුර (Antique Brass Key - Evidence 02)",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      action: () => {
        if (!this.tasks.keyFound) {
          this.hasKey = true;
          this.tasks.keyFound = true;
          this.stormActive = true;
          this.playSfx("pickup");
          this.playSfx("thunder");
          this.scene.remove(keyGroup);
          this.scene.remove(keyLight);
          const idx = this.interactableMeshes.indexOf(keyStem);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          if (this.cb.onRadioTransmission) {
            this.cb.onRadioTransmission({
              id: "storm_emergency_dispatch",
              speaker: "HQ EMERGENCY",
              text: "හදිසි කාලගුණ අනතුරු ඇඟවීමක්! ගංගා නිම්නය පිටාර ගලමින් පවතී. වතුරට නොබැස යෝධ ගස් කොටන් පාලම (Log Bridge) ඔස්සේ එතෙර වී ලෙන් දොරටුව විවෘත කරන්න!",
            });
          }
          this.cb.onTriggerStory({
            title: "පුරාණ පිත්තල යතුර (සාක්ෂි අංක 02)",
            text: "ඔබට ගල් ලෙනේ දොරටුව විවෘත කළ හැකි පුරාණ පිත්තල යතුර හමුවිය! ඒ සමඟම ගංගා නිම්නයට මහ කුණාටුවක් කඩා වැටුණි. මඩ වගුර මඟහැර යෝධ ගස් කොටන් පාලම (Log Bridge) ඔස්සේ ආරක්ෂිතව එතෙර වන්න!",
            item: "පුරාණ පිත්තල යතුර (Evidence 2)",
          });
          this.cb.onNotify("🔑 පුරාණ පිත්තල යතුර ලබාගත්තා! (සාක්ෂි 02/03)");
          if (this.cb.onAutosave) this.cb.onAutosave();
        }
      },
    };
    this.scene.add(keyGroup);
    this.interactableMeshes.push(keyStem);

    // ── M. Ancient Monolith Cave Portal at [495, 840] ──
    const caveX = 495;
    const caveZ = 840;
    const caveY = this.getTerrainHeight(caveX, caveZ);

    const archMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.88,
      metalness: 0.12,
    });
    // Left Pillar
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(2.0, 7.5, 2.5), archMat);
    pillarL.position.set(caveX - 3.2, caveY + 3.75, caveZ);
    pillarL.castShadow = true;
    this.scene.add(pillarL);
    this.colliders.push({ type: "box", minX: caveX - 4.5, maxX: caveX - 2.0, minZ: caveZ - 1.5, maxZ: caveZ + 1.5 });

    // Right Pillar
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(2.0, 7.5, 2.5), archMat);
    pillarR.position.set(caveX + 3.2, caveY + 3.75, caveZ);
    pillarR.castShadow = true;
    this.scene.add(pillarR);
    this.colliders.push({ type: "box", minX: caveX + 2.0, maxX: caveX + 4.5, minZ: caveZ - 1.5, maxZ: caveZ + 1.5 });

    // Top Arch Lintel
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(8.4, 2.0, 2.6), archMat);
    archTop.position.set(caveX, caveY + 7.5, caveZ);
    archTop.castShadow = true;
    this.scene.add(archTop);

    // Stone Gate Left Slab
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
      metalness: 0.25,
    });
    const gateLeftMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5.5, 0.45), doorMat);
    gateLeftMesh.position.set(caveX - 1.1, caveY + 2.75, caveZ);
    gateLeftMesh.castShadow = true;
    this.scene.add(gateLeftMesh);
    this.caveGateLeft = gateLeftMesh;

    // Stone Gate Right Slab
    const gateRightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5.5, 0.45), doorMat);
    gateRightMesh.position.set(caveX + 1.1, caveY + 2.75, caveZ);
    gateRightMesh.castShadow = true;
    this.scene.add(gateRightMesh);
    this.caveGateRight = gateRightMesh;

    // Gate Barrier Collider
    this.caveGateCollider = {
      isGateBarrier: true,
      type: "box",
      minX: caveX - 2.3,
      maxX: caveX + 2.3,
      minZ: caveZ - 0.75,
      maxZ: caveZ + 0.75,
    };
    this.colliders.push(this.caveGateCollider);

    // Gate interaction trigger
    gateLeftMesh.userData = {
      id: "cave_gate",
      title: "පුරාණ භූගත ලෙන් දොරටුව (Ancient Monolith Cave Portal)",
      prompt: "[E] අගුළු හරින්න / විවෘත කරන්න",
      action: () => {
        if (this.caveGateUnlocked) {
          this.cb.onNotify("⛩️ ලෙන් දොරටුව දැනටමත් විවෘතව පවතී.");
          return;
        }
        if (!this.hasKey) {
          this.playSfx("hurt");
          this.cb.onNotify("⚠️ දොරටුව අගුළු දමා ඇත! ගංගා ඉවුරේ ගල් පර්වතය මත ඇති පිත්තල යතුර සොයාගන්න.");
          return;
        }

        if (this.cb.onOpenRunePuzzle) {
          this.cb.onOpenRunePuzzle(() => {
            this.caveGateUnlocked = true;
            this.caveGateOpening = true;
            this.playSfx("stone_rumble");
            this.playSfx("thunder");
            if (this.cb.onRadioTransmission) {
              this.cb.onRadioTransmission({
                id: "cave_gate_unlocked_radio",
                speaker: "SINHA-BASE // 01",
                text: "ලෙන් දොරටුව විවෘතයි! අභ්‍යන්තරයේ නිල් ආලෝකය විහිදෙන දිලීර සාම්පලය (Research Sample) සොයාගන්න!",
              });
            }
            this.cb.onTriggerStory({
              title: "ලෙන් දොරටුව විවෘත විය!",
              text: "රහස් සංකේත ගැලපීමෙන් පසු පැරණි ගල් දොර සෙලවෙමින් දෙපසට විවෘත විය. ඇතුළතින් නිල් පැහැති විද්‍යාගාර ආලෝකයක් දිස්වේ!",
            });
            if (this.cb.onAutosave) this.cb.onAutosave();
          });
        }
      },
    };
    this.interactableMeshes.push(gateLeftMesh);

    // ── N. Evidence 3: Bioluminescent Flora/Research Sample in Cave [495, 860] ──
    const sampleX = 495;
    const sampleZ = 860;
    const sampleY = this.getTerrainHeight(sampleX, sampleZ);

    const pedMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.6, 1.1, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
    );
    pedMesh.position.set(sampleX, sampleY + 0.55, sampleZ);
    pedMesh.castShadow = true;
    this.scene.add(pedMesh);

    const sampleVial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.42, 16),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x0891b2,
        emissiveIntensity: 0.8,
      })
    );
    sampleVial.position.set(sampleX, sampleY + 1.32, sampleZ);
    sampleVial.castShadow = true;

    const sampleLight = new THREE.PointLight(0x06b6d4, 2.2, 7.5);
    sampleLight.position.set(sampleX, sampleY + 1.6, sampleZ);
    this.scene.add(sampleLight);

    sampleVial.userData = {
      id: "cave_samples",
      title: "අතුරුදහන් වූ පර්යේෂණ සාම්පල (Lost Research Sample - Evidence 03)",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      action: () => {
        if (!this.tasks.sampleFound) {
          this.hasSample = true;
          this.tasks.sampleFound = true;
          this.playSfx("pickup");
          this.scene.remove(sampleVial);
          this.scene.remove(sampleLight);
          const idx = this.interactableMeshes.indexOf(sampleVial);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          if (this.cb.onRadioTransmission) {
            this.cb.onRadioTransmission({
              id: "all_evidence_collected_dispatch",
              speaker: "HQ DISPATCH",
              text: "සාක්ෂි 3ම සම්පූර්ණයි! දැන් වහාම කඳු මුදුනේ හෙලිපෑඩ් (Helipad) වෙත යන්න. Chopper-01 ගලවා ගැනීමේ යානය සීරුවෙන් තබා ඇත!",
            });
          }
          this.cb.onTriggerStory({
            title: "අභිරහස හෙළි විය! (සාක්ෂි අංක 03)",
            text: "වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ පර්යේෂණ සාම්පල බඳුන ඔබට හමුවිය! දැන් කඳු මුදුනේ ඇති හෙලිපෑඩ් වෙත ගොස් සංඥා කරන්න!",
            item: "පර්යේෂණ සාම්පල (Evidence 3)",
            lore: {
              title: "සිංහරාජයේ දුර්ලභ ශාක සාම්පලය",
              desc: "මහාචාර්ය ඩග්ලස් විසින් රැස් කළ අතිශය දුර්ලභ ජෛව සාම්පලයකි.",
            },
          });
          this.cb.onNotify("🧪 පර්යේෂණ සාම්පලය ලබාගත්තා! (සාක්ෂි 03/03 - සියල්ල සම්පූර්ණයි!)");
          if (this.cb.onAutosave) this.cb.onAutosave();
        }
      },
    };
    this.scene.add(sampleVial);
    this.interactableMeshes.push(sampleVial);

    // ── O. Extraction Helipad & Signal Flare Point at [545, 855] ──
    const heliX = 545;
    const heliZ = 855;
    const heliY = this.getTerrainHeight(heliX, heliZ);

    const padMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 9.0, 0.35, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.2 })
    );
    padMesh.position.set(heliX, heliY + 0.18, heliZ);
    padMesh.receiveShadow = true;
    this.scene.add(padMesh);

    const hBarMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 5.0), hBarMat);
    hBar1.position.set(heliX - 1.8, heliY + 0.38, heliZ);
    this.scene.add(hBar1);
    const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 5.0), hBarMat);
    hBar2.position.set(heliX + 1.8, heliY + 0.38, heliZ);
    this.scene.add(hBar2);
    const hBarCross = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.02, 0.65), hBarMat);
    hBarCross.position.set(heliX, heliY + 0.38, heliZ);
    this.scene.add(hBarCross);

    const mastMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 6.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
    );
    mastMesh.position.set(heliX + 7.0, heliY + 3.25, heliZ - 2.0);
    mastMesh.castShadow = true;
    this.scene.add(mastMesh);

    const beaconLight = new THREE.PointLight(0xef4444, 1.8, 20.0);
    beaconLight.position.set(heliX + 7.0, heliY + 6.6, heliZ - 2.0);
    this.scene.add(beaconLight);

    const crateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.85, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    crateMesh.position.set(heliX + 2.5, heliY + 0.6, heliZ + 2.5);
    crateMesh.castShadow = true;
    crateMesh.userData = {
      id: "kudawa_helipad_flare",
      title: "ගලවා ගැනීමේ හෙලිපෑඩ් සංඥා පද්ධතිය (Extraction Flare Crate)",
      prompt: "[E] පරීක්ෂා කරන්න / සංඥා දල්වන්න",
      action: () => {
        const hasAllEvidence = Boolean(
          this.tasks.diaryFound && this.tasks.keyFound && this.tasks.sampleFound
        );
        if (!hasAllEvidence) {
          this.cb.onNotify("⚠️ මෙහෙයුම අවසන් කිරීමට සාක්ෂි 3ම (දිනපොත, යතුර, සාම්පලය) ලබාගෙන තිබිය යුතුය!");
          return;
        }

        if (!this.flareFired) {
          this.flareFired = true;
          this.tasks.helipadReached = true;
          this.playSfx("flare");
          this.playSfx("thunder");

          const flareSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
          );
          flareSphere.position.set(heliX + 2.5, heliY + 1.2, heliZ + 2.5);
          this.scene.add(flareSphere);
          this.signalRocketMesh = flareSphere;
          this.signalRocketActive = true;
          this.signalRocketY = heliY + 1.2;

          this.cb.onNotify("🚀 සංඥා රොකට්ටුව අහසට මුදා හැරියා! Chopper-01 ගලවා ගැනීමේ හෙලිකොප්ටරය පැමිණේ!");

          if (this.cb.onRadioTransmission) {
            this.cb.onRadioTransmission({
              id: "chopper_incoming",
              speaker: "CHOPPER-01 PILOT",
              text: "රතු සංඥාව දුටුවා! කුණාටුව මැදින් අපි ගොඩබසිනවා... මහාචාර්ය ඩග්ලස්ගේ සියලු සාක්ෂි සුරක්ෂිතයි! විශිෂ්ට මෙහෙයුමක්!",
            });
          }

          setTimeout(() => {
            if (this.cb.onGameWon) {
              this.cb.onGameWon("hero");
            }
          }, 3600);
        }
      },
    };
    this.scene.add(crateMesh);
    this.interactableMeshes.push(crateMesh);

    // ── P. Green Pit Viper Hazard on Branch near [480, 750] ──
    const viperBranch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 5.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 })
    );
    const vbY = this.getTerrainHeight(480, 750) + 1.1;
    viperBranch.position.set(480, vbY, 750);
    viperBranch.rotation.z = 0.3;
    this.scene.add(viperBranch);

    const viperMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.06, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.35, metalness: 0.15 })
    );
    viperMesh.position.set(480, vbY + 0.25, 750);
    viperMesh.userData = {
      id: "viper_encounter",
      title: "පළා පොළඟා (Green Pit Viper)",
      prompt: "[E] පරීක්ෂා කරන්න",
      action: () => {
        if (this.torchOn) {
          this.playSfx("pickup");
          this.cb.onTriggerStory({
            title: "පළා පොළඟා පසුබැසීම",
            text: "ඔබේ විදුලි පන්දමේ දීප්තිමත් ආලෝකයට බිය වූ පළා පොළඟා ගස් අතු අතරින් පසුබැස ගියා! මාවත දැන් ආරක්ෂිතයි.",
            lore: {
              title: "පළා පොළඟා (Trimeresurus trigonocephalus)",
              desc: "ශ්‍රී ලංකාවට ආවේණික තුරුලතා ආශ්‍රිත වෙසෙන විෂ සහිත අලංකාර සර්පයෙකි.",
            },
          });
          if (this.cb.onAchievementUnlocked) {
            this.cb.onAchievementUnlocked("viper_repelled", "පළා පොළඟාගේ පසුබැසීම (Snake Charmer)", "🐍");
          }
          this.scene.remove(viperMesh);
          const idx = this.interactableMeshes.indexOf(viperMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        } else {
          this.health = Math.max(0, this.health - 25);
          this.sanity = Math.max(0, this.sanity - 20);
          this.bleeding = true;
          this.playSfx("hurt");
          this.cb.onNotify("🐍 අඳුරේ සිටි පළා පොළඟා දෂ්ට කළා! (Health -25). විදුලි පන්දම දල්වන්න!");
        }
      },
    };
    this.scene.add(viperMesh);
    this.interactableMeshes.push(viperMesh);

    // ── Q. Ceylon Blue Magpie Feather at [515, 780] ──
    const featherMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.45),
      new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.4,
        side: THREE.DoubleSide,
      })
    );
    const fY = this.getTerrainHeight(515, 780) + 0.35;
    featherMesh.position.set(515, fY, 780);
    featherMesh.rotation.x = Math.PI / 3;
    featherMesh.userData = {
      id: "magpie_feather",
      title: "කහබිලියා පිහාටුව (Ceylon Blue Magpie Feather)",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      action: () => {
        this.feathersCollected++;
        this.magpieCharmActive = true;
        this.player.speed = 6.2;
        this.playSfx("pickup");
        this.scene.remove(featherMesh);
        const idx = this.interactableMeshes.indexOf(featherMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        this.cb.onNotify("🪶 දුර්ලභ කහබිලියා පිහාටුව ලබාගත්තා! වේගය වැඩි විය (+25%).");
        if (this.cb.onAchievementUnlocked) {
          this.cb.onAchievementUnlocked("feather_collector", "වන පක්ෂියාගේ ආශිර්වාදය", "🪶");
        }
      },
    };
    this.scene.add(featherMesh);
    this.interactableMeshes.push(featherMesh);
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
    if (this.teaBuffTimer > 0) this.teaBuffTimer -= dt;

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

    // Cave Gate sliding doors animation when unlocked
    if (this.caveGateOpening && this.caveGateLeft && this.caveGateRight) {
      this.caveGateSlide = Math.min(2.4, this.caveGateSlide + dt * 1.8);
      this.caveGateLeft.position.x = 495 - 1.1 - this.caveGateSlide;
      this.caveGateRight.position.x = 495 + 1.1 + this.caveGateSlide;
      if (this.caveGateSlide >= 2.3 && this.caveGateCollider) {
        const cIdx = this.colliders.indexOf(this.caveGateCollider);
        if (cIdx >= 0) this.colliders.splice(cIdx, 1);
        this.caveGateCollider = null;
        this.caveGateOpening = false;
      }
    }

    // Signal Rocket rising animation
    if (this.signalRocketActive && this.signalRocketMesh) {
      this.signalRocketY += dt * 38;
      this.signalRocketMesh.position.y = this.signalRocketY;
      if (this.signalRocketY > 90) {
        this.scene.remove(this.signalRocketMesh);
        this.signalRocketMesh = null;
        this.signalRocketActive = false;
      }
    }

    // Mud Leech hazard system
    if (!this.player.inShelter && this.repellentTimer <= 0) {
      this.leechHazardTimer += dt;
      if (this.leechHazardTimer >= 22) {
        this.leechHazardTimer = 0;
        if (this.player.z > 735 && Math.random() < 0.65) {
          this.attachedLeeches = Math.min(3, this.attachedLeeches + 1);
          this.bleeding = true;
          this.playSfx("squelch");
          this.cb.onNotify("🩸 කූඩැල්ලෙකු එල්ලුණා! [1] මඟින් ලුණු ඉසින්න හෝ [B] මඟින් තෙල් ගාන්න.");
        }
      }
    }

    // Leech damage drain
    if (this.attachedLeeches > 0) {
      this.health = Math.max(10, this.health - dt * 0.8 * this.attachedLeeches);
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
