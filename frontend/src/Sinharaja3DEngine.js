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
    this.lang = this.cb.lang || "si";
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
    this.controlsEngaged = false;
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
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. 3D Scene & Sinharaja Nocturnal Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#05120a");
    this.scene.fog = new THREE.FogExp2("#071a10", 0.0075);

    // 3. True Perspective Camera
    this.camera = new THREE.PerspectiveCamera(74, width / height, 0.1, 800);
    this.camera.position.set(this.player.x, this.player.y, this.player.z);
    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);

    // 4. Raycaster for Precise Crosshair Targeting from Center Screen (0, 0)
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 7.5; // Max 7.5m interaction reach
    this.centerScreen = new THREE.Vector2(0, 0);

    // 5. Environmental Lighting (Nocturnal Rain Forest)
    // Deep nocturnal ambient green-blue to maintain accessibility and visibility (Project I.G.I. clarity)
    this.ambientLight = new THREE.AmbientLight(0x163827, 0.72);
    this.scene.add(this.ambientLight);

    // Moonlight rim directional light piercing through canopy
    this.moonLight = new THREE.DirectionalLight(0x7dd3fc, 0.70);
    this.moonLight.position.set(450, 220, 600);
    this.scene.add(this.moonLight);

    // Outpost porch kerosene lantern (warm welcoming amber light)
    const porchLantern = new THREE.PointLight(0xf59e0b, 2.4, 16, 1.8);
    porchLantern.position.set(527.5, 2.7, 728.5);
    this.scene.add(porchLantern);

    // 6. Tactical Flashlight System (High-Intensity Spot + Soft Foreground Fill Spill)
    this.torchGroup = new THREE.Object3D();

    // Primary Focused Beam (Natural SpotLight with smooth penumbra - zero artificial cones)
    this.flashlight = new THREE.SpotLight(0xfff4d6, 7.5, 65, Math.PI / 4.4, 0.68, 1.65);
    this.flashlight.position.set(0, 0, 0);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.camera.near = 0.2;
    this.flashlight.shadow.camera.far = 65;
    this.flashlight.shadow.bias = -0.0004;
    this.flashlight.shadow.normalBias = 0.05;

    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -25);
    this.torchGroup.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.torchGroup.add(this.flashlight);

    // Secondary Soft Foreground Spill Light (prevents pitch-black claustrophobia around feet)
    this.flashlightSpill = new THREE.SpotLight(0xfff4d6, 1.4, 20, Math.PI / 2.2, 0.92, 2.0);
    this.flashlightSpill.position.set(0, 0, 0);
    this.flashlightSpill.target = this.flashlightTarget;
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
    dCtx.fillStyle = "#162215";
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

  // ── Build Kudawa Outpost 3D World (Chapter 1) ─────────────────────────────
  build3DWorld() {
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
      roughness: 0.82,
      metalness: 0.12,
      color: 0xa0b298,
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
            text: "'ආයුබෝවන් මහත්තයා! මම මේ අවුරුදු 40ක් තිස්සේ සිංහරාජයේ රස්සාව කරපු ගුණදාස. 1987 මහා වැස්සේ මහාචාර්ය ඩග්ලස් මේ කැබින් එකෙන් පිටත් වුණේ ලෙන් දොරටුව දෙසට. මම ලුණු කුඩුයි, බෙහෙත් තෙලුයි, ඖෂධ පැළෑටියි දුන්නා. කූඩැල්ලන්ගෙන් පරිස්සම් වෙන්න!'",
            textEn: "'Greetings officer! I am Gunadasa, 40 years guarding Sinharaja forest. Back in the torrential tempest of 1987, Professor Douglas set out from this outpost toward the monolith cave portal. Take this salt pouch, herbal balm, and wild medicinal herbs. Beware the leeches in the muddy hollows!'",
            speaker: "OLD RANGER GUNADASA",
            speakerEn: "OLD RANGER GUNADASA",
            avatar: "ranger",
          });
        } else {
          this.cb.onNotify(
            this.lang === "en"
              ? "🧙‍♂️ Ranger Gunadasa: 'Officer, study Douglas's tape reel on the workbench, take the supplies, and head for the river!'"
              : "🧙‍♂️ ගුණදාස මාමා: 'මහත්තයා, මහාචාර්යවරයාගේ හඬ පටය මේසේ උඩ තියෙනවා. ඒක පරීක්ෂා කරලා කැලේට බහින්න!'"
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
      titleEn: "Bioluminescent Flora Sample (Evidence 03)",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      promptEn: "[E] Collect Research Sample",
      action: () => {
        if (!this.tasks.sampleFound) {
          this.hasSample = true;
          this.tasks.sampleFound = true;
          this.playSfx("pickup");
          this.scene.remove(sampleVial);
          this.scene.remove(sampleLight);
          const idx = this.interactableMeshes.indexOf(sampleVial);
          if (idx >= 0) this.interactableMeshes.splice(idx, 1);
          this.activeCrosshairTarget = null;
          if (this.cb.onRadioTransmission) {
            this.cb.onRadioTransmission({
              id: "all_evidence_collected_dispatch",
              speaker: "HQ DISPATCH",
              callsign: "HQ DISPATCH",
              text: "සාක්ෂි 3ම සම්පූර්ණයි! දැන් වහාම කඳු මුදුනේ හෙලිපෑඩ් (Helipad) වෙත යන්න. Chopper-01 ගලවා ගැනීමේ යානය සීරුවෙන් තබා ඇත!",
              textEn: "All 3 critical expedition clues recovered! Proceed immediately to the ridge extraction helipad at [545, 855]. Chopper-01 standing by!",
            });
          }
          this.cb.onTriggerStory({
            title: "අභිරහස හෙළි විය! (සාක්ෂි අංක 03)",
            titleEn: "Expedition Secrets Secured! (Evidence 03)",
            text: "වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ පර්යේෂණ සාම්පල බඳුන ඔබට හමුවිය! දැන් කඳු මුදුනේ ඇති හෙලිපෑඩ් වෙත ගොස් සංඥා කරන්න!",
            textEn: "You secured Professor Douglas's rare bioluminescent Sinharaja flora vial! All Chapter 1 evidence is accounted for. Climb to the summit extraction helipad to signal the rescue chopper!",
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
              ? "🧪 Secured Bioluminescent Flora Sample! (Evidence 03/03 - All Evidence Recovered!)"
              : "🧪 පර්යේෂණ සාම්පලය ලබාගත්තා! (සාක්ෂි 03/03 - සියල්ල සම්පූර්ණයි!)"
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
      titleEn: "Sri Lankan Green Pit Viper",
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
              titleEn: "Sri Lankan Green Pit Viper (Trimeresurus trigonocephalus)",
              desc: "ශ්‍රී ලංකාවට ආවේණික තුරුලතා ආශ්‍රිත වෙසෙන විෂ සහිත අලංකාර සර්පයෙකි.",
              descEn: "Endemic arboreal pit viper inhabiting the moist lowland rainforests of Sri Lanka.",
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
          this.cb.onNotify(
            this.lang === "en"
              ? "🐍 The viper struck in the pitch black! (Health -25). Keep your flashlight ON!"
              : "🐍 අඳුරේ සිටි පළා පොළඟා දෂ්ට කළා! (Health -25). විදුලි පන්දම දල්වන්න!"
          );
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
      titleEn: "Ceylon Blue Magpie Feather",
      prompt: "[E] අහුලාගන්න (Pick Up)",
      promptEn: "[E] Pick Up Feather (+25% Speed)",
      action: () => {
        this.feathersCollected++;
        this.magpieCharmActive = true;
        this.player.speed = 6.2;
        this.playSfx("pickup");
        this.scene.remove(featherMesh);
        const idx = this.interactableMeshes.indexOf(featherMesh);
        if (idx >= 0) this.interactableMeshes.splice(idx, 1);
        this.activeCrosshairTarget = null;
        this.cb.onNotify(
          this.lang === "en"
            ? "🪶 Collected Ceylon Blue Magpie Feather! Movement speed boosted (+25%)."
            : "🪶 දුර්ලභ කහබිලියා පිහාටුව ලබාගත්තා! වේගය වැඩි විය (+25%)."
        );
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

    // C or Ctrl -> Toggle Crouch
    if (e.code === "KeyC" || e.code === "ControlLeft" || e.code === "ControlRight" || e.key.toLowerCase() === "c") {
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

    // P -> Field Photo Capture
    if (e.key.toLowerCase() === "p") {
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
    // Escape -> Pause
    if (e.key === "Escape" && this.cb.onTogglePause) {
      this.cb.onTogglePause();
    }
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
      const baseIntensity = this.uvMode ? 4.5 : 7.5;
      this.flashlight.intensity = baseIntensity * this.torchIntensity;
      this.flashlight.color.set(this.uvMode ? 0xa855f7 : 0xfff4d6);
      this.flashlight.distance = this.uvMode ? 32 : (65 * Math.sqrt(this.torchIntensity));
    }
    if (this.flashlightSpill) {
      this.flashlightSpill.visible = true;
      this.flashlightSpill.intensity = (this.uvMode ? 1.0 : 1.4) * this.torchIntensity;
      this.flashlightSpill.color.set(this.uvMode ? 0x9333ea : 0xfff4d6);
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

      const distViper = pPos.distanceTo(new THREE.Vector3(480, 0, 750));
      const distMagpie = pPos.distanceTo(new THREE.Vector3(515, 0, 780));
      const distCave = pPos.distanceTo(new THREE.Vector3(495, 0, 840));
      const distOutpost = pPos.distanceTo(new THREE.Vector3(520, 0, 720));

      if (distViper < 15) {
        photoId = "viper_photo";
        photoTitle = "පළා පොළඟා (Green Pit Viper)";
        photoTitleEn = "Sri Lankan Green Pit Viper (Craspedocephalus trigonocephalus)";
        photoDesc = "ගස් අත්තක දවටී සිටි විෂකුරු පළා පොළඟාගේ පැහැදිලි ඡායාරූපයකි.";
        photoDescEn = "Rare close-up photograph of the endemic pit viper coiled on a branch.";
      } else if (distMagpie < 18) {
        photoId = "magpie_photo";
        photoTitle = "ශ්‍රී ලංකා කැහිබෙල්ලා (Ceylon Blue Magpie)";
        photoTitleEn = "Sri Lanka Blue Magpie (Urocissa ornata)";
        photoDesc = "සිංහරාජ වැසි වනාන්තර වියනේ සැරිසරන ආවේණික නිල් කැහිබෙල්ලා.";
        photoDescEn = "Magnificent plumage of the endangered endemic blue magpie in the canopy.";
      } else if (distCave < 20) {
        photoId = "cave_monolith_photo";
        photoTitle = "පුරාණ ලෙන් දොරටුව (Monolith Portal)";
        photoTitleEn = "Ancient Monolith Cavern Portal";
        photoDesc = "පුරාණ සංකේත කැටයම් සහිත දැවැන්ත කළුගල් දොරටුව.";
        photoDescEn = "Subterranean megalithic portal carved with forgotten ancient runes.";
      } else if (distOutpost < 25) {
        photoId = "kudawa_cabin_photo";
        photoTitle = "කුඩව මුරපොළ (Kudawa Outpost 01)";
        photoTitleEn = "Kudawa Forest Outpost Cabin";
        photoDesc = "1987 ගවේෂණ කණ්ඩායමේ අවසාන කඳවුර.";
        photoDescEn = "The last known civilian ranger shelter before deep uncharted rainforest.";
      } else {
        photoId = `wildlife_photo_${Date.now()}`;
        photoTitle = "සිංහරාජ වැසි වනාන්තර පරිසරය (Rainforest Biome)";
        photoTitleEn = "Sinharaja Virgin Forest Biome";
        photoDesc = "ඝන සදාහරිත වැසි වනාන්තර වියන සහ මීදුම් නිම්නය.";
        photoDescEn = "Dense primary rainforest undergrowth shrouded in tropical storm mist.";
      }

      this.cb.onPhotoCaptured({
        id: photoId,
        title: this.lang === "en" ? photoTitleEn : photoTitle,
        titleEn: photoTitleEn,
        desc: this.lang === "en" ? photoDescEn : photoDesc,
        descEn: photoDescEn,
        date: "1987.11.14 // EXPEDITION",
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
          p.material.roughness = 0.04 + Math.sin(this.gameClock * 3.5 + i * 1.5) * 0.02;
        }
      }
    }

    // Dynamic Antique Brass Key Floating & Beacon Glow Pulse
    if (this.keyGroup && !this.tasks.keyFound) {
      this.keyGroup.rotation.y += dt * 1.5;
      this.keyGroup.position.y = this.keyBaseY + Math.sin(this.gameClock * 2.5) * 0.08;
      if (this.keyLight) {
        this.keyLight.intensity = 2.4 + Math.sin(this.gameClock * 3.2) * 0.6;
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
        this.moonLight.intensity = 0.48;
        this.ambientLight.intensity = 0.44;
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

    // ── 3D Center Crosshair Raycasting ──
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactableMeshes, false);
    if (intersects.length > 0 && intersects[0].distance < 4.5) {
      const hitObj = intersects[0].object;
      const ud = hitObj.userData || {};
      this.activeCrosshairTarget = {
        ...ud,
        mesh: hitObj,
        userData: ud,
        title: this.lang === "en" ? (ud.titleEn || ud.title) : ud.title,
        prompt: this.lang === "en" ? (ud.promptEn || ud.prompt) : ud.prompt,
        action: ud.action,
      };
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
        quality: this.quality,
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
