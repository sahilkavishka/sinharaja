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
    this.lang = this.cb.lang || "en";
    window.sinharaja3D = this;

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
    this.gameClock = 0;
    this.cameraShake = 0;
    this.magpieFeatherGroup = null;
    this.magpieBirdGroup = null;
    this.viperModelGroup = null;
    this.langurModelGroup = null;
    this.leopardGroup = null;
    this.leopardHead = null;
    this.leopardTail = null;
    this.humpnosedViperGroup = null;
    this.humpnosedTongue = null;
    this.featherObjects = [];
    this.lastLeopardGrowlTime = 0;
    this.lastViperHissTime = 0;
    this.lastGateWarningTime = 0;
    this.lastViperStrikeTime = -10.0;
    this.lastHnvStrikeTime = -10.0;
    this.lastLeopardStrikeTime = -10.0;
    this.safeHealingTimer = 0;
    this.lastHealNotifyTime = 0;
    this.chopperGroup = null;
    this.chopperRotor = null;
    this.chopperTailRotor = null;
    this.chopperStrobeLight = null;
    this.helipadBeaconBeam = null;
    this.hasKey = false;
    this.hasSample = false;
    this.hasGears = false;
    this.hasEmf = false;
    this.emfProximity = 0;
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.paused = false;

    // Chapter 2 specific variables & flags
    this.bambooStalksCollected = false;
    this.ropeCollected = false;
    this.waterLevel = 0.8;
    this.targetWaterLevel = 0.8;
    this.mineCollapsing = false;
    this.mineSealed = false;
    this.raftRiding = false;
    this.raftProgress = 0;
    this.raftBank = "west";
    this.raftDirection = 1;
    this.trolleyRiding = false;
    this.trolleyProgress = 0;
    this.sawscaledHissTimer = 0;
    this.lastSawscaledStrikeTime = -10.0;
    this.hypothermiaTimer = 0;

    // Chapter 3 specific variables & flags
    this.gasMaskEquipped = false;
    this.gasDamageTimer = 0;
    this.ch3FloodgateLowered = false;
    this.ch3WaterLevel = 0.8;
    this.ch3TargetWaterLevel = 0.8;
    this.ch3TremorActive = false;
    this.ch3TremorIntensity = 0;
    this.ch3TremorElapsed = 0;
    this.ch3BatWingSoundTimer = 0;
    this.ch3DripTimer = 0;
    this.ch3ElevatorActive = false;
    this.ch3ElevatorProgress = 0;
    this.evidence = this.cb.evidence || {};

    // Chapter Tasks
    if (this.chapter === 3) {
      this.tasks = {
        disembarkTrolley: true,
        slateFound: false,
        maskFound: false,
        floodgateUsed: false,
        riverCrossed: false,
        logFound: false,
        resonanceInvestigated: false,
        coreFound: false,
        elevatorReached: false,
      };
    } else if (this.chapter === 2) {
      this.tasks = {
        reachCamp: false,
        mapFound: false,
        raftMaterialsFound: false,
        raftRepaired: false,
        riverCrossed: false,
        tapeFound: false,
        mineFound: false,
        mineEntered: false,
        pumpActivated: false,
        gemFound: false,
        mineEscaped: false,
        trolleyFixed: false,
        gorgeCrossed: false,
      };
    } else {
      // Chapter 1 Tasks
      this.tasks = {
        diaryFound: false,
        keyFound: false,
        sampleFound: false,
        helipadReached: false,
      };
    }

    // NPC State
    this.npc = {
      x: 340,
      y: 400,
      name: "ගුණදාස මාමා (Old Ranger Gunadasa)",
      helped: false,
    };

    this.kudawaDoorOpen = true;
    this.doorSwingAngle = 1.45;

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
    const initX = this.chapter === 3 ? 120 : (this.chapter === 2 ? 108 : 520);
    const initZ = this.chapter === 3 ? 226 : (this.chapter === 2 ? 106 : 720);
    const initY = this.chapter === 3 ? 15.5 : (this.chapter === 2 ? 0.8 : 0);
    const initYaw = this.chapter === 3 ? Math.PI : (this.chapter === 2 ? Math.PI * 0.72 : Math.PI);
    const initInShelter = false;

    this.player = {
      x: initX,
      y: initY + 1.7, // Standing eye height above ground
      z: initZ,
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
      yaw: initYaw, // Facing toward camp down trail in Ch2, South toward doorway in Ch1
      pitch: 0,
      targetYaw: initYaw,
      targetPitch: 0,
      standHeight: 1.7,
      crouchHeight: 1.05,
      curEyeHeight: 1.7,
      inShelter: initInShelter,
      inCave: false,
      inMud: false,
    };

    this.keys = {};
    this.pointerLocked = false;
    this.controlsEngaged = true;
    window.addEventListener("blur", () => {
      this.keys = {};
    });
    this.activeCrosshairTarget = null;
    this.statsUpdateTimer = 0;
    this.lightningTimer = 0;
    this.footstepDist = 0;
    this.headBob = 0;

    // Graphics Quality & Tactical Flashlight State
    this.quality = "high"; // "high" | "medium" | "low"
    this.torchLag = {
      yaw: Math.PI,
      pitch: 0,
    };
    this.torchGroup = null;
    this.flashlight = null;
    this.flashlightSpill = null;
    this.hemiLight = null;
    this.volumetricBeam = null;
    this.volumetricUniforms = null;
    this.keyGroup = null;
    this.keyLight = null;
    this.keyBaseY = 0;
    this.gameTextures = {};
    this.broadleafMesh = null;

    // Continuous Procedural Ambience & 3D Audio State
    this.ambientStarted = false;
    this.ambientMasterGain = null;
    this.rainNoise = null;
    this.rainLowpass = null;
    this.rainHighpass = null;
    this.rainGainNode = null;
    this.cicadaCarrier = null;
    this.cicadaLfo = null;
    this.cicadaGainNode = null;
    this.radioNoise = null;
    this.radioGainNode = null;
    this.radioPanner = null;
    this.riverNoise = null;
    this.riverGainNode = null;
    this.riverPanner = null;
    this.caveDroneOsc = null;
    this.caveDroneGain = null;
    this.caveDronePanner = null;
    this.frogTimer = 0;
    this.nextFrogTime = 4.5;
    this.lightningActive = false;
    this.lightningFlashTimer = 0;
    this.nextLightningTime = 22.0;
    this.fernBaseMatrices = [];
    if (typeof window !== "undefined") {
      window.__sinharaja3d = this;
    }

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

    // Broadcast immediate 0-frame stats to React HUD for instant exact telemetry
    if (this.cb.onStatsUpdate) {
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
        nearInteractable: null,
        hasKey: this.hasKey,
        hasSample: this.hasSample,
        bleeding: this.bleeding,
        teaBuffTimer: Math.round(this.teaBuffTimer),
        chapter: this.chapter,
        zoom: this.zoom,
        playerX: Math.round(this.player.x),
        playerY: Math.round(this.player.z),
        playerAngle: this.player.yaw,
        elapsedTime: 0,
        inShelter: !!this.player.inShelter,
        inCave: false,
        inMud: false,
        temperature: 100,
        gingerTeaCount: this.gingerTeaCount,
        tasks: { ...this.tasks },
        quality: this.quality,
      });
    }

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
    } else if (type === "snake_hiss") {
      // Filtered White Noise Serpentine Warning Hiss
      const bufLen = Math.floor(this.audioCtx.sampleRate * 0.45);
      const hissBuf = this.audioCtx.createBuffer(1, bufLen, this.audioCtx.sampleRate);
      const data = hissBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = hissBuf;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(3200, t);
      filter.Q.setValueAtTime(3.5, t);
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start(t);
      noise.stop(t + 0.45);
    } else if (type === "leopard_growl") {
      // Low Guttural Feline Predator Growl
      const osc = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(54, t);
      osc.frequency.linearRampToValueAtTime(42, t + 0.9);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(62, t);
      osc2.frequency.linearRampToValueAtTime(36, t + 0.9);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.32, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.9);
      osc2.stop(t + 0.9);
    } else if (type === "chime") {
      // Harmonious 5-note Pentatonic Melodic Chime
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + idx * 0.09);
        gain.gain.setValueAtTime(0.18, t + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.55);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + idx * 0.09);
        osc.stop(t + idx * 0.09 + 0.55);
      });
    }
  }

  // ── Procedural Continuous Ambience & 3D Spatial Audio Engine ──────────────
  startContinuousAmbience() {
    if (!this.audioCtx || this.ambientStarted) return;
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    this.ambientStarted = true;
    const t = this.audioCtx.currentTime;

    try {
      // 1. Master Ambient Gain
      this.ambientMasterGain = this.audioCtx.createGain();
      this.ambientMasterGain.gain.setValueAtTime(this.muted ? 0 : 0.42, t);
      this.ambientMasterGain.connect(this.audioCtx.destination);

      // 2. Continuous Rainforest Rain Generator (Dual-Band Filtered Noise Loop)
      const bufLen = Math.floor(this.audioCtx.sampleRate * 2.5);
      const rainBuf = this.audioCtx.createBuffer(1, bufLen, this.audioCtx.sampleRate);
      const rainData = rainBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        rainData[i] = Math.random() * 2 - 1;
      }
      this.rainNoise = this.audioCtx.createBufferSource();
      this.rainNoise.buffer = rainBuf;
      this.rainNoise.loop = true;

      this.rainHighpass = this.audioCtx.createBiquadFilter();
      this.rainHighpass.type = "highpass";
      this.rainHighpass.frequency.setValueAtTime(260, t);

      this.rainLowpass = this.audioCtx.createBiquadFilter();
      this.rainLowpass.type = "lowpass";
      this.rainLowpass.frequency.setValueAtTime(1150, t);

      this.rainGainNode = this.audioCtx.createGain();
      this.rainGainNode.gain.setValueAtTime(0.12, t);

      this.rainNoise.connect(this.rainHighpass);
      this.rainHighpass.connect(this.rainLowpass);
      this.rainLowpass.connect(this.rainGainNode);
      this.rainGainNode.connect(this.ambientMasterGain);
      this.rainNoise.start(t);

      // 3. Sinharaja Night Cicadas & Canopy Insects (Rhythmic high-frequency carrier + LFO)
      this.cicadaCarrier = this.audioCtx.createOscillator();
      this.cicadaCarrier.type = "triangle";
      this.cicadaCarrier.frequency.setValueAtTime(4750, t);

      this.cicadaLfo = this.audioCtx.createOscillator();
      this.cicadaLfo.type = "sine";
      this.cicadaLfo.frequency.setValueAtTime(14, t);

      const cicadaLfoGain = this.audioCtx.createGain();
      cicadaLfoGain.gain.setValueAtTime(160, t);
      this.cicadaLfo.connect(cicadaLfoGain);
      cicadaLfoGain.connect(this.cicadaCarrier.frequency);

      const cicadaBandpass = this.audioCtx.createBiquadFilter();
      cicadaBandpass.type = "bandpass";
      cicadaBandpass.frequency.setValueAtTime(4750, t);
      cicadaBandpass.Q.setValueAtTime(3.8, t);

      this.cicadaGainNode = this.audioCtx.createGain();
      this.cicadaGainNode.gain.setValueAtTime(0.022, t);

      this.cicadaCarrier.connect(cicadaBandpass);
      cicadaBandpass.connect(this.cicadaGainNode);
      this.cicadaGainNode.connect(this.ambientMasterGain);

      this.cicadaCarrier.start(t);
      this.cicadaLfo.start(t);

      // 4. Positional 3D Audio: Kudawa Outpost Radio Static
      const radioBufLen = Math.floor(this.audioCtx.sampleRate * 1.5);
      const radioBuf = this.audioCtx.createBuffer(1, radioBufLen, this.audioCtx.sampleRate);
      const radioData = radioBuf.getChannelData(0);
      for (let i = 0; i < radioBufLen; i++) {
        radioData[i] = (Math.random() * 2 - 1) * 0.65;
      }
      this.radioNoise = this.audioCtx.createBufferSource();
      this.radioNoise.buffer = radioBuf;
      this.radioNoise.loop = true;

      const radioFilter = this.audioCtx.createBiquadFilter();
      radioFilter.type = "bandpass";
      radioFilter.frequency.setValueAtTime(1650, t);
      radioFilter.Q.setValueAtTime(2.2, t);

      this.radioGainNode = this.audioCtx.createGain();
      this.radioGainNode.gain.setValueAtTime(0.035, t);

      this.radioPanner = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;

      this.radioNoise.connect(radioFilter);
      radioFilter.connect(this.radioGainNode);
      if (this.radioPanner) {
        this.radioGainNode.connect(this.radioPanner);
        this.radioPanner.connect(this.ambientMasterGain);
      } else {
        this.radioGainNode.connect(this.ambientMasterGain);
      }
      this.radioNoise.start(t);

      // 5. Positional 3D Audio: River Rapids / Stream Flow
      const riverBufLen = Math.floor(this.audioCtx.sampleRate * 2.0);
      const riverBuf = this.audioCtx.createBuffer(1, riverBufLen, this.audioCtx.sampleRate);
      const riverData = riverBuf.getChannelData(0);
      for (let i = 0; i < riverBufLen; i++) {
        riverData[i] = Math.random() * 2 - 1;
      }
      this.riverNoise = this.audioCtx.createBufferSource();
      this.riverNoise.buffer = riverBuf;
      this.riverNoise.loop = true;

      const riverFilter = this.audioCtx.createBiquadFilter();
      riverFilter.type = "lowpass";
      riverFilter.frequency.setValueAtTime(420, t);

      this.riverGainNode = this.audioCtx.createGain();
      this.riverGainNode.gain.setValueAtTime(0, t);

      this.riverPanner = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;

      this.riverNoise.connect(riverFilter);
      riverFilter.connect(this.riverGainNode);
      if (this.riverPanner) {
        this.riverGainNode.connect(this.riverPanner);
        this.riverPanner.connect(this.ambientMasterGain);
      } else {
        this.riverGainNode.connect(this.ambientMasterGain);
      }
      this.riverNoise.start(t);

      // 6. Positional 3D Audio: Ancient Cave Monolith Drone
      this.caveDroneOsc = this.audioCtx.createOscillator();
      this.caveDroneOsc.type = "triangle";
      this.caveDroneOsc.frequency.setValueAtTime(65, t);

      this.caveDroneGain = this.audioCtx.createGain();
      this.caveDroneGain.gain.setValueAtTime(0, t);

      this.caveDronePanner = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;

      this.caveDroneOsc.connect(this.caveDroneGain);
      if (this.caveDronePanner) {
        this.caveDroneGain.connect(this.caveDronePanner);
        this.caveDronePanner.connect(this.ambientMasterGain);
      } else {
        this.caveDroneGain.connect(this.ambientMasterGain);
      }
      this.caveDroneOsc.start(t);
    } catch (err) {}
  }

  updateAmbience(dt) {
    if (!this.audioCtx || !this.ambientStarted || this.muted) return;
    const t = this.audioCtx.currentTime;

    // 1. Rain filtering: Muffled inside cabin roof vs Open downpour
    if (this.rainLowpass && this.rainGainNode) {
      if (this.player.inShelter) {
        this.rainLowpass.frequency.setTargetAtTime(620, t, 0.3);
        this.rainGainNode.gain.setTargetAtTime(0.045, t, 0.3);
      } else {
        this.rainLowpass.frequency.setTargetAtTime(1400, t, 0.3);
        const stormBoost = this.stormActive ? 0.22 : 0.13;
        this.rainGainNode.gain.setTargetAtTime(stormBoost, t, 0.3);
      }
    }

    // 2. Insects/Cicadas: Quiet indoors, lively outdoors
    if (this.cicadaGainNode) {
      const insectGoal = this.player.inShelter ? 0.006 : 0.026;
      this.cicadaGainNode.gain.setTargetAtTime(insectGoal, t, 0.4);
    }

    // 3. Positional Radio (Table at [515.5, 714.8])
    if (this.radioGainNode) {
      const rDist = Math.hypot(this.player.x - 515.5, this.player.z - 714.8);
      const rVol = Math.max(0, 1 - rDist / 20) * 0.055;
      this.radioGainNode.gain.setTargetAtTime(rVol, t, 0.15);
      if (this.radioPanner) {
        const angle = Math.atan2(515.5 - this.player.x, 714.8 - this.player.z) - this.player.yaw;
        const pan = Math.sin(angle);
        this.radioPanner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.15);
      }
    }

    // 4. Positional River Rapids (Near boulders at [505, 770])
    if (this.riverGainNode) {
      const rvDist = Math.hypot(this.player.x - 505, this.player.z - 770);
      const rvBase = this.player.inShelter ? 0.02 : 0.14;
      const rvVol = Math.max(0, 1 - rvDist / 42) * rvBase;
      this.riverGainNode.gain.setTargetAtTime(rvVol, t, 0.15);
      if (this.riverPanner) {
        const angle = Math.atan2(505 - this.player.x, 770 - this.player.z) - this.player.yaw;
        const pan = Math.sin(angle);
        this.riverPanner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.15);
      }
    }

    // 5. Positional Cave Monolith Drone (Near portal at [495, 840])
    if (this.caveDroneGain) {
      const cDist = Math.hypot(this.player.x - 495, this.player.z - 840);
      const cVol = Math.max(0, 1 - cDist / 35) * 0.12;
      this.caveDroneGain.gain.setTargetAtTime(cVol, t, 0.15);
      if (this.caveDronePanner) {
        const angle = Math.atan2(495 - this.player.x, 840 - this.player.z) - this.player.yaw;
        const pan = Math.sin(angle);
        this.caveDronePanner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.15);
      }
    }
  }

  playEndemicFrogCroak() {
    if (this.muted || !this.audioCtx) return;
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();
    const t = this.audioCtx.currentTime;

    const panVal = (Math.random() - 0.5) * 1.6;
    const panner = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;
    if (panner) panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panVal)), t);

    [0, 0.14].forEach((delay, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      const startFreq = idx === 0 ? 285 : 330;
      osc.frequency.setValueAtTime(startFreq, t + delay);
      osc.frequency.exponentialRampToValueAtTime(145, t + delay + 0.08);

      gain.gain.setValueAtTime(0.05, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.08);

      osc.connect(gain);
      if (panner) {
        gain.connect(panner);
      } else {
        gain.connect(this.audioCtx.destination);
      }
      osc.start(t + delay);
      osc.stop(t + delay + 0.08);
    });

    if (panner) panner.connect(this.audioCtx.destination);
  }

  triggerLightningStrike() {
    this.lightningActive = true;
    this.lightningFlashTimer = 0;

    const thunderDelay = 600 + Math.random() * 800;
    setTimeout(() => {
      if (this.running) {
        this.playProceduralThunder();
      }
    }, thunderDelay);
  }

  playProceduralThunder() {
    if (this.muted || !this.audioCtx) return;
    if (this.audioCtx.state === "suspended") this.audioCtx.resume();
    const t = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(58, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 3.0);
    oscGain.gain.setValueAtTime(0.32, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

    const bufLen = Math.floor(this.audioCtx.sampleRate * 3.2);
    const buf = this.audioCtx.createBuffer(1, bufLen, this.audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buf;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(120, t);
    filter.frequency.exponentialRampToValueAtTime(36, t + 3.2);
    filter.Q.setValueAtTime(2.2, t);

    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.38, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 3.2);

    const panner = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;
    const panVal = (Math.random() - 0.5) * 1.5;
    if (panner) panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panVal)), t);

    osc.connect(oscGain);
    noise.connect(filter);
    filter.connect(noiseGain);

    if (panner) {
      oscGain.connect(panner);
      noiseGain.connect(panner);
      panner.connect(this.audioCtx.destination);
    } else {
      oscGain.connect(this.audioCtx.destination);
      noiseGain.connect(this.audioCtx.destination);
    }

    osc.start(t);
    noise.start(t);
    osc.stop(t + 3.0);
    noise.stop(t + 3.2);
  }

  // ── Graphics Quality Preset Settings ──────────────────────────────────────
  cycleQuality() {
    const modes = ["high", "medium", "low"];
    const curIdx = modes.indexOf(this.quality);
    const nextMode = modes[(curIdx + 1) % modes.length];
    this.setQuality(nextMode);
  }

  setQuality(mode) {
    this.quality = mode;
    if (mode === "high") {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      if (this.flashlight) {
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.set(1024, 1024);
      }
      if (this.volumetricUniforms) this.volumetricUniforms.uIntensity.value = 0.16;
      this.cb.onNotify("⚙️ ග්‍රැෆික් මට්ටම: HIGH (Full Shadows, Volumetric Shafts & PBR)");
    } else if (mode === "medium") {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      if (this.flashlight) {
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.set(512, 512);
      }
      if (this.volumetricUniforms) this.volumetricUniforms.uIntensity.value = 0.10;
      this.cb.onNotify("⚙️ ග්‍රැෆික් මට්ටම: MEDIUM (Optimized Shadows & Mist Shafts)");
    } else {
      this.renderer.shadowMap.enabled = false;
      if (this.flashlight) {
        this.flashlight.castShadow = false;
      }
      if (this.volumetricBeam) this.volumetricBeam.visible = false;
      this.cb.onNotify("⚙️ ග්‍රැෆික් මට්ටම: LOW (Max Performance, Minimal Effects)");
    }

    if (this.renderer.shadowMap.needsUpdate !== undefined) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  // ── Terrain Heightmap Sampling Function ───────────────────────────────────
  getTerrainHeight(x, z) {
    if (this.chapter === 3) {
      return this.getChapter3TerrainHeight(x, z);
    }
    if (this.chapter === 2) {
      return this.getChapter2TerrainHeight(x, z);
    }

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
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    // 2. 3D Scene & Sinharaja Nocturnal Atmospheric Fog
    this.scene = new THREE.Scene();
    if (this.chapter === 3) {
      this.scene.background = new THREE.Color("#04070c");
      this.scene.fog = new THREE.FogExp2("#060b13", 0.015);
    } else if (this.chapter === 2) {
      this.scene.background = new THREE.Color("#0c2018");
      this.scene.fog = new THREE.FogExp2("#122a20", 0.0095);
    } else {
      this.scene.background = new THREE.Color("#071a12");
      this.scene.fog = new THREE.FogExp2("#092116", 0.0045);
    }

    // 3. True Perspective Camera
    this.camera = new THREE.PerspectiveCamera(74, width / height, 0.1, 800);
    this.camera.position.set(this.player.x, this.player.y, this.player.z);
    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);

    // 4. Raycaster for Precise Crosshair Targeting from Center Screen (0, 0)
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 7.5; // Max 7.5m interaction reach
    this.centerScreen = new THREE.Vector2(0, 0);

    // 5. Environmental Lighting (Nocturnal Rain Forest / Subterranean Cavern)
    if (this.chapter === 3) {
      this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.55);
      this.ambientLight = new THREE.AmbientLight(0x1e293b, 0.45);
      this.moonLight = new THREE.DirectionalLight(0x93c5fd, 0.95);
      this.moonLight.position.set(120, 50, 220);
      this.moonLight.target.position.set(120, 15, 270);
    } else if (this.chapter === 2) {
      this.hemiLight = new THREE.HemisphereLight(0x52826a, 0x1f3426, 1.45);
      this.ambientLight = new THREE.AmbientLight(0x35634e, 1.35);
      this.moonLight = new THREE.DirectionalLight(0xfef08a, 1.65); // Warm mountain sunlight cutting through mist
      this.moonLight.position.set(120, 95, 140);
      this.moonLight.target.position.set(170, 0, 200);
    } else {
      // Dynamic Rainforest Canopy & Ground Bounce Hemisphere Light
      this.hemiLight = new THREE.HemisphereLight(0x386b52, 0x1f2e1e, 1.25);
      // Deep nocturnal ambient green-blue to maintain accessibility and visibility (Project I.G.I. clarity)
      this.ambientLight = new THREE.AmbientLight(0x24523d, 1.15);
      // Moonlight rim directional light piercing through canopy over Chapter 1 [500, 180, 750]
      this.moonLight = new THREE.DirectionalLight(0x93c5fd, 1.35);
      this.moonLight.position.set(500, 180, 750);
      this.moonLight.target.position.set(505, 0, 780);
    }
    this.scene.add(this.hemiLight);
    this.scene.add(this.ambientLight);
    this.scene.add(this.moonLight);
    this.scene.add(this.moonLight.target);

    // Outpost porch kerosene lantern (warm welcoming amber light)
    if (this.chapter === 1) {
      const porchLantern = new THREE.PointLight(0xf59e0b, 3.2, 22, 1.5);
      porchLantern.position.set(527.5, 2.7, 728.5);
      this.scene.add(porchLantern);
    }

    // 6. Tactical Flashlight System (High-Intensity Spot + Soft Foreground Fill Spill)
    this.torchGroup = new THREE.Object3D();

    // Primary Focused Beam (High-Power 24W Beam with 95m reach and natural falloff)
    this.flashlight = new THREE.SpotLight(0xfffae6, 24.0, 95, Math.PI / 4.0, 0.55, 1.15);
    this.flashlight.position.set(0, 0, 0);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.camera.near = 0.2;
    this.flashlight.shadow.camera.far = 95;
    this.flashlight.shadow.bias = -0.0004;
    this.flashlight.shadow.normalBias = 0.05;

    // Slight downward tilt of -0.65m on target pool illuminates the ground/trail ahead
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, -0.65, -25);
    this.torchGroup.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.torchGroup.add(this.flashlight);

    // Secondary Soft Foreground Fill Light (Omnidirectional player foot bubble to prevent black abyss)
    this.flashlightSpill = new THREE.PointLight(0xfff0d0, 4.5, 18, 1.2);
    this.flashlightSpill.position.set(0, 0, 0);
    this.torchGroup.add(this.flashlightSpill);

    // 6b. Volumetric Atmospheric Rain/Mist Beam (Soft Additive Cone)
    const beamLength = 25.0;
    const beamGeo = new THREE.CylinderGeometry(0.08, 4.2, beamLength, 24, 1, true);
    beamGeo.rotateX(-Math.PI / 2);
    beamGeo.translate(0, 0, -beamLength / 2);

    this.volumetricUniforms = {
      uColor: { value: new THREE.Color(0xfffae6) },
      uIntensity: { value: 0.16 },
    };
    this.volumetricMat = new THREE.ShaderMaterial({
      uniforms: this.volumetricUniforms,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying float vDistance;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPosition.xyz);
          vDistance = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying float vDistance;
        void main() {
          float rim = 1.0 - abs(dot(vNormal, vViewDir));
          float depthFade = clamp(vDistance / 24.0, 0.0, 1.0);
          float alpha = pow(rim, 1.6) * (1.0 - depthFade * 0.7) * uIntensity;
          gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 0.35));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.volumetricBeam = new THREE.Mesh(beamGeo, this.volumetricMat);
    this.volumetricBeam.renderOrder = 999;
    this.torchGroup.add(this.volumetricBeam);

    this.scene.add(this.torchGroup);

    // Load Real PBR Textures
    this.loadRealTextures();

    // 7. Interactive 3D Meshes Collection & Obstacle Colliders
    this.interactableMeshes = [];
    this.colliders = [];
  }

  // ── Asset & Procedural Texture Generators ──────────────────────────────────
  loadRealTextures() {
    const loader = new THREE.TextureLoader();
    this.gameTextures = {
      door: loader.load("/textures/kudawa_door.png"),
      gunadasa: loader.load("/textures/ranger_gunadasa.png"),
      radio: loader.load("/textures/outpost_radio.png"),
      reel: loader.load("/textures/douglas_reel.png"),
      balm: loader.load("/textures/balm_bottle.png"),
      salt: loader.load("/textures/salt_pouch.png"),
      uv: loader.load("/textures/uv_lens.png"),
      solar: loader.load("/textures/solar_charger.png"),
      herb: loader.load("/textures/rainforest_herb.png"),
      flare: loader.load("/textures/flare_gun.png"),
    };
  }

  generateGroundPBRTextures() {
    const size = 512;
    // 1. Diffuse Canvas
    const dCanvas = document.createElement("canvas");
    dCanvas.width = size;
    dCanvas.height = size;
    const dCtx = dCanvas.getContext("2d");

    // Base rich nocturnal rainforest soil
    dCtx.fillStyle = "#2d442b";
    dCtx.fillRect(0, 0, size, size);

    // Damp humus and loam blotches
    for (let i = 0; i < 60; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      const rad = 25 + Math.random() * 45;
      const grad = dCtx.createRadialGradient(rx, ry, 2, rx, ry, rad);
      grad.addColorStop(0, "rgba(22, 14, 8, 0.7)");
      grad.addColorStop(1, "rgba(22, 14, 8, 0)");
      dCtx.fillStyle = grad;
      dCtx.beginPath();
      dCtx.arc(rx, ry, rad, 0, Math.PI * 2);
      dCtx.fill();
    }

    // Organic moss patches
    const mossColors = ["rgba(36, 68, 25, 0.65)", "rgba(48, 88, 34, 0.55)", "rgba(24, 52, 20, 0.7)"];
    for (let i = 0; i < 110; i++) {
      const mx = Math.random() * size;
      const my = Math.random() * size;
      const mRad = 12 + Math.random() * 32;
      dCtx.fillStyle = mossColors[i % mossColors.length];
      dCtx.beginPath();
      dCtx.ellipse(mx, my, mRad, mRad * (0.6 + Math.random() * 0.7), Math.random() * Math.PI, 0, Math.PI * 2);
      dCtx.fill();
    }

    // Decayed tropical leaf litter & twigs
    const leafColors = ["#4a3318", "#5c3e1e", "#3a2512", "#664720"];
    for (let i = 0; i < 280; i++) {
      const lx = Math.random() * size;
      const ly = Math.random() * size;
      const lw = 3 + Math.random() * 6;
      const lh = 1.5 + Math.random() * 3;
      dCtx.save();
      dCtx.translate(lx, ly);
      dCtx.rotate(Math.random() * Math.PI * 2);
      dCtx.fillStyle = leafColors[i % leafColors.length];
      dCtx.beginPath();
      dCtx.ellipse(0, 0, lw, lh, 0, 0, Math.PI * 2);
      dCtx.fill();
      dCtx.restore();
    }

    // Fine organic soil grain noise
    const imgData = dCtx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    dCtx.putImageData(imgData, 0, 0);

    const diffuseTex = new THREE.CanvasTexture(dCanvas);
    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    diffuseTex.repeat.set(40, 40);

    // 2. Roughness Canvas (differential wetness)
    const rCanvas = document.createElement("canvas");
    rCanvas.width = 256;
    rCanvas.height = 256;
    const rCtx = rCanvas.getContext("2d");
    rCtx.fillStyle = "#bbbbbb"; // Default matte damp soil
    rCtx.fillRect(0, 0, 256, 256);

    // Slick wet mud patches (dark in roughness = high gloss)
    for (let i = 0; i < 35; i++) {
      const wx = Math.random() * 256;
      const wy = Math.random() * 256;
      const wr = 15 + Math.random() * 35;
      const wGrad = rCtx.createRadialGradient(wx, wy, 2, wx, wy, wr);
      wGrad.addColorStop(0, "rgba(45, 45, 45, 0.85)"); // Glossy wet
      wGrad.addColorStop(1, "rgba(187, 187, 187, 0)");
      rCtx.fillStyle = wGrad;
      rCtx.beginPath();
      rCtx.arc(wx, wy, wr, 0, Math.PI * 2);
      rCtx.fill();
    }

    const roughTex = new THREE.CanvasTexture(rCanvas);
    roughTex.wrapS = THREE.RepeatWrapping;
    roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(40, 40);

    return { diffuseTex, roughTex };
  }

  generateBarkTexture() {
    const w = 256, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Base dark ironwood / dipterocarp trunk
    ctx.fillStyle = "#22170f";
    ctx.fillRect(0, 0, w, h);

    // Vertical striated wood grain grooves
    for (let x = 0; x < w; x += 3) {
      const shade = 18 + Math.floor(Math.sin(x * 0.15) * 8 + Math.random() * 14);
      ctx.fillStyle = `rgb(${shade + 12}, ${shade + 6}, ${shade})`;
      ctx.fillRect(x, 0, 2 + Math.random() * 2, h);
    }

    // Lichen and moss fissures
    for (let i = 0; i < 30; i++) {
      const lx = Math.random() * w;
      const ly = Math.random() * h;
      const lw = 6 + Math.random() * 14;
      const lh = 18 + Math.random() * 45;
      ctx.fillStyle = "rgba(42, 65, 33, 0.55)";
      ctx.beginPath();
      ctx.ellipse(lx, ly, lw, lh, (Math.random() - 0.5) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    return tex;
  }

  generateFernFrondTexture() {
    const w = 256, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, w, h);

    // Central rachis (stem)
    ctx.strokeStyle = "#385e2b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.quadraticCurveTo(w / 2 + 8, h * 0.5, w / 2, 12);
    ctx.stroke();

    // Leaflets (pinnae) branching out from rachis
    const pairs = 18;
    for (let i = 0; i < pairs; i++) {
      const t = i / pairs;
      const y = h - 25 - t * (h - 50);
      const span = Math.sin(t * Math.PI) * (w * 0.44);

      // Left leaflet
      ctx.fillStyle = "#1e5323";
      ctx.beginPath();
      ctx.moveTo(w / 2 - 2, y);
      ctx.quadraticCurveTo(w / 2 - span * 0.6, y - 12, w / 2 - span, y - 4);
      ctx.quadraticCurveTo(w / 2 - span * 0.5, y + 8, w / 2 - 2, y + 4);
      ctx.fill();

      // Right leaflet
      ctx.fillStyle = "#27682d";
      ctx.beginPath();
      ctx.moveTo(w / 2 + 2, y);
      ctx.quadraticCurveTo(w / 2 + span * 0.6, y - 12, w / 2 + span, y - 4);
      ctx.quadraticCurveTo(w / 2 + span * 0.5, y + 8, w / 2 + 2, y + 4);
      ctx.fill();

      // Pinna highlights
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, y);
      ctx.lineTo(w / 2 - span * 0.8, y - 3);
      ctx.moveTo(w / 2, y);
      ctx.lineTo(w / 2 + span * 0.8, y - 3);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }


  generateBroadleafTexture() {
    const w = 256, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, w, h);

    // Large elephant-ear leaf shape
    ctx.fillStyle = "#164522";
    ctx.beginPath();
    ctx.moveTo(w / 2, h - 10);
    ctx.bezierCurveTo(w * 0.05, h * 0.7, 0, h * 0.35, w / 2, 10);
    ctx.bezierCurveTo(w, h * 0.35, w * 0.95, h * 0.7, w / 2, h - 10);
    ctx.fill();

    // Central pale rib
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2, h - 10);
    ctx.lineTo(w / 2, 14);
    ctx.stroke();

    // Lateral veins
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(74, 222, 128, 0.45)";
    for (let v = 0; v < 8; v++) {
      const vy = h * 0.2 + v * (h * 0.08);
      ctx.beginPath();
      ctx.moveTo(w / 2, vy);
      ctx.quadraticCurveTo(w * 0.25, vy - 20, w * 0.12, vy - 10);
      ctx.moveTo(w / 2, vy);
      ctx.quadraticCurveTo(w * 0.75, vy - 20, w * 0.88, vy - 10);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }


  generateTimberPlanksTexture() {
    const w = 512, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#3a2215";
    ctx.fillRect(0, 0, w, h);

    const numPlanks = 8;
    const plankH = h / numPlanks;
    for (let p = 0; p < numPlanks; p++) {
      const y = p * plankH;
      const colorV = 45 + Math.floor(Math.sin(p * 2.3) * 12);
      ctx.fillStyle = `rgb(${colorV + 22}, ${colorV + 8}, ${colorV - 5})`;
      ctx.fillRect(0, y + 2, w, plankH - 4);

      for (let g = 0; g < 14; g++) {
        const gy = y + 4 + Math.random() * (plankH - 8);
        ctx.strokeStyle = "rgba(25, 14, 8, 0.4)";
        ctx.lineWidth = 1 + Math.random();
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy + (Math.random() - 0.5) * 3);
        ctx.stroke();
      }

      ctx.fillStyle = "#120804";
      ctx.fillRect(0, y, w, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 02: THE MIST GORGE & CASCADES (PROCEDURAL TEXTURES & GEOMETRY)
  // ═══════════════════════════════════════════════════════════════════════════

  generateWetGraniteTexture() {
    const w = 512, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Dark wet slate-granite base
    ctx.fillStyle = "#18201a";
    ctx.fillRect(0, 0, w, h);

    // Weathered mineral veins and granite flecks
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const rad = 15 + Math.random() * 45;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
      grad.addColorStop(0, "rgba(45, 58, 48, 0.65)");
      grad.addColorStop(1, "rgba(45, 58, 48, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lush wet moss streaks along vertical crevices
    const mossColors = ["rgba(40, 75, 32, 0.7)", "rgba(55, 95, 42, 0.6)", "rgba(25, 50, 20, 0.75)"];
    for (let m = 0; m < 140; m++) {
      const mx = Math.random() * w, my = Math.random() * h;
      ctx.fillStyle = mossColors[m % mossColors.length];
      ctx.beginPath();
      ctx.ellipse(mx, my, 8 + Math.random() * 20, 18 + Math.random() * 38, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wet water sheen streaks
    ctx.strokeStyle = "rgba(180, 220, 205, 0.22)";
    ctx.lineWidth = 1.5;
    for (let s = 0; s < 45; s++) {
      const sx = Math.random() * w;
      const sy = Math.random() * (h - 100);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 8, sy + 30 + Math.random() * 70);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  generateWaterfallTexture() {
    const w = 256, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Glacial teal water torrent base
    ctx.fillStyle = "rgba(14, 116, 144, 0.85)";
    ctx.fillRect(0, 0, w, h);

    // Churning white foam torrents
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * w;
      const y = Math.random() * (h - 80);
      const len = 40 + Math.random() * 120;
      const width = 1.5 + Math.random() * 4.0;
      ctx.strokeStyle = Math.random() < 0.6 ? "rgba(255, 255, 255, 0.88)" : "rgba(224, 242, 254, 0.7)";
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 6, y + len);
      ctx.stroke();
    }

    // Foamy spray blotches
    for (let f = 0; f < 120; f++) {
      const fx = Math.random() * w, fy = Math.random() * h;
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.beginPath();
      ctx.arc(fx, fy, 2 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    return tex;
  }

  generateBambooPoleTexture() {
    const w = 256, h = 256;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Golden green bamboo surface
    ctx.fillStyle = "#7c8e38";
    ctx.fillRect(0, 0, w, h);

    // Vertical fiber striations
    for (let x = 0; x < w; x += 4) {
      const lum = 110 + Math.floor(Math.sin(x * 0.4) * 20);
      ctx.strokeStyle = `rgb(${lum + 14}, ${lum + 28}, ${lum - 15})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Node joints (ring collars)
    const nodes = [45, 110, 185, 245];
    for (const ny of nodes) {
      ctx.fillStyle = "#3f4a1c";
      ctx.fillRect(0, ny - 3, w, 6);
      ctx.fillStyle = "#9cad4e";
      ctx.fillRect(0, ny - 1, w, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3);
    return tex;
  }

  generateGeologistMapTexture() {
    const w = 512, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Weathered survey parchment vellum
    ctx.fillStyle = "#e2d4b7";
    ctx.fillRect(0, 0, w, h);

    // Blueprint survey grid lines
    ctx.strokeStyle = "rgba(40, 75, 110, 0.22)";
    ctx.lineWidth = 1;
    for (let g = 30; g < w; g += 35) {
      ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(w, g); ctx.stroke();
    }

    // Topographic canyon contour rings in sepia
    ctx.strokeStyle = "rgba(90, 50, 25, 0.55)";
    ctx.lineWidth = 1.8;
    for (let r = 50; r < 240; r += 28) {
      ctx.beginPath();
      ctx.ellipse(w * 0.45, h * 0.5, r, r * 0.75, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // River stream in dark blue
    ctx.strokeStyle = "rgba(14, 116, 144, 0.75)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(w * 0.48, 0);
    ctx.bezierCurveTo(w * 0.46, h * 0.35, w * 0.54, h * 0.65, w * 0.52, h);
    ctx.stroke();

    // Red tactical target circle: Hidden Mine Shaft behind waterfall
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.78, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs on mine target
    ctx.beginPath();
    ctx.moveTo(w * 0.62 - 30, h * 0.78); ctx.lineTo(w * 0.62 + 30, h * 0.78);
    ctx.moveTo(w * 0.62, h * 0.78 - 30); ctx.lineTo(w * 0.62, h * 0.78 + 30);
    ctx.stroke();

    // Ink label
    ctx.fillStyle = "#991b1b";
    ctx.font = "bold 13px monospace";
    ctx.fillText("SHAFT NO. 4 (BEHIND FALLS)", w * 0.38, h * 0.86);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 12px serif";
    ctx.fillText("EXPEDITION CARTOGRAPH // DEC 1987", 40, 40);
    ctx.fillText("DR. JAYASURIYA - SECTOR 02", 40, 58);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  generateCrystalTexture() {
    const w = 256, h = 256;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Deep sapphire-cyan gradient
    const grad = ctx.createRadialGradient(w/2, h/2, 5, w/2, h/2, w/2);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, "#00f0ff");
    grad.addColorStop(0.7, "#0284c7");
    grad.addColorStop(1, "#082f49");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Facet lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w/2, 10); ctx.lineTo(w - 20, h/2); ctx.lineTo(w/2, h - 10); ctx.lineTo(20, h/2); ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w/2, 10); ctx.lineTo(w/2, h - 10);
    ctx.moveTo(20, h/2); ctx.lineTo(w - 20, h/2);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  generateLimestoneTexture() {
    const w = 512, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Deep subterranean wet limestone
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(0.5, "#0f172a");
    grad.addColorStop(1, "#182234");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Layered mineral strata bands
    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * h + (Math.sin(i * 1.5) * 8);
      ctx.strokeStyle = i % 3 === 0 ? "rgba(71, 85, 105, 0.45)" : "rgba(30, 41, 59, 0.6)";
      ctx.lineWidth = 2 + (i % 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) {
        ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 4);
      }
      ctx.stroke();
    }

    // Calcite veining
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1.5;
    for (let v = 0; v < 8; v++) {
      ctx.beginPath();
      let vx = (v / 8) * w + (Math.random() * 40 - 20);
      let vy = 0;
      ctx.moveTo(vx, vy);
      while (vy < h) {
        vx += (Math.random() - 0.5) * 24;
        vy += 20 + Math.random() * 20;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  generateSlateTexture() {
    const w = 256, h = 256;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Dark grey slate slab
    ctx.fillStyle = "#1e2229";
    ctx.fillRect(0, 0, w, h);

    // Chisel border
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, w - 24, h - 24);

    // Ancient Inscription Glyphs & Chisel marks
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 2;
    for (let row = 0; row < 5; row++) {
      const y = 45 + row * 38;
      ctx.beginPath();
      ctx.moveTo(28, y);
      for (let x = 32; x < w - 30; x += 18) {
        ctx.lineTo(x, y + (Math.sin(x + row) > 0 ? -6 : 6));
      }
      ctx.stroke();
    }

    // Douglas Expedition 1987 Stencil
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 10px monospace";
    ctx.fillText("EXPEDITION 1987 // SLATE-03", 28, 232);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  generateBlastDoorTexture() {
    const w = 512, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Weathered industrial gunmetal
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, w, h);

    // Steel panel seams
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.strokeRect(32, 32, w - 64, h - 64);
    ctx.beginPath();
    ctx.moveTo(w / 2, 32); ctx.lineTo(w / 2, h - 32);
    ctx.stroke();

    // Hazard Stripes Top
    ctx.fillStyle = "#eab308";
    ctx.fillRect(32, 32, w - 64, 40);
    ctx.fillStyle = "#000000";
    for (let x = 32; x < w - 64; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x + 20, 32);
      ctx.lineTo(x, 72);
      ctx.lineTo(x - 20, 72);
      ctx.closePath();
      ctx.fill();
    }

    // Hazard Stripes Bottom
    ctx.fillStyle = "#eab308";
    ctx.fillRect(32, h - 72, w - 64, 40);
    ctx.fillStyle = "#000000";
    for (let x = 32; x < w - 64; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, h - 72);
      ctx.lineTo(x + 20, h - 72);
      ctx.lineTo(x, h - 32);
      ctx.lineTo(x - 20, h - 32);
      ctx.closePath();
      ctx.fill();
    }

    // Military Stencil Center Text
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("RESTRICTED FACILITY", w / 2, h / 2 - 30);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 26px monospace";
    ctx.fillText("SECTOR 04 // 1987", w / 2, h / 2 + 10);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px monospace";
    ctx.fillText("BIO-RESONANCE RESEARCH WING", w / 2, h / 2 + 45);

    // Perimeter Steel Rivets
    ctx.fillStyle = "#64748b";
    for (let x = 45; x < w - 40; x += 45) {
      ctx.beginPath(); ctx.arc(x, 42, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, h - 42, 4, 0, Math.PI * 2); ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // ── Chapter 2 Terrain Heightmap Function ──────────────────────────────────
  getChapter2TerrainHeight(x, z) {
    // 1. Inside subterranean mine shaft (x: 196 to 265, z: 252 to 312)
    if (x >= 196 && x <= 265 && z >= 252 && z <= 312) {
      if (x >= 230 && x <= 242 && z >= 280 && z <= 292) {
        return 1.4; // Raised pump catwalk
      }
      return 0.0; // Flat stone cavern floor
    }

    // 2. Galganga Waterfall Cliff Face (z > 246)
    if (z > 246) {
      const cliffBlend = Math.min(1.0, (z - 246) / 8.0);
      return 26.0 * cliffBlend;
    }

    // 3. River gorge canyon floor (x: 140 to 180)
    const riverCenter = 160;
    const distToRiver = Math.abs(x - riverCenter);
    if (distToRiver < 18) {
      const t = distToRiver / 18;
      return -1.2 + t * 1.5;
    }

    // 4. East bank, trail, and camp (x < 142)
    if (x < 142) {
      // Overlook [108, 106] (y ~ 12.2) slopes down to Camp [125, 155] (y ~ 2.5) to River Dock [138, 185] (y ~ 0.5)
      const baseEast = 12.0 - (z - 100) * 0.11 - (x - 100) * 0.12;
      const wave = Math.sin(x * 0.08) * 0.5 + Math.cos(z * 0.07) * 0.4;
      return Math.max(0.3, baseEast + wave);
    }

    // 5. West bank, cliff trail, and trolley rim (x >= 176)
    const distFromBank = (x - 176);
    const westBase = 0.5 + distFromBank * 0.92 + (z - 180) * 0.07;
    const rockWave = Math.sin(x * 0.12) * 0.6 + Math.cos(z * 0.1) * 0.5;
    return Math.max(0.5, Math.min(24.0, westBase + rockWave));
  }

  // ── Chapter 3 Subterranean Caverns Terrain Heightmap ───────────────────────
  getChapter3TerrainHeight(x, z) {
    // 1. South of landing is the deep gorge abyss (z < 224)
    if (z < 224) {
      return -45.0; // Deep plunge into Galganga canyon chasm
    }

    // 2. Exterior landing & approach trail to cavern portal (z: 224 to 265)
    if (z < 265) {
      const trailCenter = 120;
      const distFromCenter = Math.abs(x - trailCenter);
      const baseLedge = 15.5 + (z - 224) * 0.025 + Math.sin(z * 0.2) * 0.2;
      if (distFromCenter > 5.5) {
        // Mountain cliff walls flanking the trail
        const wallRise = Math.pow(distFromCenter - 5.5, 1.7) * 2.2;
        return Math.min(32.0, baseLedge + wallRise);
      }
      return baseLedge;
    }

    // 3. Zone 1: Cavern Vestibule & 1987 Checkpoint (z: 265 to 330)
    if (z < 330) {
      const trailCenter = 120;
      const distFromCenter = Math.abs(x - trailCenter);
      // Gentle slope down from cave entrance (16.5) to deep floor (~7.5)
      const baseFloor = 16.5 - (z - 265) * 0.14 + Math.sin(x * 0.12) * 0.3;
      
      // Raised research checkpoint plinth (x: 122 to 132, z: 295 to 315)
      if (x >= 122 && x <= 132 && z >= 295 && z <= 315) {
        return Math.max(baseFloor, 10.2);
      }
      
      if (distFromCenter > 11.5) {
        const wallRise = Math.pow(distFromCenter - 11.5, 1.6) * 1.8;
        return Math.min(35.0, baseFloor + wallRise);
      }
      return baseFloor;
    }

    // 4. Zone 2: The Great Cavern & Sluice Gate (z: 330 to 395)
    if (z < 395) {
      const trailCenter = 120;
      const distFromCenter = Math.abs(x - trailCenter);
      const baseFloor = 2.5 + Math.sin(x * 0.1) * 0.35 + Math.cos(z * 0.12) * 0.25;

      // Raised east sluice catwalk terrace (x: 129 to 138, z: 352 to 368)
      if (x >= 129 && x <= 138 && z >= 352 && z <= 368) {
        return 5.5;
      }

      if (distFromCenter > 15.5) {
        const wallRise = Math.pow(distFromCenter - 15.5, 1.6) * 1.8;
        return Math.min(35.0, baseFloor + wallRise);
      }
      return baseFloor;
    }

    // 5. Zone 3: Subterranean River Canyon (z: 395 to 450)
    if (z < 450) {
      const trailCenter = 120;
      const distFromCenter = Math.abs(x - trailCenter);

      // Subterranean river channel running across (z: 410 to 430)
      if (z >= 410 && z <= 430) {
        // Stepping stone spine across the river (x: 118 to 123)
        if (x >= 118 && x <= 123) {
          return 0.5; // Natural limestone stepping boulders
        }
        return -1.6; // Riverbed
      }

      // Approach banks sloping towards the river
      const distToBank = z < 410 ? (410 - z) : (z - 430);
      const bankBase = 0.8 + Math.min(1.8, distToBank * 0.12);

      if (distFromCenter > 14.5) {
        const wallRise = Math.pow(distFromCenter - 14.5, 1.6) * 1.8;
        return Math.min(35.0, bankBase + wallRise);
      }
      return bankBase;
    }

    // 6. Zone 4: The Azure Resonance Cathedral (z: 450 to 520)
    if (z < 520) {
      const trailCenter = 120;
      const distFromCenter = Math.abs(x - trailCenter);
      const baseFloor = 2.4 + Math.sin(x * 0.08) * 0.25;

      // Central crystal spire dais (circle around [120, 485], radius 5.5m)
      const distToSpire = Math.hypot(x - 120, z - 485);
      if (distToSpire < 5.5) {
        return 3.8;
      }

      if (distFromCenter > 18.5) {
        const wallRise = Math.pow(distFromCenter - 18.5, 1.6) * 1.8;
        return Math.min(35.0, baseFloor + wallRise);
      }
      return baseFloor;
    }

    // 7. Zone 5: Rising Escape Fissure & Sector 04 Blast Doors (z: 520 to 565)
    if (z <= 565) {
      const trailCenter = 120;
      const distFromCenter = Math.abs(x - trailCenter);
      
      // Ascending ramp from y = 2.4 (at z = 520) up to y = 12.0 (at z = 548)
      let rampY = 2.4 + Math.min(9.6, (z - 520) * 0.35);
      if (z >= 548) {
        rampY = 12.0; // Concrete facility threshold apron
      }

      const halfW = z >= 548 ? 10.5 : 7.5;
      if (distFromCenter > halfW) {
        const wallRise = Math.pow(distFromCenter - halfW, 1.6) * 2.0;
        return Math.min(35.0, rampY + wallRise);
      }
      return rampY;
    }

    // Beyond facility perimeter
    return 35.0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 02: THE MIST GORGE & CASCADES — 3D WORLD BUILDER
  // ═══════════════════════════════════════════════════════════════════════════

  buildChapter2World() {
    this.interactableMeshes = [];
    this.colliders = [];

    const wetGraniteTex = this.generateWetGraniteTexture();
    const waterfallTex = this.generateWaterfallTexture();
    const bambooTex = this.generateBambooPoleTexture();
    const mapTex = this.generateGeologistMapTexture();
    const crystalTex = this.generateCrystalTexture();
    const timberTex = this.generateTimberPlanksTexture();
    const barkTex = this.generateBarkTexture();
    const fernTex = this.generateFernFrondTexture();

    // Helper to create glowing cyan interactive halo rings
    const createCyanInteractiveHalo = (radius = 0.28) => {
      const hGeo = new THREE.TorusGeometry(radius, 0.024, 8, 24);
      hGeo.rotateX(Math.PI / 2);
      const hMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      return new THREE.Mesh(hGeo, hMat);
    };

    // ── 1. Canyon Terrain Geometry ──────────────────────────────────────────
    const terrainCenter = { x: 170, z: 195 };
    const terrainSize = 340;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, 120, 120);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const lx = posAttr.getX(i);
      const lz = posAttr.getZ(i);
      const wx = terrainCenter.x + lx;
      const wz = terrainCenter.z + lz;
      posAttr.setY(i, this.getChapter2TerrainHeight(wx, wz));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: wetGraniteTex,
      roughness: 0.62,
      metalness: 0.25,
      color: 0x94a896,
    });
    this.ch2TerrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.ch2TerrainMesh.position.set(terrainCenter.x, 0, terrainCenter.z);
    this.ch2TerrainMesh.receiveShadow = true;
    this.scene.add(this.ch2TerrainMesh);

    // ── 2. Fast-Moving Canyon River Rapids ──────────────────────────────────
    const riverGeo = new THREE.PlaneGeometry(38, 200, 24, 48);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0e7490,
      roughness: 0.12,
      metalness: 0.45,
      transparent: true,
      opacity: 0.85,
    });
    this.ch2RiverMesh = new THREE.Mesh(riverGeo, riverMat);
    this.ch2RiverMesh.position.set(160, 0.05, 175);
    this.ch2RiverMesh.receiveShadow = true;
    this.scene.add(this.ch2RiverMesh);

    // Wet riverbank mud & foam fringes
    const foamGeo = new THREE.PlaneGeometry(42, 204, 16, 32);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.42,
    });
    const foamMesh = new THREE.Mesh(foamGeo, foamMat);
    foamMesh.position.set(160, 0.08, 175);
    this.scene.add(foamMesh);

    // ── 3. The Mighty Galganga Waterfall (26m High) ─────────────────────────
    const wfGeo = new THREE.PlaneGeometry(18, 27, 16, 32);
    this.ch2WfTex = waterfallTex;
    const wfMat = new THREE.MeshStandardMaterial({
      map: this.ch2WfTex,
      transparent: true,
      opacity: 0.92,
      roughness: 0.08,
      metalness: 0.2,
      color: 0xe0f2fe,
      side: THREE.DoubleSide,
    });
    this.ch2WaterfallMesh = new THREE.Mesh(wfGeo, wfMat);
    this.ch2WaterfallMesh.position.set(198, 13.5, 249.2);
    this.scene.add(this.ch2WaterfallMesh);

    // Waterfall Plunge Spray Cloud
    const sprayGeo = new THREE.CylinderGeometry(1.0, 10.5, 4.5, 20, 1, true);
    const sprayMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ch2SprayMesh = new THREE.Mesh(sprayGeo, sprayMat);
    this.ch2SprayMesh.position.set(198, 1.8, 245);
    this.scene.add(this.ch2SprayMesh);

    // Cool glacial blue illumination for waterfall
    const wfLight = new THREE.PointLight(0x38bdf8, 3.2, 32, 1.2);
    wfLight.position.set(198, 10, 244);
    this.scene.add(wfLight);

    // ── 4. Broken Wooden Suspension Bridge ──────────────────────────────────
    const bridgeGroup = new THREE.Group();
    // Timber towers
    const towerMat = new THREE.MeshStandardMaterial({ map: timberTex, roughness: 0.7, color: 0x5c4033 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.3 });

    const createTower = (tx, tz, ty) => {
      const g = new THREE.Group();
      const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 9.5, 8), towerMat);
      post1.position.set(-1.8, 4.75, 0);
      const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 9.5, 8), towerMat);
      post2.position.set(1.8, 4.75, 0);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 0.4), towerMat);
      cross.position.set(0, 8.5, 0);
      g.add(post1); g.add(post2); g.add(cross);
      g.position.set(tx, ty, tz);
      return g;
    };

    const eastTowerY = this.getChapter2TerrainHeight(112, 110);
    const westTowerY = this.getChapter2TerrainHeight(182, 110);
    bridgeGroup.add(createTower(112, 110, eastTowerY));
    bridgeGroup.add(createTower(182, 110, westTowerY));

    // East bridge deck (14m extending out, then severed)
    for (let b = 0; b < 10; b++) {
      const px = 112 + b * 1.4;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 3.2), towerMat);
      plank.position.set(px, eastTowerY + 0.5 - b * 0.18, 110 + (Math.random() - 0.5) * 0.1);
      plank.rotation.z = (Math.random() - 0.5) * 0.08;
      bridgeGroup.add(plank);
    }
    // Dangling shattered planks
    const danglePlank = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 3.0), towerMat);
    danglePlank.position.set(127, eastTowerY - 2.5, 110);
    danglePlank.rotation.z = -Math.PI / 3;
    bridgeGroup.add(danglePlank);

    // Braided suspension steel cables (snapped and hanging)
    const cable1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 22, 6), cableMat);
    cable1.position.set(122, eastTowerY + 4.0, 108.5);
    cable1.rotation.z = Math.PI / 3.2;
    bridgeGroup.add(cable1);
    this.scene.add(bridgeGroup);

    // Invisible collider stopping player from plunging off the broken bridge
    this.colliders.push({
      type: "box",
      minX: 124, maxX: 130,
      minZ: 107, maxZ: 113,
    });

    // ── 4b. Crashed Chapter 01 Extraction Helicopter (Connection to Ch. 1) ──
    const crashHeliGroup = new THREE.Group();
    const crashHeliX = 104;
    const crashHeliZ = 98;
    const crashHeliY = this.getChapter2TerrainHeight(crashHeliX, crashHeliZ);

    const ch1BodyMat = new THREE.MeshStandardMaterial({ color: 0x2b3826, roughness: 0.75, metalness: 0.35 });
    const ch1StripeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.3 });
    const ch1GlassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.8 });
    const ch1ScorchedMetal = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9, metalness: 0.7 });

    // Fuselage - crash tilted sideways in the jungle mud
    const crashFuselage = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.0, 5.2), ch1BodyMat);
    crashFuselage.position.set(0, 1.0, 0);
    crashHeliGroup.add(crashFuselage);

    // Orange rescue stripe on fuselage
    const crashStripe = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.45, 3.8), ch1StripeMat);
    crashStripe.position.set(0, 1.15, 0.2);
    crashHeliGroup.add(crashStripe);

    // Cracked cockpit nose
    const crashNose = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 2.0, 8), ch1BodyMat);
    crashNose.position.set(0, 0.7, -3.2);
    crashNose.rotation.x = -Math.PI / 2;
    crashHeliGroup.add(crashNose);

    const crashGlass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 1.8), ch1GlassMat);
    crashGlass.position.set(0, 1.35, -2.1);
    crashHeliGroup.add(crashGlass);

    // Snapped Tail Boom with dangling wires
    const crashTail = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 4.8, 8), ch1BodyMat);
    crashTail.position.set(0.6, 1.1, 4.2);
    crashTail.rotation.x = Math.PI / 2 + 0.35;
    crashTail.rotation.y = 0.45;
    crashHeliGroup.add(crashTail);

    // Broken bent rotor blades
    const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 8), ch1ScorchedMetal);
    rotorHub.position.set(0, 2.2, -0.2);
    crashHeliGroup.add(rotorHub);

    // Blade 1 bent into the mud
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 3.8), ch1ScorchedMetal);
    blade1.position.set(0, 1.2, -2.0);
    blade1.rotation.x = 0.65;
    crashHeliGroup.add(blade1);

    // Blade 2 snapped
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 2.2), ch1ScorchedMetal);
    blade2.position.set(1.2, 2.1, 0.5);
    blade2.rotation.y = Math.PI / 1.6;
    crashHeliGroup.add(blade2);

    // Flickering cockpit emergency beacon LED
    const cockpitWarnLight = new THREE.PointLight(0xef4444, 2.8, 8, 1.5);
    cockpitWarnLight.position.set(0, 1.4, -2.0);
    crashHeliGroup.add(cockpitWarnLight);
    this.ch2CrashHeliLight = cockpitWarnLight;

    // Charred smoke wisps rising from engine
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.38 });
    const smokeWisps = [];
    for (let s = 0; s < 4; s++) {
      const sMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35 + s * 0.15, 6, 6), smokeMat);
      sMesh.position.set((Math.random() - 0.5) * 0.4, 2.3 + s * 0.6, (Math.random() - 0.5) * 0.4);
      crashHeliGroup.add(sMesh);
      smokeWisps.push(sMesh);
    }
    this.ch2CrashSmokeWisps = smokeWisps;

    // Position and tilt the helicopter in the rainforest mud
    crashHeliGroup.position.set(crashHeliX, crashHeliY, crashHeliZ);
    crashHeliGroup.rotation.z = 0.38;
    crashHeliGroup.rotation.y = 0.65;
    this.scene.add(crashHeliGroup);

    // Crash site physical collision bounds
    this.colliders.push({
      type: "box",
      minX: crashHeliX - 3.2, maxX: crashHeliX + 3.2,
      minZ: crashHeliZ - 3.8, maxZ: crashHeliZ + 3.8,
    });

    // Interactive Flight Recorder & Emergency Medical Supply Case
    const supplyCaseMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.35,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
    });
    const supplyCaseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.65), supplyCaseMat);
    supplyCaseMesh.position.set(crashHeliX + 1.8, crashHeliY + 0.35, crashHeliZ - 0.8);

    const supplyHalo = createCyanInteractiveHalo(0.36);
    supplyHalo.position.set(crashHeliX + 1.8, crashHeliY + 0.9, crashHeliZ - 0.8);
    this.scene.add(supplyHalo);
    this.ch2SupplyHalo = supplyHalo;
    this.ch2SupplyHaloBaseY = crashHeliY + 0.9;

    const supplyGlow = new THREE.PointLight(0x38bdf8, 2.5, 6, 1.2);
    supplyGlow.position.set(crashHeliX + 1.8, crashHeliY + 0.9, crashHeliZ - 0.8);
    this.scene.add(supplyGlow);
    this.ch2SupplyGlow = supplyGlow;

    supplyCaseMesh.userData = {
      id: "crashed_heli_supplies",
      title: "කඩා වැටුණු හෙලිකොප්ටරය (Crashed Extraction Chopper)",
      titleEn: "Crashed Bell-206 Extraction Helicopter (Ch. 1 Connection)",
      prompt: "[E] හෙලිකොප්ටරය පරීක්ෂා කර බඩු ලබාගන්න (Inspect Wreckage)",
      promptEn: "[E] Inspect Wreckage & Salvage Emergency Kit",
      action: () => {
        if (this.ch2SupplyHalo) this.scene.remove(this.ch2SupplyHalo);
        if (this.ch2SupplyGlow) this.scene.remove(this.ch2SupplyGlow);
        const idx = this.interactableMeshes.indexOf(supplyCaseMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        this.activeCrosshairTarget = null;

        // Replenish survival items carried over / salvaged
        this.saltCount = Math.min(8, (this.saltCount || 0) + 4);
        this.balmCount = Math.min(6, (this.balmCount || 0) + 3);
        this.herbCount = Math.min(5, (this.herbCount || 0) + 2);
        this.health = Math.min(100, this.health + 30);
        this.tasks.heliInspected = true;

        this.playSfx("radio");
        if (this.cb.onTriggerStory) {
          this.cb.onTriggerStory({
            id: "chopper_mayday_log",
            title: "CRASHED SINHA-01 EXTRACTION CHOPPER // FLIGHT RECORDER",
            speaker: "FLIGHT CREW // MAYDAY DISPATCH",
            text: this.lang === "en"
              ? "🚨 'MAYDAY MAYDAY! Sinha-01 to Kudawa Command! The moment we banked over Galganga gorge, an intense electromagnetic shockwave pulsed from the subterranean depths! Both turbine ECUs fried instantly. We managed an autorotation crash-landing on the ridge. Crew secured. Douglas's expedition path leads directly down toward the abandoned geological camp. Salvaged emergency Salt [1], Leech Balm [B], and Herbs [2] from the survival kit!'"
              : "🚨 'මැයිඩේ! මැයිඩේ! SINHA-01 සිට කුඩව මූලස්ථානයට! ගල්ගඟ නිම්නය ඉහළින් පියාසර කරද්දී භූගත ගැඹුරෙන් පුපුරා ආ ප්‍රබල විද්‍යුත් චුම්භක තරංගයක් නිසා හෙලිකොප්ටරයේ සියලුම පාලන පද්ධති විනාශ වුණා! ගුවන් නියමුවන් හදිසි ගොඩබැස්වීමකින් බේරුණා. මහාචාර්ය ඩග්ලස්ගේ අඩිපාර ඔස්සේ පහළ අතහැර දැමූ භූවිද්‍යා කඳවුරට යන්න! හදිසි ප්‍රතිකාර පෙට්ටියෙන් ලුණු [1], කූඩැළු තෙල් [B], සහ ඖෂධ [2] ලබාගන්නා ලදී.'",
          });
        }
        this.cb.onNotify(
          this.lang === "en"
            ? "🚁 Salvaged emergency survival gear from crashed chopper! (+4 Salt, +3 Leech Balm, +2 Herbs)"
            : "🚁 කඩා වැටුණු හෙලිකොප්ටරයෙන් හදිසි ප්‍රතිකාර ද්‍රව්‍ය ලබාගත්තා! (+4 ලුණු, +3 කූඩැළු තෙල්, +2 ඖෂධ)"
        );
      },
    };
    this.scene.add(supplyCaseMesh);
    this.interactableMeshes.push(supplyCaseMesh);

    // ── 5. Abandoned Geological Expedition Camp ([125, 155]) ────────────────
    const campGroup = new THREE.Group();
    const campBaseY = this.getChapter2TerrainHeight(125, 155);

    // Weathered canvas A-frame expedition tent
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x475539, roughness: 0.85, side: THREE.DoubleSide });
    const tentGeo = new THREE.ConeGeometry(3.8, 3.2, 4);
    tentGeo.rotateY(Math.PI / 4);
    const tentMesh = new THREE.Mesh(tentGeo, tentMat);
    tentMesh.position.set(122, campBaseY + 1.6, 152);
    campGroup.add(tentMesh);

    // Survey Drafting Table
    const tableMat = new THREE.MeshStandardMaterial({ map: timberTex, roughness: 0.55 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.5), tableMat);
    tableTop.position.set(126, campBaseY + 1.05, 155);
    campGroup.add(tableTop);

    // Table legs
    for (let lx of [-0.95, 0.95]) {
      for (let lz of [-0.6, 0.6]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.05, 6), tableMat);
        leg.position.set(126 + lx, campBaseY + 0.52, 155 + lz);
        campGroup.add(leg);
      }
    }

    // Brass Theodolite on Tripod
    const theodoliteMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.25 });
    const theodolite = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 10), theodoliteMat);
    theodolite.position.set(126.6, campBaseY + 1.35, 154.8);
    campGroup.add(theodolite);

    // Storm Kerosene Lantern on Table
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.6 });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8), lanternMat);
    lantern.position.set(125.4, campBaseY + 1.25, 154.7);
    campGroup.add(lantern);
    const lanternGlow = new THREE.PointLight(0xfef08a, 1.8, 8, 1.5);
    lanternGlow.position.set(125.4, campBaseY + 1.45, 154.7);
    campGroup.add(lanternGlow);

    // ── EVIDENCE A: Geologist's Map (map2) on Desk ──
    const mapGeo = new THREE.BoxGeometry(0.65, 0.04, 0.48);
    const mapMat = new THREE.MeshStandardMaterial({
      map: mapTex,
      roughness: 0.35,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
    });
    const mapMesh = new THREE.Mesh(mapGeo, mapMat);
    mapMesh.position.set(126.0, campBaseY + 1.12, 155.2);

    // Glowing Ethereal Cyan Beacon Light & Floating Halo
    const mapGlow = new THREE.PointLight(0x38bdf8, 2.5, 6, 1.2);
    mapGlow.position.set(126.0, campBaseY + 1.45, 155.2);
    campGroup.add(mapGlow);

    const mapHalo = createCyanInteractiveHalo(0.28);
    mapHalo.position.set(126.0, campBaseY + 1.35, 155.2);
    campGroup.add(mapHalo);
    this.ch2MapHalo = mapHalo;
    this.ch2MapHaloBaseY = campBaseY + 1.35;
    this.ch2MapGlow = mapGlow;

    mapMesh.userData = {
      id: "geologist_map",
      title: "භූවිද්‍යා සිතියම (Geological Cartograph)",
      titleEn: "Geological Survey Cartograph (Evidence A)",
      prompt: "[E] සිතියම පරීක්ෂා කර ලබාගන්න (Inspect & Collect)",
      promptEn: "[E] Inspect & Collect Geologist's Map",
      action: () => {
        this.scene.remove(mapMesh);
        if (this.ch2MapHalo) campGroup.remove(this.ch2MapHalo);
        if (this.ch2MapGlow) campGroup.remove(this.ch2MapGlow);
        const idx = this.interactableMeshes.indexOf(mapMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        this.activeCrosshairTarget = null;
        this.tasks.mapFound = true;
        this.playSfx("pda_open");
        if (this.cb.onOpenMap2Modal) {
          this.cb.onOpenMap2Modal();
        }
        if (this.cb.onTriggerStory) {
          this.cb.onTriggerStory({
            id: "geologist_map_found",
            title: "GEOLOGICAL SURVEY CARTOGRAPH RECOVERED",
            speaker: "EXPEDITION INTEL // DR. JAYASURIYA",
            text: this.lang === "en"
              ? "Dr. Jayasuriya's cartograph charts the Galganga gorge! It clearly marks an abandoned 1894 graphite mine shaft concealed behind the Great Cascade. The bridge is smashed — we must repair the bamboo raft to cross the rapids."
              : "ආචාර්ය ජයසූරියගේ සිතියමෙන් ගල්ගඟ අගාධයේ සම්පූර්ණ තොරතුරු හෙළිවේ! මහා දියඇල්ල පිටුපස සඟවා ඇති 1894 පැරණි පතලක් මෙහි සලකුණු කර ඇත. පාලම කැඩී ඇති බැවින් ගඟ තරණයට උණ බම්බු පහුර අලුත්වැඩියා කළ යුතුය.",
          });
        }
        this.cb.onNotify(
          this.lang === "en"
            ? "🗺️ Collected Geologist's Map! Marked secret mine entrance behind waterfall."
            : "🗺️ භූවිද්‍යා සිතියම ලබාගන්නා ලදී! දියඇල්ල පිටුපස රහස් පතල් පිවිසුම සලකුණු කර ඇත."
        );
      },
    };
    campGroup.add(mapMesh);
    this.interactableMeshes.push(mapMesh);

    // Campfire Hearth (Safe Warmth Recovery Zone)
    const fireStoneGeo = new THREE.TorusGeometry(0.9, 0.22, 8, 14);
    fireStoneGeo.rotateX(Math.PI / 2);
    const fireStoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const fireRing = new THREE.Mesh(fireStoneGeo, fireStoneMat);
    fireRing.position.set(125, campBaseY + 0.15, 159);
    campGroup.add(fireRing);

    // Glowing charred firewood logs
    const logMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
    for (let l = 0; l < 4; l++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 6), logMat);
      log.position.set(125, campBaseY + 0.2, 159);
      log.rotation.y = (l * Math.PI) / 4;
      log.rotation.z = 0.15 * (l % 2 === 0 ? 1 : -1);
      campGroup.add(log);
    }

    // Warm Campfire Point Light
    this.ch2CampfireLight = new THREE.PointLight(0xf59e0b, 3.4, 16, 1.2);
    this.ch2CampfireLight.position.set(125, campBaseY + 0.6, 159);
    campGroup.add(this.ch2CampfireLight);
    this.scene.add(campGroup);

    // ── RAFT REPAIR MATERIALS (Near Camp) ──────────────────────────────────
    // 1. Bamboo Stalks Bundle at [132, 168]
    const bambooBaseY = this.getChapter2TerrainHeight(132, 168);
    const bambooGroup = new THREE.Group();
    const bambooMat = new THREE.MeshStandardMaterial({ map: bambooTex, roughness: 0.45 });
    for (let i = 0; i < 6; i++) {
      const bPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), bambooMat);
      bPole.position.set((i % 3) * 0.16 - 0.16, 0.08 + Math.floor(i / 3) * 0.14, 0);
      bPole.rotation.z = Math.PI / 2;
      bPole.rotation.y = (Math.random() - 0.5) * 0.15;
      bambooGroup.add(bPole);
    }
    const bambooHitBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 1.2, 1.4),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
    );
    bambooHitBox.position.set(132, bambooBaseY + 0.5, 168);

    // Glowing Cyan Beacon Light & Floating Halo
    const bambooGlow = new THREE.PointLight(0x38bdf8, 2.4, 6, 1.2);
    bambooGlow.position.set(132, bambooBaseY + 1.1, 168);
    this.scene.add(bambooGlow);

    const bambooHalo = createCyanInteractiveHalo(0.35);
    bambooHalo.position.set(132, bambooBaseY + 1.0, 168);
    this.scene.add(bambooHalo);
    this.ch2BambooHalo = bambooHalo;
    this.ch2BambooHaloBaseY = bambooBaseY + 1.0;
    this.ch2BambooGlow = bambooGlow;

    bambooHitBox.userData = {
      id: "bamboo_stalks",
      title: "උණ බම්බු මිටිය (Sturdy Bamboo Stalks)",
      titleEn: "Sturdy Bamboo Stalks (Raft Material)",
      prompt: "[E] උණ බම්බු එකතු කරගන්න (Collect Stalks)",
      promptEn: "[E] Pick up Bamboo Stalks",
      action: () => {
        this.scene.remove(bambooGroup);
        this.scene.remove(bambooHitBox);
        if (this.ch2BambooHalo) this.scene.remove(this.ch2BambooHalo);
        if (this.ch2BambooGlow) this.scene.remove(this.ch2BambooGlow);
        const idx = this.interactableMeshes.indexOf(bambooHitBox);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        this.activeCrosshairTarget = null;
        this.bambooStalksCollected = true;
        this.playSfx("wood_creak");
        if (this.ropeCollected) {
          this.tasks.raftMaterialsFound = true;
          this.cb.onNotify(
            this.lang === "en"
              ? "🎋 All raft materials secured! Head to the riverbank to repair the bamboo raft."
              : "🎋 පහුරු අමුද්‍රව්‍ය සියල්ල සම්පූර්ණයි! ගං ඉවුරේ ඇති පහුර අලුත්වැඩියා කරන්න."
          );
        } else {
          this.cb.onNotify(
            this.lang === "en"
              ? "🎋 Collected Bamboo Stalks! (Still need braided rope near camp)"
              : "🎋 උණ බම්බු ලබාගන්නා ලදී! (කඳවුර අසල ඇති කඹයද අවශ්‍ය වේ)"
          );
        }
      },
    };
    bambooGroup.position.set(132, bambooBaseY + 0.2, 168);
    this.scene.add(bambooGroup);
    this.scene.add(bambooHitBox);
    this.interactableMeshes.push(bambooHitBox);

    // 2. Braided Rope Coil at [120, 148]
    const ropeBaseY = this.getChapter2TerrainHeight(120, 148);
    const ropeMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.6,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
    });
    const ropeMesh = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.12, 8, 16), ropeMat);
    ropeMesh.rotation.x = Math.PI / 2;
    ropeMesh.position.set(120, ropeBaseY + 0.15, 148);

    // Glowing Cyan Beacon Light & Floating Halo
    const ropeGlow = new THREE.PointLight(0x38bdf8, 2.4, 6, 1.2);
    ropeGlow.position.set(120, ropeBaseY + 0.8, 148);
    this.scene.add(ropeGlow);

    const ropeHalo = createCyanInteractiveHalo(0.32);
    ropeHalo.position.set(120, ropeBaseY + 0.7, 148);
    this.scene.add(ropeHalo);
    this.ch2RopeHalo = ropeHalo;
    this.ch2RopeHaloBaseY = ropeBaseY + 0.7;
    this.ch2RopeGlow = ropeGlow;

    ropeMesh.userData = {
      id: "climbing_rope",
      title: "ශක්තිමත් කඹය (Braided Climbing Rope)",
      titleEn: "Braided Rope Coil (Raft Material)",
      prompt: "[E] කඹය එකතු කරගන්න (Collect Rope)",
      promptEn: "[E] Pick up Braided Rope",
      action: () => {
        this.scene.remove(ropeMesh);
        if (this.ch2RopeHalo) this.scene.remove(this.ch2RopeHalo);
        if (this.ch2RopeGlow) this.scene.remove(this.ch2RopeGlow);
        const idx = this.interactableMeshes.indexOf(ropeMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        this.activeCrosshairTarget = null;
        this.ropeCollected = true;
        this.playSfx("squelch");
        if (this.bambooStalksCollected) {
          this.tasks.raftMaterialsFound = true;
          this.cb.onNotify(
            this.lang === "en"
              ? "🪢 All raft materials secured! Head to the riverbank to repair the bamboo raft."
              : "🪢 පහුරු අමුද්‍රව්‍ය සියල්ල සම්පූර්ණයි! ගං ඉවුරේ ඇති පහුර අලුත්වැඩියා කරන්න."
          );
        } else {
          this.cb.onNotify(
            this.lang === "en"
              ? "🪢 Collected Braided Rope! (Still need bamboo stalks near camp)"
              : "🪢 කඹය ලබාගන්නා ලදී! (කඳවුර අසල ඇති උණ බම්බුද අවශ්‍ය වේ)"
          );
        }
      },
    };
    this.scene.add(ropeMesh);
    this.interactableMeshes.push(ropeMesh);

    // ── 6. The Bamboo River Raft ([138, 185]) ──────────────────────────────
    this.ch2RaftGroup = new THREE.Group();
    // 10 parallel lashed bamboo logs
    for (let p = 0; p < 10; p++) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 4.2, 8), bambooMat);
      pole.position.set((p - 4.5) * 0.24, 0.12, 0);
      pole.rotation.x = Math.PI / 2;
      this.ch2RaftGroup.add(pole);
    }
    // Cross-ties
    for (let c of [-1.5, 0, 1.5]) {
      const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), bambooMat);
      cross.position.set(0, 0.24, c);
      cross.rotation.z = Math.PI / 2;
      this.ch2RaftGroup.add(cross);
    }
    // Wooden steering oar
    const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 6), tableMat);
    oar.position.set(0.9, 0.45, -1.8);
    oar.rotation.x = 0.5;
    this.ch2RaftGroup.add(oar);

    this.ch2RaftGroup.position.set(138, 0.2, 185);
    this.scene.add(this.ch2RaftGroup);

    // Raft Interactive Hitbox
    const raftHitBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.6, 5.0),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
    );
    raftHitBox.position.set(138, 0.6, 185);

    // Glowing Cyan Beacon Light & Mooring Halo
    const raftGlow = new THREE.PointLight(0x38bdf8, 2.8, 8, 1.2);
    raftGlow.position.set(138, 1.6, 185);
    this.scene.add(raftGlow);

    const raftHalo = createCyanInteractiveHalo(0.75);
    raftHalo.position.set(138, 1.4, 185);
    this.scene.add(raftHalo);
    this.ch2RaftHalo = raftHalo;
    this.ch2RaftHaloBaseY = 1.4;
    this.ch2RaftGlow = raftGlow;
    raftHitBox.userData = {
      id: "bamboo_raft_dock",
      title: "උණ බම්බු පහුර (Bamboo Raft)",
      titleEn: "Bamboo River Raft",
      prompt: () => {
        if (!this.tasks.raftMaterialsFound) {
          return this.lang === "en" ? "[E] Damaged Raft (Needs Bamboo & Rope)" : "[E] කැඩුණු පහුර (අමුද්‍රව්‍ය සොයාගන්න)";
        }
        if (!this.tasks.raftRepaired) {
          return this.lang === "en" ? "[E] Repair Bamboo Raft" : "[E] පහුර අලුත්වැඩියා කරන්න";
        }
        if (this.raftBank === "west") {
          return this.lang === "en"
            ? "[E] Board Raft & Cross to East Bank (Waterfall & Mine)"
            : "[E] පහුරෙන් නැගෙනහිර ඉවුරට යන්න (දියඇල්ල සහ පතල)";
        } else {
          return this.lang === "en"
            ? "[E] Board Raft & Return to West Bank (Camp & Wreckage)"
            : "[E] පහුරෙන් බටහිර ඉවුරට ආපසු යන්න (කඳවුර සහ හෙලිකොප්ටරය)";
        }
      },
      action: () => {
        if (!this.tasks.raftMaterialsFound) {
          this.playSfx("hurt");
          this.cb.onNotify(
            this.lang === "en"
              ? "⚠️ The raft is smashed! Search the expedition camp for bamboo stalks and climbing rope."
              : "⚠️ පහුර කැඩී ඇත! කඳවුර අසල ඇති උණ බම්බු සහ කඹ සොයාගන්න."
          );
          return;
        }
        if (!this.tasks.raftRepaired) {
          this.tasks.raftRepaired = true;
          this.playSfx("craft");
          this.cb.onNotify(
            this.lang === "en"
              ? "🪵 Bamboo raft repaired! Press [E] to board and navigate the rapids."
              : "🪵 පහුර අලුත්වැඩියා කරන ලදී! ගඟ තරණයට [E] ඔබන්න."
          );
          return;
        }
        if (!this.raftRiding) {
          this.raftRiding = true;
          this.raftProgress = 0;
          this.playSfx("squelch");
          if (this.raftBank === "west") {
            this.raftDirection = 1;
            this.cb.onNotify(
              this.lang === "en"
                ? "⛵ Navigating Galganga rapids to East Bank (Waterfall & Mine)..."
                : "⛵ ගල්ගඟේ සැඩ පහර ඔස්සේ නැගෙනහිර ඉවුරට (දියඇල්ල සහ පතල) ගමන් කරමින්..."
            );
          } else {
            this.raftDirection = -1;
            this.cb.onNotify(
              this.lang === "en"
                ? "⛵ Navigating Galganga rapids back to West Bank (Camp & Wreckage)..."
                : "⛵ ගල්ගඟේ සැඩ පහර ඔස්සේ බටහිර ඉවුරට (කඳවුර සහ හෙලිකොප්ටරය) ආපසු යමින්..."
            );
          }
        }
      },
    };
    this.scene.add(raftHitBox);
    this.interactableMeshes.push(raftHitBox);
    this.ch2RaftHitBox = raftHitBox;

    // ── 7. EVIDENCE B: Dr. Jayasuriya's Audio Cassette ([175, 232]) ────────
    const tapeBaseY = this.getChapter2TerrainHeight(175, 232);
    const tapeGeo = new THREE.BoxGeometry(0.32, 0.08, 0.22);
    const tapeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.65,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
    });
    this.ch2TapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
    this.ch2TapeMesh.position.set(175, tapeBaseY + 0.35, 232);

    // Glowing Electric Cyan Beacon Light & Floating Halo
    const tapeGlow = new THREE.PointLight(0x38bdf8, 3.2, 8, 1.2);
    tapeGlow.position.set(175, tapeBaseY + 0.6, 232);
    this.ch2TapeMesh.add(tapeGlow);

    const tapeHalo = createCyanInteractiveHalo(0.28);
    tapeHalo.position.set(175, tapeBaseY + 0.75, 232);
    this.scene.add(tapeHalo);
    this.ch2TapeHalo = tapeHalo;
    this.ch2TapeHaloBaseY = tapeBaseY + 0.75;
    this.ch2TapeGlow = tapeGlow;

    this.ch2TapeMesh.userData = {
      id: "jayasuriya_tape",
      title: "හඬපටය (Recovered Audio Cassette)",
      titleEn: "Dr. Jayasuriya's Audio Cassette (Evidence B)",
      prompt: "[E] හඬපටය ලබාගෙන අසන්න (Collect & Listen)",
      promptEn: "[E] Collect & Play Audio Transmission",
      action: () => {
        this.scene.remove(this.ch2TapeMesh);
        if (this.ch2TapeHalo) this.scene.remove(this.ch2TapeHalo);
        const idx = this.interactableMeshes.indexOf(this.ch2TapeMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        this.activeCrosshairTarget = null;
        this.tasks.tapeFound = true;
        this.playSfx("pda_open");
        if (this.cb.onOpenTapeModal) {
          this.cb.onOpenTapeModal();
        }
        if (this.cb.onRadioTransmission) {
          this.cb.onRadioTransmission({
            id: "jayasuriya_dispatch",
            speaker: "DR. JAYASURIYA [1987 AUDIO]",
            text: this.lang === "en"
              ? "The blue crystal inside the mine is disrupting our radios... the water level is rising... our only chance of escape is the radio tower on the summit!"
              : "පතල තුළ ඇති නිල් ස්ඵටිකය අපගේ රේඩියෝ තරංග විනාශ කරනවා... ජල මට්ටම වේගයෙන් ඉහළ යනවා... අපට බේරීමට ඇති එකම මඟ කඳු මුදුනේ ඇති සංඥා කුලුනයි!",
          });
        }
        this.cb.onNotify(
          this.lang === "en"
            ? "📼 Secured Dr. Jayasuriya's Cassette! Revealed crystal anomaly in flooded mine."
            : "📼 ආචාර්ය ජයසූරියගේ හඬපටය ලබාගන්නා ලදී! පතලේ ඇති ස්ඵටිකය ගැන හෙළිවේ."
        );
      },
    };
    this.scene.add(this.ch2TapeMesh);
    this.interactableMeshes.push(this.ch2TapeMesh);

    // ── 8. Hidden Mine Entrance Portal behind Waterfall ([198, 252]) ───────
    const portalGroup = new THREE.Group();
    // Heavy 19th-century timber shoring archway
    const postMat = new THREE.MeshStandardMaterial({ map: timberTex, color: 0x3d2817, roughness: 0.8 });
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 4.8, 0.65), postMat);
    postL.position.set(196, 2.4, 252);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.65, 4.8, 0.65), postMat);
    postR.position.set(201, 2.4, 252);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.65, 0.8), postMat);
    lintel.position.set(198.5, 4.8, 252);

    portalGroup.add(postL); portalGroup.add(postR); portalGroup.add(lintel);
    this.scene.add(portalGroup);

    // ── 9. Flooded Subterranean Mine Shaft ([205 to 260, 258 to 305]) ───────
    const mineGroup = new THREE.Group();
    // Cavern rock vault ceiling and stone tunnel walls
    const tunnelMat = new THREE.MeshStandardMaterial({ map: wetGraniteTex, roughness: 0.85, color: 0x475569 });
    // Left & Right Cavern Walls
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 6.0, 52), tunnelMat);
    wallL.position.set(197, 2.8, 280);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 6.0, 52), tunnelMat);
    wallR.position.set(262, 2.8, 280);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(66, 1.2, 52), tunnelMat);
    roof.position.set(230, 5.8, 280);
    mineGroup.add(wallL); mineGroup.add(wallR); mineGroup.add(roof);

    // Timber shoring bents along mine tunnel
    for (let tz = 260; tz <= 300; tz += 6) {
      const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 5.0, 6), postMat);
      pL.position.set(202, 2.5, tz);
      const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 5.0, 6), postMat);
      pR.position.set(258, 2.5, tz);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(57, 0.35, 0.35), postMat);
      beam.position.set(230, 5.0, tz);
      mineGroup.add(pL); mineGroup.add(pR); mineGroup.add(beam);
    }

    // Subterranean Floodwater Mesh (Dynamic Water Level)
    const mwGeo = new THREE.PlaneGeometry(62, 50);
    mwGeo.rotateX(-Math.PI / 2);
    const mwMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.82,
    });
    this.mineWaterMesh = new THREE.Mesh(mwGeo, mwMat);
    this.mineWaterMesh.position.set(230, this.waterLevel, 280);
    mineGroup.add(this.mineWaterMesh);

    // Raised Timber Catwalk for Drainage Pump at [235, 285]
    const catWalkGeo = new THREE.BoxGeometry(12, 1.4, 12);
    const catWalkMesh = new THREE.Mesh(catWalkGeo, postMat);
    catWalkMesh.position.set(236, 0.7, 285);
    mineGroup.add(catWalkMesh);

    // Vintage 19th-Century Steam/Diesel Drainage Pump
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.85, roughness: 0.35 });
    const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 1.8), pumpMat);
    pumpBody.position.set(235, 2.3, 285);
    mineGroup.add(pumpBody);

    // Pump Flywheel
    this.ch2PumpFlywheel = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.22, 16), pumpMat);
    this.ch2PumpFlywheel.position.set(233.7, 2.4, 285);
    this.ch2PumpFlywheel.rotation.z = Math.PI / 2;
    mineGroup.add(this.ch2PumpFlywheel);

    // Pump Valve Turn Wheel (Interactive with Cyan Indicator Aura)
    const valveMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const pumpValve = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 8, 16), valveMat);
    pumpValve.position.set(235, 3.3, 285);
    pumpValve.rotation.x = Math.PI / 2;

    // Glowing Cyan Pump Beacon Light & Floating Halo
    const pumpGlow = new THREE.PointLight(0x38bdf8, 2.6, 7, 1.2);
    pumpGlow.position.set(235, 3.8, 285);
    mineGroup.add(pumpGlow);

    const pumpHalo = createCyanInteractiveHalo(0.35);
    pumpHalo.position.set(235, 3.7, 285);
    mineGroup.add(pumpHalo);
    this.ch2PumpHalo = pumpHalo;
    this.ch2PumpHaloBaseY = 3.7;
    this.ch2PumpGlow = pumpGlow;

    pumpValve.userData = {
      id: "drainage_pump_valve",
      title: "ජල පොම්ප ලීවරය (Drainage Pump Valve)",
      titleEn: "Industrial Drainage Pump Valve",
      prompt: () => (this.tasks.pumpActivated ? "[PUMP RUNNING]" : "[E] ලීවරය කරකවා ජලය බස්සවන්න (Engage Pump)"),
      promptEn: () => (this.tasks.pumpActivated ? "[PUMP RUNNING]" : "[E] Turn Valve to Drain Floodwater"),
      action: () => {
        if (this.tasks.pumpActivated) return;
        this.tasks.pumpActivated = true;
        this.targetWaterLevel = -0.6; // Drains floodwater completely!
        this.playSfx("lever");
        this.cb.onNotify(
          this.lang === "en"
            ? "⚙️ Drainage pump engaged! Water level is receding, revealing the azure crystal."
            : "⚙️ ජල පොම්පය ක්‍රියාත්මක විය! ජලය බැසගොස් නිල් ස්ඵටිකය මතු වේ."
        );
      },
    };
    mineGroup.add(pumpValve);
    this.interactableMeshes.push(pumpValve);

    // ── EVIDENCE C: Subterranean Azure Crystal (gem) on Pedestal ([248, 295, 1.2]) ──
    const crystalGroup = new THREE.Group();
    const cMat = new THREE.MeshStandardMaterial({
      map: crystalTex,
      color: 0x00f0ff,
      emissive: 0x00b4d8,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.3,
    });
    // Multi-faceted crystal cluster
    for (let c = 0; c < 7; c++) {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.18 + (c % 3) * 0.06, 1.1 + (c % 2) * 0.4, 6), cMat);
      spire.position.set((c % 3) * 0.18 - 0.18, 0.55, Math.floor(c / 3) * 0.18 - 0.1);
      spire.rotation.x = (c * 0.15);
      spire.rotation.z = ((c - 3) * 0.12);
      crystalGroup.add(spire);
    }
    const crystalLight = new THREE.PointLight(0x00f0ff, 4.5, 20, 1.1);
    crystalLight.position.set(0, 0.8, 0);
    crystalGroup.add(crystalLight);

    const crystalHitBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.0, 1.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
    );
    crystalHitBox.position.set(248, 1.5, 295);

    // Floating Cyan Crystal Resonance Halo
    const crystalHalo = createCyanInteractiveHalo(0.5);
    crystalHalo.position.set(248, 2.6, 295);
    this.scene.add(crystalHalo);
    this.ch2CrystalHalo = crystalHalo;
    this.ch2CrystalHaloBaseY = 2.6;

    crystalHitBox.userData = {
      id: "azure_crystal",
      title: "නිල් ස්ඵටිකය (Azure Piezoelectric Crystal)",
      titleEn: "Azure Piezoelectric Crystal (Evidence C)",
      prompt: () => {
        if (!this.tasks.pumpActivated) {
          return this.lang === "en" ? "🔒 Submerged (Activate Pump First)" : "🔒 ජලයෙන් යටවී ඇත (පොම්පය දමන්න)";
        }
        return this.lang === "en" ? "[E] Harvest Azure Crystal Sample" : "[E] ස්ඵටික සාම්පලය ලබාගන්න";
      },
      action: () => {
        if (!this.tasks.pumpActivated) {
          this.cb.onNotify(
            this.lang === "en"
              ? "⚠️ The crystal pedestal is submerged! Engage the drainage pump first."
              : "⚠️ ස්ඵටිකය ජලයෙන් යටවී ඇත! පළමුව ජල පොම්පය ක්‍රියාත්මක කරන්න."
          );
          return;
        }
        this.scene.remove(crystalGroup);
        this.scene.remove(crystalHitBox);
        if (this.ch2CrystalHalo) this.scene.remove(this.ch2CrystalHalo);
        const idx = this.interactableMeshes.indexOf(crystalHitBox);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        this.activeCrosshairTarget = null;
        this.tasks.gemFound = true;
        this.playSfx("craft");

        // TRIGGER MINE COLLAPSE EVENT!
        this.mineCollapsing = true;
        this.cameraShake = 3.8;
        this.playProceduralThunder();
        if (this.cb.onTriggerStory) {
          this.cb.onTriggerStory({
            id: "mine_collapse_event",
            title: "CRITICAL SEISMIC COLLAPSE DETECTED",
            speaker: "WARNING // MINE STRUCTURE FAILING",
            text: this.lang === "en"
              ? "The piezoelectric resonance removal triggered hydraulic instability! The cavern ceiling is collapsing — SPRINT TO THE MINE ENTRANCE NOW!"
              : "ස්ඵටිකය ඉවත් කිරීමත් සමඟ පාෂාණ දෙදරා පතල කඩා වැටෙන්නට පටන් ගනී! වහාම පතල් පිවිසුම දෙසට දිවයන්න!",
          });
        }
        this.cb.onNotify(
          this.lang === "en"
            ? "💎 Harvested Azure Crystal! ⚠️ MINE COLLAPSING — SPRINT TO SURFACE!"
            : "💎 නිල් ස්ඵටිකය ලබාගන්නා ලදී! ⚠️ පතල කඩා වැටේ — වහාම එළිමහනට පලායන්න!"
        );
      },
    };
    crystalGroup.position.set(248, 1.2, 295);
    this.scene.add(crystalGroup);
    this.scene.add(crystalHitBox);
    this.interactableMeshes.push(crystalHitBox);
    this.ch2CrystalGroup = crystalGroup;

    this.scene.add(mineGroup);

    // ── 10. CLIFFSIDE OVERHEAD CABLE TROLLEY ([185, 225] to [120, 225]) ─────
    const trolleyGroup = new THREE.Group();
    // High-altitude overhead steel suspension cable
    const mainCableGeo = new THREE.CylinderGeometry(0.06, 0.06, 68, 8);
    mainCableGeo.rotateZ(Math.PI / 2);
    const mainCableMesh = new THREE.Mesh(mainCableGeo, cableMat);
    mainCableMesh.position.set(152.5, 17.5, 225);
    this.scene.add(mainCableMesh);

    // Steel Cable Trolley (Cage Car)
    this.ch2TrolleyCar = new THREE.Group();
    const cageMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.35 });
    // Car platform
    const carFloor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 2.2), cageMat);
    this.ch2TrolleyCar.add(carFloor);
    // Railings
    for (let r of [-1.0, 1.0]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 0.08), cageMat);
      rail.position.set(0, 0.5, r);
      this.ch2TrolleyCar.add(rail);
    }
    // Overhead hanger arms and dual cable pulleys
    const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), cageMat);
    hanger.position.set(0, 1.2, 0);
    this.ch2TrolleyCar.add(hanger);
    const pulley1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 12), cageMat);
    pulley1.position.set(-0.6, 2.4, 0); pulley1.rotation.x = Math.PI / 2;
    const pulley2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 12), cageMat);
    pulley2.position.set(0.6, 2.4, 0); pulley2.rotation.x = Math.PI / 2;
    this.ch2TrolleyCar.add(pulley1); this.ch2TrolleyCar.add(pulley2);

    this.ch2TrolleyCar.position.set(185, 15.0, 225);
    trolleyGroup.add(this.ch2TrolleyCar);

    // Trolley Mechanical Winch / Release Mechanism
    const winchMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 });
    const winchMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8), winchMat);
    winchMesh.position.set(185, 14.5, 223);

    const trolleyHitBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.2, 3.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false })
    );
    trolleyHitBox.position.set(185, 15.0, 225);

    // Glowing Cyan Trolley Winch Beacon Light & Floating Halo
    const trolleyGlow = new THREE.PointLight(0x38bdf8, 2.8, 8, 1.2);
    trolleyGlow.position.set(185, 16.0, 225);
    trolleyGroup.add(trolleyGlow);

    const trolleyHalo = createCyanInteractiveHalo(0.65);
    trolleyHalo.position.set(185, 15.8, 225);
    trolleyGroup.add(trolleyHalo);
    this.ch2TrolleyHalo = trolleyHalo;
    this.ch2TrolleyHaloBaseY = 15.8;
    this.ch2TrolleyGlow = trolleyGlow;
    trolleyHitBox.position.set(185, 15.0, 225);
    trolleyHitBox.userData = {
      id: "cable_trolley",
      title: "කේබල් ඩක්කුව (Overhead Cable Trolley)",
      titleEn: "Overhead Cable Trolley (Chapter 03 Transit)",
      prompt: () => {
        const allTasksDone = (
          this.tasks.mapFound &&
          this.tasks.raftRepaired &&
          this.tasks.riverCrossed &&
          this.tasks.tapeFound &&
          this.tasks.pumpActivated &&
          this.tasks.gemFound &&
          this.tasks.mineEscaped
        );
        if (!allTasksDone) {
          return this.lang === "en"
            ? "[E] 🔒 Trolley Locked (Complete All Prior Objectives First)"
            : "[E] 🔒 ඩක්කුව අගුළුලා ඇත (පෙර මෙහෙයුම් සියල්ල සම්පූර්ණ කරන්න)";
        }
        if (!this.tasks.trolleyFixed) {
          return this.lang === "en" ? "[E] Engage Trolley Winch Mechanism" : "[E] ඩක්කු යාන්ත්‍රණය සක්‍රිය කරන්න";
        }
        return this.lang === "en" ? "[E] Board Trolley & Traverse Chasm to Ch 03" : "[E] ඩක්කුවෙන් ප්‍රපාතය තරණය කරන්න";
      },
      action: () => {
        const allTasksDone = (
          this.tasks.mapFound &&
          this.tasks.raftRepaired &&
          this.tasks.riverCrossed &&
          this.tasks.tapeFound &&
          this.tasks.pumpActivated &&
          this.tasks.gemFound &&
          this.tasks.mineEscaped
        );
        if (!allTasksDone) {
          this.playSfx("hurt");
          if (!this.tasks.mapFound) {
            this.cb.onNotify(
              this.lang === "en"
                ? "🔒 Objective Incomplete: Search the expedition camp to find Dr. Jayasuriya's Map (Map 2)!"
                : "🔒 මෙහෙයුම අසම්පූර්ණයි: කඳවුරෙන් භූවිද්‍යාඥ සිතියම (Map 2) සොයාගන්න!"
            );
          } else if (!this.tasks.riverCrossed) {
            this.cb.onNotify(
              this.lang === "en"
                ? "🔒 Objective Incomplete: Repair the bamboo raft and cross the river to the cascades!"
                : "🔒 මෙහෙයුම අසම්පූර්ණයි: උණ බම්බු පහුර සාදා ගඟ තරණය කරන්න!"
            );
          } else if (!this.tasks.tapeFound) {
            this.cb.onNotify(
              this.lang === "en"
                ? "🔒 Objective Incomplete: Recover Dr. Jayasuriya's audio recording cassette near the waterfall!"
                : "🔒 මෙහෙයුම අසම්පූර්ණයි: දියඇල්ල පාමුල ඇති හඬපටය (Tape) සොයාගන්න!"
            );
          } else if (!this.tasks.pumpActivated) {
            this.cb.onNotify(
              this.lang === "en"
                ? "🔒 Objective Incomplete: Start the drainage pump inside the flooded mine!"
                : "🔒 මෙහෙයුම අසම්පූර්ණයි: පතල ඇතුළත ජල පොම්පය සක්‍රිය කරන්න!"
            );
          } else if (!this.tasks.gemFound) {
            this.cb.onNotify(
              this.lang === "en"
                ? "🔒 Objective Incomplete: Extract the Azure Crystal sample from the mine wall!"
                : "🔒 මෙහෙයුම අසම්පූර්ණයි: පතලෙන් නිල් මාණික්‍යය (Azure Crystal) ලබාගන්න!"
            );
          } else if (!this.tasks.mineEscaped) {
            this.cb.onNotify(
              this.lang === "en"
                ? "🔒 Hazard: Escape the collapsing mine shaft before boarding the trolley!"
                : "🔒 අනතුරක්: කඩා වැටෙන පතලෙන් වහාම පිටවන්න!"
            );
          }
          return;
        }

        if (!this.tasks.trolleyFixed) {
          this.tasks.trolleyFixed = true;
          this.playSfx("lever");
          this.cb.onNotify(
            this.lang === "en"
              ? "⚙️ All mission objectives completed! Trolley winch engaged! Press [E] to board and traverse the chasm."
              : "⚙️ සියලු මෙහෙයුම් සාර්ථකයි! ඩක්කු යාන්ත්‍රණය සක්‍රිය විය! ප්‍රපාතය තරණය කිරීමට [E] ඔබන්න."
          );
          return;
        }
        if (!this.tasks.gorgeCrossed) {
          this.trolleyRiding = true;
          this.trolleyProgress = 0;
          this.playSfx("lever");
          this.cb.onNotify(
            this.lang === "en"
              ? "🚡 Traversing the misty cascade chasm to Sector 03 (Yaksha Giri)..."
              : "🚡 මීදුම් ප්‍රපාතය තරණය කරමින් Chapter 03 වෙත ගමන් කරයි..."
          );
        }
      },
    };
    trolleyGroup.add(winchMesh);
    trolleyGroup.add(trolleyHitBox);
    this.scene.add(trolleyGroup);
    this.interactableMeshes.push(trolleyHitBox);
    this.trolleyHitBox = trolleyHitBox;
    this.ch2TrolleyHitBox = trolleyHitBox;

    // ── 11. CHAPTER 2 ENDEMIC WILDLIFE (High-Detail Organic 3D Models) ──────────────
    // A. Kangaroo Lizard (Otocryptis wiegmanni) at [114, 125]
    const lizardY = this.getChapter2TerrainHeight(114, 125) + 0.8;
    const lizardMat = new THREE.MeshStandardMaterial({ color: 0x557a2b, roughness: 0.6 });
    const lizardGularMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 }); // Distinctive Sri Lankan agamid throat fan
    const lizardGroup = new THREE.Group();

    // Body
    const lBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.35, 8, 12), lizardMat);
    lBody.rotation.x = -Math.PI / 3.5;
    lizardGroup.add(lBody);

    // Head
    const lHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), lizardMat);
    lHead.position.set(0, 0.28, 0.12);
    lHead.rotation.x = 0.3;
    lizardGroup.add(lHead);

    // Gular sac (throat fan)
    const lGular = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14, 0.12), lizardGularMat);
    lGular.position.set(0, 0.16, 0.14);
    lizardGroup.add(lGular);

    // Long whip-like tail
    const lTail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.01, 0.85, 6), lizardMat);
    lTail.position.set(0, -0.28, -0.36);
    lTail.rotation.x = -0.7;
    lizardGroup.add(lTail);

    // Slender elevated legs
    for (let lx of [-0.12, 0.12]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.35, 4), lizardMat);
      leg.position.set(lx, -0.05, 0);
      leg.rotation.z = lx < 0 ? -0.4 : 0.4;
      lizardGroup.add(leg);
    }

    lizardGroup.position.set(114, lizardY, 125);
    this.scene.add(lizardGroup);
    this.ch2LizardGroup = lizardGroup;

    // B. Venomous Hump-nosed Pit Viper (Hypnale hypnale - පොළඟා) directly on path at [127, 163]
    const viperX = 127;
    const viperZ = 163;
    const viperY = this.getChapter2TerrainHeight(viperX, viperZ);
    const viperMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.65, metalness: 0.15 });
    const viperHeadMat = new THREE.MeshStandardMaterial({ color: 0x3d1c06, roughness: 0.6 });
    const viperGroup = new THREE.Group();

    // Continuous Smooth 3D Coiled Serpent Body using CatmullRom spline tube
    const viperPoints = [
      new THREE.Vector3(-0.35, 0.04, -0.15),
      new THREE.Vector3(-0.42, 0.04, 0.12),
      new THREE.Vector3(-0.25, 0.05, 0.36),
      new THREE.Vector3(0.08, 0.05, 0.40),
      new THREE.Vector3(0.36, 0.06, 0.22),
      new THREE.Vector3(0.38, 0.07, -0.14),
      new THREE.Vector3(0.18, 0.08, -0.34),
      new THREE.Vector3(-0.16, 0.09, -0.28),
      new THREE.Vector3(-0.26, 0.10, -0.04),
      new THREE.Vector3(-0.12, 0.12, 0.18),
      new THREE.Vector3(0.14, 0.14, 0.16),
      new THREE.Vector3(0.20, 0.18, -0.02),
      new THREE.Vector3(0.10, 0.26, 0.06), // S-curve rising strike neck
      new THREE.Vector3(0.16, 0.38, 0.18),
      new THREE.Vector3(0.22, 0.46, 0.25),
    ];
    const viperCurve = new THREE.CatmullRomCurve3(viperPoints);
    const viperBodyGeo = new THREE.TubeGeometry(viperCurve, 48, 0.068, 10, false);
    const viperBodyMesh = new THREE.Mesh(viperBodyGeo, viperMat);
    viperGroup.add(viperBodyMesh);

    // Broad Spearhead Viper Head with Distinct Neck Constriction
    const vHeadGroup = new THREE.Group();
    vHeadGroup.position.set(0.22, 0.47, 0.26);

    // Triangular diamond-shaped cranium
    const craniumV = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 3), viperHeadMat);
    craniumV.rotation.x = Math.PI / 2 + 0.15;
    craniumV.rotation.y = Math.PI;
    craniumV.scale.set(1.15, 0.55, 1.0);
    vHeadGroup.add(craniumV);

    // Defining "Hump" on upturned snout (Hypnale hypnale hallmark)
    const snoutHump = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 6), viperHeadMat);
    snoutHump.position.set(0, 0.04, 0.14);
    snoutHump.rotation.x = -0.45;
    vHeadGroup.add(snoutHump);

    // Loreal Heat-Sensing Pits
    const pitMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (let pitX of [-0.065, 0.065]) {
      const pit = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), pitMat);
      pit.position.set(pitX, 0.01, 0.08);
      vHeadGroup.add(pit);
    }

    // Venomous Amber Elliptical Slit Eyes
    const vEyeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.8 });
    for (let eX of [-0.075, 0.075]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), vEyeMat);
      eye.position.set(eX, 0.025, 0.03);
      vHeadGroup.add(eye);

      const vPupil = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.03, 0.01), pitMat);
      vPupil.position.set(eX * 1.08, 0.025, 0.048);
      vHeadGroup.add(vPupil);
    }

    // Menacing glowing amber venomous eye light
    const vEyeLight = new THREE.PointLight(0xfacc15, 1.9, 4.5, 1.5);
    vEyeLight.position.set(0, 0.06, 0.08);
    vHeadGroup.add(vEyeLight);
    this.ch2ViperEyeLight = vEyeLight;

    // Rapidly Flickering Bifurcated Forked Tongue
    const vTongueGroup = new THREE.Group();
    vTongueGroup.position.set(0, -0.02, 0.15);
    const tongueStem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.12, 4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    tongueStem.rotation.x = Math.PI / 2;
    tongueStem.position.set(0, 0, 0.05);
    vTongueGroup.add(tongueStem);

    const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.002, 0.06, 4), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    forkL.rotation.x = Math.PI / 2; forkL.rotation.y = 0.45;
    forkL.position.set(-0.015, 0, 0.12);
    vTongueGroup.add(forkL);

    const forkR = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.002, 0.06, 4), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    forkR.rotation.x = Math.PI / 2; forkR.rotation.y = -0.45;
    forkR.position.set(0.015, 0, 0.12);
    vTongueGroup.add(forkR);

    vHeadGroup.add(vTongueGroup);
    this.ch2ViperTongue = vTongueGroup;
    this.ch2ViperHead = vHeadGroup;

    viperGroup.add(vHeadGroup);
    viperGroup.position.set(viperX, viperY + 0.05, viperZ);
    this.scene.add(viperGroup);
    this.ch2ViperGroup = viperGroup;
    this.ch2ViperPos = { x: viperX, y: viperY, z: viperZ };

    // C. Nocturnal Sri Lankan Fishing Cat (Prionailurus viverrinus - හඳුන් දිවියා) on River Rock [122, 172]
    const catX = 122;
    const catZ = 172;
    const catY = this.getChapter2TerrainHeight(catX, catZ) + 0.55;
    const catFurMat = new THREE.MeshStandardMaterial({ color: 0x7a5b43, roughness: 0.75 });
    const catUnderMat = new THREE.MeshStandardMaterial({ color: 0xd4c2a5, roughness: 0.8 });
    const catSpotMat = new THREE.MeshStandardMaterial({ color: 0x221711, roughness: 0.85 });
    const catNoseMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4 });
    const catGroup = new THREE.Group();

    // Sleek Muscular Feline Torso (Capsule geometry for seamless organic ribcage)
    const catTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.52, 12, 16), catFurMat);
    catTorso.rotation.x = Math.PI / 2;
    catTorso.position.set(0, 0.42, 0);
    catGroup.add(catTorso);

    // Cream underbelly
    const catBelly = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.46, 8, 12), catUnderMat);
    catBelly.rotation.x = Math.PI / 2;
    catBelly.position.set(0, 0.36, 0.02);
    catGroup.add(catBelly);

    // Powerful Muscular Haunches (Pelvis & Shoulders)
    const hips = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 14), catFurMat);
    hips.scale.set(0.9, 1.1, 1.2);
    hips.position.set(0, 0.44, -0.32);
    catGroup.add(hips);

    const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), catFurMat);
    shoulders.scale.set(0.92, 1.05, 1.05);
    shoulders.position.set(0, 0.44, 0.28);
    catGroup.add(shoulders);

    // Feline Head & Expressive Facial Features
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.60, 0.62);

    // Cranium
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.20, 16, 16), catFurMat);
    cranium.scale.set(1.0, 0.9, 1.05);
    headGroup.add(cranium);

    // Tapered Muzzle with Cream Fur
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.11, 0.16, 12), catUnderMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, -0.06, 0.15);
    headGroup.add(muzzle);

    // Sculpted Black Nose Leather
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), catNoseMat);
    nose.scale.set(1.2, 0.8, 0.9);
    nose.position.set(0, -0.03, 0.23);
    headGroup.add(nose);

    // Feline Whiskers
    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
    for (let side of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.20, 4), whiskerMat);
        whisker.rotation.z = side * (Math.PI / 2 - 0.25 * w);
        whisker.rotation.y = side * 0.3;
        whisker.position.set(side * 0.11, -0.06 + w * 0.02, 0.18);
        headGroup.add(whisker);
      }
    }

    // Anatomical Alert Ears with White Dorsal Eye Spots (Ocelli)
    for (let earX of [-0.14, 0.14]) {
      const earShell = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.16, 8), catSpotMat);
      earShell.position.set(earX, 0.19, -0.02);
      earShell.rotation.z = earX < 0 ? 0.35 : -0.35;
      earShell.rotation.x = -0.15;
      headGroup.add(earShell);

      // White spot on back of ear
      const earSpot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      earSpot.position.set(earX * 1.05, 0.19, -0.05);
      headGroup.add(earSpot);
    }

    // Twin Reflective Nocturnal Tapetum Lucidum Eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635,
      emissive: 0x84cc16,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    for (let eyeX of [-0.075, 0.075]) {
      const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), eyeMat);
      eyeball.position.set(eyeX, 0.02, 0.155);
      headGroup.add(eyeball);

      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.045, 0.01), pupilMat);
      pupil.position.set(eyeX, 0.02, 0.188);
      headGroup.add(pupil);
    }

    // Ambient eye glow
    const catEyeLight = new THREE.PointLight(0xa3e635, 2.4, 5.5, 1.4);
    catEyeLight.position.set(0, 0.05, 0.22);
    headGroup.add(catEyeLight);
    this.ch2CatEyeLight = catEyeLight;

    catGroup.add(headGroup);
    this.ch2CatHead = headGroup;

    // Articulated Legs Resting Firmly on River Boulder
    // Forelegs
    for (let side of [-0.18, 0.18]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.38, 8), catFurMat);
      arm.position.set(side, 0.22, 0.28);
      arm.rotation.x = 0.08;
      catGroup.add(arm);

      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), catSpotMat);
      paw.scale.set(1.0, 0.65, 1.3);
      paw.position.set(side, 0.05, 0.32);
      catGroup.add(paw);
    }

    // Hindlegs (Folded crouch)
    for (let side of [-0.22, 0.22]) {
      const thigh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), catFurMat);
      thigh.scale.set(0.8, 1.3, 1.1);
      thigh.position.set(side, 0.32, -0.28);
      catGroup.add(thigh);

      const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8), catFurMat);
      shank.position.set(side, 0.16, -0.24);
      shank.rotation.x = -0.3;
      catGroup.add(shank);

      const pawH = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 8), catSpotMat);
      pawH.scale.set(1.0, 0.65, 1.3);
      pawH.position.set(side, 0.05, -0.18);
      catGroup.add(pawH);
    }

    // Signature Muscular Spotted Tail (Curved with black tip)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.44, -0.52);

    const tailPart1 = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.35, 8), catFurMat);
    tailPart1.position.set(0, -0.08, -0.14);
    tailPart1.rotation.x = 0.85;
    tailGroup.add(tailPart1);

    const tailPart2 = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.38, 8), catSpotMat);
    tailPart2.position.set(0, -0.24, -0.32);
    tailPart2.rotation.x = 1.35;
    tailGroup.add(tailPart2);

    catGroup.add(tailGroup);
    this.ch2CatTail = tailGroup;

    catGroup.position.set(catX, catY, catZ);
    this.scene.add(catGroup);
    this.ch2CatGroup = catGroup;
    this.ch2CatPos = { x: catX, y: catY, z: catZ };

    // ── 12. Rainforest Trees & Lush Foliage ──────────────────────────────────
    const treeGeo = new THREE.CylinderGeometry(0.4, 0.75, 14, 8);
    const treeMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.85, color: 0x3d2817 });
    const canopyGeo = new THREE.DodecahedronGeometry(4.5, 1);
    const canopyMat = new THREE.MeshStandardMaterial({ map: fernTex, roughness: 0.7, color: 0x22543d });

    const treeSpots = [
      [104, 115], [116, 128], [128, 140], [110, 165], [130, 175],
      [186, 130], [192, 155], [182, 175], [195, 215], [178, 245],
    ];
    for (const [tx, tz] of treeSpots) {
      const ty = this.getChapter2TerrainHeight(tx, tz);
      const trunk = new THREE.Mesh(treeGeo, treeMat);
      trunk.position.set(tx, ty + 7, tz);
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(tx, ty + 15, tz);
      this.scene.add(trunk);
      this.scene.add(canopy);
      this.colliders.push({ type: "circle", x: tx, z: tz, radius: 0.85 });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 02: PER-FRAME SIMULATION & SURVIVAL LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  updateChapter2(dt) {
    // 1. Animated River Water & Waterfall Cascades
    if (this.ch2WfTex) {
      this.ch2WfTex.offset.y -= dt * 1.85; // Rapid downward water animation
    }
    if (this.ch2RiverMesh) {
      this.ch2RiverMesh.position.y = 0.05 + Math.sin(this.elapsedTime * 3.5) * 0.04;
    }
    if (this.ch2SprayMesh) {
      this.ch2SprayMesh.rotation.y += dt * 0.4;
      this.ch2SprayMesh.scale.setScalar(1.0 + Math.sin(this.elapsedTime * 4.0) * 0.08);
    }

    // 2. Drainage Pump Water Level Receding Animation
    if (this.waterLevel > this.targetWaterLevel) {
      this.waterLevel = Math.max(this.targetWaterLevel, this.waterLevel - dt * 0.45);
      if (this.mineWaterMesh) {
        this.mineWaterMesh.position.y = this.waterLevel;
      }
      if (this.ch2PumpFlywheel) {
        this.ch2PumpFlywheel.rotation.x += dt * 14.0; // Rapid flywheel spin
      }
    }

    // 3. Bamboo Raft Crossing Rapids Animation
    // 3. Bamboo Raft Crossing Rapids Animation (Permanent & Bidirectional)
    if (this.raftRiding) {
      this.raftProgress += dt * 0.22; // ~4.5 seconds crossing
      const westDock = new THREE.Vector3(138, 0.35, 185);
      const eastDock = new THREE.Vector3(179, 0.65, 192);

      const startPos = this.raftDirection === 1 ? westDock : eastDock;
      const endPos = this.raftDirection === 1 ? eastDock : westDock;

      const curX = THREE.MathUtils.lerp(startPos.x, endPos.x, this.raftProgress);
      const curZ = THREE.MathUtils.lerp(startPos.z, endPos.z, this.raftProgress);
      const curY = THREE.MathUtils.lerp(startPos.y, endPos.y, this.raftProgress) + Math.sin(this.raftProgress * Math.PI * 4) * 0.12;

      if (this.ch2RaftGroup) {
        this.ch2RaftGroup.position.set(curX, curY, curZ);
      }
      if (this.ch2RaftHitBox) {
        this.ch2RaftHitBox.position.set(curX, curY + 0.3, curZ);
      }
      if (this.ch2RaftHalo) {
        this.ch2RaftHalo.position.set(curX, curY + 1.2, curZ);
      }
      if (this.ch2RaftGlow) {
        this.ch2RaftGlow.position.set(curX, curY + 1.4, curZ);
      }

      this.player.x = curX;
      this.player.z = curZ;
      this.player.y = curY + this.player.curEyeHeight;
      this.camera.position.set(this.player.x, this.player.y, this.player.z);

      if (this.raftProgress >= 1.0) {
        this.raftRiding = false;
        if (this.raftDirection === 1) {
          this.raftBank = "east";
          this.tasks.riverCrossed = true;
          this.player.x = 183;
          this.player.z = 192;
          this.player.y = 1.25 + this.player.curEyeHeight;
          if (this.ch2RaftGroup) this.ch2RaftGroup.position.set(eastDock.x, eastDock.y, eastDock.z);
          if (this.ch2RaftHitBox) this.ch2RaftHitBox.position.set(eastDock.x, eastDock.y + 0.3, eastDock.z);
          if (this.ch2RaftHalo) this.ch2RaftHalo.position.set(eastDock.x, eastDock.y + 1.2, eastDock.z);
          if (this.ch2RaftGlow) this.ch2RaftGlow.position.set(eastDock.x, eastDock.y + 1.4, eastDock.z);
          this.cb.onNotify(
            this.lang === "en"
              ? "⛵ Reached East Bank! The raft is safely moored here whenever you need to return."
              : "⛵ නැගෙනහිර ඉවුරට ළඟා විය! අවශ්‍ය ඕනෑම මොහොතක ආපසු යාමට පහුර මෙහි නවතා ඇත."
          );
        } else {
          this.raftBank = "west";
          this.player.x = 134;
          this.player.z = 185;
          this.player.y = 0.85 + this.player.curEyeHeight;
          if (this.ch2RaftGroup) this.ch2RaftGroup.position.set(westDock.x, westDock.y, westDock.z);
          if (this.ch2RaftHitBox) this.ch2RaftHitBox.position.set(westDock.x, westDock.y + 0.3, westDock.z);
          if (this.ch2RaftHalo) this.ch2RaftHalo.position.set(westDock.x, westDock.y + 1.2, westDock.z);
          if (this.ch2RaftGlow) this.ch2RaftGlow.position.set(westDock.x, westDock.y + 1.4, westDock.z);
          this.cb.onNotify(
            this.lang === "en"
              ? "⛵ Returned to West Bank! The raft is safely moored."
              : "⛵ බටහිර ඉවුරට ආපසු පැමිණියේය! පහුර සුරක්ෂිතව නවතා ඇත."
          );
        }
      }
      return; // Suspend normal walking during raft ride
    }

    // 4. Overhead Cable Trolley Gorge Crossing Animation
    if (this.trolleyRiding) {
      this.trolleyProgress += dt * 0.16; // ~6 seconds gorge flight
      const startX = 185, startZ = 225, startY = 15.0;
      const endX = 120, endZ = 225, endY = 15.5;
      const curX = THREE.MathUtils.lerp(startX, endX, this.trolleyProgress);
      const curZ = THREE.MathUtils.lerp(startZ, endZ, this.trolleyProgress);
      // Slight sag in cable center
      const sag = Math.sin(this.trolleyProgress * Math.PI) * 1.8;
      const curY = THREE.MathUtils.lerp(startY, endY, this.trolleyProgress) - sag;

      if (this.ch2TrolleyCar) {
        this.ch2TrolleyCar.position.set(curX, curY, curZ);
      }
      this.player.x = curX;
      this.player.z = curZ;
      this.player.y = curY + 1.2;
      this.camera.position.set(this.player.x, this.player.y, this.player.z);

      if (this.trolleyProgress >= 1.0) {
        this.trolleyRiding = false;
        this.tasks.gorgeCrossed = true;
        this.cb.onNotify(
          this.lang === "en"
            ? "🏆 OPERATION 02 ACCOMPLISHED! Welcome to Chapter 03 (Yaksha Giri)."
            : "🏆 දෙවන පරිච්ඡේදය සාර්ථකයි! යක්ෂ ගිරි පිවිසුම (Chapter 03) වෙත ළඟා විය."
        );
        this.cb.onGameWon("hero");
      }
      return; // Suspend normal walking during trolley ride
    }

    // 5. Camp Arrival & Warmth Detection
    const distCamp = Math.hypot(this.player.x - 125, this.player.z - 155);
    if (distCamp < 12.0 && !this.tasks.reachCamp) {
      this.tasks.reachCamp = true;
      this.cb.onNotify(
        this.lang === "en"
          ? "🏕️ Reached the Abandoned Geological Camp! Inspect the survey drafting table."
          : "🏕️ අතහැර දැමූ භූවිද්‍යා කඳවුරට ළඟා විය! මේසය මත ඇති සිතියම පරීක්ෂා කරන්න."
      );
    }

    // Campfire Warmth & Health Regeneration
    const distFire = Math.hypot(this.player.x - 125, this.player.z - 159);
    if (distFire < 6.5) {
      this.player.inShelter = true;
      this.temperature = Math.min(100, this.temperature + dt * 16.0);
      this.health = Math.min(100, this.health + dt * 4.0);
      if (this.bleeding && this.health >= 85) this.bleeding = false;
    } else {
      this.player.inShelter = false;
      // Freezing Mist & Waterfall Spray Hypothermia
      const isWet = (Math.abs(this.player.x - 160) < 18) || (this.player.z > 225);
      const tempDropRate = isWet ? 4.5 : 1.8;
      if (this.teaBuffTimer > 0) {
        // Ginger tea protects against hypothermia
      } else {
        this.temperature = Math.max(0, this.temperature - dt * tempDropRate);
      }
      if (this.temperature < 35) {
        this.cameraShake = Math.max(this.cameraShake, 0.65); // Shivering violently
        this.health = Math.max(0, this.health - dt * 2.2);
        if (this.elapsedTime - (this.lastColdWarnTime || 0) > 8.0) {
          this.lastColdWarnTime = this.elapsedTime;
          this.playSfx("hurt");
          this.cb.onNotify(
            this.lang === "en"
              ? "🥶 Freezing hypothermia! Health draining! Warm up at the campfire or drink Ginger Tea [G]!"
              : "🥶 අධික ශීතල නිසා ලේ අඩු වේ! කඳවුරේ ගිනිමැලයෙන් උණුසුම් වන්න හෝ ඉඟුරු තේ [G] පානය කරන්න!"
          );
        }
      }
    }

    // 6. Active Galganga Mud Leeches (Hazard on Wet Riverbanks)
    if (!this.player.inShelter && this.repellentTimer <= 0) {
      const inMudBank = (this.player.z > 160 && this.player.z < 215 && this.player.x > 110 && this.player.x < 155);
      if (inMudBank) {
        this.leechHazardTimer = (this.leechHazardTimer || 0) + dt;
        if (this.leechHazardTimer >= 12.0) {
          this.leechHazardTimer = 0;
          this.attachedLeeches = Math.min(4, (this.attachedLeeches || 0) + 1);
          this.bleeding = true;
          this.playSfx("squelch");
          this.cb.onNotify(
            this.lang === "en"
              ? "🩸 River leech latched on! Use Salt [1] or Leech Balm [B] to stop blood loss."
              : "🩸 කූඩැල්ලෙකු එල්ලී ලේ උරා බොයි! [1] මඟින් ලුණු ඉසින්න හෝ [B] මඟින් තෙල් ගාන්න."
          );
        }
      }
    }
    // Leech continuous blood loss
    if (this.attachedLeeches > 0) {
      this.health = Math.max(0, this.health - dt * 1.5 * this.attachedLeeches);
    }

    // 7. Fierce River Current Hazard (Cannot swim across on foot - Must use Bamboo Raft)
    if (!this.raftRiding && this.player.x >= 147 && this.player.x <= 172 && this.player.z < 240) {
      // Violent downstream pull toward the rocky cascade abyss
      this.player.z += dt * 38.0;
      this.player.y = Math.min(this.player.y, 0.4);
      this.cameraShake = Math.max(this.cameraShake, 2.2);
      this.health = Math.max(0, this.health - dt * 70.0);
      this.temperature = Math.max(0, this.temperature - dt * 35.0);
      if (this.elapsedTime - (this.lastDrownSfxTime || 0) > 0.7) {
        this.lastDrownSfxTime = this.elapsedTime;
        this.playSfx("hurt");
      }
      if (this.elapsedTime - (this.lastRiverWarn || 0) > 1.8) {
        this.lastRiverWarn = this.elapsedTime;
        this.cb.onNotify(
          this.lang === "en"
            ? "🌊 DANGER! Galganga rapids sweeping you away! The river can only be crossed using the bamboo raft!"
            : "🌊 මාරාන්තික අනතුරක්! ගල්ගඟේ සැඩ පහරට ඔබව ගසාගෙන යයි! ගඟ තරණය කළ හැක්කේ උණ බම්බු පහුරෙන් පමණි!"
        );
      }
      if (this.health <= 0) {
        this.cb.onGameOver("drowned");
        return;
      }
    }

    // 8. Mine Entrance Detection
    if (!this.tasks.mineFound && Math.hypot(this.player.x - 198, this.player.z - 252) < 6.0) {
      this.tasks.mineFound = true;
      this.cb.onNotify(
        this.lang === "en"
          ? "⛏️ Located the hidden 1894 mine entrance behind the cascade!"
          : "⛏️ දියඇල්ල පිටුපස සැඟවුණු 1894 පැරණි පතල් පිවිසුම හමු විය!"
      );
    }
    if (!this.tasks.mineEntered && this.player.z > 254 && this.player.x > 196) {
      this.tasks.mineEntered = true;
      this.tasks.mineFound = true;
      this.cb.onNotify(
        this.lang === "en"
          ? "⛏️ Entered the flooded mine shaft. Locate the drainage pump on the catwalk."
          : "⛏️ ජලයෙන් යටවූ පතලට පිවිසුණි. පාලම මත ඇති ජල පොම්පය සොයාගන්න."
      );
    }

    // 9. Mine Collapse Tremors & Falling Rock Hazards
    if (this.mineCollapsing && !this.mineSealed) {
      this.cameraShake = Math.max(this.cameraShake, 3.2);
      this.debrisDamageTimer = (this.debrisDamageTimer || 0) + dt;
      if (this.debrisDamageTimer > 3.2) {
        this.debrisDamageTimer = 0;
        this.health = Math.max(5, this.health - 16);
        this.playSfx("hurt");
        this.cb.onNotify(
          this.lang === "en"
            ? "⚠️ Falling mine rock struck you (-16 HP)! Sprint out before you are crushed!"
            : "⚠️ කඩා වැටුණු ගල් කුට්ටියක් වැදුණා (-16 HP)! වහාම එළිමහනට දිවයන්න!"
        );
      }
      if (this.player.z < 252) {
        this.mineCollapsing = false;
        this.mineSealed = true;
        this.tasks.mineEscaped = true;
        this.cameraShake = 0;
        this.playSfx("thunder");
        this.cb.onNotify(
          this.lang === "en"
            ? "💥 The mine caved in behind you! Head to the cliffside cable trolley."
            : "💥 පතල කඩා වැටී දොරටුව වැසුණි! කඳු මුදුනේ කේබල් කරත්තය වෙත යන්න."
        );
      }
    }

    // 10. Endemic Wildlife Reactions & Attacks
    if (this.ch2LizardGroup) {
      this.ch2LizardGroup.rotation.y = Math.sin(this.elapsedTime * 2.5) * 0.25;
    }

    // Venomous Pit Viper at [127, 163]
    const distViper = Math.hypot(this.player.x - 127, this.player.z - 163);
    if (this.ch2ViperTongue) {
      this.ch2ViperTongue.scale.z = 1.0 + Math.sin(this.elapsedTime * 14.0) * 0.6;
    }
    if (this.ch2ViperGroup) {
      this.ch2ViperGroup.rotation.y = Math.sin(this.elapsedTime * 3.5) * 0.15;
    }
    if (this.ch2ViperHead) {
      this.ch2ViperHead.rotation.z = Math.sin(this.elapsedTime * 4.0) * 0.08;
    }
    if (distViper < 6.0 && this.elapsedTime - this.sawscaledHissTimer > 3.5) {
      this.sawscaledHissTimer = this.elapsedTime;
      this.playSfx("hiss");
      this.cb.onNotify(
        this.lang === "en"
          ? "🐍 Rattling hiss detected! Venomous Viper coiled on rocks [127, 163]! Throw Salt [1] or keep away!"
          : "🐍 හිස් හඬක් ඇසේ! ගල්පර අතර විසඝෝර පොළඟෙකු පහර දීමට සැරසේ [127, 163]! ලුණු [1] ඉසින්න හෝ ඈත් වන්න!"
      );
    }
    // Viper Strike if stepped too close
    if (distViper < 2.3 && this.elapsedTime - this.lastSawscaledStrikeTime > 3.0) {
      this.lastSawscaledStrikeTime = this.elapsedTime;
      this.health = Math.max(5, this.health - 28);
      this.bleeding = true;
      this.heartRate = Math.min(160, this.heartRate + 45);
      this.playSfx("hurt");
      this.cb.onNotify(
        this.lang === "en"
          ? "🩸 VIPER STRIKE! Deadly venom injected (-28 HP)! Drink Medicinal Herb [2] immediately!"
          : "🩸 පොළඟා දෂ්ට කළා (-28 HP)! වස ශරීරගත විය. වහාම ඖෂධ පැළෑටිය [2] පානය කරන්න!"
      );
    }

    // Sri Lankan Fishing Cat at [122, 172] on river rocks
    const distCat = Math.hypot(this.player.x - 122, this.player.z - 172);
    if (this.ch2CatTail) {
      this.ch2CatTail.rotation.y = Math.sin(this.elapsedTime * 3.2) * 0.35;
    }
    if (this.ch2CatHead && distCat >= 8.0) {
      this.ch2CatHead.rotation.y = Math.sin(this.elapsedTime * 0.9) * 0.2;
    }
    if (distCat < 8.0 && this.ch2CatGroup) {
      // Cat watches player vigilantly
      this.ch2CatGroup.lookAt(this.player.x, this.ch2CatGroup.position.y, this.player.z);
      if (this.elapsedTime - (this.lastCatGrowlTime || 0) > 6.0) {
        this.lastCatGrowlTime = this.elapsedTime;
        this.playSfx("squelch");
        this.cb.onNotify(
          this.lang === "en"
            ? "🐾 A wild Sri Lankan Fishing Cat is prowling on the river rocks. Don't sprint at it!"
            : "🐾 හඳුන් දිවියෙකු (Fishing Cat) ගං ඉවුරේ ගල් මත රැඳී සිටියි. දිව යාමෙන් වළකින්න!"
        );
      }
      if (this.player.isSprinting && distCat < 6.0) {
        // Cat leaps into riverside ferns
        this.ch2CatGroup.position.x = 118;
        this.ch2CatGroup.position.z = 176;
      }
    }

    // 11. Animate Crashed Helicopter Smoke & Emergency Light
    if (this.ch2CrashHeliLight) {
      this.ch2CrashHeliLight.intensity = 2.0 + Math.sin(this.elapsedTime * 6.0) * 1.5;
    }
    if (this.ch2CrashSmokeWisps) {
      for (let s = 0; s < this.ch2CrashSmokeWisps.length; s++) {
        const sm = this.ch2CrashSmokeWisps[s];
        sm.position.y += dt * (0.8 + s * 0.2);
        sm.scale.setScalar(1.0 + Math.sin(this.elapsedTime * 2.0 + s) * 0.3);
        if (sm.position.y > 6.0) sm.position.y = 2.2;
      }
    }

    // 12. Animate Floating Cyan Interactive Halos
    const haloBob = Math.sin(this.elapsedTime * 3.2) * 0.05;
    const haloRot = dt * 1.5;
    if (this.ch2SupplyHalo) {
      this.ch2SupplyHalo.position.y = this.ch2SupplyHaloBaseY + haloBob;
      this.ch2SupplyHalo.rotation.z += haloRot;
    }
    if (this.ch2MapHalo) {
      this.ch2MapHalo.position.y = this.ch2MapHaloBaseY + haloBob;
      this.ch2MapHalo.rotation.z += haloRot;
    }
    if (this.ch2BambooHalo) {
      this.ch2BambooHalo.position.y = this.ch2BambooHaloBaseY + haloBob;
      this.ch2BambooHalo.rotation.z += haloRot;
    }
    if (this.ch2RopeHalo) {
      this.ch2RopeHalo.position.y = this.ch2RopeHaloBaseY + haloBob;
      this.ch2RopeHalo.rotation.z += haloRot;
    }
    if (this.ch2RaftHalo) {
      this.ch2RaftHalo.position.y = this.ch2RaftHaloBaseY + haloBob;
      this.ch2RaftHalo.rotation.z += haloRot;
    }
    if (this.ch2TapeHalo) {
      this.ch2TapeHalo.position.y = this.ch2TapeHaloBaseY + haloBob;
      this.ch2TapeHalo.rotation.z += haloRot;
    }
    if (this.ch2PumpHalo) {
      this.ch2PumpHalo.position.y = this.ch2PumpHaloBaseY + haloBob;
      this.ch2PumpHalo.rotation.z += haloRot;
    }
    if (this.ch2CrystalHalo) {
      this.ch2CrystalHalo.position.y = this.ch2CrystalHaloBaseY + haloBob;
      this.ch2CrystalHalo.rotation.z += haloRot;
    }
    if (this.ch2TrolleyHalo) {
      this.ch2TrolleyHalo.position.y = this.ch2TrolleyHaloBaseY + haloBob;
      this.ch2TrolleyHalo.rotation.z += haloRot;
    }

    // 10. Normal Player Movement & Raycasting in Chapter 2
    this.updatePlayerMovement(dt);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 03: THE HOLLOW BELOW — 3D WORLD BUILDER & SYSTEMS
  // ═══════════════════════════════════════════════════════════════════════════

  buildChapter3World() {
    this.interactableMeshes = [];
    this.colliders = [];

    const limestoneTex = this.generateLimestoneTexture();
    const slateTex = this.generateSlateTexture();
    const blastDoorTex = this.generateBlastDoorTexture();
    const crystalTex = this.generateCrystalTexture();
    const timberTex = this.generateTimberPlanksTexture();

    // Helper to create glowing cyan interactive halo rings
    const createCyanInteractiveHalo = (radius = 0.28) => {
      const hGeo = new THREE.TorusGeometry(radius, 0.024, 8, 24);
      hGeo.rotateX(Math.PI / 2);
      const hMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const haloMesh = new THREE.Mesh(hGeo, hMat);
      const pLight = new THREE.PointLight(0x38bdf8, 1.2, 3.5, 1.8);
      haloMesh.add(pLight);
      return haloMesh;
    };

    // 1. Terrain Ground Mesh spanning z: 220 to 570, x: 90 to 150
    const terrainGeo = new THREE.PlaneGeometry(60, 350, 60, 140);
    terrainGeo.rotateX(-Math.PI / 2);
    terrainGeo.translate(120, 0, 395);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = this.getChapter3TerrainHeight(vx, vz);
      pos.setY(i, vy);
    }
    terrainGeo.computeVertexNormals();

    const caveFloorMat = new THREE.MeshStandardMaterial({
      map: limestoneTex,
      roughness: 0.85,
      metalness: 0.12,
    });
    const caveFloorMesh = new THREE.Mesh(terrainGeo, caveFloorMat);
    caveFloorMesh.receiveShadow = true;
    this.scene.add(caveFloorMesh);

    // 2. Vaulted Cavern Stone Ceiling (z: 265 to 555)
    const ceilGeo = new THREE.CylinderGeometry(18, 18, 290, 24, 1, true, 0, Math.PI);
    ceilGeo.rotateZ(Math.PI / 2);
    ceilGeo.rotateX(Math.PI / 2);
    ceilGeo.translate(120, 16.5, 410);

    const ceilMat = new THREE.MeshStandardMaterial({
      map: limestoneTex,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.BackSide,
    });
    const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
    this.scene.add(ceilMesh);

    // 3. 3D Stalactites (Hanging from ceiling)
    const stalactiteGeo = new THREE.ConeGeometry(0.4, 3.2, 8);
    stalactiteGeo.rotateX(Math.PI);
    const stalactiteMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.15,
    });

    const stalactitePositions = [
      [114, 280, 18.0], [125, 290, 17.5], [112, 310, 16.5], [128, 318, 16.5],
      [110, 335, 17.0], [124, 345, 17.0], [132, 350, 16.5], [115, 365, 17.0],
      [127, 375, 17.0], [118, 388, 17.0], [112, 405, 18.0], [126, 415, 18.0],
      [115, 425, 18.0], [123, 440, 18.0], [110, 460, 19.0], [130, 465, 19.0],
      [116, 475, 20.0], [125, 480, 20.0], [112, 495, 20.0], [128, 500, 19.5],
      [118, 512, 18.5], [122, 525, 17.0], [115, 538, 16.0], [124, 545, 16.0],
    ];

    stalactitePositions.forEach(([sx, sz, sy]) => {
      const sMesh = new THREE.Mesh(stalactiteGeo, stalactiteMat);
      sMesh.position.set(sx, sy, sz);
      sMesh.scale.set(0.7 + Math.random() * 0.6, 0.7 + Math.random() * 0.8, 0.7 + Math.random() * 0.6);
      this.scene.add(sMesh);
    });

    // 4. 3D Stalagmites (Rising from cave floor with circle colliders)
    const stalagmiteGeo = new THREE.ConeGeometry(0.5, 2.6, 8);
    const stalagmitePositions = [
      [111, 285], [127, 292], [109, 315], [129, 322],
      [108, 338], [126, 342], [112, 362], [128, 370],
      [110, 402], [127, 408], [111, 442], [128, 448],
      [108, 468], [131, 472], [112, 502], [127, 508],
      [114, 532], [126, 536]
    ];

    stalagmitePositions.forEach(([sx, sz]) => {
      const sy = this.getChapter3TerrainHeight(sx, sz);
      const smMesh = new THREE.Mesh(stalagmiteGeo, stalactiteMat);
      smMesh.position.set(sx, sy + 1.3, sz);
      smMesh.scale.set(0.8 + Math.random() * 0.5, 0.7 + Math.random() * 0.7, 0.8 + Math.random() * 0.5);
      smMesh.castShadow = true;
      this.scene.add(smMesh);
      this.colliders.push({ type: "circle", x: sx, z: sz, radius: 0.65 });
    });

    // 5. Exterior Cable Trolley Landing & Snapped Cable Mooring at [120, 15.5, 224]
    const trolleyGroup = new THREE.Group();
    trolleyGroup.position.set(120, 15.5, 224);

    const tFloor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 3.2), new THREE.MeshStandardMaterial({ map: timberTex }));
    tFloor.position.y = 0.1;
    trolleyGroup.add(tFloor);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const tPostGeo = new THREE.BoxGeometry(0.12, 2.2, 0.12);
    [[-1.1, -1.5], [1.1, -1.5], [-1.1, 1.5], [1.1, 1.5]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(tPostGeo, steelMat);
      post.position.set(px, 1.1, pz);
      trolleyGroup.add(post);
    });

    const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.4, 1.8), steelMat);
    hanger.position.set(0, 2.8, 0);
    trolleyGroup.add(hanger);

    const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 8.0, 8);
    const cableMesh = new THREE.Mesh(cableGeo, steelMat);
    cableMesh.position.set(0, 2.5, -3.5);
    cableMesh.rotation.x = Math.PI / 3.5;
    trolleyGroup.add(cableMesh);

    this.scene.add(trolleyGroup);

    // Solid collision barrier preventing player from falling backwards into the 100m gorge chasm
    this.colliders.push({ type: "box", minX: 105, maxX: 135, minZ: 215, maxZ: 224.5 });

    tFloor.userData = {
      id: "ch3_trolley",
      title: "කැඩීගිය කේබල් කරත්තය (Snapped Cable Trolley)",
      titleEn: "Snapped Cable Trolley",
      prompt: "[E] කේබල් කරත්තය පරීක්ෂා කරන්න",
      promptEn: "[E] Inspect Snapped Cable Trolley",
      action: () => {
        this.playSfx("wood_creak");
        this.cb.onNotify(
          this.lang === "en"
            ? "⚠️ The main haulage cable snapped violently upon landing. The gorge is impassable. Your only route lies ahead into the cavern."
            : "⚠️ ගොඩබසින විටම ප්‍රධාන කේබලය කැඩී ගියේය. අගාධය හරහා ආපසු යා නොහැක. ඉදිරියෙන් ඇති ගුහාව වෙත පිවිසෙන්න."
        );
      },
    };
    this.interactableMeshes.push(tFloor);

    // Sri Lanka Kangaroo Lizard (Otocryptis wiegmanni)
    const lizardGroup = new THREE.Group();
    lizardGroup.position.set(116, 15.8, 238);
    const lizBody = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 }));
    lizBody.rotation.x = -Math.PI / 4;
    lizardGroup.add(lizBody);
    const lizHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), new THREE.MeshStandardMaterial({ color: 0xa16207 }));
    lizHead.position.set(0, 0.25, -0.15);
    lizHead.rotation.x = Math.PI / 3;
    lizardGroup.add(lizHead);
    const lizTail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.04, 0.7, 5), new THREE.MeshStandardMaterial({ color: 0x713f12 }));
    lizTail.position.set(0, -0.1, 0.35);
    lizTail.rotation.x = -Math.PI / 6;
    lizardGroup.add(lizTail);
    this.scene.add(lizardGroup);
    this.ch3LizardGroup = lizardGroup;

    // Shrub Frogs (Pseudophilautus) near wet rock [124, 252, 16.2]
    const frogGroup = new THREE.Group();
    frogGroup.position.set(124, 16.2, 252);
    const frogMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshStandardMaterial({ color: 0x15803d }));
    frogMesh.scale.set(1, 0.6, 1.4);
    frogGroup.add(frogMesh);
    this.scene.add(frogGroup);
    this.ch3FrogGroup = frogGroup;

    // 6. Zone 1: 1987 Geological Research Checkpoint Plinth
    const plinthGeo = new THREE.BoxGeometry(10, 1.2, 18);
    const plinthMat = new THREE.MeshStandardMaterial({ map: limestoneTex, roughness: 0.9 });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.set(126, 9.6, 305);
    plinthMesh.receiveShadow = true;
    this.scene.add(plinthMesh);

    const tableMat = new THREE.MeshStandardMaterial({ map: timberTex, roughness: 0.8 });
    const deskMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 1.8), tableMat);
    deskMesh.position.set(126, 10.9, 305);
    deskMesh.castShadow = true;
    this.scene.add(deskMesh);
    this.colliders.push({ type: "box", minX: 124, maxX: 128, minZ: 303.8, maxZ: 306.2 });

    [[-1.4, -0.7], [1.4, -0.7], [-1.4, 0.7], [1.4, 0.7]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8), tableMat);
      leg.position.set(126 + lx, 10.5, 305 + lz);
      this.scene.add(leg);
    });

    // Kerosene Stove (Working, restores warmth & health)
    const stoveGroup = new THREE.Group();
    stoveGroup.position.set(128.5, 10.2, 303);
    const stoveBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 }));
    stoveBody.position.y = 0.4;
    stoveGroup.add(stoveBody);
    const stoveGlow = new THREE.PointLight(0xf59e0b, 2.8, 10, 1.4);
    stoveGlow.position.set(0, 0.6, 0);
    stoveGroup.add(stoveGlow);
    this.scene.add(stoveGroup);
    this.ch3StoveLight = stoveGlow;

    stoveBody.userData = {
      id: "ch3_stove",
      title: "භූමිතෙල් උදුන (Kerosene Stove)",
      titleEn: "Working Kerosene Stove",
      prompt: "[E] උදුනෙන් උණුසුම ලබාගන්න",
      promptEn: "[E] Warm Hands at Kerosene Stove",
      action: () => {
        this.temperature = 100;
        this.health = Math.min(100, this.health + 25);
        this.playSfx("heal");
        this.cb.onNotify(
          this.lang === "en"
            ? "♨️ The kerosene stove radiates steady warmth. Body temperature restored to 100%!"
            : "♨️ භූමිතෙල් උදුනෙන් දැඩි උණුසුමක් ලැබේ. ශරීර උෂ්ණත්වය 100% දක්වා ඉහළ ගියේය!"
        );
      },
    };
    this.interactableMeshes.push(stoveBody);

    // Damaged Transceiver Radio
    const radioMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.45), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 }));
    radioMesh.position.set(125.2, 11.2, 305.2);
    this.scene.add(radioMesh);

    radioMesh.userData = {
      id: "ch3_radio",
      title: "හදිසි ගුවන්විදුලි සම්ප්‍රේෂකය (Damaged Transceiver)",
      titleEn: "Expedition Transceiver (1987)",
      prompt: "[E] ගුවන්විදුලි පණිවිඩය අසන්න",
      promptEn: "[E] Play Recorded Expedition Audio",
      action: () => {
        this.playSfx("radio_static");
        if (this.cb.onTriggerStory) {
          this.cb.onTriggerStory({
            id: "ch3_radio_jayasuriya",
            title: "EXPEDITION FIELD AUDIO // DR. JAYASURIYA (1987)",
            speaker: "DR. JAYASURIYA // SINHARAJA EXPEDITION",
            text: this.lang === "en"
              ? "Dr. Jayasuriya's recorded transmission: '...Douglas went deeper down the shaft without the gas respirators! The sulfur vents in Zone 2 are active. If you follow him, equip the gas mask on the tripod and shut the river floodgate!'"
              : "ආචාර්ය ජයසූරියගේ පටිගත පණිවිඩය: '...ඩග්ලස් ගෑස් ආවරණයක් නොමැතිව පහළ කුහරය දෙසට ගියා! 2 වන කලාපයේ සල්ෆර් විෂ වායුව පිරී ඇත. ඔහු පසුපස යන්නේ නම් ට්‍රයිපොඩ් එක මත ඇති ගෑස් ආවරණය පැළඳගෙන සොරොව්වෙන් ගංගාව හිස් කරන්න!'",
          });
        }
      },
    };
    this.interactableMeshes.push(radioMesh);

    // Evidence 01: Ancient Inscription Slate (ch3_slate)
    const slateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.45), new THREE.MeshStandardMaterial({ map: slateTex }));
    slateMesh.position.set(126.8, 11.02, 304.8);
    this.scene.add(slateMesh);

    const slateHalo = createCyanInteractiveHalo(0.32);
    slateHalo.position.set(126.8, 11.45, 304.8);
    this.scene.add(slateHalo);
    this.ch3SlateHalo = slateHalo;
    this.ch3SlateHaloBaseY = 11.45;

    slateMesh.userData = {
      id: "ch3_slate",
      title: "පුරාණ සෙල්ලිපි පුවරුව (Ancient Inscription Slate)",
      titleEn: "Ancient Inscription Slate (Evidence 01)",
      prompt: "[E] සෙල්ලිපි පුවරුව ලබාගන්න",
      promptEn: "[E] Recover Ancient Inscription Slate",
      action: () => {
        const idx = this.interactableMeshes.indexOf(slateMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        if (this.ch3SlateHalo) {
          this.scene.remove(this.ch3SlateHalo);
          this.ch3SlateHalo = null;
        }
        this.tasks.slateFound = true;
        this.playSfx("pickup");
        if (this.cb.onTriggerStory) {
          this.cb.onTriggerStory({
            id: "evidence_ch3_slate",
            title: "ANCIENT INSCRIPTION SLATE // 1987 DISCOVERY",
            speaker: "EXPEDITION ARCHEOLOGICAL INTEL",
            text: this.lang === "en"
              ? "A dark metamorphic slate tablet carved with ancient Sinharaja glyphs. Douglas's scribbled margins translate: 'The subterranean azure monolith pulses with the living pulse of the rainforest roots. Disturbing the core awakens the earth tremor.'"
              : "සිංහරාජයේ පුරාණ සංකේත කැටයම් කළ අඳුරු සෙල්ලිපි පුවරුවකි. ඩග්ලස්ගේ පරිවර්තනය: 'භූගත නිල් ස්ඵටික කුලුන වැසි වනාන්තරයේ ජීව ස්පන්දනය හා බැඳී පවතී. එහි හරය බිඳහෙළීමෙන් මහා භූකම්පනයක් හටගනී.'",
          });
        }
      },
    };
    this.interactableMeshes.push(slateMesh);

    // 7. Zone 2: Catwalk, Gas Mask, Sulfur Vents & Sluice Wheel
    const catwalkGeo = new THREE.BoxGeometry(4.5, 0.25, 24);
    const catwalkMesh = new THREE.Mesh(catwalkGeo, new THREE.MeshStandardMaterial({ map: timberTex }));
    catwalkMesh.position.set(134, 5.5, 360);
    this.scene.add(catwalkMesh);

    // Miner's Gas Mask (gas_mask) on tripod
    const tripodGroup = new THREE.Group();
    tripodGroup.position.set(129, 5.6, 340);
    [-0.25, 0.25].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2), tableMat);
      leg.position.set(lx, 0.6, 0);
      leg.rotation.z = lx * 0.3;
      tripodGroup.add(leg);
    });
    const maskMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }));
    maskMesh.scale.set(1, 1.2, 0.8);
    maskMesh.position.set(0, 1.2, 0);
    const can1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 }));
    can1.rotation.z = Math.PI / 2;
    can1.position.set(-0.16, -0.06, 0.1);
    maskMesh.add(can1);
    const can2 = can1.clone();
    can2.position.set(0.16, -0.06, 0.1);
    maskMesh.add(can2);
    tripodGroup.add(maskMesh);
    this.scene.add(tripodGroup);

    const maskHalo = createCyanInteractiveHalo(0.3);
    maskHalo.position.set(129, 7.1, 340);
    this.scene.add(maskHalo);
    this.ch3MaskHalo = maskHalo;
    this.ch3MaskHaloBaseY = 7.1;

    maskMesh.userData = {
      id: "gas_mask",
      title: "පතල් වායු ආවරණය (Miner's Gas Mask)",
      titleEn: "Miner's Industrial Gas Mask",
      prompt: "[E] වායු ආවරණය පළඳින්න",
      promptEn: "[E] Equip Miner's Gas Mask",
      action: () => {
        const idx = this.interactableMeshes.indexOf(maskMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        if (this.ch3MaskHalo) {
          this.scene.remove(this.ch3MaskHalo);
          this.ch3MaskHalo = null;
        }
        this.gasMaskEquipped = true;
        this.tasks.maskFound = true;
        this.playSfx("pickup");
        this.cb.onNotify(
          this.lang === "en"
            ? "🤿 Equipped Miner's Gas Mask! Completely protected against toxic subterranean sulfur vapors."
            : "🤿 පතල් ගෑස් ආවරණය පැළඳගත්තා! විෂ සල්ෆර් වායුවෙන් සම්පූර්ණයෙන්ම ආරක්ෂිතයි."
        );
      },
    };
    this.interactableMeshes.push(maskMesh);

    // Toxic Sulfur Fissure Vents [114, 348, 2.2]
    const sulfurVentGroup = new THREE.Group();
    sulfurVentGroup.position.set(114, 2.2, 348);
    const sulfurCrust = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.9 }));
    sulfurVentGroup.add(sulfurCrust);
    const sulfurLight = new THREE.PointLight(0xa3e635, 2.0, 9, 1.6);
    sulfurLight.position.set(0, 0.8, 0);
    sulfurVentGroup.add(sulfurLight);
    this.scene.add(sulfurVentGroup);

    // Cast-iron Sluice Wheel Mechanism [135, 360, 5.5]
    const wheelStand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), steelMat);
    wheelStand.position.set(135, 6.2, 360);
    this.scene.add(wheelStand);

    const wheelGeo = new THREE.TorusGeometry(0.65, 0.08, 8, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.7, roughness: 0.4 });
    const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
    wheelMesh.position.set(135, 7.0, 360);
    this.scene.add(wheelMesh);
    this.ch3SluiceWheelMesh = wheelMesh;

    const wheelHalo = createCyanInteractiveHalo(0.4);
    wheelHalo.position.set(135, 7.8, 360);
    this.scene.add(wheelHalo);
    this.ch3WheelHalo = wheelHalo;
    this.ch3WheelHaloBaseY = 7.8;

    wheelMesh.userData = {
      id: "sluice_wheel",
      title: "භූගත සොරොව් චක්‍රය (Cast-Iron Sluice Wheel)",
      titleEn: "Cast-Iron Sluice Wheel",
      prompt: () => this.ch3FloodgateLowered ? (this.lang === "en" ? "[E] Floodgate Fully Open" : "[E] සොරොව්ව සම්පූර්ණයෙන් විවෘතයි") : (this.lang === "en" ? "[E] Turn Sluice Wheel to Drain River" : "[E] සොරොව්ව කරකවා ජලය හිස් කරන්න"),
      action: () => {
        if (this.ch3FloodgateLowered) return;
        this.ch3FloodgateLowered = true;
        this.tasks.floodgateUsed = true;
        this.ch3TargetWaterLevel = -1.5;
        this.playSfx("lever");
        if (this.ch3WheelHalo) {
          this.scene.remove(this.ch3WheelHalo);
          this.ch3WheelHalo = null;
        }
        this.cb.onNotify(
          this.lang === "en"
            ? "⚙️ Heavy iron sluice gates opened! The subterranean river is draining rapidly, exposing stepping stones."
            : "⚙️ බරැති යකඩ සොරොව්ව විවෘත විය! භූගත ගංගාවේ ජලය බැස ගොස් ගල් පාලම මතු වේ."
        );
      },
    };
    this.interactableMeshes.push(wheelMesh);

    // 8. Zone 3: Subterranean River Mesh & Stepping Stones
    const riverGeo = new THREE.PlaneGeometry(36, 24, 1, 1);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.85,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.set(120, this.ch3WaterLevel, 420);
    this.scene.add(riverMesh);
    this.ch3RiverMesh = riverMesh;

    for (let st = 0; st < 7; st++) {
      const sz = 412 + st * 2.8;
      const stoneMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.1, 1.6, 8), new THREE.MeshStandardMaterial({ map: limestoneTex, roughness: 0.9 }));
      stoneMesh.position.set(120 + Math.sin(st * 1.5) * 0.8, -0.3, sz);
      stoneMesh.receiveShadow = true;
      this.scene.add(stoneMesh);
    }

    // Cave Bat Colony
    const batGroup = new THREE.Group();
    batGroup.position.set(120, 17.5, 420);
    this.ch3BatMeshes = [];
    for (let b = 0; b < 22; b++) {
      const singleBat = new THREE.Group();
      singleBat.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 10);
      const bBody = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 5), new THREE.MeshStandardMaterial({ color: 0x09090b }));
      bBody.rotation.x = Math.PI;
      singleBat.add(bBody);
      const wingGeo = new THREE.PlaneGeometry(0.5, 0.3);
      const wL = new THREE.Mesh(wingGeo, new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide }));
      wL.position.set(-0.25, 0, 0);
      singleBat.add(wL);
      const wR = new THREE.Mesh(wingGeo, new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide }));
      wR.position.set(0.25, 0, 0);
      singleBat.add(wR);
      singleBat.userData = { wL, wR, basePos: singleBat.position.clone() };
      batGroup.add(singleBat);
      this.ch3BatMeshes.push(singleBat);
    }
    this.scene.add(batGroup);
    this.ch3BatGroup = batGroup;

    // Evidence 02: Miner's / Expedition Log (ch3_torch) at [112, 435, 3.5]
    const logOutcrop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), new THREE.MeshStandardMaterial({ map: limestoneTex }));
    logOutcrop.position.set(112, 2.9, 435);
    this.scene.add(logOutcrop);

    const logMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.38), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    logMesh.position.set(112, 3.55, 435);
    this.scene.add(logMesh);

    const torchMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 }));
    torchMesh.position.set(112.4, 3.55, 435.2);
    torchMesh.rotation.z = Math.PI / 2;
    this.scene.add(torchMesh);

    const logHalo = createCyanInteractiveHalo(0.3);
    logHalo.position.set(112, 4.05, 435);
    this.scene.add(logHalo);
    this.ch3LogHalo = logHalo;
    this.ch3LogHaloBaseY = 4.05;

    logMesh.userData = {
      id: "ch3_torch",
      title: "1987 පතල් ගවේෂණ වාර්තාව (1987 Subterranean Survey Log)",
      titleEn: "1987 Subterranean Survey Log (Evidence 02)",
      prompt: "[E] ගවේෂණ වාර්තාව ලබාගන්න",
      promptEn: "[E] Recover Subterranean Survey Log",
      action: () => {
        const idx = this.interactableMeshes.indexOf(logMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        if (this.ch3LogHalo) {
          this.scene.remove(this.ch3LogHalo);
          this.ch3LogHalo = null;
        }
        this.tasks.logFound = true;
        this.playSfx("pickup");
        if (this.cb.onTriggerStory) {
          this.cb.onTriggerStory({
            id: "evidence_ch3_torch",
            title: "SUBTERRANEAN SURVEY LOG // DECEMBER 1987",
            speaker: "1987 FIELD EXPEDITION LOGBOOK",
            text: this.lang === "en"
              ? "Journal of Chief Surveyor Douglas: 'The resonant crystal monolith in Zone 4 is emitting powerful bio-frequency oscillations. Our instruments are completely disrupted. Sector 04 military blast doors have been sealed until further orders.'"
              : "ප්‍රධාන ගවේෂක ඩග්ලස්ගේ සටහන: '4 වන කලාපයේ ඇති අනුනාද ස්ඵටික කුලුනෙන් ප්‍රබල සංඛ්‍යාත නිකුත් වේ. අපගේ විද්‍යාත්මක උපකරණ සියල්ල අක්‍රිය විය. ඉදිරි Sector 04 හමුදා දොරටුව මුද්‍රා තබා ඇත.'",
          });
        }
      },
    };
    this.interactableMeshes.push(logMesh);

    // 9. Zone 4: The Azure Resonance Cathedral & Monolith
    const plinthSpire = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 6.0, 1.4, 16), new THREE.MeshStandardMaterial({ map: limestoneTex, roughness: 0.9 }));
    plinthSpire.position.set(120, 3.1, 485);
    plinthSpire.receiveShadow = true;
    this.scene.add(plinthSpire);
    this.colliders.push({ type: "circle", x: 120, z: 485, radius: 2.5 });

    const spireGeo = new THREE.CylinderGeometry(0.35, 1.8, 12, 6);
    const spireMat = new THREE.MeshStandardMaterial({
      map: crystalTex,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.95,
    });
    const spireMesh = new THREE.Mesh(spireGeo, spireMat);
    spireMesh.position.set(120, 9.8, 485);
    this.scene.add(spireMesh);

    const spireLight = new THREE.PointLight(0x00f0ff, 6.0, 38, 1.4);
    spireLight.position.set(120, 8.0, 485);
    this.scene.add(spireLight);
    this.ch3SpireLight = spireLight;

    plinthSpire.userData = {
      id: "ch3_monolith",
      title: "අනුනාද ස්ඵටික කුලුන (Azure Resonance Monolith)",
      titleEn: "Azure Resonance Monolith",
      prompt: "[E] ස්ඵටික කුලුන පරීක්ෂා කරන්න",
      promptEn: "[E] Investigate Resonance Monolith",
      action: () => {
        this.tasks.resonanceInvestigated = true;
        this.playSfx("chime");
        const hasCh2Gem = Boolean(this.evidence.gem || this.hasSample);
        this.cb.onNotify(
          hasCh2Gem
            ? (this.lang === "en"
                ? "💎 The Chapter 2 Blue Crystal in your pack vibrates violently in harmonic frequency with the Monolith!"
                : "💎 ඔබ සතු Chapter 2 නිල් ස්ඵටිකය මහා කුලුන හා එක්ව දැඩි ලෙස අනුනාද වෙයි!")
            : (this.lang === "en"
                ? "💎 A colossal subterranean crystal monolith pulsing with ancient geological energy."
                : "💎 පුරාණ භූගත ශක්තියෙන් ස්පන්දනය වන මහා නිල් ස්ඵටික කුලුනකි.")
        );
      },
    };
    this.interactableMeshes.push(plinthSpire);

    // Evidence 03: Resonance Crystal Specimen (ch3_core)
    const coreGeo = new THREE.OctahedronGeometry(0.38, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(120, 4.3, 481.8);
    this.scene.add(coreMesh);

    const coreHalo = createCyanInteractiveHalo(0.35);
    coreHalo.position.set(120, 4.8, 481.8);
    this.scene.add(coreHalo);
    this.ch3CoreHalo = coreHalo;
    this.ch3CoreHaloBaseY = 4.8;

    coreMesh.userData = {
      id: "ch3_core",
      title: "අනුනාද ස්ඵටික සාම්පලය (Resonance Crystal Specimen)",
      titleEn: "Resonance Crystal Specimen (Evidence 03)",
      prompt: "[E] ස්ඵටික සාම්පලය ලබාගන්න",
      promptEn: "[E] Extract Resonance Crystal Specimen",
      action: () => {
        const idx = this.interactableMeshes.indexOf(coreMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        if (this.ch3CoreHalo) {
          this.scene.remove(this.ch3CoreHalo);
          this.ch3CoreHalo = null;
        }
        this.tasks.coreFound = true;
        this.tasks.resonanceInvestigated = true;
        this.playSfx("pickup");

        // TRIGGER THE SIGNATURE TREMOR COLLAPSE EVENT!
        this.ch3TremorActive = true;
        this.ch3TremorIntensity = 4.2;
        this.ch3TremorElapsed = 0;
        this.cameraShake = 4.2;
        this.playSfx("thunder");
        this.playSfx("stone_rumble");

        this.cb.onNotify(
          this.lang === "en"
            ? "⚠️ SEISMIC COLLAPSE! The cavern ceiling is collapsing! Escape into the northern fissure ramp!"
            : "⚠️ මහා භූකම්පනයක්! ගුහාව කඩා වැටෙයි! උතුරු බෑවුම ඔස්සේ වහාම පලා යන්න!"
        );
      },
    };
    this.interactableMeshes.push(coreMesh);

    // 10. Zone 5: Facility Blast Doors & Hydraulic Lever
    const apronMesh = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 20), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }));
    apronMesh.position.set(120, 11.8, 555);
    apronMesh.receiveShadow = true;
    this.scene.add(apronMesh);

    const doorMat = new THREE.MeshStandardMaterial({ map: blastDoorTex, metalness: 0.7, roughness: 0.3 });
    const blastDoorL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 8.5, 0.5), doorMat);
    blastDoorL.position.set(117.6, 16.25, 558);
    this.scene.add(blastDoorL);
    this.ch3BlastDoorL = blastDoorL;

    const blastDoorR = new THREE.Mesh(new THREE.BoxGeometry(4.8, 8.5, 0.5), doorMat);
    blastDoorR.position.set(122.4, 16.25, 558);
    this.scene.add(blastDoorR);
    this.ch3BlastDoorR = blastDoorR;

    this.ch3DoorCollider = { type: "box", minX: 112, maxX: 128, minZ: 557.5, maxZ: 558.8 };
    this.colliders.push(this.ch3DoorCollider);

    const beaconLight = new THREE.PointLight(0xef4444, 3.2, 16, 1.4);
    beaconLight.position.set(120, 21.0, 557);
    this.scene.add(beaconLight);
    this.ch3BeaconLight = beaconLight;

    const leverPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), steelMat);
    leverPedestal.position.set(124, 12.6, 555);
    this.scene.add(leverPedestal);

    const leverHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6), new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8 }));
    leverHandle.position.set(124, 13.3, 555);
    leverHandle.rotation.x = -Math.PI / 4;
    this.scene.add(leverHandle);
    this.ch3LeverHandle = leverHandle;

    const leverHalo = createCyanInteractiveHalo(0.3);
    leverHalo.position.set(124, 13.8, 555);
    this.scene.add(leverHalo);
    this.ch3LeverHalo = leverHalo;
    this.ch3LeverHaloBaseY = 13.8;

    leverPedestal.userData = {
      id: "ch4_elevator_lever",
      title: "හයිඩ්‍රොලික් පිවිසුම් ලීවරය (Hydraulic Blast Door Console)",
      titleEn: "Hydraulic Blast Door Console",
      prompt: () => this.ch3ElevatorActive ? (this.lang === "en" ? "[E] Sector 04 Blast Doors Unlocked" : "[E] දොරටුව විවෘතයි") : (this.lang === "en" ? "[E] Pull Hydraulic Lever to Unlock Chapter 04" : "[E] Chapter 04 දොරටු විවෘත කිරීමට ලීවරය අදින්න"),
      action: () => {
        if (this.ch3ElevatorActive) return;
        this.ch3ElevatorActive = true;
        this.tasks.elevatorReached = true;
        this.playSfx("lever");
        this.playSfx("door_open");

        if (this.ch3LeverHalo) {
          this.scene.remove(this.ch3LeverHalo);
          this.ch3LeverHalo = null;
        }

        if (this.ch3DoorCollider) {
          const cIdx = this.colliders.indexOf(this.ch3DoorCollider);
          if (cIdx >= 0) this.colliders.splice(cIdx, 1);
        }

        this.cb.onNotify(
          this.lang === "en"
            ? "🚪 Pneumatic seals released! Sector 04: The Forgotten Facility unlocked!"
            : "🚪 හයිඩ්‍රොලික් මුද්‍රා විවෘත විය! Sector 04: අමතක වූ පර්යේෂණාගාරය වෙත පිවිසුම විවෘත විය!"
        );

        setTimeout(() => {
          if (this.cb.onGameWon) {
            this.cb.onGameWon("hero");
          }
        }, 800);
      },
    };
    this.interactableMeshes.push(leverPedestal);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTER 03: PER-FRAME SIMULATION & SURVIVAL LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  updateChapter3(dt) {
    // 1. Dynamic Floodgate / River Water Level Lerp
    if (this.ch3WaterLevel > this.ch3TargetWaterLevel) {
      this.ch3WaterLevel = Math.max(this.ch3TargetWaterLevel, this.ch3WaterLevel - dt * 0.55);
      if (this.ch3RiverMesh) {
        this.ch3RiverMesh.position.y = this.ch3WaterLevel;
      }
      if (this.ch3SluiceWheelMesh) {
        this.ch3SluiceWheelMesh.rotation.z += dt * 8.0;
      }
    }

    // 2. Kerosene Stove Warmth & Health Regen in Zone 1 [128.5, 303]
    const distStove = Math.hypot(this.player.x - 128.5, this.player.z - 303);
    if (distStove < 6.5) {
      this.temperature = Math.min(100, (this.temperature || 100) + dt * 12);
      this.health = Math.min(100, this.health + dt * 2.5);
      this.player.inShelter = true;
    } else {
      this.player.inShelter = false;
    }

    // 3. Toxic Sulfur Vent Hazard in Zone 2 [114, 348]
    const distSulfur = Math.hypot(this.player.x - 114, this.player.z - 348);
    if (distSulfur < 8.5 && this.player.y < 5.0) {
      if (!this.gasMaskEquipped) {
        this.gasDamageTimer = (this.gasDamageTimer || 0) + dt;
        if (this.gasDamageTimer >= 1.5) {
          this.gasDamageTimer = 0;
          this.health = Math.max(10, this.health - 6);
          this.sanity = Math.max(20, this.sanity - 5);
          this.playSfx("hurt");
          this.cb.onNotify(
            this.lang === "en"
              ? "⚠️ TOXIC SULFUR VAPORS! Coughing violently (-6 HP). Equip the Miner's Gas Mask!"
              : "⚠️ විෂ සල්ෆර් වායුව! කැස්ස හටගනී (-6 HP). පතල් ගෑස් ආවරණය පළඳින්න!"
          );
        }
      }
    }

    // 4. Subterranean River Hazard in Zone 3
    if (this.player.z >= 410 && this.player.z <= 430) {
      if (this.ch3WaterLevel > 0.0) {
        this.health = Math.max(10, this.health - dt * 20);
        this.player.z = 405;
        this.playSfx("hurt");
        this.cb.onNotify(
          this.lang === "en"
            ? "🌊 Violent subterranean current! Drain the river using the Sluice Wheel before crossing!"
            : "🌊 සැඩ භූගත දියපහර! තරණය කිරීමට පෙර සොරොව්වෙන් ජලය බැස්සවිය යුතුය!"
        );
      } else {
        if (this.player.z > 428) {
          this.tasks.riverCrossed = true;
        }
      }
    }

    // 5. Monolith Pulse & Audio Distortion in Zone 4 [120, 485]
    if (this.ch3SpireLight) {
      this.ch3SpireLight.intensity = 5.0 + Math.sin(this.elapsedTime * 2.8) * 2.2;
    }
    const distMonolith = Math.hypot(this.player.x - 120, this.player.z - 485);
    if (distMonolith < 16.0) {
      if (!this.tasks.resonanceInvestigated && distMonolith < 4.5) {
        this.tasks.resonanceInvestigated = true;
      }
    }

    // 6. Tremor Collapse Event & Falling Rocks
    if (this.ch3TremorActive) {
      this.ch3TremorElapsed = (this.ch3TremorElapsed || 0) + dt;
      this.cameraShake = Math.max(this.cameraShake, this.ch3TremorIntensity);
      this.ch3TremorIntensity = Math.max(0.4, this.ch3TremorIntensity - dt * 0.35);

      if (this.ch3BatGroup && this.ch3BatGroup.position.y > 6.0) {
        this.ch3BatGroup.position.z -= dt * 14.0;
        this.ch3BatGroup.position.y += Math.sin(this.elapsedTime * 6.0) * 0.08;
      }
    }

    // 7. Bat Wings fluttering animation
    if (this.ch3BatMeshes) {
      const batFlap = Math.sin(this.elapsedTime * 14.0) * 0.65;
      for (let bm of this.ch3BatMeshes) {
        if (bm.userData.wL) bm.userData.wL.rotation.y = batFlap;
        if (bm.userData.wR) bm.userData.wR.rotation.y = -batFlap;
      }
    }

    // 8. Sliding Blast Doors in Zone 5
    if (this.ch3ElevatorActive) {
      if (this.ch3BlastDoorL && this.ch3BlastDoorL.position.x > 113.5) {
        this.ch3BlastDoorL.position.x -= dt * 2.0;
      }
      if (this.ch3BlastDoorR && this.ch3BlastDoorR.position.x < 126.5) {
        this.ch3BlastDoorR.position.x += dt * 2.0;
      }
      if (this.ch3LeverHandle && this.ch3LeverHandle.rotation.x < Math.PI / 4) {
        this.ch3LeverHandle.rotation.x += dt * 2.5;
      }
    }

    // 9. Beacon light strobe
    if (this.ch3BeaconLight) {
      this.ch3BeaconLight.intensity = Math.sin(this.elapsedTime * 8.0) > 0 ? 3.5 : 0.5;
    }

    // 10. Halo rings rotation and bobbing
    const haloBob = Math.sin(this.elapsedTime * 3.2) * 0.05;
    const haloRot = dt * 1.5;
    if (this.ch3SlateHalo) {
      this.ch3SlateHalo.position.y = this.ch3SlateHaloBaseY + haloBob;
      this.ch3SlateHalo.rotation.z += haloRot;
    }
    if (this.ch3MaskHalo) {
      this.ch3MaskHalo.position.y = this.ch3MaskHaloBaseY + haloBob;
      this.ch3MaskHalo.rotation.z += haloRot;
    }
    if (this.ch3WheelHalo) {
      this.ch3WheelHalo.position.y = this.ch3WheelHaloBaseY + haloBob;
      this.ch3WheelHalo.rotation.z += haloRot;
    }
    if (this.ch3LogHalo) {
      this.ch3LogHalo.position.y = this.ch3LogHaloBaseY + haloBob;
      this.ch3LogHalo.rotation.z += haloRot;
    }
    if (this.ch3CoreHalo) {
      this.ch3CoreHalo.position.y = this.ch3CoreHaloBaseY + haloBob;
      this.ch3CoreHalo.rotation.z += haloRot;
    }
    if (this.ch3LeverHalo) {
      this.ch3LeverHalo.position.y = this.ch3LeverHaloBaseY + haloBob;
      this.ch3LeverHalo.rotation.z += haloRot;
    }

    // 11. Disembark Trolley initial task check
    if (this.player.z > 228) {
      this.tasks.disembarkTrolley = true;
    }

    // 12. Standard first-person movement, physics, collision and interaction
    this.updatePlayerMovement(dt);
  }


  // Common player movement update subroutine
  updatePlayerMovement(dt) {
    // Mouse Look Interpolation
    this.player.yaw += (this.player.targetYaw - this.player.yaw) * Math.min(1.0, dt * 25);
    this.player.pitch += (this.player.targetPitch - this.player.pitch) * Math.min(1.0, dt * 25);

    // Crouch Height
    const targetHeight = this.player.isCrouching ? this.player.crouchHeight : this.player.standHeight;
    this.player.curEyeHeight += (targetHeight - this.player.curEyeHeight) * Math.min(1.0, dt * 12);

    let moveFwd = 0; let moveRgt = 0;
    if (this.keys["w"] || this.keys["arrowup"] || this.keys["KeyW"] || this.keys["ArrowUp"]) moveFwd += 1;
    if (this.keys["s"] || this.keys["arrowdown"] || this.keys["KeyS"] || this.keys["ArrowDown"]) moveFwd -= 1;
    if (this.keys["d"] || this.keys["arrowright"] || this.keys["KeyD"] || this.keys["ArrowRight"]) moveRgt += 1;
    if (this.keys["a"] || this.keys["arrowleft"] || this.keys["KeyA"] || this.keys["ArrowLeft"]) moveRgt -= 1;

    const isMoving = moveFwd !== 0 || moveRgt !== 0;
    this.player.isMoving = isMoving;

    const isSprint = (this.keys["shift"] || this.keys["ShiftLeft"] || this.keys["ShiftRight"]) && !this.player.isCrouching && this.player.stamina > 10;
    this.player.isSprinting = isSprint;
    if (isSprint && isMoving) {
      this.player.stamina = Math.max(0, this.player.stamina - dt * 16);
    } else {
      this.player.stamina = Math.min(100, this.player.stamina + dt * 12);
    }

    let curSpeed = this.player.speed;
    if (this.player.isCrouching) curSpeed *= this.player.crouchMultiplier;
    else if (isSprint) curSpeed *= this.player.sprintMultiplier;

    if (isMoving) {
      const len = Math.hypot(moveFwd, moveRgt);
      const fwdNorm = moveFwd / len;
      const rgtNorm = moveRgt / len;

      const sinY = Math.sin(this.player.yaw);
      const cosY = Math.cos(this.player.yaw);
      const fwdX = -sinY; const fwdZ = -cosY;
      const rgtX = cosY;  const rgtZ = -sinY;

      const worldDx = (fwdX * fwdNorm + rgtX * rgtNorm) * curSpeed * dt;
      const worldDz = (fwdZ * fwdNorm + rgtZ * rgtNorm) * curSpeed * dt;

      let nextX = this.player.x + worldDx;
      let nextZ = this.player.z + worldDz;

      // Obstacle Collision
      const pr = this.player.radius;
      for (let col of this.colliders) {
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

      this.footstepDist += Math.hypot(worldDx, worldDz);
      const stepInterval = isSprint ? 1.9 : (this.player.isCrouching ? 1.0 : 1.4);
      if (this.footstepDist > stepInterval && this.player.isGrounded) {
        this.footstepDist = 0;
        this.playSfx("step_mud");
      }
      const bobFreq = isSprint ? 13 : (this.player.isCrouching ? 6 : 8.5);
      this.headBob += dt * bobFreq;
    } else {
      this.headBob = 0;
    }

    // Vertical Physics
    const targetGroundY = this.getTerrainHeight(this.player.x, this.player.z);
    const gravity = 18.0;

    if (!this.player.isGrounded) {
      this.player.vy -= gravity * dt;
      this.player.y += this.player.vy * dt;
      if (this.player.y <= targetGroundY + this.player.curEyeHeight) {
        this.player.y = targetGroundY + this.player.curEyeHeight;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.playSfx("land");
      }
    } else {
      const currentEyeGoal = targetGroundY + this.player.curEyeHeight;
      if (this.player.y > currentEyeGoal + 0.15) {
        this.player.isGrounded = false;
        this.player.vy = -1.0;
      } else {
        this.player.y += (currentEyeGoal - this.player.y) * Math.min(1.0, dt * 18);
      }
    }

    // Camera Shake & Head Bob
    let shakeX = 0; let shakeY = 0;
    if (this.cameraShake > 0.001) {
      shakeX = (Math.random() - 0.5) * this.cameraShake * 0.14;
      shakeY = (Math.random() - 0.5) * this.cameraShake * 0.14;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 0.85);
    }
    const bobOffset = (isMoving && this.player.isGrounded) ? Math.sin(this.headBob) * 0.045 : 0;
    this.camera.position.set(this.player.x + shakeX, this.player.y + bobOffset + shakeY, this.player.z);
    this.camera.rotation.y = this.player.yaw + shakeX * 0.4;
    this.camera.rotation.x = this.player.pitch + shakeY * 0.4;

    // Tactical Flashlight
    if (this.flashlight) {
      this.flashlight.visible = Boolean(this.torchOn && this.battery > 0);
      if (this.flashlight.visible) {
        this.torchLag.yaw += (this.player.yaw - this.torchLag.yaw) * Math.min(1.0, dt * 18);
        this.torchLag.pitch += (this.player.pitch - this.torchLag.pitch) * Math.min(1.0, dt * 18);
        this.torchGroup.position.copy(this.camera.position);
        this.torchGroup.rotation.y = this.torchLag.yaw;
        this.torchGroup.rotation.x = this.torchLag.pitch;
      }
    }

    // Crosshair Raycast Interaction
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactableMeshes, false);
    if (intersects.length > 0 && intersects[0].distance < 4.5) {
      const hitObj = intersects[0].object;
      const ud = hitObj.userData || {};
      const promptVal = typeof ud.prompt === "function" ? ud.prompt() : ud.prompt;
      const promptEnVal = typeof ud.promptEn === "function" ? ud.promptEn() : ud.promptEn;
      this.activeCrosshairTarget = {
        ...ud,
        mesh: hitObj,
        title: this.lang === "en" ? (ud.titleEn || ud.title) : ud.title,
        prompt: this.lang === "en" ? (promptEnVal || promptVal) : promptVal,
        action: ud.action,
      };
    } else {
      this.activeCrosshairTarget = null;
    }

    // Periodic Stats Reporting to React HUD (15 Hz)
    this.dispatchStatsUpdate(dt);
  }

  // Common stats reporting dispatcher across all chapters
  dispatchStatsUpdate(dt) {
    this.statsUpdateTimer = (this.statsUpdateTimer || 0) + dt;
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
        nearCampfire: !!this.player.inShelter,
        nearInteractable: this.activeCrosshairTarget ? {
          id: this.activeCrosshairTarget.id,
          title: this.activeCrosshairTarget.title,
          prompt: this.activeCrosshairTarget.prompt,
        } : null,
        hasKey: this.hasKey,
        hasSample: this.hasSample,
        bleeding: this.bleeding,
        attachedLeeches: this.attachedLeeches || 0,
        temperature: Math.round(this.temperature !== undefined ? this.temperature : 100),
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
        gingerTeaCount: this.gingerTeaCount,
        tasks: { ...this.tasks },
        quality: this.quality,
      });
    }
  }

  // ── Build Kudawa Outpost 3D World (Chapter 1) ─────────────────────────────
  build3DWorld() {
    if (this.chapter === 3) {
      this.buildChapter3World();
      return;
    }
    if (this.chapter === 2) {
      this.buildChapter2World();
      return;
    }

    // ── A. Multi-Layer PBR Sinharaja Terrain ──
    const terrainCenter = { x: 520, z: 780 };
    const terrainSize = 750;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, 140, 140);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const localX = posAttr.getX(i);
      const localZ = posAttr.getZ(i);
      const worldX = terrainCenter.x + localX;
      const worldZ = terrainCenter.z + localZ;
      posAttr.setY(i, this.getTerrainHeight(worldX, worldZ));
    }
    terrainGeo.computeVertexNormals();

    const { diffuseTex, roughTex } = this.generateGroundPBRTextures();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: diffuseTex,
      roughnessMap: roughTex,
      roughness: 0.72,
      metalness: 0.08,
      color: 0xc4d8bc,
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.position.set(terrainCenter.x, 0, terrainCenter.z);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // ── B. Muddy Rainforest Trail (Leading from Kudawa Outpost toward River & Cave) ──
    const trailRawPoints = [
      [520, 726],
      [518, 735],
      [512, 750],
      [505, 768],
      [500, 790],
      [492, 815],
      [480, 840],
    ];
    const trailCurve = new THREE.CatmullRomCurve3(
      trailRawPoints.map(([tx, tz]) => new THREE.Vector3(tx, this.getTerrainHeight(tx, tz) + 0.035, tz))
    );
    const trailGeo = new THREE.TubeGeometry(trailCurve, 50, 1.5, 8, false);
    trailGeo.scale(1, 0.02, 1);
    const trailMat = new THREE.MeshStandardMaterial({
      color: 0x24160d, // Rich damp rainforest mud
      roughness: 0.32,  // High wetness reflection
      metalness: 0.28,
    });
    const trailMesh = new THREE.Mesh(trailGeo, trailMat);
    trailMesh.receiveShadow = true;
    this.scene.add(trailMesh);

    // ── B2. Nocturnal Flowing River Stream ──
    const riverCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(522, this.getTerrainHeight(522, 715) - 0.22, 715),
      new THREE.Vector3(514, this.getTerrainHeight(514, 738) - 0.22, 738),
      new THREE.Vector3(505, this.getTerrainHeight(505, 765) - 0.22, 765),
      new THREE.Vector3(496, this.getTerrainHeight(496, 795) - 0.22, 795),
      new THREE.Vector3(482, this.getTerrainHeight(482, 830) - 0.22, 830),
      new THREE.Vector3(468, this.getTerrainHeight(468, 860) - 0.22, 860),
    ]);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 40, 3.6, 8, false);
    riverGeo.scale(1, 0.015, 1);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x072b38,
      roughness: 0.08,
      metalness: 0.88,
      transparent: true,
      opacity: 0.82,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.receiveShadow = true;
    this.scene.add(riverMesh);

    // ── C. Reflective Rain Puddles along the Muddy Trail ──
    const puddleGeo = new THREE.CircleGeometry(1.6, 24);
    puddleGeo.rotateX(-Math.PI / 2);
    this.puddles = [];
    const puddlePositions = [
      [517, 738, 1.4, 1.1],
      [507, 762, 2.1, 1.5],
      [498, 795, 1.8, 1.2],
      [483, 835, 2.3, 1.6],
      [532, 736, 1.2, 0.9],
      [502, 780, 1.9, 1.3],
      [490, 850, 2.0, 1.4],
    ];
    puddlePositions.forEach(([px, pz, sx, sz]) => {
      const puddleMat = new THREE.MeshStandardMaterial({
        color: 0x07151a,
        roughness: 0.05,
        metalness: 0.9,
        transparent: true,
        opacity: 0.88,
      });
      const puddle = new THREE.Mesh(puddleGeo, puddleMat);
      puddle.position.set(px, this.getTerrainHeight(px, pz) + 0.04, pz);
      puddle.scale.set(sx, 1, sz);
      puddle.receiveShadow = true;
      this.scene.add(puddle);
      this.puddles.push(puddle);
    });

    // ── D. Kudawa Outpost 3D Cabin Architecture ──
    const cabinOriginX = 520;
    const cabinOriginZ = 720;
    const cabinW = 18;
    const cabinD = 14;
    const cabinH = 4.2;

    // 1. Polished Timber Floorboards inside cabin
    const timberTex = this.generateTimberPlanksTexture();
    const floorGeo = new THREE.PlaneGeometry(cabinW, cabinD);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      roughness: 0.45,
      metalness: 0.12,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(cabinOriginX, 0.02, cabinOriginZ);
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // 2. Timber Ceiling
    const ceilGeo = new THREE.PlaneGeometry(cabinW + 1, cabinD + 1);
    ceilGeo.rotateX(Math.PI / 2);
    const ceilMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      roughness: 0.82,
    });
    const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
    ceilMesh.position.set(cabinOriginX, cabinH, cabinOriginZ);
    this.scene.add(ceilMesh);

    // 3. Kudawa Cabin Log Walls Material
    const wallMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      color: 0x73482e,
      roughness: 0.78,
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
      map: this.gameTextures.door,
      roughness: 0.65,
      metalness: 0.15,
    });
    this.doorPivot = new THREE.Object3D();
    this.doorPivot.position.set(cabinOriginX - doorGapW / 2, 0, cabinOriginZ + cabinD / 2);
    const doorMesh = new THREE.Mesh(doorLeafGeo, doorLeafMat);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    this.doorPivot.add(doorMesh);
    this.doorPivot.rotation.y = this.doorSwingAngle;
    this.scene.add(this.doorPivot);

    doorMesh.userData = {
      isDoor: true,
      title: "කුඩව මුරපොළ දොරටුව (Outpost Door)",
      titleEn: "Kudawa Outpost Door",
      prompt: "[E] දොර අරින්න / වහන්න (Toggle Door)",
      promptEn: "[E] Open / Close Door",
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
    const lanternLight = new THREE.PointLight(0xfbbf24, 2.8, 22, 1.4);
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

    // Warm workbench reading lamp
    const benchLamp = new THREE.PointLight(0xfef08a, 1.8, 10, 1.5);
    benchLamp.position.set(tableX, tableH + 1.2, tableZ);
    this.scene.add(benchLamp);

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
      new THREE.MeshStandardMaterial({ map: this.gameTextures.radio, roughness: 0.4, metalness: 0.6 })
    );
    radioMesh.position.set(tableX - 1.1, tableH + 0.22, tableZ);
    radioMesh.castShadow = true;
    radioMesh.userData = {
      id: "outpost_radio",
      title: "සන්නිවේදන ගුවන්විදුලි යන්ත්‍රය (Radio Dispatch)",
      titleEn: "Tactical Radio Dispatch (1987)",
      prompt: "[E] සංඥාවට සවන් දෙන්න",
      promptEn: "[E] Listen to Transmission",
      action: () => {
        this.playSfx("radio_static");
        this.cb.onTriggerStory({
          title: "1987 නොවැම්බර් 14 රේන්ජර් පණිවිඩ සටහන",
          titleEn: "November 14, 1987 Ranger Dispatch",
          text: "'(ස්ටැටික් හඬ... අකුණු ගසන හඬ...) HQ... මෙහෙ කුඩව මුරපොළ 01... මහා වැස්ස සහ සුළඟ නිසා ගඟ පිටාර ගලලා. මහාචාර්ය ඩග්ලස් ලෙන් දොරටුව දෙසට ගියා. ආපසු ආවේ නෑ... (සංඥාව ඇනහිටී)'",
          textEn: "'(Static crackle... Heavy thunderclap...) HQ... This is Kudawa Outpost 01... Flash flood conditions along the valley river. Professor Douglas has departed toward the monolith cave portal. He has not returned... (Transmission lost)'",
          speaker: "1987 RANGER DISPATCH",
          speakerEn: "1987 RANGER DISPATCH",
          avatar: "radio",
        });
      },
    };
    this.scene.add(radioMesh);
    this.interactableMeshes.push(radioMesh);

    // 2. Douglas Voice Reel
    const reelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16),
      new THREE.MeshStandardMaterial({ map: this.gameTextures.reel, metalness: 0.8, roughness: 0.25 })
    );
    reelMesh.position.set(tableX, tableH + 0.12, tableZ);
    reelMesh.castShadow = true;
    reelMesh.userData = {
      id: "outpost_douglas_reel",
      title: "මහාචාර්ය ඩග්ලස්ගේ හඬ පටය (Douglas Voice Reel)",
      titleEn: "Prof. Douglas Voice Reel (1987)",
      prompt: "[E] හඬ පටය පරීක්ෂා කරන්න",
      promptEn: "[E] Play Audio Reel",
      action: () => {
        this.playSfx("pickup");
        if (this.cb.onOpenDouglasTape) {
          this.cb.onOpenDouglasTape();
        } else {
          this.cb.onTriggerStory({
            title: "මහාචාර්ය ඩග්ලස්ගේ හඬ පටය (1987)",
            titleEn: "Professor Douglas Voice Reel (1987)",
            text: "'මම මහාචාර්ය ඩග්ලස්... ලෙන් දොරටුවේ රහස් කේතය [හිරු, ගඟ, සිංහයා]. ගඟේ ජල මට්ටම ඉහළ යාමට පෙර ගලවා ගැනීමේ හෙලිපෑඩ් වෙත ළඟා විය යුතුයි...'",
            textEn: "'This is Professor Douglas... The subterranean monolith cipher is [SUN, RIVER, LION]. The river is rising fast; we must secure the bioluminescent flora sample and rendezvous at the summit helipad before flash flooding traps us...'",
            speaker: "PROF. DOUGLAS (1987)",
            speakerEn: "PROF. DOUGLAS (1987)",
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
      new THREE.MeshStandardMaterial({ map: this.gameTextures.balm, roughness: 0.3 })
    );
    balmMesh.position.set(tableX + 1.1, tableH + 0.15, tableZ);
    balmMesh.castShadow = true;
    balmMesh.userData = {
      id: "outpost_balm_bottle",
      title: "ඖෂධීය ලේ මැක්කන් විකර්ෂක තෙල් (Leech Balm)",
      titleEn: "Herbal Leech Repellent Balm",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      promptEn: "[E] Pick Up (+2 Leech Balm)",
      action: (obj) => {
        const ud = (obj && obj.userData) ? obj.userData : (obj || {});
        if (!ud.picked) {
          ud.picked = true;
          this.balmCount += 2;
          this.playSfx("pickup");
          this.scene.remove(balmMesh);
          const idx = this.interactableMeshes.indexOf(balmMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.activeCrosshairTarget = null;
          this.cb.onNotify(
            this.lang === "en"
              ? "🌿 Picked up Herbal Leech Repellent Balm! Apply with [B] for 90s protection."
              : "🌿 ලේ මැක්කන් විකර්ෂක තෙල් බෝතලය ලබාගත්තා! [B] මඟින් ආලේප කරන්න."
          );
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
      titleEn: "Professor Douglas Field Journal (Evidence 01)",
      prompt: "[E] කියවන්න / සාක්ෂිය ලබාගන්න",
      promptEn: "[E] Read / Secure Evidence 01",
      action: (obj) => {
        const ud = (obj && obj.userData) ? obj.userData : (obj || {});
        if (!ud.picked) {
          ud.picked = true;
          this.tasks.diaryFound = true;
          this.playSfx("pickup");
          this.scene.remove(diaryMesh);
          const idx = this.interactableMeshes.indexOf(diaryMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.activeCrosshairTarget = null;
          if (this.cb.onRadioTransmission) {
            this.cb.onRadioTransmission({
              id: "hq_diary_dispatch",
              speaker: "HQ DISPATCH",
              callsign: "HQ DISPATCH",
              text: "දිනපොතේ හෝඩුවාව ලැබුණා! ඩග්ලස්ගේ කණ්ඩායම ලෙන දෙසට ගොස් ඇත. ගංගා ඉවුරේ සඟවා ඇති පිත්තල යතුර සොයාගන්න. කූඩැලි රැළිවලින් ප්‍රවේශම් වන්න!",
              textEn: "Field Journal logged! Douglas's team crossed toward the monolith cave portal. Locate the antique brass key resting on the river boulder. Beware of leeches in the damp mud!",
            });
          }
          this.cb.onTriggerStory({
            title: "දිනපොතේ අභිරහස (සාක්ෂි අංක 01)",
            titleEn: "Field Journal Secrets (Evidence 01)",
            text: "'1987 නොවැම්බර් 14: ඔවුන් ගල් ලෙන තුළට ගියා. ලෙන් දොරටුවේ රහස් සංකේත තුන: [සූර්යයා, ගංගාව, සිංහයා]. දොර විවෘත කිරීමට ගංගා ඉවුරේ සැඟවූ පිත්තල යතුර අවශ්‍යයි!'",
            textEn: "'November 14, 1987: They moved into the subterranean sanctuary. Three ancient dials lock the portal: [SUN, RIVER, LION]. The portal gate mechanism requires the heavy brass key left on the river boulder!'",
            item: "ලෙයින් පෙඟුණු දිනපොත (Evidence 1)",
            itemEn: "Blood-Stained Field Journal (Evidence 01)",
            lore: {
              title: "සිංහරාජයේ රහස් දිනපොත",
              titleEn: "Sinharaja Expedition Field Journal",
              desc: "අතුරුදහන් වූ කණ්ඩායමේ ගමන් මාර්ගය හෙළි කරන වැදගත් සාක්ෂියකි.",
              descEn: "Vital field notes mapping Douglas's expedition path and the rune cipher.",
            },
          });
          this.cb.onNotify(
            this.lang === "en"
              ? "📖 Secured Professor Douglas's Field Journal! (Evidence 01/03)"
              : "📖 මහාචාර්ය ඩග්ලස්ගේ දිනපොත ලබාගත්තා! (සාක්ෂි 01/03)"
          );
          if (this.cb.onAutosave) this.cb.onAutosave();
        }
      },
    };
    this.scene.add(diaryMesh);
    this.interactableMeshes.push(diaryMesh);

    // 5. Optical UV Night Filter Lens (UV කාචය)
    const uvGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.06, 16);
    const uvMat = new THREE.MeshStandardMaterial({
      map: this.gameTextures.uv,
      roughness: 0.15,
      metalness: 0.85,
    });
    const uvMesh = new THREE.Mesh(uvGeo, uvMat);
    uvMesh.position.set(tableX - 1.7, tableH + 0.08, tableZ + 0.35);
    uvMesh.castShadow = true;
    uvMesh.userData = {
      id: "uv_lens_item",
      title: "අධෝරක්ත/UV රාත්‍රී පෙරහන (Tactical UV Lens)",
      titleEn: "Tactical UV Night Filter Lens",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      promptEn: "[E] Pick Up Tactical UV Lens",
      action: (obj) => {
        const ud = (obj && obj.userData) ? obj.userData : (obj || {});
        if (!ud.picked) {
          ud.picked = true;
          this.uvUnlocked = true;
          this.playSfx("pickup");
          this.scene.remove(uvMesh);
          const idx = this.interactableMeshes.indexOf(uvMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.activeCrosshairTarget = null;
          this.cb.onNotify(
            this.lang === "en"
              ? "🟣 Acquired Tactical UV Filter! Press [U] to toggle UV Blacklight for hidden runes."
              : "🟣 UV පෙරහන ලබාගත්තා! [U] මඟින් UV Blacklight සක්‍රිය කළ හැක."
          );
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
      titleEn: "Hot Ceylon Ginger Tea Mug",
      prompt: "[E] පානය කරන්න (Drink)",
      promptEn: "[E] Drink Tea (Sanity +30%)",
      action: (obj) => {
        const ud = (obj && obj.userData) ? obj.userData : (obj || {});
        if (!ud.drank) {
          ud.drank = true;
          this.sanity = Math.min(100, this.sanity + 30);
          this.player.stamina = 100;
          this.teaBuffTimer = 120;
          this.playSfx("heal");
          this.scene.remove(teaMesh);
          const idx = this.interactableMeshes.indexOf(teaMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.activeCrosshairTarget = null;
          this.cb.onNotify(
            this.lang === "en"
              ? "☕ Drank Hot Ceylon Ginger Tea! Sanity +30% & hypothermia cured."
              : "☕ උණුසුම් ඉඟුරු තේ පානය කළා! Sanity +30 & සීතල දුරු විය."
          );
        }
      },
    };
    this.scene.add(teaMesh);
    this.interactableMeshes.push(teaMesh);

    // 7. Emergency Salt Pouch on Bench (ලුණු කුඩු පැකට්ටුව)
    const saltGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const saltMat = new THREE.MeshStandardMaterial({
      map: this.gameTextures.salt,
      roughness: 0.9,
    });
    const saltMesh = new THREE.Mesh(saltGeo, saltMat);
    saltMesh.position.set(cabinOriginX + 4.2, 0.4, cabinOriginZ - 3.5);
    saltMesh.castShadow = true;
    saltMesh.userData = {
      id: "salt_pouch_outpost",
      title: "ලුණු කුඩු පැකට්ටුව (Salt Pouch for Leeches)",
      titleEn: "Emergency Salt Pouch",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      promptEn: "[E] Pick Up (+4 Salt)",
      action: (obj) => {
        const ud = (obj && obj.userData) ? obj.userData : (obj || {});
        if (!ud.picked) {
          ud.picked = true;
          this.saltCount += 4;
          this.playSfx("pickup");
          this.scene.remove(saltMesh);
          const idx = this.interactableMeshes.indexOf(saltMesh);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.activeCrosshairTarget = null;
          this.cb.onNotify(
            this.lang === "en"
              ? "🧂 Picked up Salt Pouch! (+4 Salt) Press [1] or Space to purge attached leeches."
              : "🧂 ලුණු කුඩු ලබාගත්තා! (+4 ලුණු) [1] මඟින් කූඩැල්ලන් ඉවත් කරන්න."
          );
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

    // Gunadasa Field Badge Portrait
    const badgeGeo = new THREE.PlaneGeometry(0.32, 0.42);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: this.gameTextures.gunadasa,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0, 1.02, 0.30);
    npcGroup.add(badgeMesh);

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
      titleEn: "Veteran Ranger Gunadasa",
      prompt: "[E] කතා කරන්න (Talk)",
      promptEn: "[E] Talk to Gunadasa",
      action: () => {
        if (!this.npc.helped) {
          this.npc.helped = true;
          this.saltCount += 3;
          this.herbCount += 2;
          this.balmCount += 1;
          this.playSfx("pickup");
          this.cb.onTriggerStory({
            title: "ප්‍රවීණ වන නිලධාරී ගුණදාස මාමා",
            titleEn: "Veteran Ranger Gunadasa",
            text: "'ආයුබෝවන් මහත්තයා! මම මේ අවුරුදු 40ක් තිස්සේ සිංහරාජයේ රස්සාව කරපු ගුණදාස. 1987 මහා වැස්සේ මහාචාර්ය ඩග්ලස් මේ කැබින් එකෙන් පිටත් වුණේ ලෙන් දොරටුව දෙසට. මඩ වලවල් වල කූඩැල්ලන්ගෙන් විතරක් නෙවෙයි, තෙත් ගස් අතු වල ඉන්න විෂකුරු පළා පොළඟුන්ගෙනුත්, උස් ගල් පර මුදුනේ සැරිසරන ශ්‍රී ලංකා කොටියාගෙනුත් ප්‍රවේශම් වෙන්න! මඟ දිග ඇති දිදුලන නිල් කැහිබෙලි පිහාටු 3ම එකතු කරගන්න. කැමරාවෙන් [C] වනජීවී ඡායාරූප ලබාගන්න!'",
            textEn: "'Greetings officer! I am Gunadasa, 40 years guarding Sinharaja forest. Back in the torrential tempest of 1987, Professor Douglas set out from this outpost toward the monolith cave portal. Beware the leeches in muddy hollows, but also watch wet branches for venomous Green Pit Vipers and look up at the high granite bluffs—the apex Sri Lankan Leopard stalks these ridges! Collect all 3 glowing blue magpie feathers to gain stamina, and use your Field Camera [C] to photograph the wildlife!'",
            speaker: "OLD RANGER GUNADASA",
            speakerEn: "OLD RANGER GUNADASA",
            avatar: "ranger",
          });
        } else {
          this.cb.onNotify(
            this.lang === "en"
              ? "🧙‍♂️ Ranger Gunadasa: 'Officer, watch for the leopard on the bluffs, the vipers on the logs, and collect all 3 blue magpie feathers!'"
              : "🧙‍♂️ ගුණදාස මාමා: 'මහත්තයා, ගල් පරේ ඉන්න කොටියාගෙනුත්, අතු වල ඉන්න පොළඟුන්ගෙනුත් ප්‍රවේශම් වෙලා, පිහාටු 3ම එකතු කරගන්න!'"
          );
        }
      },
    };
    this.interactableMeshes.push(npcBody);

    // ── G. Towering Sinharaja Dipterocarp Canopy Trees with Flanged Buttress Roots ──
    const barkTex = this.generateBarkTexture();
    const treeTrunkGeo = new THREE.CylinderGeometry(0.55, 1.1, 18, 12);
    const treeTrunkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      roughness: 0.88,
      metalness: 0.08,
    });
    const canopyGeo1 = new THREE.DodecahedronGeometry(5.2, 1);
    const canopyGeo2 = new THREE.DodecahedronGeometry(4.2, 1);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0e3214, roughness: 0.82 });
    const rootGeo = new THREE.ConeGeometry(0.65, 3.2, 5);
    const rootMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.95 });

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
      map: barkTex,
      roughness: 0.92,
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
      color: 0x526052,
      roughness: 0.68,
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
      const isKeyBoulder = (bx === 512 && bz === 735);
      const scaleY = isKeyBoulder ? 0.45 : (bScale * 0.85);
      const by = this.getTerrainHeight(bx, bz) + (isKeyBoulder ? 0.4 : (bScale * 0.8));
      bMesh.position.set(bx, by, bz);
      bMesh.scale.set(bScale * (isKeyBoulder ? 1.25 : 1), scaleY, bScale * 1.1);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      this.scene.add(bMesh);
      this.colliders.push({ type: "circle", x: bx, z: bz, radius: bScale * (isKeyBoulder ? 0.85 : 1.05) });
    });

    // ── J. Instanced Undergrowth Foliage (Feathered Ferns & Broadleaf Tropical Shrubs) ──
    const fernLeafGeo = new THREE.PlaneGeometry(0.95, 2.0);
    fernLeafGeo.translate(0, 1.0, 0); // Pivot at base
    const fernFrondTex = this.generateFernFrondTexture();
    const fernMat = new THREE.MeshStandardMaterial({
      map: fernFrondTex,
      transparent: true,
      alphaTest: 0.28,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const fernInstances = 450;
    this.fernMesh = new THREE.InstancedMesh(fernLeafGeo, fernMat, fernInstances);
    const dummy = new THREE.Object3D();

    let fIdx = 0;
    const fernClusters = 75;
    for (let f = 0; f < fernClusters; f++) {
      const clumpX = 520 + (Math.random() - 0.5) * 120;
      const clumpZ = 750 + (Math.random() - 0.5) * 140;

      // Keep cabin interior clear of ferns
      if (Math.abs(clumpX - 520) < 10 && Math.abs(clumpZ - 720) < 8) continue;

      const clumpY = this.getTerrainHeight(clumpX, clumpZ);
      const frondsPerClump = 6;
      for (let fr = 0; fr < frondsPerClump; fr++) {
        if (fIdx >= fernInstances) break;
        const angle = (fr / frondsPerClump) * Math.PI * 2 + Math.random() * 0.3;
        dummy.position.set(clumpX + (Math.random() - 0.5) * 0.8, clumpY, clumpZ + (Math.random() - 0.5) * 0.8);
        dummy.rotation.set(0.35 + Math.random() * 0.25, angle, 0);
        const sc = 0.9 + Math.random() * 0.45;
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        this.fernBaseMatrices.push(dummy.matrix.clone());
        this.fernMesh.setMatrixAt(fIdx++, dummy.matrix);
      }
    }
    this.fernMesh.instanceMatrix.needsUpdate = true;
    this.fernMesh.castShadow = true;
    this.scene.add(this.fernMesh);

    // ── J2. Giant Broadleaf Tropical Foliage (Alocasia / Elephant Ear Understory) ──
    const broadleafTex = this.generateBroadleafTexture();
    const broadleafGeo = new THREE.PlaneGeometry(1.6, 2.4);
    broadleafGeo.translate(0, 1.2, 0);
    const broadleafMat = new THREE.MeshStandardMaterial({
      map: broadleafTex,
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.45,
      side: THREE.DoubleSide,
    });
    const broadleafCount = 140;
    this.broadleafMesh = new THREE.InstancedMesh(broadleafGeo, broadleafMat, broadleafCount);
    const bDummy = new THREE.Object3D();
    let bIdx = 0;
    const broadleafClumps = [
      [514, 730], [526, 736], [508, 745], [516, 755],
      [502, 770], [494, 785], [530, 750], [538, 775],
      [488, 805], [505, 820], [478, 835], [512, 795],
      [525, 810], [535, 830], [470, 750], [545, 740],
      [490, 725], [550, 765], [465, 780], [500, 845],
    ];
    broadleafClumps.forEach(([bx, bz]) => {
      const by = this.getTerrainHeight(bx, bz);
      for (let l = 0; l < 7; l++) {
        if (bIdx >= broadleafCount) break;
        const leafAngle = (l / 7) * Math.PI * 2 + Math.random() * 0.4;
        const lean = 0.5 + Math.random() * 0.3;
        bDummy.position.set(bx + (Math.random() - 0.5) * 1.8, by, bz + (Math.random() - 0.5) * 1.8);
        bDummy.rotation.set(lean, leafAngle, 0);
        const sc = 0.85 + Math.random() * 0.5;
        bDummy.scale.set(sc, sc, sc);
        bDummy.updateMatrix();
        this.broadleafMesh.setMatrixAt(bIdx++, bDummy.matrix);
      }
    });
    this.broadleafMesh.instanceMatrix.needsUpdate = true;
    this.broadleafMesh.castShadow = true;
    this.scene.add(this.broadleafMesh);

    // ── K. Dynamic Storm Raindrop Particles ──
    const rDropCanvas = document.createElement("canvas");
    rDropCanvas.width = 32;
    rDropCanvas.height = 32;
    const rDropCtx = rDropCanvas.getContext("2d");
    const rGrad = rDropCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    rGrad.addColorStop(0, "rgba(224, 242, 254, 0.9)");
    rGrad.addColorStop(0.4, "rgba(186, 230, 253, 0.4)");
    rGrad.addColorStop(1, "rgba(186, 230, 253, 0)");
    rDropCtx.fillStyle = rGrad;
    rDropCtx.beginPath();
    rDropCtx.arc(16, 16, 16, 0, Math.PI * 2);
    rDropCtx.fill();
    const rainTexture = new THREE.CanvasTexture(rDropCanvas);

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
      map: rainTexture,
      color: 0xbae6fd,
      size: 0.08,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);

    // ── L. Evidence 2: Antique Brass Key on River Boulder [512, 735] ──
    const keyGroup = new THREE.Group();
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
    });

    const keyStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8),
      keyMat
    );
    keyStem.rotation.x = Math.PI / 2;
    keyGroup.add(keyStem);

    const keyRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.035, 8, 16),
      keyMat
    );
    keyRing.position.z = -0.28;
    keyGroup.add(keyRing);

    const keyBit = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.16, 0.04),
      keyMat
    );
    keyBit.position.set(0.05, 0.07, 0.22);
    keyGroup.add(keyBit);

    // Glowing Golden Beacon Shaft rising from the boulder into the mist
    const beaconGeo = new THREE.CylinderGeometry(0.06, 0.38, 3.2, 16, 1, true);
    beaconGeo.translate(0, 1.6, 0);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    keyGroup.add(beaconMesh);

    // Generous Interaction Hit Sphere around the key & boulder top
    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    keyGroup.add(hitSphere);

    const keyBouldY = this.getTerrainHeight(512, 735) + 0.4 + (1.4 * 0.45) + 0.18;
    this.keyBaseY = keyBouldY;
    keyGroup.position.set(512, keyBouldY, 735);
    keyGroup.castShadow = true;

    const keyLight = new THREE.PointLight(0xf59e0b, 2.6, 8.0);
    keyLight.position.set(512, keyBouldY + 0.45, 735);
    this.scene.add(keyLight);

    this.keyGroup = keyGroup;
    this.keyLight = keyLight;

    const keyAction = () => {
      if (!this.tasks.keyFound) {
        this.hasKey = true;
        this.tasks.keyFound = true;
        this.stormActive = true;
        this.playSfx("pickup");
        this.playSfx("thunder");
        this.scene.remove(keyGroup);
        this.scene.remove(keyLight);
        this.keyGroup = null;
        this.keyLight = null;
        const idx1 = this.interactableMeshes.indexOf(hitSphere);
        if (idx1 >= 0) this.interactableMeshes.splice(idx1, 1);
        const idx2 = this.interactableMeshes.indexOf(keyStem);
        if (idx2 >= 0) this.interactableMeshes.splice(idx2, 1);
        this.activeCrosshairTarget = null;
        if (this.cb.onRadioTransmission) {
          this.cb.onRadioTransmission({
            id: "storm_emergency_dispatch",
            speaker: "HQ EMERGENCY",
            callsign: "HQ EMERGENCY",
            text: "හදිසි කාලගුණ අනතුරු ඇඟවීමක්! ගංගා නිම්නය පිටාර ගලමින් පවතී. වතුරට නොබැස යෝධ ගස් කොටන් පාලම (Log Bridge) ඔස්සේ එතෙර වී ලෙන් දොරටුව විවෘත කරන්න!",
            textEn: "Emergency weather warning! Torrential flash flooding along the riverbed. Cross via the massive fallen log bridge and breach the monolith cave gate!",
          });
        }
        this.cb.onTriggerStory({
          title: "පුරාණ පිත්තල යතුර (සාක්ෂි අංක 02)",
          titleEn: "Antique Brass Key (Evidence 02)",
          text: "ඔබට ගල් ලෙනේ දොරටුව විවෘත කළ හැකි පුරාණ පිත්තල යතුර හමුවිය! ඒ සමඟම ගංගා නිම්නයට මහ කුණාටුවක් කඩා වැටුණි. මඩ වගුර මඟහැර යෝධ ගස් කොටන් පාලම (Log Bridge) ඔස්සේ ආරක්ෂිතව එතෙර වන්න!",
          textEn: "You recovered the antique brass key required to breach the monolith cave entrance! Simultaneously, a torrential tropical gale has struck the valley. Cross safely over the fallen timber bridge!",
          item: "පුරාණ පිත්තල යතුර (Evidence 2)",
          itemEn: "Antique Brass Key (Evidence 02)",
        });
        this.cb.onNotify(
          this.lang === "en"
            ? "🔑 Secured Antique Brass Key! (Evidence 02/03)"
            : "🔑 පුරාණ පිත්තල යතුර ලබාගත්තා! (සාක්ෂි 02/03)"
        );
        if (this.cb.onAutosave) this.cb.onAutosave();
      }
    };

    hitSphere.userData = {
      id: "glowing_brass_key",
      title: "දිදුලන පිත්තල යතුර (Antique Brass Key - Evidence 02)",
      titleEn: "Antique Brass Monolith Key (Evidence 02)",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      promptEn: "[E] Pick Up Key",
      action: keyAction,
    };
    keyStem.userData = hitSphere.userData;

    this.scene.add(keyGroup);
    this.interactableMeshes.push(hitSphere);
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
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.5, 3.2), archMat);
    pillarL.position.set(caveX - 3.2, caveY + 4.25, caveZ);
    pillarL.castShadow = true;
    this.scene.add(pillarL);

    // Right Pillar
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.5, 3.2), archMat);
    pillarR.position.set(caveX + 3.2, caveY + 4.25, caveZ);
    pillarR.castShadow = true;
    this.scene.add(pillarR);

    // Top Arch Lintel
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(9.2, 2.5, 3.4), archMat);
    archTop.position.set(caveX, caveY + 8.5, caveZ);
    archTop.castShadow = true;
    this.scene.add(archTop);

    // ── Impassable Towering Mountain Ridge Barriers (Flanking West & East) ──
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.95,
      metalness: 0.1,
    });
    // West Mountain Ridge (Blocks all movement left of portal from X=340 to X=492.8)
    const westMountainWall = new THREE.Mesh(new THREE.BoxGeometry(150, 26, 45), cliffMat);
    westMountainWall.position.set(caveX - 77, caveY + 12, caveZ + 18);
    westMountainWall.castShadow = true;
    this.scene.add(westMountainWall);
    this.colliders.push({ type: "box", minX: 340, maxX: caveX - 2.1, minZ: caveZ - 6, maxZ: caveZ + 45 });

    // East Portal Flank (Blocks sneaking around right of portal from X=497.2 to X=518)
    const eastPortalFlank = new THREE.Mesh(new THREE.BoxGeometry(22, 26, 26), cliffMat);
    eastPortalFlank.position.set(caveX + 13, caveY + 12, caveZ + 6);
    eastPortalFlank.castShadow = true;
    this.scene.add(eastPortalFlank);
    this.colliders.push({ type: "box", minX: caveX + 2.1, maxX: 518, minZ: caveZ - 6, maxZ: 854 });

    // North Mountain Perimeter Cliff (Blocks north map edge beyond helipad & cave)
    const northMountainWall = new THREE.Mesh(new THREE.BoxGeometry(110, 28, 25), cliffMat);
    northMountainWall.position.set(525, caveY + 13, 890);
    northMountainWall.castShadow = true;
    this.scene.add(northMountainWall);
    this.colliders.push({ type: "box", minX: 475, maxX: 575, minZ: 878, maxZ: 910 });

    // Far East Mountain Rim (Blocks east map boundary beyond helipad)
    const farEastWall = new THREE.Mesh(new THREE.BoxGeometry(45, 28, 90), cliffMat);
    farEastWall.position.set(585, caveY + 13, 850);
    farEastWall.castShadow = true;
    this.scene.add(farEastWall);
    this.colliders.push({ type: "box", minX: 565, maxX: 660, minZ: 810, maxZ: 895 });

    // Exterior Mountain Ridge Trail Stairs & Guide Lanterns to Helipad
    for (let step = 0; step < 12; step++) {
      const stepProg = step / 12;
      const stX = THREE.MathUtils.lerp(518, 542, stepProg);
      const stZ = THREE.MathUtils.lerp(818, 850, stepProg);
      const stY = this.getTerrainHeight(stX, stZ);
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.28, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
      );
      stepMesh.position.set(stX, stY + 0.14, stZ);
      stepMesh.receiveShadow = true;
      this.scene.add(stepMesh);

      if (step % 4 === 0) {
        // Guide Post with Amber Lantern along exterior path
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6),
          new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
        );
        post.position.set(stX - 1.4, stY + 0.9, stZ);
        this.scene.add(post);

        const lantern = new THREE.PointLight(0xf59e0b, 1.2, 8.0);
        lantern.position.set(stX - 1.4, stY + 1.8, stZ);
        this.scene.add(lantern);
      }
    }

    // Jagged Craggy Boulders on Ridge Line for visual authenticity
    for (let bx = -45; bx <= 45; bx += 7.5) {
      if (Math.abs(bx) < 4.0) continue; // Gap for the portal entrance
      const boulderGeo = new THREE.DodecahedronGeometry(3.5 + Math.abs(Math.sin(bx)) * 2.5, 1);
      const bMesh = new THREE.Mesh(boulderGeo, cliffMat);
      bMesh.position.set(caveX + bx, caveY + 2.0 + Math.abs(Math.cos(bx)) * 4.0, caveZ - 0.5 + Math.sin(bx) * 1.5);
      bMesh.rotation.set(bx * 0.2, bx * 0.3, bx * 0.1);
      bMesh.castShadow = true;
      this.scene.add(bMesh);
    }

    // Stone Gate Left Slab
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
      metalness: 0.25,
    });
    const gateLeftMesh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 6.2, 0.6), doorMat);
    gateLeftMesh.position.set(caveX - 1.15, caveY + 3.1, caveZ);
    gateLeftMesh.castShadow = true;
    this.scene.add(gateLeftMesh);
    this.caveGateLeft = gateLeftMesh;

    // Stone Gate Right Slab
    const gateRightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 6.2, 0.6), doorMat);
    gateRightMesh.position.set(caveX + 1.15, caveY + 3.1, caveZ);
    gateRightMesh.castShadow = true;
    this.scene.add(gateRightMesh);
    this.caveGateRight = gateRightMesh;

    // Gate Barrier Collider (Strictly blocks the 4.8m portal gap when gate is sealed)
    this.caveGateCollider = {
      isGateBarrier: true,
      type: "box",
      minX: caveX - 2.4,
      maxX: caveX + 2.4,
      minZ: caveZ - 1.5,
      maxZ: caveZ + 1.5,
    };
    this.colliders.push(this.caveGateCollider);

    // Gate interaction trigger
    gateLeftMesh.userData = {
      id: "cave_gate",
      title: "පුරාණ භූගත ලෙන් දොරටුව (Ancient Monolith Cave Portal)",
      titleEn: "Ancient Monolith Cave Portal",
      prompt: "[E] අගුළු හරින්න / විවෘත කරන්න",
      promptEn: "[E] Unlock Rune Portal",
      action: () => {
        if (this.caveGateUnlocked) {
          this.cb.onNotify(
            this.lang === "en"
              ? "⛩️ Monolith cave portal is already unsealed."
              : "⛩️ ලෙන් දොරටුව දැනටමත් විවෘතව පවතී."
          );
          return;
        }
        if (!this.hasKey) {
          this.playSfx("hurt");
          this.cb.onNotify(
            this.lang === "en"
              ? "⚠️ The monolith gate is locked! Find the antique brass key resting atop the river boulder."
              : "⚠️ දොරටුව අගුළු දමා ඇත! ගංගා ඉවුරේ ගල් පර්වතය මත ඇති පිත්තල යතුර සොයාගන්න."
          );
          return;
        }

        if (this.cb.onOpenRunePuzzle) {
          this.cb.onOpenRunePuzzle(() => {
            this.caveGateUnlocked = true;
            this.caveGateOpening = true;
            this.cameraShake = 0.95;
            this.playSfx("stone_rumble");
            this.playSfx("thunder");
            if (this.cb.onRadioTransmission) {
              this.cb.onRadioTransmission({
                id: "cave_gate_unlocked_radio",
                speaker: "SINHA-BASE // 01",
                callsign: "SINHA-BASE",
                text: "ලෙන් දොරටුව විවෘතයි! අභ්‍යන්තරයේ නිල් ආලෝකය විහිදෙන දිලීර සාම්පලය (Research Sample) සොයාගන්න!",
                textEn: "Monolith portal breached! Enter the subterranean cavern and extract the bioluminescent research vial!",
              });
            }
            this.cb.onTriggerStory({
              title: "ලෙන් දොරටුව විවෘත විය!",
              titleEn: "Monolith Cave Portal Unsealed!",
              text: "රහස් සංකේත ගැලපීමෙන් පසු පැරණි ගල් දොර සෙලවෙමින් දෙපසට විවෘත විය. ඇතුළතින් නිල් පැහැති විද්‍යාගාර ආලෝකයක් දිස්වේ!",
              textEn: "The heavy stone monolith groaned open in response to the ancient cipher. An eerie cyan bioluminescent glow radiates from within the cavern sanctuary!",
            });
            if (this.cb.onAutosave) this.cb.onAutosave();
          });
        }
      },
    };
    this.interactableMeshes.push(gateLeftMesh);

    // ── N. Subterranean Cavern Chamber & Altar [495, 840-878] ──
    const caveFloorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.92,
      metalness: 0.15,
    });
    const caveFloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 40), caveFloorMat);
    caveFloor.rotation.x = -Math.PI / 2;
    caveFloor.position.set(caveX, caveY + 0.05, caveZ + 19);
    caveFloor.receiveShadow = true;
    this.scene.add(caveFloor);

    // Cavern Left Stone Wall
    const caveWallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.96,
      metalness: 0.05,
    });
    const caveWallL = new THREE.Mesh(new THREE.BoxGeometry(2.0, 9.5, 40), caveWallMat);
    caveWallL.position.set(caveX - 7.5, caveY + 4.75, caveZ + 19);
    caveWallL.castShadow = true;
    this.scene.add(caveWallL);
    this.colliders.push({ type: "box", minX: caveX - 9.5, maxX: caveX - 6.0, minZ: caveZ - 2, maxZ: caveZ + 39 });

    // Cavern Right Stone Wall - Front Section (Z: 838 to 856)
    const caveWallR_front = new THREE.Mesh(new THREE.BoxGeometry(2.0, 9.5, 18), caveWallMat);
    caveWallR_front.position.set(caveX + 7.5, caveY + 4.75, caveZ + 8);
    caveWallR_front.castShadow = true;
    this.scene.add(caveWallR_front);
    this.colliders.push({ type: "box", minX: caveX + 6.0, maxX: caveX + 9.5, minZ: caveZ - 2, maxZ: caveZ + 16 });

    // Cavern Right Stone Wall - Rear Section (Z: 868 to 879)
    const caveWallR_rear = new THREE.Mesh(new THREE.BoxGeometry(2.0, 9.5, 11), caveWallMat);
    caveWallR_rear.position.set(caveX + 7.5, caveY + 4.75, caveZ + 33.5);
    caveWallR_rear.castShadow = true;
    this.scene.add(caveWallR_rear);
    this.colliders.push({ type: "box", minX: caveX + 6.0, maxX: caveX + 9.5, minZ: caveZ + 28, maxZ: caveZ + 39 });

    // Archway Lintel above exit archway (Z: 856 to 868)
    const caveArchLintel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 12), caveWallMat);
    caveArchLintel.position.set(caveX + 7.5, caveY + 8.25, caveZ + 22);
    this.scene.add(caveArchLintel);

    // ── Cavern Ascent Tunnel to Helipad [X: 502.5 -> 540, Z: 861.5] ──
    const tunnelSouthWall = new THREE.Mesh(new THREE.BoxGeometry(38, 9.5, 2.0), caveWallMat);
    tunnelSouthWall.position.set(521, caveY + 4.75, 855);
    tunnelSouthWall.castShadow = true;
    this.scene.add(tunnelSouthWall);
    this.colliders.push({ type: "box", minX: 502, maxX: 540, minZ: 853.5, maxZ: 856.5 });

    const tunnelNorthWall = new THREE.Mesh(new THREE.BoxGeometry(38, 9.5, 2.0), caveWallMat);
    tunnelNorthWall.position.set(521, caveY + 4.75, 868);
    tunnelNorthWall.castShadow = true;
    this.scene.add(tunnelNorthWall);
    this.colliders.push({ type: "box", minX: 502, maxX: 540, minZ: 866.5, maxZ: 869.5 });

    // Tunnel Stone Steps Ascending from Cavern to Summit Helipad
    for (let tStep = 0; tStep < 14; tStep++) {
      const tProg = tStep / 14;
      const stepX = THREE.MathUtils.lerp(503, 539, tProg);
      const stepY = caveY + tProg * 0.45;
      const tStepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.35, 10),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
      );
      tStepMesh.position.set(stepX, stepY + 0.15, 861.5);
      tStepMesh.receiveShadow = true;
      this.scene.add(tStepMesh);

      // Glowing Cyan Wall Crystals
      if (tStep % 3 === 0) {
        const cMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        });
        const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.85, 5), cMat);
        crystal.position.set(stepX, stepY + 1.8, 856.2);
        crystal.rotation.x = Math.PI / 4;
        this.scene.add(crystal);

        const cLight = new THREE.PointLight(0x06b6d4, 1.8, 8.0);
        cLight.position.set(stepX, stepY + 2.0, 861.5);
        this.scene.add(cLight);
      }
    }

    // Directional Wooden Signpost pointing out to the Helipad
    const signPostMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 8), signPostMat);
    signPole.position.set(504, caveY + 1.2, 858);
    this.scene.add(signPole);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 1.6), signPostMat);
    signBoard.position.set(504, caveY + 2.1, 858);
    this.scene.add(signBoard);

    // Cavern Rear Sanctuary Wall
    const caveWallBack = new THREE.Mesh(new THREE.BoxGeometry(17, 9.5, 2.0), caveWallMat);
    caveWallBack.position.set(caveX, caveY + 4.75, caveZ + 39);
    caveWallBack.castShadow = true;
    this.scene.add(caveWallBack);
    this.colliders.push({ type: "box", minX: caveX - 8.5, maxX: caveX + 8.5, minZ: caveZ + 38, maxZ: caveZ + 41 });

    // Cavern Overhead Arched Vault Ceiling (Blocks outside sky/rain)
    const caveCeil = new THREE.Mesh(
      new THREE.CylinderGeometry(7.5, 7.5, 40, 20, 1, true, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.98, side: THREE.BackSide })
    );
    caveCeil.rotation.x = Math.PI / 2;
    caveCeil.rotation.z = Math.PI / 2;
    caveCeil.position.set(caveX, caveY + 4.75, caveZ + 19);
    this.scene.add(caveCeil);

    // Cavern Hanging Stalactites from ceiling
    const stalactiteGeo = new THREE.ConeGeometry(0.35, 2.4, 7);
    const stalactiteMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.92 });
    [
      [caveX - 3.2, caveY + 6.5, caveZ + 8],
      [caveX + 2.8, caveY + 6.3, caveZ + 14],
      [caveX - 2.5, caveY + 6.6, caveZ + 22],
      [caveX + 3.0, caveY + 6.4, caveZ + 30],
      [caveX - 1.2, caveY + 6.8, caveZ + 34],
    ].forEach(([sx, sy, sz]) => {
      const st = new THREE.Mesh(stalactiteGeo, stalactiteMat);
      st.position.set(sx, sy, sz);
      st.rotation.x = Math.PI; // point downward
      st.castShadow = true;
      this.scene.add(st);
    });

    // Cavern Stalagmites rising from floor
    const stalagmiteGeo = new THREE.ConeGeometry(0.38, 1.9, 7);
    [
      [caveX - 4.5, caveY + 0.95, caveZ + 12],
      [caveX + 4.8, caveY + 0.95, caveZ + 20],
      [caveX - 4.2, caveY + 0.95, caveZ + 28],
    ].forEach(([sx, sy, sz]) => {
      const sm = new THREE.Mesh(stalagmiteGeo, stalactiteMat);
      sm.position.set(sx, sy, sz);
      sm.castShadow = true;
      this.scene.add(sm);
    });

    // Bioluminescent Wall Mushroom Clusters & Crystals
    const mushroomMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    });
    [
      [caveX - 5.5, caveY + 1.2, caveZ + 10],
      [caveX + 5.5, caveY + 1.4, caveZ + 18],
      [caveX - 5.5, caveY + 1.1, caveZ + 26],
      [caveX + 5.5, caveY + 1.3, caveZ + 32],
    ].forEach(([mx, my, mz]) => {
      const mGroup = new THREE.Group();
      mGroup.position.set(mx, my, mz);
      for (let m = 0; m < 4; m++) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mushroomMat);
        cap.position.set((m % 2) * 0.18 - 0.09, Math.floor(m / 2) * 0.16, (m % 3) * 0.12);
        mGroup.add(cap);
      }
      const mLight = new THREE.PointLight(0x06b6d4, 1.4, 7.0);
      mLight.position.set(0, 0.2, 0);
      mGroup.add(mLight);
      this.scene.add(mGroup);
    });

    // ── Evidence 3: Bioluminescent Flora Research Sample in Sanctuary [495, 862] ──
    const sampleX = 495;
    const sampleZ = 862;
    const sampleY = caveY;

    // Ancient Tiered Dais Altar
    const daisBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.7, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    );
    daisBase.position.set(sampleX, sampleY + 0.18, sampleZ);
    daisBase.castShadow = true;
    this.scene.add(daisBase);

    const daisMid = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.2, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
    );
    daisMid.position.set(sampleX, sampleY + 0.55, sampleZ);
    daisMid.castShadow = true;
    this.scene.add(daisMid);

    const pedMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.55, 0.75, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.82 })
    );
    pedMesh.position.set(sampleX, sampleY + 1.12, sampleZ);
    pedMesh.castShadow = true;
    this.scene.add(pedMesh);

    const sampleVial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.44, 16),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x0891b2,
        emissiveIntensity: 0.85,
      })
    );
    sampleVial.position.set(sampleX, sampleY + 1.72, sampleZ);
    sampleVial.castShadow = true;

    const sampleLight = new THREE.PointLight(0x06b6d4, 2.6, 9.0);
    sampleLight.position.set(sampleX, sampleY + 1.9, sampleZ);
    this.scene.add(sampleLight);

    sampleVial.userData = {
      id: "cave_samples",
      title: "අතුරුදහන් වූ පර්යේෂණ සාම්පල (Lost Research Sample - Evidence 03)",
      titleEn: "Bioluminescent Flora Sample (Evidence 03)",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      promptEn: "[E] Collect Research Sample",
      action: () => {
        if (!this.tasks.sampleFound) {
          this.hasSample = true;
          this.tasks.sampleFound = true;
          this.cameraShake = 1.35;
          this.playSfx("pickup");
          this.playSfx("stone_rumble");
          this.playSfx("thunder");
          this.scene.remove(sampleVial);
          this.scene.remove(sampleLight);
          const idx = this.interactableMeshes.indexOf(sampleVial);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.activeCrosshairTarget = null;

          // Ignite the Summit Helipad Rescue Beacon Light Pillar
          if (this.helipadBeaconBeam) {
            this.helipadBeaconBeam.visible = true;
          }
          if (this.helipadBeaconLight) {
            this.helipadBeaconLight.intensity = 5.0;
          }

          if (this.cb.onRadioTransmission) {
            this.cb.onRadioTransmission({
              id: "all_evidence_collected_dispatch",
              speaker: "HQ DISPATCH",
              callsign: "HQ DISPATCH",
              text: "භූ කම්පන අනතුරු ඇඟවීමක්! පැරණි භූගත ලෙන දෙදරුම් කයි! වහාම ඉවත් වන්න! කඳු මුදුනේ හෙලිපෑඩ් ගලවා ගැනීමේ බීකනය දැල්වී ඇත [545, 855]!",
              textEn: "SEISMIC ALARM! The ancient subterranean vault is destabilizing! Evacuate immediately! Summit Helipad rescue beacon is active at [545, 855]! Run!",
            });
          }
          this.cb.onTriggerStory({
            title: "අභිරහස හෙළි විය! (සාක්ෂි අංක 03)",
            titleEn: "Expedition Secrets Secured! (Evidence 03)",
            text: "වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ පර්යේෂණ සාම්පල බඳුන ඔබට හමුවිය! ලෙන දෙදරුම් කන බැවින් දැන් කඳු මුදුනේ දැල්වුණු බීකනය ඔස්සේ හෙලිපෑඩ් වෙත ගොස් සංඥා කරන්න!",
            textEn: "You secured Professor Douglas's rare bioluminescent Sinharaja flora vial! With the cavern destabilizing, sprint toward the towering rescue beacon on the summit ridge helipad!",
            item: "පර්යේෂණ සාම්පල (Evidence 3)",
            itemEn: "Bioluminescent Flora Sample (Evidence 03)",
            lore: {
              title: "සිංහරාජයේ දුර්ලභ ශාක සාම්පලය",
              titleEn: "Sinharaja Bioluminescent Flora Sample",
              desc: "මහාචාර්ය ඩග්ලස් විසින් රැස් කළ අතිශය දුර්ලභ ජෛව සාම්පලයකි.",
              descEn: "Ultra-rare bioluminescent specimen collected by Professor Douglas's 1987 lost expedition.",
            },
          });
          this.cb.onNotify(
            this.lang === "en"
              ? "🧪 Secured Bioluminescent Flora Sample! (Evidence 03/03 - Cavern Collapsing! Evacuate to Helipad!)"
              : "🧪 පර්යේෂණ සාම්පලය ලබාගත්තා! (සාක්ෂි 03/03 - ලෙන කඩා වැටේ! හෙලිපෑඩ් වෙත දුවන්න!)"
          );
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
      new THREE.CylinderGeometry(11.0, 11.5, 0.35, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.2 })
    );
    padMesh.position.set(heliX, heliY + 0.18, heliZ);
    padMesh.receiveShadow = true;
    this.scene.add(padMesh);

    const hBarMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 6.5), hBarMat);
    hBar1.position.set(heliX - 2.5, heliY + 0.38, heliZ);
    this.scene.add(hBar1);
    const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 6.5), hBarMat);
    hBar2.position.set(heliX + 2.5, heliY + 0.38, heliZ);
    this.scene.add(hBar2);
    const hBarCross = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.02, 0.85), hBarMat);
    hBarCross.position.set(heliX, heliY + 0.38, heliZ);
    this.scene.add(hBarCross);

    const mastMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 6.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
    );
    mastMesh.position.set(heliX + 8.5, heliY + 3.25, heliZ - 4.0);
    mastMesh.castShadow = true;
    this.scene.add(mastMesh);

    const beaconLight = new THREE.PointLight(0xef4444, 2.2, 25.0);
    beaconLight.position.set(heliX + 8.5, heliY + 6.6, heliZ - 4.0);
    this.scene.add(beaconLight);

    // ── O2. Detailed 3D Military Search & Rescue Helicopter (Chopper-01) ──
    const chopperGroup = new THREE.Group();
    chopperGroup.position.set(heliX, heliY + 0.35, heliZ);
    chopperGroup.rotation.y = -Math.PI / 4; // Photogenic angled landing posture

    const heliBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Tactical military slate
      roughness: 0.45,
      metalness: 0.55,
    });
    const heliStripeMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // High-visibility search & rescue yellow
      roughness: 0.35,
      metalness: 0.2,
    });
    const heliGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Deep tinted aeronautic windshield
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.72,
    });
    const heliMetalMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.25,
      metalness: 0.85,
    });
    const heliBladeMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.2,
      metalness: 0.75,
    });

    // Main Cabin Fuselage
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 5.6), heliBodyMat);
    fuselage.position.set(0, 1.45, 0);
    fuselage.castShadow = true;
    chopperGroup.add(fuselage);

    // Hazard Yellow Rescue Chevrons along fuselage
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 4.2), heliStripeMat);
    stripeL.position.set(-1.22, 1.45, 0);
    chopperGroup.add(stripeL);
    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 4.2), heliStripeMat);
    stripeR.position.set(1.22, 1.45, 0);
    chopperGroup.add(stripeR);

    // Aerodynamic Nose Cockpit Wedge
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.25, 2.2, 8), heliBodyMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 1.25, 3.6);
    nose.castShadow = true;
    chopperGroup.add(nose);

    // Cockpit Tinted Canopy Glass
    const cockpitGlass = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.2, 2.0), heliGlassMat);
    cockpitGlass.position.set(0, 1.85, 2.4);
    chopperGroup.add(cockpitGlass);

    // Engine Cowling / Doghouse on roof
    const engineDoghouse = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 3.2), heliMetalMat);
    engineDoghouse.position.set(0, 2.8, -0.4);
    chopperGroup.add(engineDoghouse);

    // Twin Turboshaft Exhaust Pipes
    const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.8, 8), heliMetalMat);
    exhaustL.position.set(-0.75, 2.7, -1.8);
    exhaustL.rotation.x = Math.PI / 3;
    chopperGroup.add(exhaustL);
    const exhaustR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.8, 8), heliMetalMat);
    exhaustR.position.set(0.75, 2.7, -1.8);
    exhaustR.rotation.x = Math.PI / 3;
    chopperGroup.add(exhaustR);

    // Landing Skids (Twin tubular steel runners)
    const skidGeo = new THREE.CylinderGeometry(0.075, 0.075, 6.2, 8);
    const skidL = new THREE.Mesh(skidGeo, heliMetalMat);
    skidL.rotation.x = Math.PI / 2;
    skidL.position.set(-1.35, 0.15, 0.2);
    skidL.castShadow = true;
    chopperGroup.add(skidL);

    const skidR = new THREE.Mesh(skidGeo, heliMetalMat);
    skidR.rotation.x = Math.PI / 2;
    skidR.position.set(1.35, 0.15, 0.2);
    skidR.castShadow = true;
    chopperGroup.add(skidR);

    // Skid Struts (Diagonal supports)
    [
      [-1.35, 0.15, 1.6],
      [-1.35, 0.15, -1.4],
      [1.35, 0.15, 1.6],
      [1.35, 0.15, -1.4],
    ].forEach(([sx, sy, sz]) => {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.75, 6), heliMetalMat);
      strut.position.set(sx * 0.75, sy + 0.35, sz);
      strut.rotation.z = sx < 0 ? -0.45 : 0.45;
      chopperGroup.add(strut);
    });

    // Rotor Mast & Swashplate Hub
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.95, 12), heliMetalMat);
    mast.position.set(0, 3.45, 0);
    chopperGroup.add(mast);

    // Main 4-Blade Rotor System (Rotates in update loop)
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 3.9, 0);

    const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8), heliMetalMat);
    rotorGroup.add(hubMesh);

    for (let b = 0; b < 4; b++) {
      const angle = (b * Math.PI) / 2;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.y = angle;

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 4.8), heliBladeMat);
      blade.position.set(0, 0, 2.5);
      bladeArm.add(blade);

      // Yellow Blade Tip
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.038, 0.6), heliStripeMat);
      tip.position.set(0, 0, 4.8);
      bladeArm.add(tip);

      rotorGroup.add(bladeArm);
    }
    chopperGroup.add(rotorGroup);
    this.chopperRotor = rotorGroup;

    // Tail Boom
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.62, 7.2, 8), heliBodyMat);
    tailBoom.rotation.x = -Math.PI / 2;
    tailBoom.position.set(0, 1.75, -5.8);
    tailBoom.castShadow = true;
    chopperGroup.add(tailBoom);

    // Vertical Stabilizer Fin
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 1.4), heliBodyMat);
    tailFin.position.set(0, 2.65, -9.2);
    tailFin.castShadow = true;
    chopperGroup.add(tailFin);

    // Horizontal Stabilizer Wing
    const hWing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.8), heliBodyMat);
    hWing.position.set(0, 1.9, -8.6);
    chopperGroup.add(hWing);

    // Tail Rotor (2 Blades, spinning rapidly)
    const tailRotorGroup = new THREE.Group();
    tailRotorGroup.position.set(0.25, 2.8, -9.2);

    const trHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 6), heliMetalMat);
    trHub.rotation.z = Math.PI / 2;
    tailRotorGroup.add(trHub);

    const trBlade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.03), heliBladeMat);
    tailRotorGroup.add(trBlade);

    chopperGroup.add(tailRotorGroup);
    this.chopperTailRotor = tailRotorGroup;

    // Avionics & Lighting
    // 1. High-intensity Nose Searchlight shining down onto Helipad
    const searchlight = new THREE.SpotLight(0xfef08a, 4.2, 28, Math.PI / 5, 0.4);
    searchlight.position.set(0, 0.8, 4.2);
    searchlight.target.position.set(0, -1.0, 9.0);
    chopperGroup.add(searchlight);
    chopperGroup.add(searchlight.target);

    // 2. Port (Left) Red Nav Light
    const navRed = new THREE.PointLight(0xef4444, 2.2, 6.0);
    navRed.position.set(-1.3, 1.6, 1.0);
    chopperGroup.add(navRed);

    // 3. Starboard (Right) Green Nav Light
    const navGreen = new THREE.PointLight(0x22c55e, 2.2, 6.0);
    navGreen.position.set(1.3, 1.6, 1.0);
    chopperGroup.add(navGreen);

    // 4. Tail White Flashing Anti-Collision Beacon
    const tailStrobe = new THREE.PointLight(0xffffff, 4.0, 12.0);
    tailStrobe.position.set(0, 3.8, -9.4);
    chopperGroup.add(tailStrobe);
    this.chopperStrobeLight = tailStrobe;

    // Interactive Chopper Extraction Trigger (Cabin Door)
    const doorTriggerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.2, 1.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    doorTriggerMesh.position.set(-1.4, 1.5, 0);
    chopperGroup.add(doorTriggerMesh);

    doorTriggerMesh.userData = {
      id: "chopper_extraction_door",
      title: "ගලවා ගැනීමේ හෙලිකොප්ටරය (Extraction Chopper-01)",
      titleEn: "Search & Rescue Helicopter (Chopper-01)",
      prompt: "[E] හෙලිකොප්ටරයට ගොඩවන්න (Board Chopper)",
      promptEn: "[E] Board Rescue Helicopter",
      action: () => {
        const hasAllEvidence = Boolean(
          this.tasks.diaryFound && this.tasks.keyFound && this.tasks.sampleFound
        );
        if (!hasAllEvidence) {
          this.cb.onNotify(
            this.lang === "en"
              ? "⚠️ Must secure all 3 expedition evidence items (Journal, Key, Specimen) before evacuating!"
              : "⚠️ ගලවා ගැනීමට පෙර සාක්ෂි 3ම (දිනපොත, යතුර, පර්යේෂණ සාම්පලය) ලබාගෙන තිබිය යුතුය!"
          );
          if (this.cb.onRadioTransmission) {
            this.cb.onRadioTransmission({
              id: "chopper_not_ready",
              speaker: "CHOPPER-01 PILOT",
              callsign: "RESCUE-01",
              text: "නිලධාරියා, මහාචාර්ය ඩග්ලස්ගේ සාක්ෂි 3ම සොයාගන්නා තුරු අපිට පිටත්විය නොහැකියි! ලෙන සහ ගංගාව පරීක්ෂා කරන්න!",
              textEn: "Officer, we cannot lift off without all 3 expedition clues! Locate Douglas's journal, key, and cavern specimen first!",
            });
          }
          return;
        }

        // Full Evacuation Success Sequence!
        this.tasks.helipadReached = true;
        this.playSfx("flare");
        this.playSfx("thunder");

        this.cb.onNotify(
          this.lang === "en"
            ? "🚁 All evidence secured! Boarded Chopper-01! Evacuating Sinharaja!"
            : "🚁 සාක්ෂි සියල්ල සුරක්ෂිතයි! Chopper-01 වෙත ගොඩවිය! සිංහරාජයෙන් ඉවතට!"
        );

        if (this.cb.onRadioTransmission) {
          this.cb.onRadioTransmission({
            id: "chopper_evac_success",
            speaker: "CHOPPER-01 PILOT",
            callsign: "RESCUE-01",
            text: "සාක්ෂි 3ම සුරක්ෂිතයි! නිලධාරියා යානයට ගොඩවුණා! පූර්ණ බලයෙන් ඉහළට නගිනවා... විශිෂ්ට මෙහෙයුමක් නිලධාරියා!",
            textEn: "All expedition evidence secured! Officer aboard Chopper-01! Full collective pitch up... Outstanding mission, officer! Sinharaja secrets preserved!",
          });
        }

        if (this.cb.onAchievementUnlocked) {
          this.cb.onAchievementUnlocked("chopper_evacuation", "සිංහරාජ ගලවාගැනීම (Apex Extraction)", "🚁");
        }

        setTimeout(() => {
          if (this.cb.onGameWon) {
            this.cb.onGameWon("hero");
          }
        }, 3200);
      },
    };

    this.scene.add(chopperGroup);
    this.chopperGroup = chopperGroup;
    this.interactableMeshes.push(doorTriggerMesh);

    // Towering Vertical Emergency Navigation Beacon Beam (Lit upon retrieving Evidence 03)
    const beamGeo = new THREE.CylinderGeometry(0.8, 2.6, 95, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beaconBeam = new THREE.Mesh(beamGeo, beamMat);
    beaconBeam.position.set(heliX, heliY + 47.5, heliZ);
    beaconBeam.visible = false;
    this.scene.add(beaconBeam);
    this.helipadBeaconBeam = beaconBeam;

    const beaconLightPulse = new THREE.PointLight(0xf59e0b, 0, 50.0);
    beaconLightPulse.position.set(heliX, heliY + 6.0, heliZ);
    this.scene.add(beaconLightPulse);
    this.helipadBeaconLight = beaconLightPulse;

    const crateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.85, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    crateMesh.position.set(heliX + 2.5, heliY + 0.6, heliZ + 2.5);
    crateMesh.castShadow = true;
    crateMesh.userData = {
      id: "kudawa_helipad_flare",
      title: "ගලවා ගැනීමේ හෙලිපෑඩ් සංඥා පද්ධතිය (Extraction Flare Crate)",
      titleEn: "Extraction Helipad Distress Flare Launcher",
      prompt: "[E] පරීක්ෂා කරන්න / සංඥා දල්වන්න",
      promptEn: "[E] Fire Extraction Signal Flare",
      action: () => {
        const hasAllEvidence = Boolean(
          this.tasks.diaryFound && this.tasks.keyFound && this.tasks.sampleFound
        );
        if (!hasAllEvidence) {
          this.cb.onNotify(
            this.lang === "en"
              ? "⚠️ Must collect all 3 evidence items (Journal, Key, Specimen) before calling extraction chopper!"
              : "⚠️ මෙහෙයුම අවසන් කිරීමට සාක්ෂි 3ම (දිනපොත, යතුර, සාම්පලය) ලබාගෙන තිබිය යුතුය!"
          );
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

          this.cb.onNotify(
            this.lang === "en"
              ? "🚀 Distress rocket fired high into the storm! Chopper-01 extraction inbound!"
              : "🚀 සංඥා රොකට්ටුව අහසට මුදා හැරියා! Chopper-01 ගලවා ගැනීමේ හෙලිකොප්ටරය පැමිණේ!"
          );

          if (this.cb.onRadioTransmission) {
            this.cb.onRadioTransmission({
              id: "chopper_incoming",
              speaker: "CHOPPER-01 PILOT",
              callsign: "CHOPPER-01",
              text: "රතු සංඥාව දුටුවා! කුණාටුව මැදින් අපි ගොඩබසිනවා... මහාචාර්ය ඩග්ලස්ගේ සියලු සාක්ෂි සුරක්ෂිතයි! විශිෂ්ට මෙහෙයුමක්!",
              textEn: "Red flare sighted through the storm! Descending on Kudawa ridge now... All of Douglas's expedition evidence secured! Outstanding mission, officer!",
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

    // ── P. Sri Lankan Green Pit Viper (Craspedocephalus trigonocephalus) [480, 750] ──
    const viperBranch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 5.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 })
    );
    const vbY = this.getTerrainHeight(480, 750) + 1.1;
    viperBranch.position.set(480, vbY, 750);
    viperBranch.rotation.z = 0.3;
    viperBranch.castShadow = true;
    this.scene.add(viperBranch);

    const viperGroup = new THREE.Group();
    viperGroup.position.set(480, vbY + 0.15, 750);

    const viperScaleMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.32,
      metalness: 0.18,
    });
    // Coiled muscular body segments
    const vCoil1 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.065, 10, 24), viperScaleMat);
    vCoil1.rotation.x = Math.PI / 2;
    vCoil1.castShadow = true;
    viperGroup.add(vCoil1);

    const vCoil2 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 10, 24), viperScaleMat);
    vCoil2.position.set(0.04, 0.07, -0.02);
    vCoil2.rotation.x = Math.PI / 2 + 0.18;
    vCoil2.castShadow = true;
    viperGroup.add(vCoil2);

    // Arched striking neck
    const vNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.26, 8), viperScaleMat);
    vNeck.position.set(0.16, 0.16, 0.12);
    vNeck.rotation.x = 0.45;
    vNeck.rotation.z = -0.35;
    viperGroup.add(vNeck);

    // Distinct triangular/heart-shaped pit viper head
    const vHeadMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.3,
      metalness: 0.15,
    });
    const vHeadGeo = new THREE.ConeGeometry(0.088, 0.22, 6);
    vHeadGeo.scale(1.25, 0.55, 1.0);
    const vHead = new THREE.Mesh(vHeadGeo, vHeadMat);
    vHead.position.set(0.24, 0.26, 0.22);
    vHead.rotation.x = Math.PI / 2;
    vHead.rotation.y = 0.35;
    vHead.castShadow = true;
    viperGroup.add(vHead);

    // Yellow-gold cat-slit eyes with black pupils
    const vEyeMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.35,
      roughness: 0.2,
    });
    [-0.07, 0.07].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), vEyeMat);
      eye.position.set(0.24 + side * 0.06, 0.28, 0.22 - side * 0.04);
      viperGroup.add(eye);
    });

    // Flickering dark red forked tongue
    const vTongueMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
    const vTongue = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.002, 0.14, 4), vTongueMat);
    vTongue.position.set(0.28, 0.25, 0.32);
    vTongue.rotation.x = Math.PI / 2;
    vTongue.rotation.y = 0.35;
    viperGroup.add(vTongue);
    this.viperTongue = vTongue;

    // Interaction trigger hit box
    const viperHitBox = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    viperHitBox.position.set(0.15, 0.18, 0.1);
    viperGroup.add(viperHitBox);

    viperHitBox.userData = {
      id: "viper_encounter",
      title: "පළා පොළඟා (Sri Lankan Green Pit Viper)",
      titleEn: "Sri Lankan Green Pit Viper (Craspedocephalus trigonocephalus)",
      prompt: "[E] පරීක්ෂා කරන්න",
      promptEn: "[E] Repel with Torch Beam",
      action: () => {
        if (this.torchOn) {
          this.playSfx("pickup");
          this.cb.onTriggerStory({
            title: "පළා පොළඟා පසුබැසීම",
            titleEn: "Green Pit Viper Repelled",
            text: "ඔබේ විදුලි පන්දමේ දීප්තිමත් ආලෝකයට බිය වූ පළා පොළඟා ගස් අතු අතරින් පසුබැස ගියා! මාවත දැන් ආරක්ෂිතයි.",
            textEn: "Blinded by the intense beam of your tactical flashlight, the venomous viper slithered back into the high canopy! The jungle trail is clear.",
            lore: {
              title: "පළා පොළඟා (Trimeresurus trigonocephalus)",
              titleEn: "Sri Lankan Green Pit Viper (Craspedocephalus trigonocephalus)",
              desc: "ශ්‍රී ලංකාවට ආවේණික තුරුලතා ආශ්‍රිත වෙසෙන විෂ සහිත අලංකාර සර්පයෙකි.",
              descEn: "Endemic arboreal pit viper inhabiting the moist lowland rainforests of Sri Lanka.",
            },
          });
          if (this.cb.onAchievementUnlocked) {
            this.cb.onAchievementUnlocked("viper_repelled", "පළා පොළඟාගේ පසුබැසීම (Snake Charmer)", "🐍");
          }
          this.scene.remove(viperGroup);
          const idx = this.interactableMeshes.indexOf(viperHitBox);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.activeCrosshairTarget = null;
        } else {
          this.health = Math.max(0, this.health - 25);
          this.sanity = Math.max(0, this.sanity - 20);
          this.bleeding = true;
          this.playSfx("hurt");
          this.cb.onNotify(
            this.lang === "en"
              ? "🐍 The viper struck in the pitch black! (Health -25). Keep your flashlight ON!"
              : "🐍 අඳුරේ සිටි පළා පොළඟා දෂ්ට කළා! (Health -25). විදුලි පන්දම දල්වන්න!"
          );
        }
      },
    };
    this.scene.add(viperGroup);
    this.viperModelGroup = viperGroup;
    this.interactableMeshes.push(viperHitBox);

    // ── P2. Sri Lankan Hump-nosed Pit Viper (Hypnale hypnale) [508, 772] ──
    const hnvY = this.getTerrainHeight(508, 772) + 0.15;
    const hnvLog = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, 3.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x2b1d0c, roughness: 0.94 })
    );
    hnvLog.position.set(508, hnvY, 772);
    hnvLog.rotation.z = Math.PI / 2 + 0.2;
    hnvLog.castShadow = true;
    this.scene.add(hnvLog);

    const hnvGroup = new THREE.Group();
    hnvGroup.position.set(508, hnvY + 0.22, 772);
    const hnvMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.65,
      metalness: 0.1,
    });
    const hnvCoil1 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.055, 8, 20), hnvMat);
    hnvCoil1.rotation.x = Math.PI / 2;
    hnvGroup.add(hnvCoil1);
    const hnvCoil2 = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 8, 16), hnvMat);
    hnvCoil2.position.set(0.02, 0.05, 0.02);
    hnvCoil2.rotation.x = Math.PI / 2;
    hnvGroup.add(hnvCoil2);

    // Distinct upturned hump-nosed snout
    const hnvHeadGeo = new THREE.ConeGeometry(0.065, 0.18, 5);
    hnvHeadGeo.scale(1.2, 0.6, 1.0);
    const hnvHead = new THREE.Mesh(hnvHeadGeo, hnvMat);
    hnvHead.position.set(0.12, 0.14, 0.12);
    hnvHead.rotation.x = Math.PI / 2;
    hnvHead.rotation.y = 0.25;
    hnvGroup.add(hnvHead);

    const hnvTongueMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 });
    const hnvTongue = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.001, 0.1, 4), hnvTongueMat);
    hnvTongue.position.set(0.16, 0.14, 0.2);
    hnvTongue.rotation.x = Math.PI / 2;
    hnvGroup.add(hnvTongue);
    this.humpnosedTongue = hnvTongue;

    const hnvHitBox = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hnvHitBox.position.set(0.08, 0.1, 0.08);
    hnvGroup.add(hnvHitBox);
    hnvHitBox.userData = {
      id: "humpnosed_viper_encounter",
      title: "කුරුඳු පොළඟා (Hump-nosed Pit Viper)",
      titleEn: "Sri Lankan Hump-nosed Pit Viper (Hypnale hypnale)",
      prompt: "[E] නිරීක්ෂණය කරන්න (Inspect Viper)",
      promptEn: "[E] Inspect Viper [Use Camera C to Photograph]",
      action: () => {
        this.playSfx("snake_hiss");
        this.cb.onNotify(
          this.lang === "en"
            ? "⚠️ Venomous Hump-nosed Viper spotted coiled on rotting trail wood! Equip Camera [C] to photograph."
            : "⚠️ කුණු වූ ලී කඳක් මත දඟර ගැසුණු කුරුඳු පොළඟා! කැමරාවෙන් [C] ඡායාරූපයක් ලබාගන්න."
        );
      },
    };
    this.scene.add(hnvGroup);
    this.humpnosedViperGroup = hnvGroup;
    this.interactableMeshes.push(hnvHitBox);

    // ── P3. Sri Lankan Leopard (Panthera pardus kotiya) on Elevated Bluff [485, 785] ──
    const lepBaseY = this.getTerrainHeight(485, 785);
    // Elevated Granite Promontory Rock Shelf
    const bluffGeo = new THREE.DodecahedronGeometry(4.8, 1);
    const bluffMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.95,
      metalness: 0.1,
    });
    const bluffMesh = new THREE.Mesh(bluffGeo, bluffMat);
    bluffMesh.position.set(485, lepBaseY + 2.2, 785);
    bluffMesh.scale.set(1.4, 0.85, 1.2);
    bluffMesh.castShadow = true;
    this.scene.add(bluffMesh);
    this.colliders.push({ type: "circle", x: 485, z: 785, radius: 4.2 });

    const leopardGroup = new THREE.Group();
    leopardGroup.position.set(485, lepBaseY + 4.2, 785);
    leopardGroup.rotation.y = -Math.PI / 3; // Facing toward main valley trail

    const lepFurMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Tawny Golden Yellow-Orange
      roughness: 0.78,
      metalness: 0.12,
    });
    const lepSpotMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Dark Charcoal Rosette markings
      roughness: 0.85,
    });
    const lepBellyMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7, // Pale Cream Underbelly
      roughness: 0.8,
    });

    // Muscular Feline Torso
    const lepTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 1.6, 12), lepFurMat);
    lepTorso.rotation.x = Math.PI / 2;
    lepTorso.castShadow = true;
    leopardGroup.add(lepTorso);

    // Cream Chest & Underbelly
    const lepBelly = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.3, 8), lepBellyMat);
    lepBelly.position.set(0, -0.06, 0);
    lepBelly.rotation.x = Math.PI / 2;
    leopardGroup.add(lepBelly);

    // Rosette spot clusters on body
    for (let s = -0.55; s <= 0.55; s += 0.22) {
      [-0.28, 0.28].forEach((side) => {
        const spot = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.02, 6, 8), lepSpotMat);
        spot.position.set(side, 0.08 + Math.random() * 0.1, s);
        spot.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        leopardGroup.add(spot);
      });
    }

    // Powerful Feline Shoulders & Haunches
    const lepShoulders = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), lepFurMat);
    lepShoulders.position.set(0, 0.05, 0.65);
    leopardGroup.add(lepShoulders);

    const lepHaunches = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), lepFurMat);
    lepHaunches.position.set(0, 0.08, -0.65);
    leopardGroup.add(lepHaunches);

    // Front Paws draped over rock ledge
    [-0.22, 0.22].forEach((xSide) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.8, 8), lepFurMat);
      leg.position.set(xSide, -0.38, 0.72);
      leg.rotation.x = 0.2;
      leopardGroup.add(leg);

      const paw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.22), lepFurMat);
      paw.position.set(xSide, -0.74, 0.82);
      leopardGroup.add(paw);
    });

    // Sculpted Feline Head
    const lepHeadGroup = new THREE.Group();
    lepHeadGroup.position.set(0, 0.28, 0.95);

    const lepHeadMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.38), lepFurMat);
    lepHeadMesh.castShadow = true;
    lepHeadGroup.add(lepHeadMesh);

    // Muzzle & Whiskers
    const lepMuzzle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.2), lepBellyMat);
    lepMuzzle.position.set(0, -0.06, 0.22);
    lepHeadGroup.add(lepMuzzle);

    const lepNose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.06), lepSpotMat);
    lepNose.position.set(0, -0.02, 0.31);
    lepHeadGroup.add(lepNose);

    // Rounded Feline Ears with Dark Rim
    [-0.14, 0.14].forEach((eSide) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 5), lepFurMat);
      ear.position.set(eSide, 0.18, -0.05);
      ear.rotation.z = eSide > 0 ? -0.2 : 0.2;
      lepHeadGroup.add(ear);
    });

    // Piercing Luminous Amber/Golden Eyes that catch torchlight!
    const lepEyeMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.75,
      roughness: 0.15,
    });
    [-0.09, 0.09].forEach((eyeSide) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), lepEyeMat);
      eye.position.set(eyeSide, 0.04, 0.2);
      lepHeadGroup.add(eye);

      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.038, 0.01), lepSpotMat);
      slit.position.set(eyeSide, 0.04, 0.225);
      lepHeadGroup.add(slit);
    });
    leopardGroup.add(lepHeadGroup);
    this.leopardHead = lepHeadGroup;

    // Graceful Long Spotted Feline Tail (curves down the rock shelf)
    const lepTail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.035, 1.35, 8), lepFurMat);
    lepTail.position.set(0, -0.2, -1.05);
    lepTail.rotation.x = -1.1;
    leopardGroup.add(lepTail);
    this.leopardTail = lepTail;

    // Leopard Interaction Hitbox
    const leopardHitBox = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    leopardHitBox.position.set(0, 0.2, 0.2);
    leopardGroup.add(leopardHitBox);

    leopardHitBox.userData = {
      id: "leopard_encounter",
      title: "ශ්‍රී ලංකා කොටියා (Sri Lankan Leopard)",
      titleEn: "Sri Lankan Leopard (Panthera pardus kotiya)",
      prompt: "[E] නිරීක්ෂණය කරන්න (Inspect Leopard)",
      promptEn: "[E] Observe Apex Predator [Camera C to Photograph]",
      action: () => {
        this.playSfx("leopard_growl");
        this.cb.onTriggerStory({
          title: "සිංහරාජයේ අග්‍රගන්‍ය විලෝපිකයා",
          titleEn: "Apex Predator of the Rainforest",
          text: "ගල් පර්වතය මත වැතිර සිටින ශ්‍රී ලංකා කොටියා (Panthera pardus kotiya) නිහඬව ඔබ දෙස බලා සිටියි. මොවුන් ආවේණික සතුන් වන අතර රාත්‍රී වැසි වනාන්තරයේ ප්‍රධාන විලෝපිකයා වේ. ඈත සිට කැමරාවෙන් [C] ඡායාරූපයක් ලබාගන්න!",
          textEn: "A majestic Sri Lankan Leopard (Panthera pardus kotiya) surveys the misty ravine from the granite promontory. As the apex predator of Sinharaja, it watches silently. Step back and capture a tactical photograph with [C]!",
          lore: {
            title: "ශ්‍රී ලංකා කොටියා (Panthera pardus kotiya)",
            titleEn: "Sri Lankan Leopard (Panthera pardus kotiya)",
            desc: "ශ්‍රී ලංකාවට ආවේණික දුර්ලභ දිවියන් විශේෂයකි. සිංහරාජයේ ඉහළ කඳු මුදුන් හා ගල් පර ආශ්‍රිතව වෙසෙයි.",
            descEn: "Strictly endemic subspecies of leopard, functioning as the apex terrestrial carnivore in Sinharaja rainforest.",
          },
        });
        if (this.cb.onAchievementUnlocked) {
          this.cb.onAchievementUnlocked("leopard_encounter", "සිංහරාජයේ රජු (Apex Predator)", "🐆");
        }
      },
    };
    this.scene.add(leopardGroup);
    this.leopardModelGroup = leopardGroup;
    this.interactableMeshes.push(leopardHitBox);

    // ── Q. 3 Distinct Authentic 3D Ceylon Blue Magpie Feathers (1/3, 2/3, 3/3) ──
    const spawnFeather = (fId, fX, fZ, labelEn, labelSi) => {
      const groundY = this.getTerrainHeight(fX, fZ) + 0.32;
      const fGroup = new THREE.Group();
      fGroup.position.set(fX, groundY, fZ);

      // Central ivory quill (rachis)
      const quillGeo = new THREE.CylinderGeometry(0.005, 0.001, 0.62, 8);
      const quillMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.35,
        metalness: 0.1,
      });
      const quillMesh = new THREE.Mesh(quillGeo, quillMat);
      quillMesh.position.y = 0.31;
      fGroup.add(quillMesh);

      // Curved electric royal-blue vanes
      const vaneMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        emissive: 0x1e40af,
        emissiveIntensity: 0.42,
        roughness: 0.45,
        side: THREE.DoubleSide,
      });

      const vaneShapeL = new THREE.Shape();
      vaneShapeL.moveTo(0, 0.08);
      vaneShapeL.quadraticCurveTo(-0.065, 0.28, -0.055, 0.45);
      vaneShapeL.quadraticCurveTo(-0.035, 0.58, 0, 0.62);
      vaneShapeL.lineTo(0, 0.08);
      const vaneMeshL = new THREE.Mesh(new THREE.ShapeGeometry(vaneShapeL), vaneMat);
      fGroup.add(vaneMeshL);

      const vaneShapeR = new THREE.Shape();
      vaneShapeR.moveTo(0, 0.08);
      vaneShapeR.quadraticCurveTo(0.055, 0.26, 0.045, 0.43);
      vaneShapeR.quadraticCurveTo(0.025, 0.56, 0, 0.62);
      vaneShapeR.lineTo(0, 0.08);
      const vaneMeshR = new THREE.Mesh(new THREE.ShapeGeometry(vaneShapeR), vaneMat);
      fGroup.add(vaneMeshR);

      // Characteristic white feather tip
      const tipShape = new THREE.Shape();
      tipShape.moveTo(-0.022, 0.52);
      tipShape.lineTo(0, 0.62);
      tipShape.lineTo(0.016, 0.52);
      tipShape.closePath();
      const tipMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
        roughness: 0.3,
      });
      const tipMesh = new THREE.Mesh(new THREE.ShapeGeometry(tipShape), tipMat);
      tipMesh.position.z = 0.001;
      fGroup.add(tipMesh);

      // Ethereal cyan particle glow aura
      const featherLight = new THREE.PointLight(0x38bdf8, 2.0, 4.5);
      featherLight.position.set(0, 0.32, 0);
      fGroup.add(featherLight);

      fGroup.rotation.x = Math.PI / 4;
      fGroup.rotation.z = Math.PI / 6;

      // Hit sphere for easy interaction
      const featherHit = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      featherHit.position.set(0, 0.3, 0);
      fGroup.add(featherHit);

      featherHit.userData = {
        id: fId,
        title: `${labelSi} (Ceylon Blue Magpie Feather)`,
        titleEn: `${labelEn} (Blue Magpie Sacred Feather)`,
        prompt: "[E] අහුලාගන්න (Pick Up)",
        promptEn: "[E] Pick Up Feather",
        action: () => {
          this.feathersCollected++;
          this.playSfx("pickup");
          this.scene.remove(fGroup);

          const idx = this.interactableMeshes.indexOf(featherHit);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          const fObjIdx = this.featherObjects.findIndex((item) => item.id === fId);
          if (fObjIdx >= 0) this.featherObjects.splice(fObjIdx, 1);
          this.activeCrosshairTarget = null;

          if (this.feathersCollected === 1) {
            this.cb.onNotify(
              this.lang === "en"
                ? "🪶 Collected Ceylon Blue Magpie Feather (1/3)! Search the forest trail for 2 more."
                : "🪶 නිල් කැහිබෙලි පිහාටුවක් හමුවිය (1/3)! තවත් පිහාටු 2ක් වනාන්තරයේ සොයන්න."
            );
          } else if (this.feathersCollected === 2) {
            this.cb.onNotify(
              this.lang === "en"
                ? "🪶 Collected Ceylon Blue Magpie Feather (2/3)! Just 1 more feather to awaken the sacred charm."
                : "🪶 නිල් කැහිබෙලි පිහාටුවක් හමුවිය (2/3)! තව 1ක් පමණක් ඉතිරිව ඇත."
            );
          } else {
            this.magpieCharmActive = true;
            this.player.speed = 6.25;
            this.playSfx("chime");
            this.cb.onNotify(
              this.lang === "en"
                ? "✨ All 3 Ceylon Blue Magpie Feathers Collected! Sacred Talisman Awakened (+25% Permanent Speed & Stamina)!"
                : "✨ නිල් කැහිබෙලි පිහාටු 3ම එකතු කර අවසන්! කැහිබෙලි ආමුදිතය සක්‍රීය විය (+25% වේගය සහ ශක්තිය)!"
            );
            if (this.cb.onAchievementUnlocked) {
              this.cb.onAchievementUnlocked(
                "magpie_charm",
                this.lang === "en" ? "Lucky Magpie Charm (All 3 Feathers)" : "කැහිබෙලි ආමුදිතය (පිහාටු 3ම සම්පූර්ණයි)",
                "🪶"
              );
            }
          }
        },
      };

      this.scene.add(fGroup);
      this.interactableMeshes.push(featherHit);
      this.featherObjects.push({
        id: fId,
        group: fGroup,
        baseY: groundY,
      });
      return fGroup;
    };

    // Spawn All 3 Sacred Blue Magpie Feathers across Chapter 1 Trail
    this.magpieFeatherGroup = spawnFeather("magpie_feather_1", 515, 780, "River Trail Feather (1/3)", "ගංගා මාවතේ පිහාටුව (1/3)");
    spawnFeather("magpie_feather_2", 482, 752, "Rock Ledge Feather (2/3)", "ගල් කුහරයේ පිහාටුව (2/3)");
    spawnFeather("magpie_feather_3", 503, 815, "Bamboo Hollow Feather (3/3)", "උණ පඳුරු මාවතේ පිහාටුව (3/3)");

    // ── Q2. Perched 3D Ceylon Blue Magpie Bird (Urocissa ornata) at [515, birdBaseY + 1.8, 780] ──
    const birdBaseY = this.getTerrainHeight(515, 780);
    const birdGroup = new THREE.Group();
    birdGroup.position.set(515, birdBaseY + 1.75, 780);

    // Mossy perch branch
    const birdBranch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 3.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x3f2d1d, roughness: 0.9 })
    );
    birdBranch.rotation.z = Math.PI / 2;
    birdBranch.rotation.y = 0.4;
    birdBranch.castShadow = true;
    birdGroup.add(birdBranch);

    const bird = new THREE.Group();
    bird.position.set(0, 0.22, 0);

    // Body (Rich Cobalt Royal Blue)
    const birdBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.48,
      metalness: 0.12,
    });
    const birdBodyGeo = new THREE.SphereGeometry(0.18, 16, 12);
    birdBodyGeo.scale(0.85, 0.85, 1.4);
    const birdBody = new THREE.Mesh(birdBodyGeo, birdBlueMat);
    birdBody.position.set(0, 0.14, 0);
    birdBody.rotation.x = -0.3;
    birdBody.castShadow = true;
    bird.add(birdBody);

    // Chestnut head & neck
    const chestnutMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.55,
    });
    const birdHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), chestnutMat);
    birdHead.position.set(0, 0.32, 0.22);
    birdHead.castShadow = true;
    bird.add(birdHead);
    this.magpieHead = birdHead;

    // Scarlet Crimson Beak
    const beakMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
    });
    const birdBeak = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.15, 8), beakMat);
    birdBeak.position.set(0, 0.31, 0.38);
    birdBeak.rotation.x = Math.PI / 2 + 0.15;
    birdBeak.castShadow = true;
    bird.add(birdBeak);

    // Dark bead eyes with scarlet orbital rings
    const bEyeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 });
    const bRingMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    [-0.09, 0.09].forEach((side) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 6, 12), bRingMat);
      ring.position.set(side, 0.33, 0.24);
      ring.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      bird.add(ring);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), bEyeMat);
      eye.position.set(side, 0.33, 0.24);
      bird.add(eye);
    });

    // Folded cobalt wings
    [-0.14, 0.14].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.42), birdBlueMat);
      wing.position.set(side, 0.14, -0.05);
      wing.rotation.x = -0.25;
      wing.rotation.z = side < 0 ? -0.1 : 0.1;
      wing.castShadow = true;
      bird.add(wing);
    });

    // Long stepped tail with white tip
    const bTailMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45 });
    const birdTail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.65), bTailMat);
    birdTail.position.set(0, 0.08, -0.42);
    birdTail.rotation.x = -0.55;
    birdTail.castShadow = true;
    bird.add(birdTail);
    this.magpieTail = birdTail;

    const bTailTipMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const birdTailTip = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.022, 0.14), bTailTipMat);
    birdTailTip.position.set(0, -0.06, -0.68);
    birdTailTip.rotation.x = -0.55;
    bird.add(birdTailTip);

    // Coral red legs and feet gripping branch
    const bLegMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    [-0.06, 0.06].forEach((side) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), bLegMat);
      leg.position.set(side, 0.02, 0.04);
      bird.add(leg);
    });

    birdGroup.add(bird);
    birdGroup.rotation.y = -0.6;
    this.scene.add(birdGroup);
    this.magpieBirdGroup = birdGroup;

    // ── Q3. Perched 3D Sri Lankan Purple-faced Langur (Semnopithecus vetulus) at [505, 765] ──
    const langurY = this.getTerrainHeight(505, 765) + 5.2;
    const langurGroup = new THREE.Group();
    langurGroup.position.set(505, langurY, 765);

    const langurBranch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 4.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 })
    );
    langurBranch.rotation.z = Math.PI / 2;
    langurBranch.rotation.y = 0.6;
    langurBranch.castShadow = true;
    langurGroup.add(langurBranch);

    const monkey = new THREE.Group();
    monkey.position.set(0, 0.25, 0);

    const furMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const mBody = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), furMat);
    mBody.scale.set(0.85, 1.25, 0.9);
    mBody.position.set(0, 0.35, 0);
    mBody.castShadow = true;
    monkey.add(mBody);

    const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), furMat);
    mHead.position.set(0, 0.75, 0.15);
    mHead.castShadow = true;
    monkey.add(mHead);

    // Prominent white facial whiskers / beard
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.7 });
    [-0.14, 0.14].forEach((side) => {
      const whiskers = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), beardMat);
      whiskers.scale.set(0.7, 1.2, 0.8);
      whiskers.position.set(side, 0.72, 0.22);
      monkey.add(whiskers);
    });

    // Dark face plate
    const mFaceMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6 });
    const mFace = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.06, 12), mFaceMat);
    mFace.position.set(0, 0.75, 0.28);
    mFace.rotation.x = Math.PI / 2;
    monkey.add(mFace);

    // Limbs gripping the branch
    [-0.2, 0.2].forEach((side) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.42, 6), furMat);
      arm.position.set(side, 0.22, 0.14);
      arm.rotation.x = 0.3;
      monkey.add(arm);

      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.45, 6), furMat);
      leg.position.set(side * 0.9, 0.18, -0.1);
      leg.rotation.x = -0.4;
      monkey.add(leg);
    });

    // Long dangling tail (1.1m) hanging into view
    const mTailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.25, -0.2),
      new THREE.Vector3(0.05, 0.0, -0.28),
      new THREE.Vector3(0.08, -0.4, -0.22),
      new THREE.Vector3(0.12, -0.85, -0.15),
      new THREE.Vector3(0.18, -1.1, -0.05),
    ]);
    const mTail = new THREE.Mesh(new THREE.TubeGeometry(mTailCurve, 16, 0.035, 6, false), furMat);
    mTail.castShadow = true;
    monkey.add(mTail);
    this.langurTail = mTail;

    langurGroup.add(monkey);
    langurGroup.rotation.y = 0.8;
    this.scene.add(langurGroup);
    this.langurModelGroup = langurGroup;
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
    // Escape handled globally (even when paused or in modal)
    if (e.key === "Escape") {
      if (this.cb.onEscapePress) {
        this.cb.onEscapePress();
        return;
      } else if (this.cb.onTogglePause) {
        this.cb.onTogglePause();
        return;
      }
    }

    // If a modal or paused, do not capture movement inputs
    if (this.paused) return;

    // Filter out if user is typing in an input or textarea
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea") return;

    // Start continuous procedural ambience on first player interaction
    if (!this.ambientStarted) {
      this.startContinuousAmbience();
    }

    if (e.key) this.keys[e.key.toLowerCase()] = true;
    if (e.code) this.keys[e.code] = true;

    // Space -> Leech removal if leeches/bleeding active; otherwise Jump
    if (e.code === "Space") {
      e.preventDefault();
      if (this.attachedLeeches > 0 || this.bleeding) {
        this.throwSalt();
      } else if (this.player.isGrounded && !this.player.isCrouching && this.player.stamina >= 8) {
        this.player.vy = 5.6; // Launch upward
        this.player.isGrounded = false;
        this.player.stamina = Math.max(0, this.player.stamina - 8);
        this.playSfx("jump");
      }
    }

    // Ctrl -> Toggle Crouch
    if (e.code === "ControlLeft" || e.code === "ControlRight") {
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

    // E -> Interact with Raycasted Object / Nearest Object
    if (e.key.toLowerCase() === "e") {
      this.interactNearest();
    }

    // C, P or 6 -> Field Wildlife Photography (Camera)
    if (e.key.toLowerCase() === "c" || e.code === "KeyC" || e.key.toLowerCase() === "p" || e.key === "6") {
      this.takePhoto();
    }

    // J -> Drink Ceylon Ginger Tea
    if (e.key.toLowerCase() === "j") {
      this.drinkGingerTea();
    }

    // H -> Heal Herb
    if (e.key.toLowerCase() === "h") {
      this.useHerb();
    }

    // Quick items
    if (e.key === "1") this.throwSalt();
    if (e.key === "2") this.useHerb();
    if (e.key === "3") this.toggleTorch();
    if (e.key === "4") this.interactNearest();
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
    // O -> Graphics Quality Preset Toggle (High -> Medium -> Low)
    if (e.key.toLowerCase() === "o") {
      this.cycleQuality();
    }
    // M -> Tactical Military GPS PDA Tablet
    if (e.key.toLowerCase() === "m" && this.cb.onToggleMap) {
      this.cb.onToggleMap();
    }
    // I or Tab -> Tactical Backpack Inventory Grid
    if ((e.key.toLowerCase() === "i" || e.code === "Tab") && this.cb.onToggleInventory) {
      e.preventDefault();
      this.cb.onToggleInventory();
    }
    // Escape is handled at the start of _onKeyDown
  }

  _onKeyUp(e) {
    if (e.key) this.keys[e.key.toLowerCase()] = false;
    if (e.code) this.keys[e.code] = false;
  }

  _onCanvasClick(e) {
    // Check if click was on modal or UI element above canvas
    if (this.paused) return;
    if (e.target !== this.canvas) return;

    // Start continuous procedural ambience on first player interaction
    if (!this.ambientStarted) {
      this.startContinuousAmbience();
    }

    if (document.pointerLockElement !== this.canvas) {
      this.requestPointerLock();
    } else {
      // Clicking while locked interacts with focused crosshair object or nearest item
      if (!this.interactTarget()) {
        this.interactNearest();
      }
    }
  }

  requestPointerLock() {
    this.controlsEngaged = true;
    if (this.canvas && this.canvas.requestPointerLock) {
      try {
        const res = this.canvas.requestPointerLock();
        if (res && typeof res.catch === "function") {
          res.catch(() => {});
        }
      } catch (err) {}
    }
  }

  exitPointerLock() {
    this.pointerLocked = false;
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch (err) {}
    }
  }

  _onPointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.canvas;
    if (this.pointerLocked) {
      this.controlsEngaged = true;
    }
    if (this.cb && this.cb.onPointerLockChange) {
      this.cb.onPointerLockChange(this.pointerLocked);
    }
  }

  _onPointerLockError() {
    this.pointerLocked = false;
    if (this.cb && this.cb.onPointerLockChange) {
      this.cb.onPointerLockChange(false);
    }
  }

  _onMouseMove(e) {
    if ((this.pointerLocked || this.controlsEngaged) && !this.paused) {
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
  setLang(lang) {
    this.lang = lang;
  }

  toggleCabinDoor() {
    this.kudawaDoorOpen = !this.kudawaDoorOpen;
    if (this.kudawaDoorOpen) {
      this.playSfx("door_open");
      this.cb.onNotify(
        this.lang === "en"
          ? "🚪 Opened Kudawa Outpost door. Rain echoes outside."
          : "🚪 කුඩව මුරපොළේ දොර විවෘත කළා. වර්ෂාව ඇතුළට ඇසෙයි."
      );
    } else {
      this.playSfx("door_close");
      this.cb.onNotify(
        this.lang === "en"
          ? "🚪 Closed Kudawa Outpost door."
          : "🚪 කුඩව මුරපොළේ දොර වැසුවා."
      );
    }
  }

  toggleTorch() {
    this.torchOn = !this.torchOn;
    this.updateFlashlight();
    this.playSfx("click");
    this.cb.onNotify(
      this.lang === "en"
        ? (this.torchOn ? "💡 Tactical Flashlight ON" : "🌑 Tactical Flashlight OFF")
        : (this.torchOn ? "💡 විදුලි පන්දම දැල්වීය (Flashlight ON)" : "🌑 විදුලි පන්දම නිවා දැමීය (Flashlight OFF)")
    );
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
    const label = this.lang === "en"
      ? (this.torchIntensity === 0.5 ? "Low (Conserve)" : this.torchIntensity === 1.0 ? "Medium (Tactical)" : "High (Turbo Beam)")
      : (this.torchIntensity === 0.5 ? "අඩු (Low)" : this.torchIntensity === 1.0 ? "මධ්‍යම (Medium)" : "උපරිම (High / Turbo)");
    this.cb.onNotify(
      this.lang === "en"
        ? `🔦 Flashlight Beam Intensity: ${label}`
        : `🔦 විදුලි පන්දමේ දීප්තිය: ${label}`
    );
  }

  updateFlashlight() {
    const isLit = Boolean(this.torchOn && this.battery > 0);
    if (!isLit) {
      if (this.flashlight) this.flashlight.visible = false;
      if (this.flashlightSpill) this.flashlightSpill.visible = false;
      if (this.volumetricBeam) this.volumetricBeam.visible = false;
      return;
    }
    if (this.flashlight) {
      this.flashlight.visible = true;
      const baseIntensity = this.uvMode ? 14.0 : 24.0;
      this.flashlight.intensity = baseIntensity * this.torchIntensity;
      this.flashlight.color.set(this.uvMode ? 0xa855f7 : 0xfffae6);
      this.flashlight.distance = this.uvMode ? 45 : (95 * Math.sqrt(this.torchIntensity));
    }
    if (this.flashlightSpill) {
      this.flashlightSpill.visible = true;
      this.flashlightSpill.intensity = (this.uvMode ? 2.8 : 4.5) * this.torchIntensity;
      this.flashlightSpill.color.set(this.uvMode ? 0x9333ea : 0xfff0d0);
    }
    if (this.volumetricBeam && this.volumetricUniforms) {
      this.volumetricBeam.visible = true;
      this.volumetricUniforms.uColor.value.set(this.uvMode ? 0xa855f7 : 0xfffae6);
      this.volumetricUniforms.uIntensity.value = (this.uvMode ? 0.09 : 0.16) * this.torchIntensity;
    }
  }

  interactTarget() {
    if (this.activeCrosshairTarget && this.activeCrosshairTarget.action) {
      const targetObj = this.activeCrosshairTarget.mesh || this.activeCrosshairTarget;
      const actionFn = this.activeCrosshairTarget.action;
      this.activeCrosshairTarget = null;
      actionFn(targetObj);
      return true;
    }
    return false;
  }

  interactNearest() {
    if (this.interactTarget()) {
      return true;
    }
    let closest = null;
    let closestDist = 4.2;
    const pPos = new THREE.Vector3(this.player.x, this.player.y, this.player.z);
    for (const mesh of this.interactableMeshes) {
      const wPos = new THREE.Vector3();
      mesh.getWorldPosition(wPos);
      const d = pPos.distanceTo(wPos);
      if (d < closestDist) {
        closestDist = d;
        closest = mesh;
      }
    }
    if (closest && closest.userData && closest.userData.action) {
      this.activeCrosshairTarget = null;
      closest.userData.action(closest);
      return true;
    }
    return false;
  }

  drinkGingerTea() {
    if (this.gingerTeaCount <= 0) {
      this.cb.onNotify(
        this.lang === "en"
          ? "⚠️ No Ginger Tea available!"
          : "⚠️ උණුසුම් ඉඟුරු තේ නොමැත!"
      );
      return;
    }
    this.gingerTeaCount--;
    this.teaBuffTimer = 120;
    this.sanity = Math.min(100, this.sanity + 30);
    this.health = Math.min(100, this.health + 15);
    this.player.stamina = 100;
    this.playSfx("heal");
    this.cb.onNotify(
      this.lang === "en"
        ? "☕ Drank Hot Ceylon Ginger Tea! Body warmed, sanity +30%!"
        : "☕ උණුසුම් ලංකා ඉඟුරු තේ පානය කළා! සිරුර උණුසුම් විය, Sanity +30%!"
    );
  }

  brewHerbalTea() {
    if (this.herbCount < 2) {
      this.cb.onNotify(
        this.lang === "en"
          ? "⚠️ Need at least 2 medicinal herbs to brew herbal tea!"
          : "⚠️ ඖෂධීය තේ සෑදීමට පැළෑටි අවම වශයෙන් 2ක් අවශ්‍යයි!"
      );
      return;
    }
    this.herbCount -= 2;
    this.gingerTeaCount = (this.gingerTeaCount || 0) + 1;
    this.playSfx("pickup");
    this.cb.onNotify(
      this.lang === "en"
        ? "🍵 Brewed herbal remedy tea! Added 1 Herbal Tea to supplies."
        : "🍵 ඖෂධීය පැළෑටි තම්බා තේ පිළියෙළ කළා! ඉඟුරු/ඖෂධීය තේ 1ක් එකතු විය."
    );
  }

  takePhoto() {
    this.playSfx("camera");
    if (this.cb.onPhotoCaptured) {
      const pPos = new THREE.Vector3(this.player.x, 0, this.player.z);
      let photoId = null;
      let photoTitle = null;
      let photoTitleEn = null;
      let photoDesc = null;
      let photoDescEn = null;
      let photoIcon = "Camera";
      let photoType = "forest";

      if (this.chapter === 3) {
        const distBats = pPos.distanceTo(new THREE.Vector3(120, 18, 420));
        const distMonolith = pPos.distanceTo(new THREE.Vector3(120, 8, 485));
        const distSlate = pPos.distanceTo(new THREE.Vector3(126, 11, 305));
        const distDoors = pPos.distanceTo(new THREE.Vector3(120, 16, 558));
        const distLizard3 = pPos.distanceTo(new THREE.Vector3(116, 16, 238));

        if (distMonolith < 22) {
          photoId = "ch3_monolith_photo";
          photoTitle = "අනුනාද ස්ඵටික කුලුන (Azure Resonance Monolith)";
          photoTitleEn = "Azure Resonance Monolith (Zone 4)";
          photoDesc = "භූගත ආකාශය ස්පර්ශ කරන මහා නිල් ස්ඵටික කුලුන.";
          photoDescEn = "Towering 12m subterranean crystal monolith radiating electromagnetic resonance.";
          photoIcon = "Orb";
          photoType = "crystal";
        } else if (distBats < 22) {
          photoId = "ch3_bats_photo";
          photoTitle = "ලෙන් වවුලන් රංචුව (Sinharaja Subterranean Bats)";
          photoTitleEn = "Sinharaja Subterranean Cave Bats";
          photoDesc = "ගුහා වියනෙහි එල්ලී සිටින ස්වදේශික ලෙන් වවුලන්.";
          photoDescEn = "Colony of native cave bats roosting under the limestone ceiling.";
          photoIcon = "Target";
          photoType = "bats";
        } else if (distSlate < 15) {
          photoId = "ch3_slate_photo";
          photoTitle = "පුරාණ සෙල්ලිපි පුවරුව (Ancient Inscription Slate)";
          photoTitleEn = "Ancient Inscription Slate (1987 Expedition)";
          photoDesc = "ලෙන් පර්යේෂණ මේසය මත තිබූ පුරාණ සෙල්ලිපි පුවරුව.";
          photoDescEn = "Ancient engraved slate recovered from the 1987 survey table.";
          photoIcon = "Scroll";
          photoType = "evidence";
        } else if (distDoors < 20) {
          photoId = "ch3_blastdoors_photo";
          photoTitle = "Sector 04 පිවිසුම් දොරටුව (Sector 04 Blast Doors)";
          photoTitleEn = "Sector 04 Blast Doors (The Forgotten Facility)";
          photoDesc = "1987 අමතක වූ පර්යේෂණාගාරයට පිවිසෙන දැවැන්ත වානේ දොරටුව.";
          photoDescEn = "Heavy reinforced military blast doors leading into The Forgotten Facility.";
          photoIcon = "Shield";
          photoType = "door";
        } else if (distLizard3 < 15) {
          photoId = "ch3_lizard_photo";
          photoTitle = "පිනුම් කටුස්සා (Kangaroo Lizard)";
          photoTitleEn = "Sri Lankan Kangaroo Lizard (Otocryptis wiegmanni)";
          photoDesc = "ගුහා පිවිසුම අසල ගල් මත සිටි ආවේණික පිනුම් කටුස්සා.";
          photoDescEn = "Endemic Kangaroo Lizard perched on mossy limestone near the cave mouth.";
          photoIcon = "Target";
          photoType = "lizard";
        }
      } else if (this.chapter === 2) {
        const distLizard = pPos.distanceTo(new THREE.Vector3(118, 0, 135));
        const distViper2 = pPos.distanceTo(new THREE.Vector3(165, 0, 145));
        const distFishingCat = pPos.distanceTo(new THREE.Vector3(150, 0, 210));
        const distWaterfall = pPos.distanceTo(new THREE.Vector3(198, 0, 245));
        const distMine = pPos.distanceTo(new THREE.Vector3(198, 0, 252));

        if (distFishingCat < 20) {
          photoId = "fishing_cat_photo";
          photoTitle = "හඳුන් දිවියා (Sri Lankan Fishing Cat)";
          photoTitleEn = "Sri Lankan Fishing Cat (Prionailurus viverrinus)";
          photoDesc = "ගල්ගඟ දියඇල්ල අසල මසුන් දඩයමේ යෙදෙන දුර්ලභ ආවේණික හඳුන් දිවියා.";
          photoDescEn = "Rare sighting of the nocturnal Sri Lankan Fishing Cat prowling along the spray-soaked Galganga river rapids.";
          photoIcon = "Target";
          photoType = "cat";
        } else if (distLizard < 18) {
          photoId = "kangaroo_lizard_photo";
          photoTitle = "පිනුම් කටුස්සා (Kangaroo Lizard)";
          photoTitleEn = "Sri Lankan Kangaroo Lizard (Otocryptis wiegmanni)";
          photoDesc = "ගස් කඳක් මත හිඳිමින් අනතුරු හඟවන ආවේණික පිනුම් කටුස්සා.";
          photoDescEn = "Endemic terrestrial lizard demonstrating its characteristic bipedal stance on a rainforest tree trunk.";
          photoIcon = "Shield";
          photoType = "lizard";
        } else if (distViper2 < 18) {
          photoId = "sawscaled_viper_photo";
          photoTitle = "වැලි පොළඟා (Saw-scaled Viper)";
          photoTitleEn = "Sri Lankan Saw-scaled Viper (Echis carinatus)";
          photoDesc = "වියළි ගල් කුහරයක දවටී සිටි මාරාන්තික විෂ සහිත වැලි පොළඟා.";
          photoDescEn = "Venomous saw-scaled viper coiled tightly in a shale rock crevice overlooking the cascade gorge.";
          photoIcon = "Shield";
          photoType = "viper";
        } else if (distWaterfall < 30) {
          photoId = "waterfall_photo";
          photoTitle = "ගල්ගඟ මහා දියඇල්ල (Galganga Cascade)";
          photoTitleEn = "The Great Galganga Cascade";
          photoDesc = "අඩි 80ක් උසින් පතිත වන මහා දියඇල්ල සහ මීදුම් අගාධය.";
          photoDescEn = "Majestic tropical waterfall plunging through steep jungle cliffs into a churning plunge pool.";
          photoIcon = "Camera";
          photoType = "waterfall";
        } else if (distMine < 22) {
          photoId = "mine_portal_photo";
          photoTitle = "පැරණි පතල් පිවිසුම (1894 Mine Shaft)";
          photoTitleEn = "Disused 1894 Graphite Mine Shaft";
          photoDesc = "දියඇල්ල පිටුපස සඟවා තිබූ බ්‍රිතාන්‍ය යුගයේ පැරණි මිනිරන් පතල.";
          photoDescEn = "Submerged 19th-century colonial graphite mine portal concealed behind the cascading water curtain.";
          photoIcon = "Door";
          photoType = "mine";
        } else {
          photoId = "gorge_mist_photo";
          photoTitle = "මීදුම් නිම්නය (The Mist Gorge)";
          photoTitleEn = "The Mist Gorge & Canyon";
          photoDesc = "සීතල ඝන මීදුමෙන් වැසුණු දියඇලි අගාධයේ පරිදර්ශනයක්.";
          photoDescEn = "Atmospheric panorama of the deep tropical gorge shrouded in cryogenic mist.";
          photoIcon = "Camera";
          photoType = "gorge";
        }
      } else {
        const distLeopard = pPos.distanceTo(new THREE.Vector3(485, 0, 785));
      const distViper = pPos.distanceTo(new THREE.Vector3(480, 0, 750));
      const distHumpnosed = pPos.distanceTo(new THREE.Vector3(508, 0, 772));
      const distMagpie = pPos.distanceTo(new THREE.Vector3(515, 0, 780));
      const distLangur = pPos.distanceTo(new THREE.Vector3(505, 0, 765));
      const distCave = pPos.distanceTo(new THREE.Vector3(495, 0, 840));
      const distOutpost = pPos.distanceTo(new THREE.Vector3(520, 0, 720));

      if (distLeopard < 24) {
        photoId = "leopard_photo";
        photoTitle = "ශ්‍රී ලංකා කොටියා (Sri Lankan Leopard)";
        photoTitleEn = "Sri Lankan Leopard (Panthera pardus kotiya)";
        photoDesc = "සිංහරාජයේ රජු වන දුර්ලභ ශ්‍රී ලංකා කොටියා ගල් පර්වතය මත වැතිර සිටින අතිශය දුර්ලභ ඡායාරූපයක්.";
        photoDescEn = "Rare high-resolution capture of the apex predator of Sinharaja, the elusive Sri Lankan Leopard, surveying its territory from the granite promontory.";
        photoIcon = "Target";
        photoType = "leopard";
      } else if (distViper < 18) {
        photoId = "viper_photo";
        photoTitle = "පළා පොළඟා (Green Pit Viper)";
        photoTitleEn = "Sri Lankan Green Pit Viper (Craspedocephalus trigonocephalus)";
        photoDesc = "ගස් අත්තක දවටී සිටි විෂකුරු පළා පොළඟාගේ පැහැදිලි ඡායාරූපයකි.";
        photoDescEn = "Rare close-up photograph of the endemic green pit viper coiled on a jungle branch with vertical slit eyes.";
        photoIcon = "Shield";
        photoType = "viper";
      } else if (distHumpnosed < 18) {
        photoId = "viper_photo";
        photoTitle = "කුරුඳු පොළඟා (Hump-nosed Pit Viper)";
        photoTitleEn = "Sri Lankan Hump-nosed Pit Viper (Hypnale hypnale)";
        photoDesc = "වියළි ලී කඳක් මත පරිපූර්ණ සැඟවුණු කුරුඳු පොළඟාගේ ඡායාරූපයකි.";
        photoDescEn = "Cryptic photograph of the venomous hump-nosed pit viper camouflaged across wet rainforest trail litter.";
        photoIcon = "Shield";
        photoType = "viper";
      } else if (distMagpie < 20) {
        photoId = "magpie_photo";
        photoTitle = "ශ්‍රී ලංකා කැහිබෙල්ලා (Ceylon Blue Magpie)";
        photoTitleEn = "Sri Lanka Blue Magpie (Urocissa ornata)";
        photoDesc = "සිංහරාජ වැසි වනාන්තර වියනේ සැරිසරන ආවේණික නිල් කැහිබෙල්ලා.";
        photoDescEn = "Vivid photograph of the rare endemic Ceylon Blue Magpie displaying brilliant cobalt plumage and crimson bill.";
        photoIcon = "Eye";
        photoType = "magpie";
      } else if (distLangur < 22) {
        photoId = "langur_photo";
        photoTitle = "ශ්‍රී ලංකා කලු වඳුරා (Purple-faced Langur)";
        photoTitleEn = "Purple-faced Langur (Semnopithecus vetulus)";
        photoDesc = "සිංහරාජයේ ගස් වියන් මුදුනේ වෙසෙන ආවේණික දුර්ලභ වඳුරු විශේෂයකි.";
        photoDescEn = "Endangered endemic arboreal langur with distinctive white facial whiskers perched high in the sub-canopy.";
        photoIcon = "Target";
        photoType = "langur";
      } else if (distCave < 24) {
        photoId = "cave_monolith_photo";
        photoTitle = "පුරාණ ලෙන් දොරටුව (Monolith Portal)";
        photoTitleEn = "Ancient Monolith Cavern Portal";
        photoDesc = "පුරාණ සංකේත කැටයම් සහිත දැවැන්ත කළුගල් දොරටුව.";
        photoDescEn = "Subterranean megalithic portal carved with forgotten ancient runes.";
        photoIcon = "Compass";
        photoType = "monolith";
      } else if (distOutpost < 25) {
        photoId = "kudawa_cabin_photo";
        photoTitle = "කුඩව මුරපොළ (Kudawa Outpost 01)";
        photoTitleEn = "Kudawa Forest Outpost Cabin";
        photoDesc = "1987 ගවේෂණ කණ්ඩායමේ අවසාන කඳවුර.";
        photoDescEn = "The last known civilian ranger shelter before deep uncharted rainforest.";
        photoIcon = "Shield";
        photoType = "outpost";
      } else {
        photoId = "wildlife_photo";
        photoTitle = "සිංහරාජ වැසි වනාන්තර පරිසරය (Rainforest Biome)";
        photoTitleEn = "Sinharaja Virgin Forest Biome";
        photoDesc = "ඝන සදාහරිත වැසි වනාන්තර වියන සහ මීදුම් නිම්නය.";
        photoDescEn = "Dense primary rainforest undergrowth shrouded in tropical storm mist.";
        photoIcon = "Camera";
        photoType = "forest";
      }
      }

      let snapshotUrl = null;
      try {
        this.renderer.render(this.scene, this.camera);
        snapshotUrl = this.renderer.domElement.toDataURL("image/jpeg", 0.88);
      } catch (e) {
        console.warn("Canvas snapshot generation failed", e);
      }

      const chosenTitle = this.lang === "en" ? photoTitleEn : photoTitle;
      const chosenDesc = this.lang === "en" ? photoDescEn : photoDesc;
      this.cb.onPhotoCaptured({
        id: photoId,
        name: chosenTitle,
        title: chosenTitle,
        titleEn: photoTitleEn,
        desc: chosenDesc,
        descEn: photoDescEn,
        date: "1987.11.14 // EXPEDITION",
        icon: photoIcon,
        illustrationType: photoType,
        snapshotUrl: snapshotUrl,
      });
    }
    this.cb.onNotify(
      this.lang === "en"
        ? "📸 Tactical photo captured and logged to expedition dossier!"
        : "📸 ඡායාරූපය ලබාගෙන ක්ෂේත්‍ර සාක්ෂි පොතට ඇතුළත් කළා!"
    );
  }

  toggleViewMode() {
    this.viewModeCinematic = !this.viewModeCinematic;
    this.camera.fov = this.viewModeCinematic ? 65 : 75;
    this.camera.updateProjectionMatrix();
    this.cb.onNotify(
      this.lang === "en"
        ? (this.viewModeCinematic ? "🎥 View Mode: Cinematic (65° FOV)" : "👁️ View Mode: Tactical Wide (75° FOV)")
        : (this.viewModeCinematic ? "🎥 දර්ශන මාදිලිය: සිනමාත්මක (65°)" : "👁️ දර්ශන මාදිලිය: පුළුල් (75°)")
    );
  }

  throwSalt() {
    if (this.saltCount <= 0) {
      this.cb.onNotify(
        this.lang === "en"
          ? "⚠️ Out of Salt! Search the Kudawa Outpost."
          : "⚠️ ලුණු කුඩු අවසන්! කඳවුරෙන් සොයාගන්න."
      );
      return;
    }
    this.saltCount--;
    this.playSfx("salt");
    if (this.attachedLeeches > 0 || this.bleeding) {
      this.attachedLeeches = 0;
      this.bleeding = false;
      this.cb.onNotify(
        this.lang === "en"
          ? "🧂 Sprinkled salt: Leeches detached and dropped off!"
          : "🧂 ලුණු කුඩු ඉසීමෙන් ලේ මැක්කන් ගැලවී ගියා!"
      );
    } else {
      this.cb.onNotify(
        this.lang === "en"
          ? "🧂 Dispersed defensive salt perimeter on muddy ground."
          : "🧂 ලුණු කුඩු අවට භූමියට ඉස්සා."
      );
    }
  }

  useHerb() {
    if (this.herbCount <= 0) {
      this.cb.onNotify(
        this.lang === "en"
          ? "⚠️ No medicinal herbs remaining!"
          : "⚠️ ඖෂධීය පැළෑටි නොමැත!"
      );
      return;
    }
    this.herbCount--;
    this.health = Math.min(100, this.health + 25);
    this.playSfx("heal");
    this.cb.onNotify(
      this.lang === "en"
        ? `🌿 Applied medicinal rainforest herb! Health: ${this.health}%`
        : `🌿 ඖෂධය භාවිතයෙන් සුවපත් විය! Health: ${this.health}%`
    );
  }

  useBalm() {
    if (this.balmCount <= 0) {
      this.cb.onNotify(
        this.lang === "en"
          ? "⚠️ Out of Leech Repellent Balm!"
          : "⚠️ ලේ මැක්කන් විකර්ෂක තෙල් අවසන්!"
      );
      return;
    }
    this.balmCount--;
    this.repellentTimer = 90;
    this.attachedLeeches = 0;
    this.bleeding = false;
    this.playSfx("balm");
    this.cb.onNotify(
      this.lang === "en"
        ? "🛡️ Applied Herbal Leech Repellent Balm! (Protected for 90s)"
        : "🛡️ ලේ මැක්කන් විකර්ෂක තෙල් ආලේප කළා! (තත්පර 90ක් ආරක්ෂිතයි)"
    );
  }

  crankDynamo() {
    if (this.battery >= 100) {
      this.cb.onNotify(
        this.lang === "en"
          ? "🔋 Flashlight battery fully charged (100%)."
          : "🔋 බැටරිය උපරිම මට්ටමේ පවතී (100%)."
      );
      return;
    }
    if (this.crankCooldown > 0) return;
    this.crankCooldown = 0.45;
    this.battery = Math.min(100, this.battery + 16);
    this.playSfx("step");
    this.noiseLevel = 75;
    this.updateFlashlight();
    this.cb.onNotify(
      this.lang === "en"
        ? "⚙️ Hand cranked dynamo: Battery recharged (+16%)!"
        : "⚙️ ඩයිනමෝ කරකවා බැටරිය ආරෝපණය කළා! (+16%)"
    );
  }

  toggleUv() {
    if (!this.uvUnlocked) {
      this.cb.onNotify(
        this.lang === "en"
          ? "⚠️ UV Lens Filter not yet found! (Inspect Kudawa workbench)"
          : "⚠️ UV පෙරහන තවමත් සොයාගෙන නැත! (කැබින් එක පරීක්ෂා කරන්න)"
      );
      return;
    }
    this.uvMode = !this.uvMode;
    this.playSfx("uv_toggle");
    if (this.uvMode) {
      this.flashlight.color.setHex(0xa855f7); // Ultraviolet phosphorescence
      this.cb.onNotify(
        this.lang === "en"
          ? "🟣 UV Blacklight Active: Hidden runes and bioluminescence visible."
          : "🟣 UV Blacklight සක්‍රියයි: සැඟවුණු සලකුණු පෙනෙනු ඇත."
      );
    } else {
      this.flashlight.color.setHex(0xfff8db); // Warm incandescent
      this.cb.onNotify(
        this.lang === "en"
          ? "💡 Standard incandescent torch beam active."
          : "💡 සාමාන්‍ය විදුලි පන්දම සක්‍රියයි."
      );
    }
    this.updateFlashlight();
  }

  // ── Physics, Collision, & Player Movement ─────────────────────────────────
  update(dt) {
    if (this.paused) return;
    this.elapsedTime += dt;
    this.gameClock = this.elapsedTime;

    if (this.chapter === 3) {
      this.updateChapter3(dt);
      return;
    }
    if (this.chapter === 2) {
      this.updateChapter2(dt);
      return;
    }

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
    if (this.keys["w"] || this.keys["arrowup"] || this.keys["KeyW"] || this.keys["ArrowUp"]) moveFwd += 1;
    if (this.keys["s"] || this.keys["arrowdown"] || this.keys["KeyS"] || this.keys["ArrowDown"]) moveFwd -= 1;
    if (this.keys["d"] || this.keys["arrowright"] || this.keys["KeyD"] || this.keys["ArrowRight"]) moveRgt += 1;
    if (this.keys["a"] || this.keys["arrowleft"] || this.keys["KeyA"] || this.keys["ArrowLeft"]) moveRgt -= 1;

    const isMoving = moveFwd !== 0 || moveRgt !== 0;
    this.player.isMoving = isMoving;

    // Sprinting handling with stamina drain
    const isSprint = (this.keys["shift"] || this.keys["ShiftLeft"] || this.keys["ShiftRight"]) && !this.player.isCrouching && this.player.stamina > 10;
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
      const fwdNorm = moveFwd / len;
      const rgtNorm = moveRgt / len;

      // Transform by Player Yaw
      // In Three.js: Forward direction is (-sin(yaw), 0, -cos(yaw)), Right is (cos(yaw), 0, -sin(yaw))
      const sinY = Math.sin(this.player.yaw);
      const cosY = Math.cos(this.player.yaw);
      const fwdX = -sinY;
      const fwdZ = -cosY;
      const rgtX = cosY;
      const rgtZ = -sinY;

      const worldDx = (fwdX * fwdNorm + rgtX * rgtNorm) * curSpeed * dt;
      const worldDz = (fwdZ * fwdNorm + rgtZ * rgtNorm) * curSpeed * dt;

      // Proposed horizontal positions
      let nextX = this.player.x + worldDx;
      let nextZ = this.player.z + worldDz;

      // ── Obstacle Collision Resolution & Smooth Sliding ──
      const pr = this.player.radius;
      for (let col of this.colliders) {
        if (col.isDoorBarrier && this.kudawaDoorOpen) continue; // Doorway is open!
        if (col.isGateBarrier && this.caveGateUnlocked) continue; // Cavern portal is open!

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

      // ── Strict Cavern Entrance Lockdown: Cannot bypass without unsealing the rune monolith ──
      if (!this.caveGateUnlocked && nextZ > 838.2) {
        nextZ = Math.min(nextZ, 838.2);
        if (this.elapsedTime - (this.lastGateWarningTime || 0) > 3.0) {
          this.lastGateWarningTime = this.elapsedTime;
          this.playSfx("hurt");
          this.cb.onNotify(
            this.lang === "en"
              ? "🔒 The monolithic cavern gate is sealed shut! You must solve the ancient rune cipher to pass."
              : "🔒 පුරාණ ලෙන් දොරටුව තදින් මුද්‍රා තබා ඇත! ඇතුළු වීමට ලෙන් රූන් අගුල විවෘත කළ යුතුය."
          );
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

    // Update Camera Position & Rotation with Subtle Head Bob & Camera Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShake > 0.001) {
      shakeX = (Math.random() - 0.5) * this.cameraShake * 0.14;
      shakeY = (Math.random() - 0.5) * this.cameraShake * 0.14;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 0.85);
    }
    const bobOffset = (isMoving && this.player.isGrounded) ? Math.sin(this.headBob) * 0.045 : 0;
    this.camera.position.set(this.player.x + shakeX, this.player.y + bobOffset + shakeY, this.player.z);
    this.camera.rotation.y = this.player.yaw + shakeX * 0.4;
    this.camera.rotation.x = this.player.pitch + shakeY * 0.4;

    // ── Update Tactical Flashlight & Hand-Held Torch Sway ──
    if (this.flashlight) {
      const isLit = Boolean(this.torchOn && this.battery > 0);
      this.flashlight.visible = isLit;
      if (this.flashlightSpill) this.flashlightSpill.visible = isLit;
      if (this.volumetricBeam) this.volumetricBeam.visible = isLit;
    }

    // Dynamic rain ripples in reflective puddles
    if (this.puddles && this.puddles.length > 0) {
      for (let i = 0; i < this.puddles.length; i++) {
        const p = this.puddles[i];
        if (p.material) {
          p.material.roughness = 0.04 + Math.sin(this.elapsedTime * 3.5 + i * 1.5) * 0.02;
        }
      }
    }

    // Dynamic Antique Brass Key Floating & Beacon Glow Pulse
    if (this.keyGroup && !this.tasks.keyFound) {
      this.keyGroup.rotation.y += dt * 1.5;
      this.keyGroup.position.y = this.keyBaseY + Math.sin(this.elapsedTime * 2.5) * 0.08;
      if (this.keyLight) {
        this.keyLight.intensity = 2.4 + Math.sin(this.elapsedTime * 3.2) * 0.6;
      }
    }

    // 🪶 Dynamic 3D Blue Magpie Feathers Hover & Spin Animation
    for (const fItem of this.featherObjects) {
      if (fItem.group) {
        fItem.group.rotation.y += dt * 0.95;
        fItem.group.position.y = fItem.baseY + Math.sin(this.elapsedTime * 2.6) * 0.07;
      }
    }

    // 🐦 Dynamic Ceylon Blue Magpie Idle Movement
    if (this.magpieHead) {
      this.magpieHead.rotation.y = Math.sin(this.elapsedTime * 1.6) * 0.35;
    }
    if (this.magpieTail) {
      this.magpieTail.rotation.x = -0.55 + Math.sin(this.elapsedTime * 2.2) * 0.05;
    }

    // 🐆 Dynamic Sri Lankan Leopard Feline Movement & Audio Reaction
    const distToLeopard = Math.hypot(this.player.x - 485, this.player.z - 785);
    if (this.leopardGroup) {
      // Subtle rhythmic breathing
      const breath = 1.0 + Math.sin(this.elapsedTime * 1.8) * 0.025;
      this.leopardGroup.scale.set(1.0, breath, 1.0);

      // Tail swish
      if (this.leopardTail) {
        this.leopardTail.rotation.z = Math.sin(this.elapsedTime * 1.4) * 0.12;
      }

      // Head tracking toward player if within 25 meters
      if (this.leopardHead && distToLeopard < 25) {
        const targetAngle = Math.atan2(this.player.x - 485, this.player.z - 785) - this.leopardGroup.rotation.y;
        this.leopardHead.rotation.y = THREE.MathUtils.clamp(targetAngle, -0.7, 0.7);

        // Low predator growl if player approaches within 13 meters
        if (distToLeopard < 13 && this.elapsedTime - this.lastLeopardGrowlTime > 14.0) {
          this.lastLeopardGrowlTime = this.elapsedTime;
          this.playSfx("leopard_growl");
        }
      }
    }

    // 🐆 Leopard Proximity Attack (inflicts heavy slashing damage if within 4.8m)
    if (distToLeopard < 4.8) {
      if (this.elapsedTime - this.lastLeopardStrikeTime > 3.2) {
        this.lastLeopardStrikeTime = this.elapsedTime;
        this.health = Math.max(10, this.health - 22);
        this.sanity = Math.max(10, this.sanity - 18);
        this.bleeding = true;
        this.cameraShake = 1.25;
        this.playSfx("hurt");
        this.playSfx("leopard_growl");
        this.cb.onNotify(
          this.lang === "en"
            ? "🐆 The Sri Lankan Leopard lashed out with its claws! (-22 HP) Retreat immediately!"
            : "🐆 ශ්‍රී ලංකා කොටියා පහර දුන්නා! (-22 HP) වහාම ඈතට යන්න!"
        );
      }
    }

    // 🐍 Dynamic Green Pit Viper Tongue Flick & Warning Hiss
    const distToViper = Math.hypot(this.player.x - 480, this.player.z - 750);
    if (this.viperTongue) {
      const flick = Math.sin(this.elapsedTime * 8.0);
      this.viperTongue.scale.z = flick > 0.7 ? 1.6 : 0.4;
      this.viperTongue.visible = flick > 0.3;
    }
    if (distToViper < 9.0 && this.elapsedTime - this.lastViperHissTime > 10.0) {
      this.lastViperHissTime = this.elapsedTime;
      this.playSfx("snake_hiss");
    }

    // 🐍 Green Pit Viper Proximity Attack (Strikes in the dark if within 3.2m without flashlight)
    if (this.viperModelGroup && distToViper < 3.2) {
      if (!this.torchOn) {
        if (this.elapsedTime - this.lastViperStrikeTime > 2.8) {
          this.lastViperStrikeTime = this.elapsedTime;
          this.health = Math.max(10, this.health - 16);
          this.sanity = Math.max(10, this.sanity - 12);
          this.bleeding = true;
          this.cameraShake = 0.85;
          this.playSfx("hurt");
          this.playSfx("snake_hiss");
          this.cb.onNotify(
            this.lang === "en"
              ? "🐍 The Green Pit Viper struck in the dark! (-16 HP) Keep flashlight ON!"
              : "🐍 අඳුරේ සිටි පළා පොළඟා දෂ්ට කළා! (-16 HP) විදුලි පන්දම දල්වන්න!"
          );
        }
      }
    }

    // 🐍 Dynamic Hump-nosed Pit Viper Tongue Flick & Proximity Attack
    const distToHnv = Math.hypot(this.player.x - 508, this.player.z - 772);
    if (this.humpnosedTongue) {
      const flickHnv = Math.sin(this.elapsedTime * 9.0);
      this.humpnosedTongue.scale.z = flickHnv > 0.65 ? 1.4 : 0.3;
      this.humpnosedTongue.visible = flickHnv > 0.35;
    }
    if (distToHnv < 2.8) {
      if (!this.torchOn) {
        if (this.elapsedTime - this.lastHnvStrikeTime > 2.8) {
          this.lastHnvStrikeTime = this.elapsedTime;
          this.health = Math.max(10, this.health - 14);
          this.sanity = Math.max(10, this.sanity - 10);
          this.bleeding = true;
          this.cameraShake = 0.75;
          this.playSfx("hurt");
          this.playSfx("snake_hiss");
          this.cb.onNotify(
            this.lang === "en"
              ? "🐍 Hump-nosed Viper struck from the wet log! (-14 HP) Back away!"
              : "🐍 කුණකටුවා ලී කොටයෙන් දෂ්ට කළා! (-14 HP) ඈතට යන්න!"
          );
        }
      }
    }

    // 💚 Safe Distance Proximity Health & Sanity Regeneration Away from Dangerous Animals
    const isNearDangerousFauna =
      (Boolean(this.viperModelGroup) && distToViper < 6.8) ||
      (distToHnv < 6.5) ||
      (distToLeopard < 7.2);

    if (!isNearDangerousFauna && this.attachedLeeches === 0) {
      if (this.health < 100) {
        this.health = Math.min(100, this.health + dt * 4.5);
        if (this.bleeding) {
          this.safeHealingTimer += dt;
          if (this.safeHealingTimer > 2.5) {
            this.bleeding = false;
            this.safeHealingTimer = 0;
          }
        }
        if (this.elapsedTime - this.lastHealNotifyTime > 9.0 && this.health < 85) {
          this.lastHealNotifyTime = this.elapsedTime;
          this.cb.onNotify(
            this.lang === "en"
              ? "🌿 Outside predator strike zone — wounds stabilizing & health recovering! (+HP/s)"
              : "🌿 දරුණු සතුන්ගෙන් ඈත් විය — තුවාල සුවවෙමින් සෞඛ්‍යය වර්ධනය වේ! (+HP/s)"
          );
        }
      }
      if (this.sanity < 100) {
        this.sanity = Math.min(100, this.sanity + dt * 3.0);
      }
    } else {
      this.safeHealingTimer = 0;
    }

    // 🐒 Dynamic Purple-faced Langur Tail Sway
    if (this.langurTail) {
      this.langurTail.rotation.z = Math.sin(this.elapsedTime * 1.4) * 0.08;
    }

    // 🚁 Animated Search & Rescue Helicopter Rotors & Avionics
    if (this.chopperRotor) {
      this.chopperRotor.rotation.y += dt * 18.0;
    }
    if (this.chopperTailRotor) {
      this.chopperTailRotor.rotation.z += dt * 28.0;
    }
    if (this.chopperStrobeLight) {
      this.chopperStrobeLight.intensity = Math.sin(this.elapsedTime * 8.0) > 0.4 ? 4.5 : 0.0;
    }

    // 🚨 Emergency Extraction Helipad Beacon Beam Pulse
    if (this.helipadBeaconBeam && this.helipadBeaconBeam.visible) {
      if (this.helipadBeaconLight) {
        this.helipadBeaconLight.intensity = 5.0 + Math.sin(this.elapsedTime * 4.0) * 2.0;
      }
    }

    if (this.torchGroup) {
      this.torchLag.yaw += (this.player.yaw - this.torchLag.yaw) * Math.min(1.0, dt * 16);
      this.torchLag.pitch += (this.player.pitch - this.torchLag.pitch) * Math.min(1.0, dt * 16);

      const sinY = Math.sin(this.torchLag.yaw);
      const cosY = Math.cos(this.torchLag.yaw);
      const bobX = Math.cos(this.headBob * 0.5) * 0.02;

      // In Three.js, camera forward is (-sin(yaw), 0, -cos(yaw)), right is (cos(yaw), 0, -sin(yaw))
      const forwardX = -sinY;
      const forwardZ = -cosY;
      const rightX = cosY;
      const rightZ = -sinY;

      const worldTorchX = this.player.x + rightX * (0.24 + bobX) + forwardX * 0.22;
      const worldTorchY = this.player.y + bobOffset - 0.20;
      const worldTorchZ = this.player.z + rightZ * (0.24 + bobX) + forwardZ * 0.22;

      this.torchGroup.position.set(worldTorchX, worldTorchY, worldTorchZ);
      this.torchGroup.rotation.order = "YXZ";
      this.torchGroup.rotation.y = this.torchLag.yaw;
      this.torchGroup.rotation.x = this.torchLag.pitch;
    }

    // ── Dynamic Foliage Wind Movement ──
    if (this.fernMesh && this.quality !== "low" && this.fernBaseMatrices && this.fernBaseMatrices.length > 0) {
      const windSpeed = this.stormActive ? 3.4 : 1.8;
      const tempMatrix = new THREE.Matrix4();
      const tempPos = new THREE.Vector3();
      const tempRot = new THREE.Quaternion();
      const tempScale = new THREE.Vector3();
      const tempEuler = new THREE.Euler();

      const maxFerns = Math.min(this.fernMesh.count, 60);
      for (let i = 0; i < maxFerns; i++) {
        tempMatrix.copy(this.fernBaseMatrices[i]);
        tempMatrix.decompose(tempPos, tempRot, tempScale);
        tempEuler.setFromQuaternion(tempRot, "YXZ");
        const sway = Math.sin(this.elapsedTime * windSpeed + tempPos.x * 0.15 + tempPos.z * 0.15) * 0.06;
        tempEuler.x += sway;
        tempRot.setFromEuler(tempEuler);
        tempMatrix.compose(tempPos, tempRot, tempScale);
        this.fernMesh.setMatrixAt(i, tempMatrix);
      }
      this.fernMesh.instanceMatrix.needsUpdate = true;
    }

    // ── Continuous Web Audio Spatial Ambience ──
    this.updateAmbience(dt);

    // ── Sinharaja Endemic Tree Frogs Periodic Croaks ──
    if (!this.player.inShelter && this.quality !== "low") {
      this.frogTimer += dt;
      if (this.frogTimer >= this.nextFrogTime) {
        this.frogTimer = 0;
        this.nextFrogTime = 4.5 + Math.random() * 5.0;
        this.playEndemicFrogCroak();
      }
    }

    // ── Dynamic Thunderstorm & Sheet Lightning Cycle ──
    this.lightningTimer += dt;
    if (this.lightningTimer >= this.nextLightningTime) {
      this.lightningTimer = 0;
      this.nextLightningTime = this.stormActive ? (16 + Math.random() * 12) : (26 + Math.random() * 18);
      this.triggerLightningStrike();
    }

    if (this.lightningActive) {
      this.lightningFlashTimer += dt;
      if (this.lightningFlashTimer < 0.07) {
        this.moonLight.intensity = 3.6;
        this.ambientLight.intensity = 1.6;
      } else if (this.lightningFlashTimer < 0.12) {
        this.moonLight.intensity = 0.45;
        this.ambientLight.intensity = 0.44;
      } else if (this.lightningFlashTimer < 0.24) {
        this.moonLight.intensity = 4.2;
        this.ambientLight.intensity = 2.0;
      } else {
        this.lightningActive = false;
        this.moonLight.intensity = 1.35;
        this.ambientLight.intensity = 1.15;
        if (this.hemiLight) this.hemiLight.intensity = 1.25;
      }
    }

    // Update Rain Particles
    if (this.rainParticles) {
      const pos = this.rainParticles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= dt * 28;
        if (pos[i] < 0) pos[i] = 25;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // ── 3D Center Crosshair Raycasting & Intelligent Proximity Assist ──
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactableMeshes, true);
    let targetMesh = null;
    let targetUd = null;

    if (intersects.length > 0 && intersects[0].distance < 4.8) {
      let hitObj = intersects[0].object;
      while (hitObj && !hitObj.userData?.action && hitObj.parent && hitObj.parent !== this.scene) {
        hitObj = hitObj.parent;
      }
      if (hitObj && hitObj.userData && hitObj.userData.action) {
        targetMesh = hitObj;
        targetUd = hitObj.userData;
      }
    }

    // Proximity Assist Fallback: within 3.6m and looking generally towards an interactable object
    if (!targetMesh) {
      let closestObj = null;
      let closestDist = 3.6;
      const camPos = this.camera.position;
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);

      for (const m of this.interactableMeshes) {
        if (!m || !m.userData || !m.userData.action) continue;
        const wPos = new THREE.Vector3();
        m.getWorldPosition(wPos);
        const toObj = wPos.clone().sub(camPos);
        const d = toObj.length();
        if (d < closestDist) {
          toObj.normalize();
          const dot = camDir.dot(toObj);
          if (dot > 0.35) { // Looking within ~69 degrees of target
            closestDist = d;
            closestObj = m;
          }
        }
      }

      if (closestObj) {
        targetMesh = closestObj;
        targetUd = closestObj.userData;
      }
    }

    if (targetMesh && targetUd) {
      const pmt = typeof targetUd.prompt === "function" ? targetUd.prompt() : (this.lang === "en" ? (targetUd.promptEn || targetUd.prompt) : targetUd.prompt);
      this.activeCrosshairTarget = {
        ...targetUd,
        mesh: targetMesh,
        userData: targetUd,
        title: this.lang === "en" ? (targetUd.titleEn || targetUd.title) : targetUd.title,
        prompt: pmt,
        action: targetUd.action,
      };
    } else {
      this.activeCrosshairTarget = null;
    }

    // Periodic Stats Reporting to React HUD (15 Hz)
    this.dispatchStatsUpdate(dt);
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
    if (window.sinharaja3D === this) delete window.sinharaja3D;

    // Clean up all DOM and Window Listeners
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    this.canvas.removeEventListener("click", this._onCanvasClick);
    document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    document.removeEventListener("pointerlockerror", this._onPointerLockError);
    window.removeEventListener("mousemove", this._onMouseMove);
    this.canvas.removeEventListener("wheel", this._onWheel);

    try {
      if (this.rainNoise) { this.rainNoise.stop(); this.rainNoise.disconnect(); }
      if (this.cicadaCarrier) { this.cicadaCarrier.stop(); this.cicadaCarrier.disconnect(); }
      if (this.cicadaLfo) { this.cicadaLfo.stop(); this.cicadaLfo.disconnect(); }
      if (this.radioNoise) { this.radioNoise.stop(); this.radioNoise.disconnect(); }
      if (this.riverNoise) { this.riverNoise.stop(); this.riverNoise.disconnect(); }
      if (this.caveDroneOsc) { this.caveDroneOsc.stop(); this.caveDroneOsc.disconnect(); }
    } catch (e) {}

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
