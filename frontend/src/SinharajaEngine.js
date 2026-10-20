// ═══════════════════════════════════════════════════════════════════════════════
// SINHARAJA 2D SURVIVAL EXPLORATION ENGINE — CHAPTER 01 DEEP EXPANSION
// (Campfires, Friendly Ranger NPC, Secret Areas, Puzzles, Wildlife & Fireflies)
// ═══════════════════════════════════════════════════════════════════════════════

export class SinharajaEngine {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cb = callbacks || {};
    this.chapter = this.cb.chapter || 1;

    // World Dimensions (Large explorable open-world map)
    this.worldWidth = 3200;
    this.worldHeight = 2400;

    // Camera & Smooth Zoom (Binoculars)
    this.camera = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.targetZoom = 1.0;

    // Camera View Mode: "fps" (First-Person Tactical I.G.I. Mode) vs "isometric" (2.5D Expedition View)
    this.viewMode = "fps"; // Default to authentic First-Person I.G.I. Eye-Level experience!
    this.headBob = 0;
    this.fpsRainVisor = [];
    for (let i = 0; i < 28; i++) {
      this.fpsRainVisor.push({
        x: Math.random(),
        y: Math.random(),
        len: 14 + Math.random() * 22,
        speed: 0.8 + Math.random() * 1.5,
        alpha: 0.18 + Math.random() * 0.35,
      });
    }

    // Player Entity
    this.player = {
      x: this.chapter === 2 ? 300 : 250,
      y: this.chapter === 2 ? 450 : 350,
      radius: 18,
      speed: 3.2,
      sprintMultiplier: 1.6,
      vx: 0,
      vy: 0,
      facingAngle: 0,
      stamina: 100,
      isSprinting: false,
      isMoving: false,
      walkFrame: 0,
      inShelter: false,
      inCave: false,
      inMud: false,
    };

    // Mission Timer & HQ Radio Dispatch System
    this.elapsedTime = 0;
    this.radioHistory = new Set();
    this.caveDripTimer = 3.0;
    this.trailCairns = [];

    // Controls State
    this.keys = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
    this.moveTarget = null; // Click-to-move destination
    this.campfireEmbers = []; // Campfire sparks
    this.heliRotorAngle = 0; // Helicopter spinning blades

    // Cached offscreen lighting canvas to eliminate GC freezes (60 FPS allocation bug)
    this.darknessCanvas = document.createElement("canvas");
    this.dCtx = this.darknessCanvas.getContext("2d");
    this.statsUpdateTimer = 0;

    // Survival Stats & Buffs
    this.health = 100;
    this.sanity = 100;
    this.battery = 100;
    this.torchOn = true;
    this.saltCount = 3;
    this.herbCount = 1;
    this.balmCount = 1; // Leech repellent herbal balm
    this.repellentTimer = 0; // Leech repellent buff timer in seconds
    this.photosTaken = {}; // Captured wildlife photos
    this.ambientLight = 0.55; // Day/Dusk to Deep Night ambient lighting
    this.logBridges = []; // Fallen giant tree log bridges
    this.treeBlazes = []; // Tree blaze guide markings
    this.hasKey = false;
    this.hasSample = false;
    this.bleeding = false;
    this.bleedTimer = 0;
    this.teaBuffTimer = 0; // Herbal tea buff timer in seconds
    this.uvUnlocked = false; // UV Blacklight filter unlocked
    this.uvMode = false; // UV Blacklight active
    this.stormActive = false; // Torrential dynamic rainstorm after picking up key
    this.stormIntensity = 0;
    this.feathersCollected = 0; // Lucky Magpie Feathers (0/3)
    this.magpieCharmActive = false; // +20% sprint & stamina regen
    this.flareGunFound = false; // Emergency flare gun found at outpost
    this.flareFired = false; // Flare fired at helipad
    this.flareEntity = null; // { x, y, altitude, exploded, timer }
    this.chopperArriving = false; // Helicopter rescue searchlight sequence
    this.chopperSearchlightAngle = 0;
    this.uvFootprints = []; // 1987 glowing path
    this.uvGlyphs = []; // Cave rock secret glyphs
    this.paused = false;

    // ═══ PRO TACTICAL SURVIVAL SYSTEMS ═══════════════════════════════════
    this.difficulty = "tactical"; // 'tactical' (standard pro) | 'hardcore' (nightmare)
    this.attachedLeeches = 0;     // Clinging leeches (0..4)
    this.venomToxicity = 0;       // Pit viper neurotoxin (0..100%)
    this.venomTimer = 0;
    this.noiseLevel = 15;         // Decibels / Acoustic detection (10..100)
    this.crankCooldown = 0;       // Dynamo crank timer
    this.paranoiaTimer = 5.0;     // Whispers & hallucinations
    this.shadowStalker = {
      x: 1850,
      y: 1250,
      vx: 0,
      vy: 0,
      state: "lurking", // 'lurking' | 'stalking' | 'charging' | 'repelled'
      timer: 4.0,
      eyesAlpha: 0,
      roarCooldown: 0,
    };
    this.vipers = [
      { id: 1, x: 1050, y: 720, state: "coiled", strikeCooldown: 0, hissCooldown: 0 },
      { id: 2, x: 1380, y: 520, state: "coiled", strikeCooldown: 0, hissCooldown: 0 },
      { id: 3, x: 1950, y: 1320, state: "coiled", strikeCooldown: 0, hissCooldown: 0 },
    ];
    // ═════════════════════════════════════════════════════════════════════

    // ═══ AAA VISUAL & ATMOSPHERE SYSTEMS ═════════════════════════════════
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    this.floatingTexts = [];      // Floating pickup/damage labels
    this.jungleParticles = [];    // Pollen, falling leaves, dust motes
    this.butterflies = [];        // Decorative butterfly pairs
    this.terrainSeeds = [];       // Terrain texture anchor points
    this.jungleTrees = [];        // Dense background jungle trees
    this.windAngle = 0;           // Current wind direction (radians)
    this.windStrength = 0.3;      // Wind speed
    this.windTimer = 0;
    this.heartbeatTimer = 0;      // Danger heartbeat audio
    this.lensDroplets = [];       // Rain droplets on camera lens
    this.caveDroplets = [];       // Cave drip particle system
    this.godRays = [];            // Volumetric god-rays through canopy
    this.lastHurtFlash = 0;       // Last time hurt flash happened
    this.footprints = [];         // Dynamic explorer trail footprints
    this.waterRipples = [];       // Concentric water ripple particles
    this.analogMove = { x: 0, y: 0, active: false }; // Virtual analog joystick vector
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    // ═════════════════════════════════════════════════════════════════════


    if (this.chapter === 2) {
      this.torchOn = false; // Bright mountain daylight! No flashlight needed!
      this.ambientLight = 0.0; // 0% darkness (100% crystal-clear daytime visibility)
      this.stormActive = false; // No rainstorm in Chapter 2!
      this.rainDrops = [];
      this.tasks = {
        mapFound: false,
        raftUsed: false,
        cableUsed: false,
        tapeFound: false,
        gemFound: false,
        towerReached: false,
      };
      this.raft = {
        x: 820,
        y: 980,
        targetY: 980,
        riding: false,
        state: "north",
      };
      this.cableway = {
        x: 1800,
        y: 920,
        targetY: 920,
        riding: false,
        repaired: false,
        state: "north",
      };
      this.temperature = 100;
      this.gingerTeaCount = 2;
      this.hasGears = false;
      this.hasEmf = false;
      this.emfProximity = 0;
      this.waterfallSoundTimer = 0;
      this.shiverTimer = 0;
      this.waterfallParticles = [];
      this.coldMistWaves = [];
      this.campfires = [
        { x: 550, y: 650, radius: 24, lit: true, name: "භූවිද්‍යා කඳවුරේ ගිනිමැලය (Base Campfire)" },
        { x: 1950, y: 1560, radius: 24, lit: true, name: "පතල් පිවිසුමේ ගිනිමැලය (Mine Campfire)" },
      ];
      this.vipers = [
        { id: 1, x: 1050, y: 620, state: "coiled", strikeCooldown: 0, hissCooldown: 0 },
        { id: 2, x: 2200, y: 1650, state: "coiled", strikeCooldown: 0, hissCooldown: 0 },
      ];
      this.shadowStalker = {
        x: 2350,
        y: 1750,
        vx: 0,
        vy: 0,
        state: "lurking",
        timer: 4.0,
        eyesAlpha: 0,
        roarCooldown: 0,
      };
    } else if (this.chapter === 3) {
      // ════ CHAPTER 03: THE SUBTERRANEAN CAVERNS (භූගත අගාධය) ════
      this.torchOn = false; // Bioluminescent ambient cavern lighting
      this.ambientLight = 0.35;
      this.stormActive = false;
      this.rainDrops = [];
      this.hasGasMask = false;
      this.gasExposure = 0;
      this.floodgateOpen = false;
      this.tasks = {
        slateFound: false,
        maskFound: false,
        floodgateUsed: false,
        coreFound: false,
        logFound: false,
        elevatorReached: false,
      };
      this.campfires = [
        { x: 450, y: 550, radius: 24, lit: true, name: "ලෙන් පිවිසුමේ තෙල් පහන" },
        { x: 2150, y: 1450, radius: 24, lit: true, name: "පතල් ශ්‍රයින් පහන" },
      ];
    } else if (this.chapter === 4) {
      // ════ CHAPTER 04: THE FORGOTTEN FACILITY (රහස් පර්යේෂණාගාරය) ════
      this.torchOn = false; // Industrial emergency lights & CRT glow
      this.ambientLight = 0.3;
      this.stormActive = false;
      this.rainDrops = [];
      this.generatorPowered = false;
      this.breakerOff = false;
      this.hasKeycard = false;
      this.blastDoorOpen = false;
      this.tasks = {
        generatorFixed: false,
        docsFound: false,
        breakerPulled: false,
        keycardFound: false,
        dnaFound: false,
        monorailReached: false,
      };
      this.campfires = [
        { x: 500, y: 500, radius: 24, lit: true, name: "ආරක්ෂිත පාලක මැදිරිය" },
        { x: 1950, y: 1250, radius: 24, lit: true, name: "විද්‍යාගාර හදිසි මධ්‍යස්ථානය" },
      ];
    } else if (this.chapter === 5) {
      // ════ CHAPTER 05: THE COLOSSUS CANOPY & FINAL TRUTH (මහා නාවෘක්ෂය) ════
      this.torchOn = false; // Breathtaking sunset twilight
      this.ambientLight = 0.0;
      this.stormActive = false;
      this.rainDrops = [];
      this.windStrength = 0.7;
      this.tasks = {
        blackboxFound: false,
        bridgeCrossed: false,
        truthFound: false,
        beaconActivated: false,
        skyhookReached: false,
      };
      this.campfires = [
        { x: 450, y: 500, radius: 24, lit: true, name: "වියන් නැරඹුම් කුටියේ පහන" },
        { x: 1850, y: 1200, radius: 24, lit: true, name: "මහා නාවෘක්ෂ නිවහන" },
      ];
    } else {
      this.tasks = {
        diaryFound: false,
        keyFound: false,
        sampleFound: false,
        helipadReached: false,
      };
      this.campfires = [
        { x: 480, y: 880, radius: 24, lit: true, name: "මුරපොළේ ගිනිමැලය" },
        { x: 1620, y: 1380, radius: 24, lit: true, name: "ලෙන් දොරටුවේ ගිනිමැලය" },
      ];
    }

    // Friendly Ranger NPC (ගුණදාස මාමා - Chapter 1)
    this.npc = {
      x: 340,
      y: 400,
      radius: 26,
      name: "ගුණදාස මාමා (Old Ranger Gunadasa)",
      icon: "🧙‍♂️",
      helped: false,
    };

    // Endemic Fauna: Sri Lanka Blue Magpie (කැහිබෙල්ලා)
    this.blueMagpie = {
      x: 100,
      y: 350,
      wingAngle: 0,
      active: true,
      timer: 15,
      feathersDropped: 0,
    };

    // Endemic Fauna: Purple-faced Langur monkeys (කළු වඳුරන්)
    this.langurs = [
      { x: 500, y: 560, shake: 0, callTimer: 8, treeName: "හොර ගස" },
      { x: 1350, y: 410, shake: 0, callTimer: 18, treeName: "දුන් ගස" },
    ];

    // Endemic Trees (3D Flora with Canopy Elevation and Buttress Roots)
    this.trees = [
      { x: 380, y: 220, r: 42, height: 115, foliageR: 95, name: "මහා හොර ගස (Dipterocarpus zeylanicus)", hue: 125, saturation: 42, lightness: 18 },
      { x: 680, y: 520, r: 38, height: 105, foliageR: 88, name: "දුන් ගස (Doona congestiflora)", hue: 130, saturation: 45, lightness: 20 },
      { x: 1100, y: 380, r: 48, height: 125, foliageR: 105, name: "වල් දෙල් ගස (Artocarpus nobilis)", hue: 120, saturation: 38, lightness: 17 },
      { x: 1550, y: 780, r: 40, height: 100, foliageR: 85, name: "කැකුණ ගස (Canarium zeylanicum)", hue: 135, saturation: 42, lightness: 19 },
      { x: 2100, y: 550, r: 52, height: 130, foliageR: 110, name: "පුරාණ වෘක්ෂය (Ancient Shorea)", hue: 118, saturation: 35, lightness: 16 },
    ];

    // Wildlife: Fireflies & Footsteps
    this.fireflies = [];
    this.footsteps = [];
    this.initFireflies();

    // Weather & Atmosphere
    this.rainDrops = [];
    this.mistClouds = [];
    this.lightningTimer = 0;
    this.lightningActive = false;
    this.ambientTimer = 10;

    // Entities in World
    this.leeches = [];
    this.items = [];
    this.interactiveObjects = [];
    this.waterZones = [];
    this.obstacles = [];

    // Audio Synthesizer
    this.initAudio();

    // Setup World Map Elements
    this.buildWorld();
    this.initWeather();

    // AAA Atmosphere Systems
    this.initJungleParticles();
    this.initButterflies();
    this.initTerrainSeeds();
    this.initJungleTrees();
    this.godRays = this.generateGodRays();

    // Event Listeners
    this.setupInputs();

    // Start Main Game Loop
    this.running = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  // ── 1. Web Audio Synthesizer ──────────────────────────────────────────────
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

    if (type === "step") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
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
    } else if (type === "heal") {
      [330, 440, 550, 660].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + i * 0.08);
        gain.gain.setValueAtTime(0.15, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.25);
      });
    } else if (type === "hurt") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    } else if (type === "thunder") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 1.2);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 1.2);
    } else if (type === "dial") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === "pda_open") {
      [520, 680, 820].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + i * 0.04);
        gain.gain.setValueAtTime(0.08, t + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.04);
        osc.stop(t + i * 0.04 + 0.1);
      });
    } else if (type === "pda_close") {
      [820, 680, 480].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + i * 0.04);
        gain.gain.setValueAtTime(0.08, t + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.04);
        osc.stop(t + i * 0.04 + 0.1);
      });
    } else if (type === "blip") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } else if (type === "viper_hiss") {
      const bufferSize = this.audioCtx.sampleRate * 0.45;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(3200, t);
      filter.Q.setValueAtTime(4.0, t);
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.45);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start(t);
      noise.stop(t + 0.45);
    } else if (type === "leopard_growl") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(65, t);
      osc.frequency.linearRampToValueAtTime(85, t + 0.3);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.85);
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(28, t);
      lfoGain.gain.setValueAtTime(25, t);
      lfo.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + 0.85);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.85);
    } else if (type === "crank_dynamo") {
      [180, 260, 340, 420, 520].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, t + i * 0.03);
        gain.gain.setValueAtTime(0.12, t + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.03 + 0.04);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.03);
        osc.stop(t + i * 0.03 + 0.04);
      });
    } else if (type === "whisper_paranoia") {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(140, t);
      osc2.frequency.setValueAtTime(144, t); // Binaural 4Hz beat
      osc1.frequency.linearRampToValueAtTime(110, t + 1.2);
      osc2.frequency.linearRampToValueAtTime(114, t + 1.2);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.4);
      gain.gain.linearRampToValueAtTime(0.001, t + 1.2);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 1.2);
      osc2.stop(t + 1.2);
    } else if (type === "heartbeat_fast") {
      [0, 0.12].forEach((offset) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(65, t + offset);
        osc.frequency.exponentialRampToValueAtTime(35, t + offset + 0.08);
        gain.gain.setValueAtTime(0.24, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.08);
      });
    } else if (type === "venom_strike") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.2);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } else if (type === "splash") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (type === "bird_call") {
      [1800, 2200, 1950].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + i * 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, t + i * 0.08 + 0.06);
        gain.gain.setValueAtTime(0.05, t + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.001, t + i * 0.08 + 0.07);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.07);
      });
    } else if (type === "monkey_call") {
      [320, 280, 360, 250].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, t + i * 0.07);
        gain.gain.setValueAtTime(0.07, t + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.001, t + i * 0.07 + 0.06);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.07);
        osc.stop(t + i * 0.07 + 0.06);
      });
    } else if (type === "tea_brew") {
      [528, 660, 792, 1056].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + i * 0.09);
        gain.gain.setValueAtTime(0.12, t + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.09);
        osc.stop(t + i * 0.09 + 0.35);
      });
    } else if (type === "ambient_cicada") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(4500, t);
      osc.frequency.linearRampToValueAtTime(4800, t + 0.4);
      gain.gain.setValueAtTime(0.015, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    } else if (type === "radio") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(1174, t + 0.05);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (type === "camera_snap") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.06);

      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(600, t + 0.07);
      osc2.frequency.exponentialRampToValueAtTime(950, t + 0.18);
      gain2.gain.setValueAtTime(0.12, t + 0.07);
      gain2.gain.linearRampToValueAtTime(0.001, t + 0.18);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(t + 0.07);
      osc2.stop(t + 0.18);
    } else if (type === "recharge") {
      [523, 659, 784, 1046].forEach((f, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t + i * 0.07);
        gain.gain.setValueAtTime(0.12, t + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.18);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.07);
        osc.stop(t + i * 0.07 + 0.18);
      });
    } else if (type === "balm") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.2);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } else if (type === "radio_static") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.setValueAtTime(320, t + 0.08);
      osc.frequency.setValueAtTime(140, t + 0.15);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    } else if (type === "flare_launch") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.7);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.7);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.7);
    } else if (type === "flare_burst") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.9);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.9);
    } else if (type === "uv_toggle") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.setValueAtTime(920, t + 0.06);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (type === "tape_play") {
      [320, 280, 360].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + i * 0.05);
        gain.gain.setValueAtTime(0.1, t + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.001, t + i * 0.05 + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.08);
      });
    } else if (type === "radio_beep") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, t);
      osc.frequency.setValueAtTime(2200, t + 0.06);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    } else if (type === "cave_drip") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1600, t);
      osc.frequency.exponentialRampToValueAtTime(650, t + 0.09);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } else if (type === "step_wood") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.07);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } else if (type === "step_mud") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.11);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.11);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    } else if (type === "step_cave") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } else if (type === "heartbeat") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(65, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.18);

      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(55, t + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(30, t + 0.32);
      gain2.gain.setValueAtTime(0.22, t + 0.14);
      gain2.gain.linearRampToValueAtTime(0.001, t + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(t + 0.14);
      osc2.stop(t + 0.35);
    } else if (type === "waterfall_roar") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(50, t);
      osc.frequency.linearRampToValueAtTime(45, t + 0.5);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (type === "cable_creak") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.linearRampToValueAtTime(420, t + 0.2);
      osc.frequency.linearRampToValueAtTime(180, t + 0.4);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    } else if (type === "gear_turn") {
      [220, 280, 190, 310].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, t + i * 0.06);
        gain.gain.setValueAtTime(0.08, t + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.001, t + i * 0.06 + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.08);
      });
    } else if (type === "shiver_cold") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(360, t + 0.08);
      osc.frequency.linearRampToValueAtTime(310, t + 0.16);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (type === "crystal_hum") {
      [528, 792, 1056].forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
      });
    } else if (type === "emf_beep") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(950, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  triggerRadio(id, callsign, text) {
    if (this.radioHistory.has(id)) return;
    this.radioHistory.add(id);
    this.playSfx("radio_beep");
    if (this.cb.onRadioTransmission) {
      this.cb.onRadioTransmission({ id, callsign, text });
    }
  }

  // ── 2. Wildlife & Fireflies ───────────────────────────────────────────────
  initFireflies() {
    this.fireflies = [];
    for (let i = 0; i < 40; i++) {
      this.fireflies.push({
        x: 300 + Math.random() * 2600,
        y: 200 + Math.random() * 2000,
        radius: 2 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
      });
    }
  }

  // ── AAA: Jungle Atmosphere Particles (pollen, leaves, dust) ──────────────
  initJungleParticles() {
    this.jungleParticles = [];
    for (let i = 0; i < 60; i++) {
      this.jungleParticles.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: Math.random() * 0.25 + 0.05,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.5,
        type: Math.random() < 0.5 ? "pollen" : "leaf",
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // ── AAA: Decorative Butterflies ──────────────────────────────────────────
  initButterflies() {
    this.butterflies = [];
    const colors = ["#ff9eb5", "#b5d4ff", "#d4ffb5", "#ffe9b5", "#e4b5ff"];
    for (let i = 0; i < 12; i++) {
      this.butterflies.push({
        x: 200 + Math.random() * 2800,
        y: 150 + Math.random() * 1800,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.6,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 4 + Math.random() * 3,
        size: 5 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        wanderTimer: Math.random() * 3,
        active: true,
      });
    }
  }

  // ── AAA: Terrain Texture Seeds (grass, roots, rocks, moss) ───────────────
  initTerrainSeeds() {
    this.terrainSeeds = [];
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(42);
    // Grass tufts
    for (let i = 0; i < 220; i++) {
      this.terrainSeeds.push({
        type: "grass",
        x: rand() * this.worldWidth,
        y: rand() * this.worldHeight,
        size: 4 + rand() * 7,
        angle: rand() * Math.PI * 2,
        color: `hsl(${110 + rand() * 30}, ${50 + rand() * 25}%, ${15 + rand() * 12}%)`,
      });
    }
    // Rock pebbles
    for (let i = 0; i < 80; i++) {
      this.terrainSeeds.push({
        type: "rock",
        x: rand() * this.worldWidth,
        y: rand() * this.worldHeight,
        size: 3 + rand() * 8,
        color: `hsl(200, ${5 + rand() * 15}%, ${22 + rand() * 14}%)`,
      });
    }
    // Moss patches
    for (let i = 0; i < 55; i++) {
      this.terrainSeeds.push({
        type: "moss",
        x: rand() * this.worldWidth,
        y: rand() * this.worldHeight,
        rx: 10 + rand() * 22,
        ry: 5 + rand() * 12,
        color: `rgba(${30 + rand() * 20}, ${75 + rand() * 40}, ${25 + rand() * 20}, ${0.35 + rand() * 0.3})`,
      });
    }
    // Exposed roots
    for (let i = 0; i < 30; i++) {
      const bx = rand() * this.worldWidth;
      const by = rand() * this.worldHeight;
      const pts = [];
      let cx = bx, cy = by;
      for (let j = 0; j < 4; j++) {
        cx += (rand() - 0.5) * 60;
        cy += (rand() - 0.5) * 30;
        pts.push({ x: cx, y: cy });
      }
      this.terrainSeeds.push({ type: "root", pts, color: `rgba(42,26,14,0.6)` });
    }
  }

  // ── AAA: Dense Background Jungle Trees ───────────────────────────────────
  initJungleTrees() {
    this.jungleTrees = [];
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(77);
    for (let i = 0; i < 80; i++) {
      const fr = 32 + rand() * 40;
      this.jungleTrees.push({
        x: rand() * this.worldWidth,
        y: rand() * this.worldHeight,
        r: 10 + rand() * 12,
        height: 65 + rand() * 45,
        foliageR: fr,
        fr: fr,
        hue: 112 + rand() * 32,
        saturation: 38 + rand() * 25,
        lightness: 14 + rand() * 10,
        phase: rand() * Math.PI * 2,
      });
    }
  }

  // ── AAA: God-Rays Through Canopy ─────────────────────────────────────────
  generateGodRays() {
    const rays = [];
    for (let i = 0; i < 8; i++) {
      rays.push({
        x: 200 + i * 360,
        y: 0,
        width: 20 + Math.random() * 40,
        length: 300 + Math.random() * 250,
        angle: 0.08 + (Math.random() - 0.5) * 0.08,
        alpha: 0.03 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return rays;
  }

  // ── AAA: Screen Shake Trigger ─────────────────────────────────────────────
  triggerScreenShake(intensity, duration) {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    this.screenShake.duration = Math.max(this.screenShake.duration, duration);
  }

  // ── AAA: Spawn Floating Text ──────────────────────────────────────────────
  spawnFloatingText(worldX, worldY, text, color = "#ffffff") {
    this.floatingTexts.push({
      x: worldX,
      y: worldY,
      text,
      color,
      alpha: 1.0,
      vy: -0.7,
      timer: 0,
      maxTime: 2.2,
    });
  }



  // ── 3. Build World Map Entities ───────────────────────────────────────────
  buildWorld() {
    if (this.chapter === 2) {
      // ═══════════════════════════════════════════════════════════════════════
      // CHAPTER 02: THE MIST GORGE & CASCADES (මීදුම් නිම්නය සහ මහා දියඇලි)
      // ═══════════════════════════════════════════════════════════════════════
      this.waterZones = [
        { x: 0, y: 920, w: 3200, h: 380, name: "මහා දියඇලි අගාධය (The Grand Cascade Gorge)" },
        { x: 650, y: 0, w: 220, h: 920, name: "උතුරු දියඇලි මිටියාවත (North Falls)" },
        { x: 1550, y: 0, w: 240, h: 920, name: "නිහඬ ඇල්ල ජල කඳ (Silent Cascade Falls)" },
        { x: 2450, y: 0, w: 220, h: 920, name: "පතල් ඇල්ල (Mine Falls)" },
      ];

      this.steppingStones = [
        { x: 1320, y: 980, r: 24 },
        { x: 1390, y: 1040, r: 26 },
        { x: 1460, y: 1120, r: 24 },
        { x: 1530, y: 1200, r: 26 },
        { x: 1600, y: 1260, r: 24 },
      ];

      this.obstacles = [
        // Gorge Cliffs with safe passages for Raft (720-920), Stepping Stones (1280-1640), and Cableway (1740-1860)
        { x: 0, y: 910, w: 720, h: 25 },
        { x: 920, y: 910, w: 360, h: 25 },
        { x: 1640, y: 910, w: 100, h: 25 },
        { x: 1860, y: 910, w: 1340, h: 25 },

        { x: 0, y: 1290, w: 720, h: 25 },
        { x: 920, y: 1290, w: 360, h: 25 },
        { x: 1640, y: 1290, w: 100, h: 25 },
        { x: 1860, y: 1290, w: 1340, h: 25 },

        // Giant boulders
        { x: 1200, y: 450, r: 80 },
        { x: 2050, y: 480, r: 85 },
        { x: 1400, y: 1650, r: 90 },
        { x: 2200, y: 1750, r: 95 },
      ];

      this.interactiveObjects = [
        {
          id: "cascades_sign",
          x: 420,
          y: 480,
          radius: 28,
          title: "දියඇලි මාවත පුවරුව",
          prompt: "[E] කියවන්න",
          icon: "🪧",
          action: () => {
            this.playSfx("blip");
            this.cb.onNotify("🪧 [➡️ මාවත ඔස්සේ: උණ බම්බු පහුර මීටර් 120යි | භූවිද්‍යා කඳවුර මීටර් 150යි | කේබල් කරත්තය මීටර් 300යි]");
          },
        },
        {
          id: "geologist_camp_tent",
          x: 420,
          y: 380,
          radius: 40,
          title: "භූවිද්‍යාඥ කූඩාරම (Expedition Tent)",
          prompt: "[E] විවේක ගන්න & උණුසුම් වන්න",
          icon: "⛺",
          action: () => {
            this.temperature = 100;
            this.health = 100;
            this.sanity = 100;
            this.player.stamina = 100;
            this.playSfx("heal");
            this.cb.onNotify("⛺ කූඩාරම තුළ උණුසුම් වී විවේක ගත්තා! (Temperature & Health 100%)");
            if (this.cb.onAutosave) this.cb.onAutosave();
          },
        },
        {
          id: "geologist_workbench",
          x: 520,
          y: 440,
          radius: 35,
          title: "භූවිද්‍යාඥ වැඩ මේසය (Work Bench)",
          prompt: "[E] පරීක්ෂා කරන්න",
          icon: "⚙️",
          opened: false,
          action: (obj) => {
            if (!this.hasGears) {
              this.hasGears = true;
              obj.opened = true;
              this.gingerTeaCount += 2;
              this.playSfx("pickup");
              this.cb.onTriggerStory({
                title: "කේබල් කරත්තයේ ගියර් පෙට්ටිය (Trolley Gears)",
                text: "අතහැර දැමූ මේසය මත තිබී කේබල් කරත්තය (Cable Trolley) අලුත්වැඩියා කළ හැකි දැති රෝද (Gears) සහ උණුසුම් ඉඟුරු තේ බෝතල් 2ක් හමුවිය! [G] ඔබා ඉඟුරු තේ පානය කර සීතලෙන් මිදෙන්න (Warmth +40%).",
                item: "කේබල් ගියර් x1 | ඉඟුරු තේ x2",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            } else {
              this.cb.onNotify("මෙම මේසයේ ගියර් පෙට්ටිය දැනටමත් ලබාගෙන ඇත.");
            }
          },
        },
        {
          id: "emf_scanner_item",
          x: 620,
          y: 480,
          radius: 30,
          title: "විද්‍යුත් චුම්භක අනාවරකය (EMF Scanner)",
          prompt: "[E] අහුලාගන්න",
          icon: "📻",
          picked: false,
          action: (obj) => {
            if (!this.hasEmf) {
              this.hasEmf = true;
              obj.picked = true;
              this.playSfx("emf_beep");
              this.cb.onTriggerStory({
                title: "විද්‍යුත් චුම්භක අනාවරකය (EMF Scanner)",
                text: "කඳුකරයේ අද්භූත තරංග අනාවරණය කළ හැකි EMF උපකරණයක් හමුවිය! සැඟවුණු ස්ඵටික හෝ රහස් හඬපට අසලට යත්ම මෙහි සංඥා ශබ්දය වැඩි වේ.",
                item: "EMF Detector [Active]",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            } else {
              this.cb.onNotify("EMF අනාවරකය දැනටමත් ඔබ ළඟ ඇත.");
            }
          },
        },
        {
          id: "geologist_map",
          x: 950,
          y: 650,
          radius: 35,
          title: "අතහැර දැමූ භූවිද්‍යා සිතියම",
          prompt: "[E] අහුලාගන්න",
          icon: "🗺️",
          picked: false,
          action: (obj) => {
            if (!obj.picked) {
              obj.picked = true;
              this.tasks.mapFound = true;
              this.playSfx("pickup");
              this.triggerRadio(
                "ch2_map",
                "BASE-DISPATCH",
                "සිතියමේ තොරතුරු ලැබුණා! දියඇල්ලෙන් එහා ඉවුරේ පැරණි මයිකා පතලක් ඇත. කේබල් කරත්තය හෝ පහුර භාවිත කර එතෙර වන්න!"
              );
              this.cb.onTriggerStory({
                title: "භූවිද්‍යාඥයින්ගේ සිතියම (සාක්ෂි අංක 01)",
                text: "'දියඇලි නිම්නයේ ගැඹුරු ගංගාව හරහා යාමට උණ බම්බු පහුර හෝ කේබල් කරත්තය භාවිතා කරන්න. එහා ඉවුරේ පිහිටි පැරණි පතල තුළ රහස් ස්ඵටිකයක් ඇත!'",
                item: "භූවිද්‍යා සිතියම (Evidence 1)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "bamboo_raft",
          x: 820,
          y: 980,
          radius: 45,
          title: "උණ බම්බු පහුර (Bamboo Raft)",
          prompt: "[E] පහුර පදවන්න",
          icon: "🎋",
          action: () => {
            if (!this.raft.riding) {
              this.raft.riding = true;
              this.tasks.raftUsed = true;
              this.playSfx("splash");
              this.triggerScreenShake(4, 0.4);
              if (this.raft.state === "north") {
                this.raft.targetY = 1320;
                this.raft.state = "south";
                this.cb.onNotify("🎋 උණ බම්බු පහුර දියවැල් මැදින් දකුණු ඉවුරට පාවී යයි...");
              } else {
                this.raft.targetY = 980;
                this.raft.state = "north";
                this.cb.onNotify("🎋 උණ බම්බු පහුර උතුරු ඉවුරට පාවී යයි...");
              }
            }
          },
        },
        {
          id: "cable_trolley",
          x: 1800,
          y: 920,
          radius: 48,
          title: "අගාධ කේබල් කරත්තය (Cable Trolley)",
          prompt: "[E] කරත්තය ක්‍රියාත්මක කරන්න",
          icon: "🚠",
          action: () => {
            if (!this.cableway.repaired) {
              if (this.hasGears) {
                this.cableway.repaired = true;
                this.playSfx("gear_turn");
                this.cb.onNotify("⚙️ දැති රෝද සවි කර කේබල් කරත්තය අලුත්වැඩියා කරන ලදී!");
                if (this.cb.onAchievementUnlocked) {
                  this.cb.onAchievementUnlocked("cable_mechanic", "කේබල් කාර්මිකයා (Cableway Mechanic)", "🚠");
                }
              } else {
                this.playSfx("hurt");
                this.cb.onNotify("⚠️ කේබල් කරත්තයේ ගියර් පෙට්ටිය කැඩී ඇත! භූවිද්‍යා වැඩ මේසයෙන් ගියර් සොයාගන්න.");
                return;
              }
            }

            if (!this.cableway.riding) {
              this.cableway.riding = true;
              this.tasks.cableUsed = true;
              this.playSfx("cable_creak");
              this.triggerScreenShake(6, 0.6);
              if (this.cableway.state === "north") {
                this.cableway.targetY = 1340;
                this.cableway.state = "south";
                this.cb.onNotify("🚠 කේබල් කරත්තය ගිරි අගාධය හරහා දකුණු ඉවුරට ගමන් කරයි...");
              } else {
                this.cableway.targetY = 920;
                this.cableway.state = "north";
                this.cb.onNotify("🚠 කේබල් කරත්තය උතුරු ඉවුරට ආපසු පැමිණෙයි...");
              }
            }
          },
        },
        {
          id: "hot_spring_basin",
          x: 1350,
          y: 420,
          radius: 35,
          title: "උණුදිය උල්පත (Geothermal Spring)",
          prompt: "[E] උණුදියෙන් නාන්න",
          icon: "♨️",
          action: () => {
            this.temperature = 100;
            this.health = Math.min(100, this.health + 30);
            this.player.stamina = 100;
            this.playSfx("heal");
            this.cb.onNotify("♨️ ස්වභාවික උණුදියෙන් ශරීරය සම්පූර්ණයෙන්ම උණුසුම් විය! (Warmth 100% | Health +30)");
          },
        },
        {
          id: "audio_cassette",
          x: 1800,
          y: 1750,
          radius: 35,
          title: "තෙතබරිත කැසට් පටිය",
          prompt: "[E] අසන්න",
          icon: "📼",
          picked: false,
          action: (obj) => {
            if (!obj.picked) {
              obj.picked = true;
              this.tasks.tapeFound = true;
              this.playSfx("radio");
              this.cb.onTriggerStory({
                title: "හඬ පටයේ අවසාන පණිවිඩය (සාක්ෂි අංක 02)",
                text: "'(ශ්‍රව්‍ය පටය): ...අපිට මෙහි තිබී අද්භූත ස්ඵටිකයක් හමුවුණා! එයින් සුවිශේෂී ශක්තියක් පිටවෙනවා... කවුරුන් හෝ මෙය අසන්නේ නම්, කඳු මුදුනේ මුරකුළුණෙන් රතු සංඥා එළිය දල්වන්න!'",
                item: "අභිරහස් කැසට් පටිය (Evidence 2)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "mine_cart_cache",
          x: 2150,
          y: 1550,
          radius: 35,
          title: "පැරණි පතල් කරත්තය",
          prompt: "[E] පරීක්ෂා කරන්න",
          icon: "🛒",
          opened: false,
          action: (obj) => {
            if (!obj.opened) {
              obj.opened = true;
              this.gingerTeaCount += 2;
              this.saltCount += 2;
              this.playSfx("pickup");
              this.cb.onNotify("🛒 පතල් කරත්තයෙන් ඉඟුරු තේ x2 සහ ලුණු x2 හමුවිය!");
            } else {
              this.cb.onNotify("මෙම පතල් කරත්තය දැනටමත් පරීක්ෂා කර ඇත.");
            }
          },
        },
        {
          id: "crystal_core",
          x: 2400,
          y: 1500,
          radius: 40,
          title: "නිල් මැණික් ස්ඵටික සාම්පලය",
          prompt: "[E] අහුලාගන්න",
          icon: "💎",
          picked: false,
          action: (obj) => {
            if (!obj.picked) {
              obj.picked = true;
              this.tasks.gemFound = true;
              this.playSfx("crystal_hum");
              this.playSfx("pickup");
              this.triggerScreenShake(5, 0.4);
              this.cb.onTriggerStory({
                title: "සිංහරාජයේ හදවත: නිල් ස්ඵටිකය (සාක්ෂි අංක 03)",
                text: "පතල ඇතුළතින් නිල් පැහැයෙන් දිදුලන පුරාණ ස්ඵටික සාම්පලය ඔබට හමුවිය! සියලු සාක්ෂි සම්පූර්ණයි! දැන් කඳු මුදුනේ සංඥා කුලුන වෙත ගොස් සංඥා කරන්න!",
                item: "නිල් ස්ඵටිකය (Evidence 3)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "signal_tower",
          x: 2850,
          y: 1900,
          radius: 65,
          title: "කඳු මුදුනේ මුරකුළුණ",
          prompt: "[E] සංඥා එළිය දල්වන්න",
          icon: "🗼",
          action: () => {
            this.tasks.towerReached = true;
            this.playSfx("pickup");
            const allEvidence = this.tasks.mapFound && this.tasks.tapeFound && this.tasks.gemFound;
            if (this.cb.onGameWon) {
              this.cb.onGameWon(allEvidence ? "hero" : "survivor");
            }
          },
        },
      ];

      this.items = [
        { x: 420, y: 520, type: "ginger_tea", name: "ඉඟුරු තේ (Ginger Tea)", icon: "🫖" },
        { x: 920, y: 580, type: "herb", name: "සුවදායක පැළෑටිය", icon: "🌿" },
        { x: 1200, y: 1500, type: "ginger_tea", name: "ඉඟුරු තේ (Ginger Tea)", icon: "🫖" },
        { x: 1900, y: 1650, type: "ginger_tea", name: "ඉඟුරු තේ (Ginger Tea)", icon: "🫖" },
        { x: 2600, y: 1600, type: "herb", name: "කඳුකර ඔසු පැළය", icon: "🌿" },
      ];

      this.leeches = []; // NO leeches in Chapter 2!
      return;
    }

    if (this.chapter === 3) {
      // ═══════════════════════════════════════════════════════════════════════
      // CHAPTER 03: THE SUBTERRANEAN CAVERNS (යක්ෂ ගිරි භූගත අගාධය)
      // ═══════════════════════════════════════════════════════════════════════
      this.waterZones = [
        { x: 980, y: 0, w: 260, h: 2400, name: "භූගත ප්‍රාග් ඓතිහාසික ගංගාව (Subterranean River)" },
        { x: 1400, y: 1300, w: 500, h: 350, name: "ගිලීගිය ශුද්ධ භූමිය (Sunken Cavern Shrine)" },
      ];

      this.steppingStones = [
        { x: 1010, y: 850, r: 26 },
        { x: 1070, y: 850, r: 26 },
        { x: 1140, y: 850, r: 26 },
        { x: 1210, y: 850, r: 26 },
      ];

      this.obstacles = [
        // Stalagmite clusters & abyss drops
        { x: 850, y: 400, r: 65 },
        { x: 1550, y: 450, r: 75 },
        { x: 850, y: 1500, r: 80 },
        { x: 2150, y: 1050, r: 85 },
        // Chasm walls
        { x: 970, y: 0, w: 15, h: 750 },
        { x: 970, y: 950, w: 15, h: 1450 },
        { x: 1240, y: 0, w: 15, h: 750 },
        { x: 1240, y: 950, w: 15, h: 1450 },
      ];

      this.interactiveObjects = [
        {
          id: "cavern_sign",
          x: 420,
          y: 460,
          radius: 28,
          title: "ලෙන් පුවරුව",
          prompt: "[E] කියවන්න",
          icon: "🪧",
          action: () => {
            this.playSfx("blip");
            this.cb.onNotify("🪧 [යක්ෂ ගිරි ලෙන් සංකීර්ණය: විෂ වායු හා කටු උගුල් වලින් ප්‍රවේශම් වන්න!]");
          },
        },
        {
          id: "ch3_ancient_slate",
          x: 650,
          y: 550,
          radius: 36,
          title: "පුරාණ ශිලා ලේඛනය (Ancient Inscription)",
          prompt: "[E] කියවන්න & පිටපත් කරන්න",
          icon: "📜",
          picked: false,
          action: (obj) => {
            if (!obj.picked) {
              obj.picked = true;
              this.tasks.slateFound = true;
              this.playSfx("pickup");
              this.cb.onTriggerStory({
                title: "ප්‍රාග් ඓතිහාසික ශිලා ලේඛනය (සාක්ෂි අංක 01)",
                text: "'වසර දහස් ගණනකට පෙර ලෙන තුළ පූජනීය නිල්-දම් ස්ඵටිකයක් තැන්පත් කර ඇත. විෂ වායු ගලන කුහරය පසුකර යාමට වායු මුහුණු ආවරණය (Gas Mask) පළඳින්න. සොරොව් චක්‍රය කරකවා ජලය බැස යාමට සලස්වන්න...'",
                item: "ශිලා ලේඛන පිටපත (Evidence 1)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "ch3_gas_mask_cache",
          x: 920,
          y: 620,
          radius: 35,
          title: "පැරණි පතල් වායු මුහුණු ආවරණය (Gas Mask)",
          prompt: "[E] ලබාගන්න",
          icon: "🎭",
          picked: false,
          action: (obj) => {
            if (!obj.picked) {
              obj.picked = true;
              this.hasGasMask = true;
              this.tasks.maskFound = true;
              this.playSfx("pickup");
              this.cb.onTriggerStory({
                title: "පතල් වායු මුහුණු ආවරණය (Gas Mask)",
                text: "1987 පතල් කම්කරුවන් භාවිත කළ වායු මුහුණු ආවරණයක් හමුවිය! දැන් විෂ සල්ෆර් වායුවෙන් ශරීරයට හානියක් සිදු නොවේ.",
                item: "Miner's Gas Mask [Equipped]",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "ch3_floodgate_wheel",
          x: 1450,
          y: 650,
          radius: 38,
          title: "භූගත සොරොව් චක්‍රය (Floodgate Wheel)",
          prompt: "[E] සොරොව්ව කරකවන්න",
          icon: "⚙️",
          turned: false,
          action: (obj) => {
            if (!obj.turned) {
              obj.turned = true;
              this.floodgateOpen = true;
              this.tasks.floodgateUsed = true;
              this.playSfx("gear_turn");
              this.triggerScreenShake(7, 0.6);
              this.cb.onNotify("🌊 සොරොව්ව විවෘත විය! ගිලීගිය ලෙන් කුටියේ ජල මට්ටම පහත බසී...");
              if (this.cb.onAutosave) this.cb.onAutosave();
            } else {
              this.cb.onNotify("සොරොව්ව දැනටමත් සම්පූර්ණයෙන්ම විවෘත කර ඇත.");
            }
          },
        },
        {
          id: "ch3_resonance_crystal",
          x: 1650,
          y: 1450,
          radius: 40,
          title: "ප්‍රතිදීප්ත අගාධ පාෂාණය (Resonance Crystal)",
          prompt: "[E] අහුලාගන්න",
          icon: "🔮",
          picked: false,
          action: (obj) => {
            if (!obj.picked) {
              obj.picked = true;
              this.tasks.coreFound = true;
              this.playSfx("crystal_hum");
              this.playSfx("pickup");
              this.triggerScreenShake(6, 0.5);
              this.cb.onTriggerStory({
                title: "ප්‍රතිදීප්ත අගාධ පාෂාණය (සාක්ෂි අංක 02)",
                text: "දම් පැහැති දීප්තියෙන් හා ගුප්ත හඬකින් යුතු ප්‍රාග් ඓතිහාසික පාෂාණ සාම්පලය ඔබට හමුවිය! මෙහි ශක්තිය ඉදිරියෙන් ඇති පර්යේෂණාගාරයට සම්බන්ධ බව පෙනේ.",
                item: "ප්‍රතිදීප්ත පාෂාණය (Evidence 2)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "ch3_miner_log",
          x: 2350,
          y: 1550,
          radius: 35,
          title: "1987 පතල් කම්කරු සටහන & ඔක්සිජන් කට්ටලය",
          prompt: "[E] පරීක්ෂා කරන්න",
          icon: "🪔",
          picked: false,
          action: (obj) => {
            if (!obj.picked) {
              obj.picked = true;
              this.tasks.logFound = true;
              this.playSfx("pickup");
              this.cb.onTriggerStory({
                title: "අවසාන පතල් වාර්තාව (සාක්ෂි අංක 03)",
                text: "'1987 නොවැම්බර් 20: අපි ලෙන් අගාධයේ ඉහළට විහිදෙන රහස් විද්‍යාගාරයක් සොයාගත්තා... හයිඩ්‍රොලික් ලිෆ්ට් එකෙන් ඉහළට යා හැක. සියලු දොරවල් සීල් කර ඇත...'",
                item: "පතල් කම්කරු සටහන (Evidence 3)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "cavern_elevator",
          x: 2800,
          y: 1850,
          radius: 65,
          title: "භූගත එසවුම් යන්ත්‍රය (Hydraulic Lift)",
          prompt: "[E] ලිෆ්ට් එක ක්‍රියාත්මක කරන්න",
          icon: "🛗",
          action: () => {
            this.tasks.elevatorReached = true;
            this.playSfx("cable_creak");
            this.triggerScreenShake(8, 0.8);
            const allEvidence = this.tasks.slateFound && this.tasks.coreFound && this.tasks.logFound;
            if (this.cb.onGameWon) {
              this.cb.onGameWon(allEvidence ? "hero" : "survivor");
            }
          },
        },
      ];

      this.items = [
        { x: 520, y: 480, type: "herb", name: "ලෙන් දිලීර ඔසුව", icon: "🍄" },
        { x: 1350, y: 600, type: "herb", name: "ලෙන් දිලීර ඔසුව", icon: "🍄" },
        { x: 1950, y: 1400, type: "herb", name: "ලෙන් දිලීර ඔසුව", icon: "🍄" },
        { x: 2500, y: 1600, type: "ginger_tea", name: "උණුසුම් පානය", icon: "🫖" },
      ];

      this.leeches = [];
      return;
    }

    if (this.chapter === 4) {
      // ═══════════════════════════════════════════════════════════════════════
      // CHAPTER 04: THE FORGOTTEN FACILITY (නටබුන් වූ රහස් පර්යේෂණාගාරය)
      // ═══════════════════════════════════════════════════════════════════════
      this.waterZones = [
        { x: 1100, y: 800, w: 320, h: 220, name: "විදුලි සැර වැදුණු ජල තටාකය (Electrified Pool)" },
      ];

      this.obstacles = [
        // Metal corridors & containment rooms
        { x: 900, y: 0, w: 25, h: 750 },
        { x: 900, y: 1050, w: 25, h: 1350 },
        { x: 1700, y: 0, w: 25, h: 1100 },
        { x: 1700, y: 1350, w: 25, h: 1050 },
        { x: 1450, y: 500, r: 60 },
        { x: 2250, y: 1100, r: 75 },
      ];

      this.interactiveObjects = [
        {
          id: "facility_sign",
          x: 420,
          y: 460,
          radius: 28,
          title: "විද්‍යාගාර පුවරුව",
          prompt: "[E] කියවන්න",
          icon: "🪧",
          action: () => {
            this.playSfx("blip");
            this.cb.onNotify("🪧 [PROJECT SINHARAJA 1987 // MILITARY BIO-LAB B-4]");
          },
        },
        {
          id: "facility_generator",
          x: 650,
          y: 420,
          radius: 40,
          title: "ප්‍රධාන ඩීසල් ජෙනරේටරය (Main Generator)",
          prompt: "[E] ජෙනරේටරය පණගන්වන්න",
          icon: "⚡",
          powered: false,
          action: (obj) => {
            if (!obj.powered) {
              obj.powered = true;
              this.generatorPowered = true;
              this.tasks.generatorFixed = true;
              this.playSfx("recharge");
              this.triggerScreenShake(6, 0.6);
              this.cb.onNotify("⚡ ප්‍රධාන ජෙනරේටරය පණගැන්විණි! විද්‍යාගාරයේ විදුලි පහන් දැල්වෙයි.");
              if (this.cb.onAutosave) this.cb.onAutosave();
            } else {
              this.cb.onNotify("ජෙනරේටරය දැනටමත් පූර්ණ ධාරිතාවෙන් ක්‍රියාත්මකයි.");
            }
          },
        },
        {
          id: "facility_terminal",
          x: 850,
          y: 650,
          radius: 35,
          title: "ප්‍රධාන පරිගණක පර්යන්තය (Mainframe Terminal)",
          prompt: "[E] ලිපිගොනු කියවන්න",
          icon: "📁",
          read: false,
          action: (obj) => {
            if (!obj.read) {
              obj.read = true;
              this.tasks.docsFound = true;
              this.playSfx("pickup");
              this.cb.onTriggerStory({
                title: "1987 රහස් ව්‍යාපෘති ලිපිගොනු (සාක්ෂි අංක 01)",
                text: "'ව්‍යාපෘති වාර්තාව 87-B: සිංහරාජයේ රහස් ලෙනෙන් ලබාගත් ස්ඵටිකය මඟින් දුර්ලභ විකෘති DNA සාම්පලයක් ජනනය කෙරුණි. විද්‍යාගාර ප්‍රවේශ කාඩ්පත (Keycard) ප්‍රධාන මේසය මත ඇත. සාම්පලය රැගෙන වියන් මොනොරේල් වෙත යන්න...'",
                item: "රහස් ලිපිගොනුව (Evidence 1)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "facility_breaker",
          x: 1050,
          y: 720,
          radius: 35,
          title: "විදුලි විසන්ධිකාරකය (Breaker Switch)",
          prompt: "[E] ස්විචය ක්‍රියාවිරහිත කරන්න",
          icon: "🔌",
          pulled: false,
          action: (obj) => {
            if (!obj.pulled) {
              obj.pulled = true;
              this.breakerOff = true;
              this.tasks.breakerPulled = true;
              this.playSfx("gear_turn");
              this.cb.onNotify("🔌 විදුලි ධාරාව විසන්ධි විය! ජල තටාකය හරහා දැන් ආරක්ෂිතව යා හැක.");
              if (this.cb.onAutosave) this.cb.onAutosave();
            } else {
              this.cb.onNotify("විදුලි ස්විචය දැනටමත් ක්‍රියාවිරහිත කර ඇත.");
            }
          },
        },
        {
          id: "facility_keycard",
          x: 1350,
          y: 620,
          radius: 35,
          title: "විද්‍යාගාර ප්‍රවේශ කාඩ්පත (Level 3 Keycard)",
          prompt: "[E] අහුලාගන්න",
          icon: "💳",
          picked: false,
          action: (obj) => {
            if (!obj.picked) {
              obj.picked = true;
              this.hasKeycard = true;
              this.tasks.keycardFound = true;
              this.playSfx("pickup");
              this.cb.onTriggerStory({
                title: "Level 3 ආරක්ෂක ප්‍රවේශ කාඩ්පත (සාක්ෂි අංක 02)",
                text: "විද්‍යාගාරයේ ක්‍රයෝ-පර්යේෂණ කුටිය සහ මොනොරේල් වායු අගුළුව (Airlock) විවෘත කළ හැකි විද්‍යුත් කාඩ්පතක් හමුවිය!",
                item: "Level 3 Keycard (Evidence 2)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "facility_cryo",
          x: 2350,
          y: 1350,
          radius: 40,
          title: "ක්‍රයෝ-පර්යේෂණ කුටිය (Cryo Containment)",
          prompt: "[E] සාම්පලය ලබාගන්න",
          icon: "🧬",
          picked: false,
          action: (obj) => {
            if (!this.hasKeycard) {
              this.playSfx("hurt");
              this.cb.onNotify("⚠️ ප්‍රවේශය ප්‍රතික්ෂේප විය! Level 3 ප්‍රවේශ කාඩ්පත (Keycard) අවශ්‍යයි.");
              return;
            }
            if (!obj.picked) {
              obj.picked = true;
              this.tasks.dnaFound = true;
              this.playSfx("crystal_hum");
              this.playSfx("pickup");
              this.triggerScreenShake(6, 0.5);
              this.cb.onTriggerStory({
                title: "විකෘති DNA සාම්පලය (සාක්ෂි අංක 03)",
                text: "වසර 30ක් සුරක්ෂිතව පැවති ජෛව විද්‍යාත්මක සාම්පලය ඔබට ලැබුණි! සියලු සාක්ෂි සම්පූර්ණයි. දැන් අවසාන මොනොරේල් දොරටුව වෙත යන්න!",
                item: "විකෘති DNA සාම්පලය (Evidence 3)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "facility_monorail",
          x: 2850,
          y: 1850,
          radius: 65,
          title: "වියන් මොනොරේල් පිවිසුම (Canopy Airlock)",
          prompt: "[E] දොර අරින්න",
          icon: "🚇",
          action: () => {
            this.tasks.monorailReached = true;
            this.playSfx("pickup");
            const allEvidence = this.tasks.docsFound && this.tasks.keycardFound && this.tasks.dnaFound;
            if (this.cb.onGameWon) {
              this.cb.onGameWon(allEvidence ? "hero" : "survivor");
            }
          },
        },
      ];

      this.items = [
        { x: 550, y: 550, type: "herb", name: "හදිසි ප්‍රථමාධාර කට්ටලය", icon: "💊" },
        { x: 1250, y: 580, type: "herb", name: "හදිසි ප්‍රථමාධාර කට්ටලය", icon: "💊" },
        { x: 2100, y: 1300, type: "ginger_tea", name: "ශක්තිජනක පානය", icon: "🥤" },
      ];

      this.leeches = [];
      return;
    }

    if (this.chapter === 5) {
      // ═══════════════════════════════════════════════════════════════════════
      // CHAPTER 05: THE COLOSSUS CANOPY & FINAL TRUTH (මහා නාවෘක්ෂය)
      // ═══════════════════════════════════════════════════════════════════════
      this.waterZones = []; // No water on tree branches!

      this.steppingStones = [];

      this.obstacles = [
        // Huge Colossus tree trunks
        { x: 750, y: 600, r: 85 },
        { x: 1750, y: 1200, r: 90 },
        { x: 2350, y: 1450, r: 85 },
      ];

      this.interactiveObjects = [
        {
          id: "canopy_sign",
          x: 420,
          y: 460,
          radius: 28,
          title: "වියන් මාවත පුවරුව",
          prompt: "[E] කියවන්න",
          icon: "🪧",
          action: () => {
            this.playSfx("blip");
            this.cb.onNotify("🪧 [මහා නාවෘක්ෂ වියන් මාවත: උස මීටර් 60යි (අඩි 190ක්). ලණු පාලම් මතින් පමණක් යන්න!]");
          },
        },
        {
          id: "canopy_blackbox",
          x: 750,
          y: 550,
          radius: 38,
          title: "ගවේෂණ කළු පෙට්ටිය (Expedition Blackbox)",
          prompt: "[E] ලබාගන්න",
          icon: "📦",
          picked: false,
          action: (obj) => {
            if (!obj.picked) {
              obj.picked = true;
              this.tasks.blackboxFound = true;
              this.playSfx("pickup");
              this.cb.onTriggerStory({
                title: "ගවේෂණ කළු පෙට්ටිය (සාක්ෂි අංක 01)",
                text: "'ෆ්ලයිට් රෙකෝඩරය: 1987 ගවේෂණ කණ්ඩායමේ හෙලිකොප්ටරය අනතුරට පත් වූ මොහොතේ සම්පූර්ණ ටෙලිමෙට්‍රි දත්ත මෙහි සුරක්ෂිතව ඇත!'",
                item: "ගවේෂණ කළු පෙට්ටිය (Evidence 1)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "canopy_bridge_1",
          x: 1200,
          y: 850,
          radius: 45,
          title: "සුළඟට පැද්දෙන ලණු පාලම (Rope Bridge)",
          prompt: "[E] පාලම තරණය කරන්න",
          icon: "🌉",
          crossed: false,
          action: (obj) => {
            obj.crossed = true;
            this.tasks.bridgeCrossed = true;
            this.playSfx("step_wood");
            this.triggerScreenShake(5, 0.5);
            this.cb.onNotify("🌉 ඔබ යෝධ ලණු පාලම මතින් සුළං කලාපය සාර්ථකව තරණය කරන ලදී!");
          },
        },
        {
          id: "canopy_douglas_hideout",
          x: 1750,
          y: 1150,
          radius: 38,
          title: "මහාචාර්ය ඩග්ලස්ගේ අවසාන සටහන (Final Confession)",
          prompt: "[E] කියවන්න",
          icon: "📜",
          read: false,
          action: (obj) => {
            if (!obj.read) {
              obj.read = true;
              this.tasks.truthFound = true;
              this.playSfx("pickup");
              this.cb.onTriggerStory({
                title: "මහාචාර්ය ඩග්ලස්ගේ අවසාන පාපොච්චාරණය (සාක්ෂි අංක 02)",
                text: "'මම මහාචාර්ය ඩග්ලස්... සිංහරාජයේ රහස ලෝකයෙන් සඟවා තැබුවේ එහි පාරිසරික පාරිශුද්ධත්වය රැකීමටයි. එමෙන්ම විකෘති පැළෑටියෙන් මිනිසාට සුව කළ හැකි ඖෂධීය වට්ටෝරුව මම මෙහි සටහන් කළෙමි. දැන් සැටලයිට් ඇන්ටනාව ඔස්සේ මෙය ලෝකයට මුදාහරින්න!'",
                item: "අවසාන පාපොච්චාරණය & ඖෂධ වට්ටෝරුව (Evidence 2)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "canopy_satellite_antenna",
          x: 2350,
          y: 1400,
          radius: 40,
          title: "සැටලයිට් සම්ප්‍රේෂක ඇන්ටනාව (Satellite Uplink)",
          prompt: "[E] ඇන්ටනාව පෙළගස්වන්න",
          icon: "📡",
          aligned: false,
          action: (obj) => {
            if (!obj.aligned) {
              obj.aligned = true;
              this.tasks.beaconActivated = true;
              this.playSfx("radio");
              this.triggerScreenShake(6, 0.4);
              this.cb.onTriggerStory({
                title: "සැටලයිට් සම්ප්‍රේෂණය සාර්ථකයි! (සාක්ෂි අංක 03)",
                text: "සැටලයිට් සංඥාව කක්ෂගත චන්ද්‍රිකාව හා සම්බන්ධ විය! 1987 රහස් ලිපිගොනු සහ ඩග්ලස්ගේ වට්ටෝරුව මුළු ලෝකයටම විකාශනය විය. දැන් අවසාන මුරකුළුණ වෙත ගොස් ගැලවුම් යානය අමතන්න!",
                item: "සැටලයිට් බීකනය [Active] (Evidence 3)",
              });
              if (this.cb.onAutosave) this.cb.onAutosave();
            }
          },
        },
        {
          id: "canopy_skyhook_tower",
          x: 2850,
          y: 1850,
          radius: 70,
          title: "මහා නාවෘක්ෂ මුරකුළුණ (Grand Observation Tower)",
          prompt: "[E] අවසාන ගැලවුම් සංඥාව දල්වන්න",
          icon: "🗼",
          action: () => {
            this.tasks.skyhookReached = true;
            this.playSfx("pickup");
            const allEvidence = this.tasks.blackboxFound && this.tasks.truthFound && this.tasks.beaconActivated;
            if (this.cb.onGameWon) {
              this.cb.onGameWon(allEvidence ? "hero" : "survivor");
            }
          },
        },
      ];

      this.items = [
        { x: 500, y: 500, type: "herb", name: "වියන් පලතුරු ඔසුව", icon: "🍎" },
        { x: 1300, y: 880, type: "ginger_tea", name: "උණුසුම් ඉඟුරු තේ", icon: "🫖" },
        { x: 2150, y: 1350, type: "ginger_tea", name: "උණුසුම් ඉඟුරු තේ", icon: "🫖" },
      ];

      this.leeches = [];
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAPTER 01: THE KUDAWA TRAILHEAD (කුඩව අඳුරු මාවත)
    // ═══════════════════════════════════════════════════════════════════════
    // 1. Water zones (Rivers, Streams, Rapids)
    this.waterZones = [
      { x: 750, y: 0, w: 220, h: 1800, name: "මහ ගංගා නිම්නය (The Grand River Rapids)" },
      { x: 970, y: 1500, w: 900, h: 200, name: "දියඇලි ඇළ (Waterfall Stream)" },
    ];

    // Stepping stones across the river
    this.steppingStones = [
      { x: 780, y: 700, r: 24 },
      { x: 860, y: 720, r: 26 },
      { x: 940, y: 690, r: 24 },
    ];

    // Fallen Giant Tree Log Bridges (Natural shortcuts avoiding water/mud & leeches)
    this.logBridges = [
      { x1: 740, y1: 520, x2: 980, y2: 520, width: 34, name: "උතුරු හොර ගස් පාලම (North Fallen Log)" },
      { x1: 740, y1: 1240, x2: 980, y2: 1240, width: 34, name: "වගුරු ගස් පාලම (Swamp Fallen Log)" },
    ];

    // Tree Blaze Markings (Ranger navigational guide carvings)
    this.treeBlazes = [
      { x: 380, y: 220, text: "➡️ මුරපොළ මීටර් 180" },
      { x: 680, y: 520, text: "➡️ ගස් පාලම & ඔරු තොට මීටර් 120" },
      { x: 1100, y: 380, text: "➡️ පුරාණ ලෙන මීටර් 200" },
      { x: 1550, y: 780, text: "➡️ හෙලිපෑඩ් මීටර් 350" },
    ];

    // 1987 Expedition Glowing UV Footprints Trail (Outpost -> Bridge -> Cave)
    this.uvFootprints = [
      { x: 500, y: 720 },
      { x: 580, y: 700 },
      { x: 660, y: 640 },
      { x: 740, y: 550 },
      { x: 860, y: 520 }, // over first log bridge
      { x: 980, y: 520 },
      { x: 1080, y: 560 },
      { x: 1220, y: 680 },
      { x: 1380, y: 840 },
      { x: 1540, y: 990 },
      { x: 1680, y: 1080 },
      { x: 1730, y: 1120 }, // to cave entrance!
    ];

    // Secret Ancient Glyphs visible under UV light near cave gate
    this.uvGlyphs = [
      { x: 1670, y: 1070, text: "☀️ 1. සූර්යයා (THE SUN)" },
      { x: 1730, y: 1055, text: "🌊 2. ගංගාව (THE RIVER)" },
      { x: 1790, y: 1070, text: "🦁 3. සිංහයා (THE LION)" },
    ];

    // Illuminated Trail Cairn Stone Markers (Directional stone piles with moss & UV runes)
    this.trailCairns = [
      { x: 490, y: 460, name: "මුරපොළ මාවත ➡️", uvArrow: "OUTPOST // 120m" },
      { x: 820, y: 520, name: "ගංගා නිම්නය ➡️", uvArrow: "RIVER TRAIL // 200m" },
      { x: 960, y: 690, name: "ගස් කොටන් පාලම ➡️", uvArrow: "LOG BRIDGE // SAFE ROUTE" },
      { x: 1530, y: 980, name: "රහස් ගල් ලෙන ➡️", uvArrow: "RUNIC CAVE // 150m" },
      { x: 2220, y: 1460, name: "හෙලිපෑඩ් කඳු මුදුන ➡️", uvArrow: "HELIPAD SUMMIT // 300m" },
    ];

    // 2. Obstacles (Boulders, Giant Trees, Cabin Walls)
    this.obstacles = [
      // Outpost cabin walls
      { x: 420, y: 650, w: 220, h: 15 },
      { x: 420, y: 650, w: 15, h: 180 },
      { x: 625, y: 650, w: 15, h: 180 },
      { x: 420, y: 820, w: 90, h: 15 },
      { x: 550, y: 820, w: 90, h: 15 },
      // Big boulders
      { x: 1200, y: 350, r: 60 },
      { x: 1450, y: 620, r: 75 },
      { x: 1950, y: 400, r: 90 },
      { x: 2200, y: 800, r: 110 },
      // Cave entrance rocks
      { x: 1600, y: 1100, w: 300, h: 40 },
      { x: 1600, y: 1100, w: 40, h: 250 },
      { x: 1860, y: 1100, w: 40, h: 250 },
    ];

    // 3. Interactive Objects
    this.interactiveObjects = [
      {
        id: "gunadasa_npc",
        x: this.npc.x,
        y: this.npc.y,
        radius: 35,
        title: "ගුණදාස මාමා",
        prompt: "[E] කතා කරන්න",
        icon: "🧙‍♂️",
        action: () => {
          if (!this.npc.helped) {
            this.npc.helped = true;
            this.saltCount += 3;
            this.herbCount += 2;
            this.balmCount += 1;
            this.playSfx("pickup");
            this.cb.onTriggerStory({
              title: "පැරණි වන පාලක ගුණදාස මාමා",
              text: "'ආයුබෝවන් මහත්තයෝ! මම වසර 40ක් මේ සිංහරාජයේ රාජකාරි කළ පැරණි වන පාලක ගුණදාස. 1987 අතුරුදහන් වූ ඩග්ලස්ගේ කණ්ඩායමත් ගියේ ඔය ගංගාවෙන් එහා පැත්තේ ලෙන හොයාගෙන තමයි! මං ගාව තිබ්බ ලුණු, සුවදායක ඔසු කොළ වගයකුයි කූඩැලි විකර්ෂක වන තෙල් බෝතලයකුයි (Balm) මම ඔයාට දෙන්නම්! [B] ඔබලා තෙල් ගෑවම කූඩැල්ලෝ ළඟට එන්නේ නෑ. [C] ඔබලා කැහිබෙල්ලා සහ වනජීවීන්ගේ ඡායාරූප ගන්න! ගඟෙන් එතෙර වෙන්න හොර ගස් පාලම (Log Bridge) පාවිච්චි කරන්න!'",
              item: "ලුණු x3 | ඖෂධ x2 | කූඩැලි තෙල් x1 | කැමරාව",
              avatar: "🧙‍♂️",
              speaker: "GUNADASA MAMA (RANGER)",
            });
          } else if (this.tasks.sampleFound) {
            this.cb.onTriggerStory({
              title: "ගුණදාස මාමාගේ අවසන් මඟපෙන්වීම",
              text: "'බුදු සරණයි මහත්තයෝ! ඔබ ඒ අභිරහස් දිලීර සාම්පලය සොයාගත්තා නේද! දැන් ප්‍රමාද වෙන්න එපා. කුණාටුව දරුණු වෙනවා. වහාම කඳු මුදුනේ ඇති හෙලිපෑඩ් වෙත ගොස් [E] ඔබා සංඥා වෙඩිල්ල (Flare) අහසට දල්වන්න! Chopper-01 ඔබව බේරාගන්න පැමිණේවි!'",
              avatar: "🧙‍♂️",
              speaker: "GUNADASA MAMA (RANGER)",
            });
          } else if (this.tasks.keyFound) {
            this.cb.onTriggerStory({
              title: "ගුණදාස මාමාගේ හදිසි අවවාදය",
              text: "'මහත්තයෝ, ඔය අකුණු ගහන්නේ ගංගා නිම්නය පිටාර ගලන පෙරනිමිති! ජල මට්ටම වැඩි නිසා වතුරට බහින්න එපා. උතුරු හොර ගස් කොටන් පාලම (Log Bridge) මතින් ගල් ලෙනට යන්න. ලෙන් දොරටුවේ රහස් සංකේත තුන දිනපොතේ තිබුණා නේද? සූර්යයා, ගංගාව, සිංහයා!'",
              avatar: "🧙‍♂️",
              speaker: "GUNADASA MAMA (RANGER)",
            });
          } else if (this.tasks.diaryFound) {
            this.cb.onTriggerStory({
              title: "ගුණදාස මාමාගේ හෝඩුවාව",
              text: "'ඩග්ලස්ගේ දිනපොත හමුවුණාද? ඔව්, ඔවුන් ලෙන අගුළු ලා තිබෙනවා. යතුර ගංගා ඉවුරේ ඔරු තොට අසල සැඟවූ බවක් මතකයි. එතැනට ගොස් පරීක්ෂා කරන්න. UV කාචය [U] ක්‍රියාත්මක කර බැලුවොත් ඔවුන්ගේ පා සටහන් පෙනේවි!'",
              avatar: "🧙‍♂️",
              speaker: "GUNADASA MAMA (RANGER)",
            });
          } else {
            this.cb.onTriggerStory({
              title: "ගුණදාස මාමාගේ උපදෙස",
              text: "'මහන්සි නම් කඳවුරේ කූඩාරම (Tent) අස්සට ගිහින් නිදාගන්න, Health & Sanity සම්පූර්ණ වෙනවා. මුරපොළේ සූර්ය කෝෂයෙන් ටෝච් එකේ බැටරියත් Charge කරගන්න පුළුවන්. මුලින්ම මුරපොළ කුටියට ගොස් දිනපොත හා උපකරණ සොයාගන්න!'",
              avatar: "🧙‍♂️",
              speaker: "GUNADASA MAMA (RANGER)",
            });
          }
        },
      },
      {
        id: "kudawa_camp_tent",
        x: 180,
        y: 280,
        radius: 38,
        title: "කඳවුරු කූඩාරම (Expedition Tent)",
        prompt: "[E] විවේක ගන්න",
        icon: "⛺",
        action: () => {
          this.health = 100;
          this.sanity = 100;
          this.player.stamina = 100;
          this.bleeding = false;
          this.playSfx("heal");
          this.cb.onNotify("⛺ කූඩාරම තුළ විවේක ගත්තා! Health & Sanity පූර්ණ විය (100%).");
          if (this.cb.onAutosave) this.cb.onAutosave();
        },
      },
      {
        id: "outpost_solar_charger",
        x: 615,
        y: 810,
        radius: 32,
        title: "සූර්ය කෝෂ ආරෝපකය (Solar Charger)",
        prompt: "[E] බැටරි ආරෝපණය",
        icon: "🔋",
        action: () => {
          this.battery = 100;
          this.playSfx("recharge");
          this.cb.onNotify("⚡ සූර්ය කෝෂයෙන් විදුලි පන්දම 100% ආරෝපණය විය!");
          if (this.cb.onAutosave) this.cb.onAutosave();
        },
      },
      {
        id: "outpost_balm_bottle",
        x: 465,
        y: 690,
        radius: 28,
        title: "වන ඖෂධීය තෙල් බෝතලය (Herbal Balm)",
        prompt: "[E] අහුලාගන්න",
        icon: "🧴",
        picked: false,
        action: (obj) => {
          if (!obj.picked) {
            obj.picked = true;
            this.balmCount += 2;
            this.playSfx("pickup");
            this.cb.onTriggerStory({
              title: "කූඩැලි විකර්ෂක වන තෙල් (Herbal Balm)",
              text: "අතහැර දැමූ මුරපොළේ තිබී පැරණි වන පාලකයන් භාවිතා කළ සුවිශේෂී ඖෂධීය තෙල් බෝතලයක් හමුවිය! [B] ඔබා මෙය භාවිත කළ විට විනාඩි 1.5ක් (තත්පර 90ක්) යනතුරු කූඩැල්ලන් ශරීරයට එල්ලීම සම්පූර්ණයෙන්ම වළක්වයි!",
              item: "කූඩැලි ආරක්ෂක තෙල් බෝතල් x2",
            });
            if (this.cb.onAutosave) this.cb.onAutosave();
          } else {
            this.cb.onNotify("මෙම තෙල් බෝතලය දැනටමත් ලබාගෙන ඇත.");
          }
        },
      },
      {
        id: "outpost_radio",
        x: 495,
        y: 670,
        radius: 30,
        title: "කැඩුණු වෝකිටෝකිය (Radio Dispatch)",
        prompt: "[E] පණිවිඩය අසන්න",
        icon: "📻",
        action: () => {
          this.playSfx("radio_static");
          this.cb.onTriggerStory({
            title: "1987 නොවැම්බර් 14 ගුවන්විදුලි පටිගත කිරීම",
            text: "'(ස්ථිතික හඬ... ඝන සුළඟක ශබ්දය...) HQ... මෙය මුරපොළ 01... අප කඳු පාමුල ඇති ගල් ලෙන තුළට ගමන් කරනවා. ලෙන් දොරටුවේ රහස් කේතය දිනපොතේ සටහන් කළා. දෙවියනේ... අඳුරේ අමුතු දෙයක් ඇවිදිනවා... (සංඥාව ඇණහිටියි)'",
            speaker: "1987 RANGER DISPATCH",
            avatar: "📻",
          });
        },
      },
      {
        id: "outpost_uv_lens",
        x: 475,
        y: 715,
        radius: 30,
        title: "පාරජම්බුල කාචය (UV Blacklight Lens)",
        prompt: "[E] ලබාගන්න",
        icon: "🟣",
        picked: false,
        action: (obj) => {
          if (!this.uvUnlocked) {
            this.uvUnlocked = true;
            this.uvMode = true;
            obj.picked = true;
            this.playSfx("uv_toggle");
            this.cb.onTriggerStory({
              title: "පාරජම්බුල කාචය (UV Blacklight Lens)",
              text: "විදුලි පන්දමට සවිකළ හැකි UV කාචයක් හමුවිය! [U] ඔබා UV මාදිලියට මාරු වූ විට, 1987 අතුරුදහන් වූ ගවේෂකයන්ගේ දිදුලන පා සටහන් (Footprints) සහ ගල් ලෙනේ සැඟවුණු රහස් සංකේත (Hidden Glyphs) සොයාගත හැක!",
              item: "UV Blacklight Lens [U]",
            });
            if (this.cb.onAchievementUnlocked) {
              this.cb.onAchievementUnlocked("uv_detective", "අදෘශ්‍යමාන හෝඩුවාව (UV Detective)", "🟣");
            }
            if (this.cb.onAutosave) this.cb.onAutosave();
          } else {
            this.cb.onNotify("මෙම UV කාචය දැනටමත් ලබාගෙන ඇත. [U] ඔබා ක්‍රියාත්මක කරන්න.");
          }
        },
      },
      {
        id: "outpost_flaregun",
        x: 555,
        y: 740,
        radius: 30,
        title: "සංඥා පිස්තෝලය (Emergency Flare Gun)",
        prompt: "[E] අහුලාගන්න",
        icon: "🚨",
        picked: false,
        action: (obj) => {
          if (!this.flareGunFound) {
            this.flareGunFound = true;
            obj.picked = true;
            this.playSfx("pickup");
            this.cb.onTriggerStory({
              title: "හදිසි ගලවාගැනීමේ සංඥා පිස්තෝලය (Flare Gun)",
              text: "මිලිටරි මට්ටමේ රතු සංඥා පිස්තෝලයක් හමුවිය! සියලු සාක්ෂි 3ම එකතු කර කඳු මුදුනේ හෙලිපෑඩ් වෙත ළඟා වී [E] එබීමෙන් සංඥා වෙඩිල්ල අහසට දල්වා ගලවාගැනීමේ හෙලිකොප්ටරය කැඳවිය හැක!",
              item: "Emergency Flare Gun",
            });
            if (this.cb.onAutosave) this.cb.onAutosave();
          } else {
            this.cb.onNotify("සංඥා පිස්තෝලය දැනටමත් ඔබ ළඟ ඇත.");
          }
        },
      },
      {
        id: "outpost_douglas_reel",
        x: 590,
        y: 670,
        radius: 32,
        title: "මහාචාර්ය ඩග්ලස්ගේ හඬපටය (Douglas Voice Reel)",
        prompt: "[E] හඬපටය අසන්න",
        icon: "📼",
        action: () => {
          this.playSfx("tape_play");
          if (this.cb.onOpenDouglasTape) {
            this.cb.onOpenDouglasTape();
          } else {
            this.cb.onTriggerStory({
              title: "මහාචාර්ය ඩග්ලස්ගේ හඬ පණිවිඩය (1987)",
              text: "'මම මහාචාර්ය ඩග්ලස්... අපගේ ගවේෂණ කණ්ඩායම සිංහරාජයේ රහස් ලෙන අසලට පැමිණියා. ලෙන් දොරටුවේ රහස් කේතය [සූර්යයා, ගංගාව, සිංහයා]. යතුර ගංගා ඉවුරේ ඔරුව අසල සැඟවූයෙමි. ලෙන තුළින් අමුතු නිල් එළියක් විහිදෙනවා... එය සොයාගත් පසු කඳු මුදුනේ හෙලිපෑඩ් වෙත ගොස් සංඥා කරන්න...'",
              speaker: "PROF. DOUGLAS (1987)",
              avatar: "radio",
            });
          }
        },
      },
      {
        id: "kudawa_water_spring",
        x: 210,
        y: 440,
        radius: 30,
        title: "පානීය ජල උල්පත (Fresh Water)",
        prompt: "[E] වතුර බොන්න",
        icon: "🚰",
        action: () => {
          this.health = Math.min(100, this.health + 15);
          this.player.stamina = 100;
          this.playSfx("heal");
          this.cb.onNotify("💧 පිරිසිදු උල්පත් ජලය පානය කළා! Stamina පූර්ණ විය (Health +15).");
          if (this.cb.onAchievementUnlocked) {
            this.cb.onAchievementUnlocked("spring_water", "ජීවයේ උල්පත (Pure Spring)", "🚰");
          }
        },
      },
      {
        id: "kudawa_supply_crate",
        x: 290,
        y: 310,
        radius: 30,
        title: "කුඩව ආරම්භක සැපයුම් පෙට්ටිය",
        prompt: "[E] අරින්න",
        icon: "📦",
        opened: false,
        action: (obj) => {
          if (!obj.opened) {
            obj.opened = true;
            this.saltCount += 2;
            this.herbCount += 1;
            this.battery = 100;
            this.playSfx("pickup");
            this.cb.onTriggerStory({
              title: "ආරම්භක සැපයුම් පෙට්ටිය",
              text: "ඔබට අමතර විදුලි පන්දම් බැටරි, ලුණු කුඩු පැකට් 2ක් සහ ඖෂධ පැළෑටියක් ලැබුණි! දැන් ගවේෂණය ආරම්භ කළ හැක.",
              item: "බැටරි 100% | ලුණු x2 | ඖෂධ x1",
            });
          } else {
            this.cb.onNotify("මෙම සැපයුම් පෙට්ටිය දැනටමත් ලබාගෙන ඇත.");
          }
        },
      },
      {
        id: "sign_trail_1",
        x: 390,
        y: 320,
        radius: 28,
        title: "මඟ පෙන්වුම් පුවරුව",
        prompt: "[E] කියවන්න",
        icon: "🪧",
        action: () => {
          this.playSfx("blip");
          this.cb.onNotify("🪧 [➡️ මාවත ඔස්සේ: අතහැර දැමූ මුරපොළ මීටර් 180යි]");
        },
      },
      {
        id: "sign_trail_2",
        x: 630,
        y: 770,
        radius: 28,
        title: "මුරපොළ පුවරුව",
        prompt: "[E] කියවන්න",
        icon: "🪧",
        action: () => {
          this.playSfx("blip");
          this.cb.onNotify("🪧 [➡️ මාවත ඔස්සේ: මහ ගංගා නිම්නය & ඔරු තොට මීටර් 250යි]");
        },
      },
      {
        id: "sign_trail_3",
        x: 1020,
        y: 680,
        radius: 28,
        title: "ගංගා ඉවුරේ පුවරුව",
        prompt: "[E] කියවන්න",
        icon: "🪧",
        action: () => {
          this.playSfx("blip");
          this.cb.onNotify("🪧 [➡️ ගල් මතින් එතෙර වී කඳු පාමුල ඇති පුරාණ ලෙන වෙත යන්න. (යතුර අසල ඇත)]");
        },
      },
      {
        id: "sign_trail_4",
        x: 1850,
        y: 1180,
        radius: 28,
        title: "ගලවා ගැනීමේ පුවරුව",
        prompt: "[E] කියවන්න",
        icon: "🪧",
        action: () => {
          this.playSfx("blip");
          this.cb.onNotify("🪧 [➡️ හෙලිකොප්ටර් ගලවා ගැනීමේ කලාපය මීටර් 450යි]");
        },
      },
      {
        id: "outpost_chest",
        x: 520,
        y: 720,
        radius: 35,
        title: "මුරපොළේ පැරණි ලාච්චුව",
        prompt: "[E] විවෘත කරන්න",
        icon: "📦",
        opened: false,
        action: (obj) => {
          if (!obj.opened) {
            obj.opened = true;
            this.battery = Math.min(100, this.battery + 50);
            this.saltCount += 3;
            this.playSfx("pickup");
            this.cb.onTriggerStory({
              title: "පැරණි මුරපොළේ උපකරණ",
              text: "ඔබට අමතර බැටරි සහ ලුණු කුඩු පැකට් 3ක් හමුවිය! (ලුණු විසි කිරීමට SPACE ඔබන්න).",
              item: "බැටරි & ලුණු",
            });
          } else {
            this.cb.onNotify("මෙම පෙට්ටිය දැනටමත් පරීක්ෂා කර ඇත.");
          }
        },
      },
      {
        id: "ranger_diary",
        x: 580,
        y: 700,
        radius: 30,
        title: "වන නිලධාරී දිනපොත",
        prompt: "[E] කියවන්න",
        icon: "📖",
        action: () => {
          this.tasks.diaryFound = true;
          this.triggerRadio(
            "diary",
            "HQ DISPATCH",
            "දිනපොතේ හෝඩුවාව ලැබුණා! ඩග්ලස්ගේ කණ්ඩායම ලෙන දෙසට ගොස් ඇත. ගංගා ඉවුරේ සඟවා ඇති පිත්තල යතුර සොයාගන්න. කූඩැලි රැළිවලින් ප්‍රවේශම් වන්න!"
          );
          this.cb.onTriggerStory({
            title: "දිනපොතේ අභිරහස (සාක්ෂි අංක 01)",
            text: "'1987 නොවැම්බර් 14: ඔවුන් ගල් ලෙන තුළට ගියා. ලෙන් දොරටුවේ රහස් සංකේත තුන: [සූර්යයා, ගංගාව, සිංහයා]. දොර විවෘත කිරීමට ගංගා ඉවුරේ සැඟවූ පිත්තල යතුර අවශ්‍යයි!'",
            item: "ලෙයින් පෙඟුණු දිනපොත (Evidence 1)",
            lore: {
              title: "සිංහරාජයේ රහස් දිනපොත",
              desc: "අතුරුදහන් වූ කණ්ඩායමේ ගමන් මාර්ගය හෙළි කරන වැදගත් සාක්ෂියකි.",
            },
          });
          if (this.cb.onAutosave) this.cb.onAutosave();
        },
      },
      {
        id: "secret_waterfall_chest",
        x: 1450,
        y: 1550,
        radius: 35,
        title: "දියඇල්ල පිටුපස සැඟවුණු පෙට්ටිය",
        prompt: "[E] විවෘත කරන්න",
        icon: "💎",
        opened: false,
        action: (obj) => {
          if (!obj.opened) {
            obj.opened = true;
            this.herbCount += 2;
            this.saltCount += 3;
            this.playSfx("pickup");
            this.cb.onTriggerStory({
              title: "දියඇල්ලේ සැඟවුණු නිධානය",
              text: "දියඇල්ලේ දිය තිරය පිටුපසින් පැරණි සිංහල කාසියක් සහ ඖෂධීය කොළ පැකට්ටුවක් ඔබට හමුවිය!",
              item: "ඖෂධ කොළ x2 & ලුණු x3",
            });
          }
        },
      },
      {
        id: "viper_encounter",
        x: 1350,
        y: 500,
        radius: 45,
        title: "පළා පොළඟා (Green Pit Viper)",
        prompt: "[E] පරීක්ෂා කරන්න",
        icon: "🐍",
        passed: false,
        action: (obj) => {
          if (this.torchOn) {
            obj.passed = true;
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
          } else {
            this.health = Math.max(0, this.health - 25);
            this.sanity = Math.max(0, this.sanity - 20);
            this.playSfx("hurt");
            this.cb.onTriggerStory({
              title: "සර්ප ප්‍රහාරය!",
              text: "අන්ධකාරයේදී සර්පයා ඔබගේ අතට දෂ්ට කළා! (Health -25). විදුලි පන්දම දල්වාගෙන යන්න!",
            });
          }
        },
      },
      {
        id: "natural_mountain_spring",
        x: 980,
        y: 480,
        radius: 32,
        title: "සිසිල් කඳුකර දිය උල්පත (Crystal Spring)",
        prompt: "[E] සිසිල් පැන් බොන්න",
        icon: "💧",
        action: () => {
          this.health = Math.min(100, this.health + 35);
          this.sanity = Math.min(100, this.sanity + 40);
          this.player.stamina = 100;
          this.playSfx("heal");
          this.cb.onNotify("💧 පිරිසිදු කඳුකර උල්පත් පැන් පානය කළා! (Health +35 | Sanity +40 | Stamina 100%)");
          if (this.cb.onAchievementUnlocked) {
            this.cb.onAchievementUnlocked("crystal_spring", "සිසිල් උල්පත (Crystal Spring)", "💧");
          }
        },
      },
      {
        id: "sacred_feather_1",
        x: 360,
        y: 330,
        radius: 26,
        title: "කැහිබෙලි නිල් පිහාටුව (1/3)",
        prompt: "[E] අහුලාගන්න",
        icon: "🪶",
        picked: false,
        action: (obj) => {
          if (!obj.picked) {
            obj.picked = true;
            this.feathersCollected++;
            this.sanity = Math.min(100, this.sanity + 25);
            this.playSfx("pickup");
            if (this.feathersCollected >= 3) {
              this.magpieCharmActive = true;
              this.cb.onNotify("✨ කැහිබෙලි පිහාටු 3ම හමුවිය! 'කැහිබෙලි ආමුදිතය' ක්‍රියාත්මකයි (වේගය +20% & Stamina Boost)!");
              if (this.cb.onAchievementUnlocked) {
                this.cb.onAchievementUnlocked("magpie_charm", "කැහිබෙලි ආමුදිතය (Lucky Charm)", "🪶");
              }
            } else {
              this.cb.onNotify(`🪶 නිල් පිහාටුවක් අහුලාගත්තා! (${this.feathersCollected}/3) - Sanity +25`);
            }
          }
        },
      },
      {
        id: "sacred_feather_2",
        x: 790,
        y: 560,
        radius: 26,
        title: "කැහිබෙලි නිල් පිහාටුව (2/3)",
        prompt: "[E] අහුලාගන්න",
        icon: "🪶",
        picked: false,
        action: (obj) => {
          if (!obj.picked) {
            obj.picked = true;
            this.feathersCollected++;
            this.sanity = Math.min(100, this.sanity + 25);
            this.playSfx("pickup");
            if (this.feathersCollected >= 3) {
              this.magpieCharmActive = true;
              this.cb.onNotify("✨ කැහිබෙලි පිහාටු 3ම හමුවිය! 'කැහිබෙලි ආමුදිතය' ක්‍රියාත්මකයි (වේගය +20% & Stamina Boost)!");
              if (this.cb.onAchievementUnlocked) {
                this.cb.onAchievementUnlocked("magpie_charm", "කැහිබෙලි ආමුදිතය (Lucky Charm)", "🪶");
              }
            } else {
              this.cb.onNotify(`🪶 නිල් පිහාටුවක් අහුලාගත්තා! (${this.feathersCollected}/3) - Sanity +25`);
            }
          }
        },
      },
      {
        id: "sacred_feather_3",
        x: 1250,
        y: 660,
        radius: 26,
        title: "කැහිබෙලි නිල් පිහාටුව (3/3)",
        prompt: "[E] අහුලාගන්න",
        icon: "🪶",
        picked: false,
        action: (obj) => {
          if (!obj.picked) {
            obj.picked = true;
            this.feathersCollected++;
            this.sanity = Math.min(100, this.sanity + 25);
            this.playSfx("pickup");
            if (this.feathersCollected >= 3) {
              this.magpieCharmActive = true;
              this.cb.onNotify("✨ කැහිබෙලි පිහාටු 3ම හමුවිය! 'කැහිබෙලි ආමුදිතය' ක්‍රියාත්මකයි (වේගය +20% & Stamina Boost)!");
              if (this.cb.onAchievementUnlocked) {
                this.cb.onAchievementUnlocked("magpie_charm", "කැහිබෙලි ආමුදිතය (Lucky Charm)", "🪶");
              }
            } else {
              this.cb.onNotify(`🪶 නිල් පිහාටුවක් අහුලාගත්තා! (${this.feathersCollected}/3) - Sanity +25`);
            }
          }
        },
      },
      {
        id: "river_key",
        x: 1100,
        y: 850,
        radius: 35,
        title: "දිදුලන පිත්තල යතුර",
        prompt: "[E] අහුලාගන්න",
        icon: "🔑",
        picked: false,
        action: (obj) => {
          if (!obj.picked) {
            obj.picked = true;
            this.hasKey = true;
            this.tasks.keyFound = true;
            this.stormActive = true;
            this.playSfx("thunder");
            this.playSfx("pickup");
            this.triggerRadio(
              "storm",
              "HQ EMERGENCY",
              "හදිසි කාලගුණ අනතුරු ඇඟවීමක්! ගංගා නිම්නය පිටාර ගලමින් පවතී. වතුරට නොබැස යෝධ ගස් කොටන් පාලම (Log Bridge) ඔස්සේ එතෙර වන්න!"
            );
            this.cb.onTriggerStory({
              title: "පුරාණ පිත්තල යතුර (සාක්ෂි අංක 02)",
              text: "ඔබට ගල් ලෙනේ දොරටුව විවෘත කළ හැකි පුරාණ පිත්තල යතුර හමුවිය! ඒ සමඟම ගංගා නිම්නයට මහ කුණාටුවක් කඩා වැටුණි. මඩ වගුර මඟහැර යෝධ ගස් කොටන් පාලම (Log Bridge) ඔස්සේ ආරක්ෂිතව එතෙර වන්න!",
              item: "පුරාණ පිත්තල යතුර (Evidence 2)",
            });
            if (this.cb.onAutosave) this.cb.onAutosave();
          }
        },
      },
      {
        id: "cave_gate",
        x: 1730,
        y: 1120,
        radius: 50,
        title: "භූගත ලෙන් දොරටුව",
        prompt: "[E] දොර අරින්න",
        icon: "⛩️",
        unlocked: false,
        action: (obj) => {
          if (!obj.unlocked) {
            if (this.hasKey) {
              // Trigger Interactive Rune Lock Puzzle Modal in UI!
              this.cb.onOpenRunePuzzle(() => {
                obj.unlocked = true;
                this.playSfx("pickup");
                this.triggerRadio(
                  "cave",
                  "SINHA-BASE // 01",
                  "ලෙන් දොරටුව විවෘතයි! අභ්‍යන්තරයේ නිල් ආලෝකය විහිදෙන දිලීර සාම්පලය (Research Sample) සොයාගන්න!"
                );
                this.cb.onTriggerStory({
                  title: "ලෙන් දොරටුව විවෘත විය!",
                  text: "රහස් සංකේත ගැලපීමෙන් පසු පැරණි ගල් දොර සෙලවෙමින් විවෘත විය. ඇතුළතින් නිල් පැහැති ආලෝකයක් දිස්වේ!",
                });
              });
            } else {
              this.playSfx("hurt");
              this.cb.onNotify("දොරටුව අගුළු දමා ඇත! ගංගා ඉවුරේ ඇති යතුර සොයාගන්න.");
            }
          }
        },
      },
      {
        id: "cave_samples",
        x: 1730,
        y: 1300,
        radius: 40,
        title: "අතුරුදහන් වූ පර්යේෂණ සාම්පල",
        prompt: "[E] අහුලාගන්න",
        icon: "🧪",
        picked: false,
        action: (obj) => {
          if (!obj.picked) {
            obj.picked = true;
            this.hasSample = true;
            this.tasks.sampleFound = true;
            this.playSfx("pickup");
            this.triggerRadio(
              "sample",
              "HQ DISPATCH",
              "සාක්ෂි 3ම සම්පූර්ණයි! දැන් වහාම කඳු මුදුනේ හෙලිපෑඩ් වෙත යන්න. Chopper-01 ගලවා ගැනීමේ යානය සීරුවෙන් තබා ඇත!"
            );
            this.cb.onTriggerStory({
              title: "අභිරහස හෙළි විය! (සාක්ෂි අංක 03)",
              text: "වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ පර්යේෂණ සාම්පල බඳුන ඔබට හමුවිය! දැන් කඳු මුදුනේ ඇති හෙලිපෑඩ් වෙත ගොස් සංඥා කරන්න!",
              item: "පර්යේෂණ සාම්පල (Evidence 3)",
              lore: {
                title: "ප්‍රතිදීප්ත හතු (Bioluminescent Fungi)",
                desc: "සිංහරාජයේ ගුහා තුළ ස්වභාවිකව නිල් ආලෝකය විහිදුවන දුර්ලභ දිලීර විශේෂයකි.",
              },
            });
            if (this.cb.onAutosave) this.cb.onAutosave();
          }
        },
      },
      {
        id: "rescue_helipad",
        x: 2700,
        y: 1800,
        radius: 80,
        title: "යෝධ නාවෘක්ෂය සහ හෙලිකොප්ටර් කලාපය",
        prompt: "[E] සංඥා කරන්න",
        icon: "🚁",
        action: () => {
          this.tasks.helipadReached = true;
          const hasAllEvidence = this.tasks.diaryFound && this.tasks.keyFound && this.tasks.sampleFound;

          if (hasAllEvidence) {
            if (!this.flareFired) {
              this.flareFired = true;
              this.chopperArriving = true;
              this.flareEntity = { x: 2700, y: 1800, altitude: 0, exploded: false, timer: 0 };
              this.playSfx("flare_launch");
              this.triggerRadio(
                "helipad",
                "RESCUE CHOPPER 01",
                "අපට ඔබගේ රේඩාර් සලකුණ පෙනෙනවා! සංඥා වෙඩිල්ල දල්වා හෙලිකොප්ටරය වෙත ළඟා වන්න!"
              );
              this.cb.onNotify("🚀 රතු සංඥා වෙඩිල්ල අහසට විහිදී ගියා! හෙලිකොප්ටරය පැමිණෙමින් තිබේ...");
              if (this.cb.onAchievementUnlocked) {
                this.cb.onAchievementUnlocked("flare_evac", "ගලවාගැනීමේ සංඥාව (Rescue Beacon)", "🚨");
                this.cb.onAchievementUnlocked("legend_ch1", "සිංහරාජ පුරාවෘත්තය (Chapter 1 Complete)", "🏆");
              }
            }
          } else {
            this.cb.onNotify("⚠️ සාක්ෂි 3ම සොයාගත යුතුය! (දිනපොත, පිත්තල යතුර, පර්යේෂණ සාම්පලය). තවමත් ඉවත් වීමට නම් නැවත [E] ඔබන්න.");
            if (this.leavingAnyway) {
              this.cb.onGameWon("survivor");
            } else {
              this.leavingAnyway = true;
              setTimeout(() => { this.leavingAnyway = false; }, 5000);
            }
          }
        },
      },
    ];

    // 4. Ground Collectible Items (Salt, Herbs)
    this.items = [
      { x: 380, y: 400, type: "salt", name: "ලුණු කුඩු", icon: "🧂" },
      { x: 880, y: 450, type: "herb", name: "සුවදායක පැළෑටිය", icon: "🌿" },
      { x: 1250, y: 750, type: "salt", name: "ලුණු කුඩු", icon: "🧂" },
      { x: 1550, y: 900, type: "herb", name: "සුවදායක පැළෑටිය", icon: "🌿" },
      { x: 2100, y: 1300, type: "salt", name: "ලුණු කුඩු", icon: "🧂" },
      { x: 2350, y: 1650, type: "herb", name: "සුවදායක පැළෑටිය", icon: "🌿" },
    ];

    // 5. Spawn Enemy Leeches (කූඩැල්ලන්)
    this.spawnLeeches();
  }

  spawnLeeches() {
    this.leeches = [];
    const spots = [
      { x: 720, y: 550 },
      { x: 790, y: 800 },
      { x: 920, y: 650 },
      { x: 1050, y: 900 },
      { x: 1300, y: 950 },
      { x: 1500, y: 1200 },
      { x: 1850, y: 1500 },
      { x: 2200, y: 1700 },
    ];
    spots.forEach((p, idx) => {
      this.leeches.push({
        id: idx,
        x: p.x,
        y: p.y,
        radius: 8,
        speed: 1.2,
        alive: true,
        crawlFrame: 0,
      });
    });
  }

  // ── 4. Weather & Rain ─────────────────────────────────────────────────────
  initWeather() {
    this.rainDrops = [];
    if (this.chapter === 2) {
      // CHAPTER 2: Bright Mountain Morning - NO RAIN!
      this.mistClouds = [];
      for (let i = 0; i < 22; i++) {
        this.mistClouds.push({
          x: Math.random() * this.worldWidth,
          y: Math.random() * this.worldHeight,
          radius: 130 + Math.random() * 110,
          speed: 0.35 + Math.random() * 0.45,
          opacity: 0.16 + Math.random() * 0.14,
        });
      }
      return;
    }

    for (let i = 0; i < 200; i++) {
      this.rainDrops.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: 12 + Math.random() * 14,
        speed: 14 + Math.random() * 8,
      });
    }

    this.mistClouds = [];
    for (let i = 0; i < 15; i++) {
      this.mistClouds.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        radius: 120 + Math.random() * 100,
        speed: 0.2 + Math.random() * 0.3,
      });
    }
  }

  // ── 5. Inputs Setup ───────────────────────────────────────────────────────
  setupInputs() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Space -> Throw Salt
      if (e.code === "Space") {
        e.preventDefault();
        this.throwSalt();
      }
      // F -> Toggle Torch
      if (e.key.toLowerCase() === "f") {
        this.torchOn = !this.torchOn;
        this.playSfx("step");
      }
      // E -> Interact
      if (e.key.toLowerCase() === "e") {
        this.interactNearest();
      }
      // H -> Consume Herb to Heal
      if (e.key.toLowerCase() === "h") {
        this.useHerb();
      }
      // Quick Numbers [1, 2, 3, 4]
      if (e.key === "1") {
        this.throwSalt();
      }
      if (e.key === "2") {
        this.useHerb();
      }
      if (e.key === "3") {
        this.torchOn = !this.torchOn;
        this.playSfx("step");
      }
      if (e.key === "4") {
        this.interactNearest();
      }
      // 5 -> Evidence Board
      if (e.key === "5") {
        if (this.cb.onToggleEvidence) this.cb.onToggleEvidence();
      }
      // M -> Tactical Map
      if (e.key.toLowerCase() === "m") {
        if (this.cb.onToggleMap) this.cb.onToggleMap();
      }
      // I -> Survival Backpack / Inventory
      if (e.key.toLowerCase() === "i") {
        if (this.cb.onToggleInventory) this.cb.onToggleInventory();
      }
      // T -> Brew Herbal Tea at Campfire
      if (e.key.toLowerCase() === "t") {
        this.brewHerbalTea();
      }
      // G -> Drink Ginger Tea
      if (e.key.toLowerCase() === "g") {
        this.drinkGingerTea();
      }
      // B -> Use Leech Repellent Balm
      if (e.key.toLowerCase() === "b") {
        this.useBalm();
      }
      // C -> Wildlife Photography Camera
      if (e.key.toLowerCase() === "c") {
        this.takePhoto();
      }
      // R -> Hand-Crank Dynamo Recharge
      if (e.key.toLowerCase() === "r") {
        this.crankDynamo();
      }
      // U -> Toggle UV Blacklight Mode
      if (e.key.toLowerCase() === "u") {
        this.toggleUv();
      }
      // Z -> Toggle Binoculars Zoom
      if (e.key.toLowerCase() === "z") {
        this.targetZoom = this.targetZoom === 1.0 ? 0.75 : 1.0;
        this.cb.onNotify(this.targetZoom < 1.0 ? "🔭 දූරදර්ශකය: පුළුල් දසුන (Wide Field View)" : "🔭 සාමාන්‍ය දසුන (Normal View)");
      }
      // V -> Toggle View Mode (1st Person I.G.I. Mode vs 2.5D Isometric Mode)
      if (e.key.toLowerCase() === "v") {
        this.toggleViewMode();
      }
      // Escape -> Pause Menu
      if (e.key === "Escape") {
        if (this.cb.onTogglePause) this.cb.onTogglePause();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        this.targetZoom = Math.max(0.72, this.targetZoom - 0.08);
      } else {
        this.targetZoom = Math.min(1.15, this.targetZoom + 0.08);
      }
    }, { passive: false });

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.worldX = this.mouse.x / this.zoom + this.camera.x;
      this.mouse.worldY = this.mouse.y / this.zoom + this.camera.y;

      if (this.viewMode === "fps") {
        // In FPS Mode, horizontal mouse movement turns camera smoothly (IGI style mouse look)
        const deltaX = (e.movementX !== undefined && Math.abs(e.movementX) < 120)
          ? e.movementX * 0.004
          : ((this.mouse.x - rect.width / 2) / (rect.width / 2)) * 0.035;
        this.player.facingAngle += deltaX;
      } else {
        const dx = this.mouse.worldX - this.player.x;
        const dy = this.mouse.worldY - this.player.y;
        this.player.facingAngle = Math.atan2(dy, dx);
      }
    });

    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        // Check if clicked the Camera Mode Toggle pill in top-right
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        if (clickX >= this.canvas.width - 220 && clickX <= this.canvas.width - 15 && clickY >= 12 && clickY <= 52) {
          this.toggleViewMode();
          return;
        }

        if (this.viewMode === "fps") {
          // In FPS mode, clicking interacts with whatever is in front of the crosshair!
          if (this.interactNearest()) {
            return;
          }
          return;
        }

        // 1. Check if clicked directly on an interactive object (in isometric mode)
        const clickedObj = this.interactiveObjects.find((obj) => {
          const d = Math.hypot(obj.x - this.mouse.worldX, obj.y - this.mouse.worldY);
          return d < obj.radius + 30;
        });

        if (clickedObj) {
          const distToPlayer = Math.hypot(clickedObj.x - this.player.x, clickedObj.y - this.player.y);
          if (distToPlayer < clickedObj.radius + 60) {
            clickedObj.action(clickedObj);
            this.moveTarget = null;
            return;
          } else {
            // Walk to the object and interact on arrival!
            this.moveTarget = { x: clickedObj.x, y: clickedObj.y, targetObj: clickedObj, time: performance.now() };
            return;
          }
        }

        // 2. Check if clicked on ground item
        const clickedItem = this.items.find((it) => {
          return Math.hypot(it.x - this.mouse.worldX, it.y - this.mouse.worldY) < 32;
        });
        if (clickedItem) {
          this.moveTarget = { x: clickedItem.x, y: clickedItem.y, time: performance.now() };
          return;
        }

        // 3. Open ground: move there smoothly!
        this.moveTarget = { x: this.mouse.worldX, y: this.mouse.worldY, time: performance.now() };
      }
    });

    this.canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = (touch.clientX - rect.left) / this.zoom + this.camera.x;
        const touchY = (touch.clientY - rect.top) / this.zoom + this.camera.y;

        const clickedObj = this.interactiveObjects.find((obj) => {
          return Math.hypot(obj.x - touchX, obj.y - touchY) < obj.radius + 35;
        });
        if (clickedObj) {
          const distToPlayer = Math.hypot(clickedObj.x - this.player.x, clickedObj.y - this.player.y);
          if (distToPlayer < clickedObj.radius + 60) {
            clickedObj.action(clickedObj);
            this.moveTarget = null;
            return;
          } else {
            this.moveTarget = { x: clickedObj.x, y: clickedObj.y, targetObj: clickedObj, time: performance.now() };
            return;
          }
        }
        this.moveTarget = { x: touchX, y: touchY, time: performance.now() };
      }
    }, { passive: true });
  }

  // ── 6. Actions ────────────────────────────────────────────────────────────
  brewHerbalTea() {
    const nearCampfire = this.campfires.some((fire) => {
      const dist = Math.hypot(this.player.x - fire.x, this.player.y - fire.y);
      return dist < 140;
    });

    if (!nearCampfire) {
      this.cb.onNotify("⚠️ ඔසුපැන් පෙරීමට ගිනිමැලයක් අසලට යන්න!");
      return;
    }

    if (this.herbCount < 1) {
      this.cb.onNotify("⚠️ ඔසුපැන් පෙරීමට ඖෂධීය පැළෑටි (Herbs) අවශ්‍යයි!");
      return;
    }

    this.herbCount--;
    this.health = Math.min(100, this.health + 25);
    this.sanity = Math.min(100, this.sanity + 35);
    this.player.stamina = 100;
    this.teaBuffTimer = 60; // 60 seconds energy buff!
    this.playSfx("tea_brew");
    this.cb.onNotify("🍵 සිංහරාජ උණුසුම් ඔසුපැන් පානය කළා! (තත්පර 60ක් නොනවතින Stamina & සුවපත් වීම)");
    if (this.cb.onAchievementUnlocked) {
      this.cb.onAchievementUnlocked("tea_master", "ඔසුපැන් ස්වාමියා (Herbalist)", "🍵");
    }
    if (this.cb.onAutosave) {
      this.cb.onAutosave();
    }
  }
  useHerb() {
    if (this.herbCount <= 0) {
      this.cb.onNotify("⚠️ ඖෂධීය පැළෑටි අවසන්! කැලයෙන් සොයාගන්න.");
      return;
    }
    this.herbCount--;
    if (this.venomToxicity > 0) {
      this.venomToxicity = 0;
      this.health = Math.min(100, this.health + 20);
      this.playSfx("heal");
      this.spawnFloatingText(this.player.x, this.player.y - 25, "ANTIVENOM CURE! 🌿", "#22c55e");
      this.cb.onNotify(`🌿 ඖෂධීය පත්තුවෙන් පොළොං විෂ සුවපත් විය! Health +20 (ඉතිරි: ${this.herbCount})`);
      return;
    }
    if (this.health >= 100) {
      this.cb.onNotify("ඔබේ සෞඛ්‍යය (Health) දැනටමත් උපරිම මට්ටමේ ඇත.");
      return;
    }
    this.health = Math.min(100, this.health + 30);
    this.playSfx("heal");
    this.cb.onNotify(`🌿 ඖෂධීය කොළ භාවිතා කළා! Health +30 (ඉතිරි: ${this.herbCount})`);
  }

  throwSalt() {
    if (this.saltCount <= 0) {
      this.cb.onNotify("⚠️ ලුණු කුඩු අවසන්! කූඩැල්ලන්ගෙන් ඈත් වන්න.");
      return;
    }
    this.saltCount--;
    this.playSfx("salt");

    let killed = 0;
    this.leeches.forEach((l) => {
      if (l.alive) {
        const dist = Math.hypot(l.x - this.player.x, l.y - this.player.y);
        if (dist < 180) {
          l.alive = false;
          killed++;
        }
      }
    });

    const detached = this.attachedLeeches || 0;
    this.attachedLeeches = 0;
    this.bleeding = false;

    if (detached > 0) {
      this.spawnFloatingText(this.player.x, this.player.y - 22, `DETACHED x${detached} 🧂`, "#ffffff");
      this.cb.onNotify(`✨ ලුණු කුඩු දමා එල්ලී සිටි කූඩැල්ලන් ${detached}දෙනාම ඉවත් කළා! ලේ ගැලීම නැවතුණි.`);
    } else if (killed > 0) {
      this.cb.onNotify(`✨ ලුණු කුඩු ප්‍රහාරයෙන් කූඩැල්ලන් ${killed}ක් විනාශ විය!`);
    } else {
      this.cb.onNotify(`🧂 ලුණු කුඩු විසි කළා! (ඉතිරි: ${this.saltCount})`);
    }
  }

  crankDynamo() {
    if (this.battery >= 100) {
      this.cb.onNotify("විදුලි පන්දමේ බැටරිය දැනටමත් 100% සම්පූර්ණයි!");
      return;
    }
    if (this.crankCooldown > 0) return;
    this.crankCooldown = 0.45;
    this.battery = Math.min(100, this.battery + 14);
    this.playSfx("crank_dynamo");
    this.noiseLevel = 88;
    this.spawnFloatingText(this.player.x, this.player.y - 24, "+14% DYNAMO 🔋", "#f59e0b");
    this.cb.onNotify("⚡ හෑන්ඩ් ක්‍රෑන්ක් මඟින් බැටරිය ආරෝපණය විය! (ශබ්දය නිසා වනසතුන් ඇදී එයි!)");
    if (!this.torchOn && this.battery > 10) {
      this.torchOn = true;
    }
  }

  setDifficulty(mode) {
    this.difficulty = mode === "hardcore" ? "hardcore" : "tactical";
    this.playSfx("click");
    this.spawnFloatingText(
      this.player.x,
      this.player.y - 30,
      this.difficulty === "hardcore" ? "NIGHTMARE HARDCORE" : "TACTICAL PRO",
      this.difficulty === "hardcore" ? "#ef4444" : "#10b981"
    );
    if (this.cb && this.cb.onNotify) {
      this.cb.onNotify(
        this.difficulty === "hardcore"
          ? "⚠️ NIGHTMARE HARDCORE: වනසතුන්ගේ හානිය සහ බැටරි ක්ෂය වීම 1.55x ගුණයකින් වැඩි විය!"
          : "🛡️ TACTICAL PRO: සම්මත උපක්‍රමික පැවැත්මේ මාදිලිය සක්‍රියයි."
      );
    }
  }

  drinkGingerTea() {
    if ((this.gingerTeaCount || 0) <= 0) {
      if (this.cb && this.cb.onNotify) {
        this.cb.onNotify("⚠️ ඔබ ළඟ ඉඟුරු තේ (Ginger Tea) ඉතිරිව නැත!");
      }
      return;
    }
    this.gingerTeaCount--;
    this.temperature = Math.min(100, (this.temperature || 0) + 40);
    this.health = Math.min(100, this.health + 20);
    this.playSfx("heal");
    this.spawnFloatingText(this.player.x, this.player.y - 25, "+40% WARMTH 🫖", "#f59e0b");
    if (this.cb && this.cb.onNotify) {
      this.cb.onNotify(`🫖 උණුසුම් ඉඟුරු තේ පානය කළා! ශරීරය උණුසුම් විය (Warmth +40% | ඉතිරි: ${this.gingerTeaCount})`);
    }
  }

  setAnalogMove(x, y, active) {
    this.analogMove = { x: x || 0, y: y || 0, active: !!active };
    if (active && (x !== 0 || y !== 0)) {
      this.player.facingAngle = Math.atan2(y, x);
    }
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === "fps" ? "isometric" : "fps";
    this.cb.onNotify(
      this.viewMode === "fps"
        ? "🎯 ප්‍රථම-පුද්ගල දසුන (1st Person I.G.I. Mode) සක්‍රියයි! [V] ඔබන්න"
        : "🗺️ 2.5D උපායශීලී දසුන (Isometric View) සක්‍රියයි! [V] ඔබන්න"
    );
  }

  interactNearest() {
    // 1. In FPS mode: prioritize object in front of the crosshair
    if (this.viewMode === "fps") {
      let bestObj = null;
      let minAngleDiff = 0.65;
      for (let obj of this.interactiveObjects) {
        const dist = Math.hypot(obj.x - this.player.x, obj.y - this.player.y);
        if (dist < (obj.radius || 35) + 85) {
          const angleToObj = Math.atan2(obj.y - this.player.y, obj.x - this.player.x);
          let diff = angleToObj - this.player.facingAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          if (Math.abs(diff) < minAngleDiff) {
            minAngleDiff = Math.abs(diff);
            bestObj = obj;
          }
        }
      }
      if (bestObj) {
        bestObj.action(bestObj);
        return true;
      }
    }

    // 2. Standard radius check
    for (let obj of this.interactiveObjects) {
      const dist = Math.hypot(obj.x - this.player.x, obj.y - this.player.y);
      if (dist < obj.radius + 45) {
        obj.action(obj);
        return true;
      }
    }
    return false;
  }

  useBalm() {
    if (this.balmCount <= 0) {
      this.cb.onNotify("🧴 කූඩැලි ආරක්ෂක තෙල් අවසන්! මුරපොළෙන් සොයාගන්න.");
      return;
    }
    this.balmCount--;
    this.repellentTimer = 90; // 90 seconds continuous protection
    this.bleeding = false; // cures active bites immediately
    this.playSfx("balm");
    this.cb.onNotify("🧴 කූඩැලි ආරක්ෂක තෙල් ආලේප කළා! (තත්පර 90ක් යනතුරු කූඩැල්ලන් පළා යයි)");
    if (this.cb.onAchievementUnlocked) {
      this.cb.onAchievementUnlocked("leech_balm", "කූඩැලි ප්‍රතිරෝධය (Leech Ward)", "🧴");
    }
    if (this.cb.onAutosave) this.cb.onAutosave();
  }

  takePhoto() {
    this.playSfx("camera_snap");
    let photoCaptured = null;

    // Check Blue Magpie
    if (this.blueMagpie && this.blueMagpie.active) {
      const dist = Math.hypot(this.player.x - this.blueMagpie.x, this.player.y - this.blueMagpie.y);
      if (dist < 420) {
        photoCaptured = {
          id: "photo_magpie",
          name: "ශ්‍රී ලංකා කැහිබෙල්ලා (Sri Lanka Blue Magpie)",
          desc: "දුර්ලභ නිල් පිහාටු සහ දීප්තිමත් රතු හොටක් සහිත සිංහරාජයේ ආවේණික පක්ෂියාගේ සුපැහැදිලි ඡායාරූපයක්.",
          icon: "🐦",
          subject: "magpie",
        };
      }
    }

    // Check Langurs
    if (!photoCaptured && this.langurs) {
      const nearLangur = this.langurs.find(
        (l) => Math.hypot(this.player.x - l.x, this.player.y - l.y) < 380
      );
      if (nearLangur) {
        photoCaptured = {
          id: "photo_langur",
          name: "ශ්‍රී ලංකා කළු වඳුරා (Purple-faced Langur)",
          desc: "සිංහරාජයේ වියන් ස්ථරයේ වෙසෙන ආවේණික දුර්ලභ කළු වඳුරෙකුගේ අපූරු ඡායාරූපයක්.",
          icon: "🐒",
          subject: "langur",
        };
      }
    }

    // Check Pit Viper
    if (!photoCaptured) {
      const distViper = Math.hypot(this.player.x - 1050, this.player.y - 750);
      if (distViper < 280) {
        photoCaptured = {
          id: "photo_viper",
          name: "පළා පොළඟා (Green Pit Viper)",
          desc: "උණ පඳුරේ සැඟවී සිටි විෂඝෝර පළා පොළඟාගේ ත්‍රාසජනක ඡායාරූපයක්.",
          icon: "🐍",
          subject: "viper",
        };
      }
    }

    // Check Fireflies
    if (!photoCaptured && this.fireflies && this.fireflies.length > 0) {
      const nearFirefly = this.fireflies.some(
        (f) => Math.hypot(this.player.x - f.x, this.player.y - f.y) < 180
      );
      if (nearFirefly) {
        photoCaptured = {
          id: "photo_firefly",
          name: "දිදුලන කලාමැදිරියන් (Bioluminescent Fireflies)",
          desc: "සිංහරාජයේ රාත්‍රී අන්ධකාරය ආලෝකවත් කරන අපූරු කලාමැදිරි රංචුවක්.",
          icon: "✨",
          subject: "firefly",
        };
      }
    }

    if (photoCaptured) {
      this.photosTaken[photoCaptured.id] = true;
      this.cb.onNotify(`📸 අපූරු ඡායාරූපයක් ගනු ලැබුවා: ${photoCaptured.name}!`);
      if (this.cb.onPhotoCaptured) {
        this.cb.onPhotoCaptured(photoCaptured);
      }
      if (this.cb.onAchievementUnlocked) {
        this.cb.onAchievementUnlocked("wildlife_photographer", "වනජීවී ඡායාරූප ශිල්පියා (Photographer)", "📸");
        if (Object.keys(this.photosTaken).length >= 4) {
          this.cb.onAchievementUnlocked("master_photographer", "වනජීවී විශාරද සම්මානය (Golden Master)", "🎖️");
        }
      }
      if (this.cb.onAutosave) this.cb.onAutosave();
    } else {
      this.cb.onNotify("📸 ඡායාරූපයක් ගන්නා ලදී. (සතුන් හෝ කලාමැදිරියන් අසලදී උත්සාහ කරන්න!)");
    }
  }

  toggleUv() {
    if (!this.uvUnlocked) {
      this.cb.onNotify("⚠️ UV පාරජම්බුල කාචය තවමත් හමුවී නැත! (මුරපොළේ මේසය පරීක්ෂා කරන්න)");
      return;
    }
    this.uvMode = !this.uvMode;
    this.playSfx("uv_toggle");
    this.cb.onNotify(
      this.uvMode
        ? "🟣 UV පාරජම්බුල මාදිලිය: ක්‍රියාත්මකයි (1987 පා සටහන් සහ රහස් සංකේත දිස්වේ)"
        : "🔦 සාමාන්‍ය විදුලි පන්දම: ක්‍රියාත්මකයි"
    );
    if (this.uvMode && this.cb.onAchievementUnlocked) {
      this.cb.onAchievementUnlocked("uv_detective", "පාරජම්බුල රහස් පරීක්ෂක (UV Investigator)", "🟣");
    }
    if (this.cb.onAutosave) this.cb.onAutosave();
  }

  // ── 7. Update Loop ────────────────────────────────────────────────────────
  update(dt) {
    if (this.paused) return;

    if (this.health <= 0) {
      this.cb.onGameOver("dead");
      return;
    }
    if (this.sanity <= 0) {
      this.cb.onGameOver("insane");
      return;
    }

    // 1. Movement Handling (Dual Support: WASD / Arrow Keys + Click/Tap-to-Move)
    let dx = 0;
    let dy = 0;
    const isKeyMoving =
      this.keys["w"] ||
      this.keys["arrowup"] ||
      this.keys["s"] ||
      this.keys["arrowdown"] ||
      this.keys["a"] ||
      this.keys["arrowleft"] ||
      this.keys["d"] ||
      this.keys["arrowright"];

    if (this.analogMove && this.analogMove.active) {
      this.moveTarget = null;
      dx = this.analogMove.x;
      dy = this.analogMove.y;
      if (dx !== 0 || dy !== 0) {
        this.player.facingAngle = Math.atan2(dy, dx);
      }
    } else if (isKeyMoving) {
      this.moveTarget = null; // Keyboard overrides click-to-move
      if (this.viewMode === "fps") {
        // ── First-Person I.G.I. Tactical Movement & Turning ──
        if (this.keys["arrowleft"]) {
          this.player.facingAngle -= 2.5 * dt;
        }
        if (this.keys["arrowright"]) {
          this.player.facingAngle += 2.5 * dt;
        }

        // Forward & Backward in look direction
        if (this.keys["w"] || this.keys["arrowup"]) {
          dx += Math.cos(this.player.facingAngle);
          dy += Math.sin(this.player.facingAngle);
        }
        if (this.keys["s"] || this.keys["arrowdown"]) {
          dx -= Math.cos(this.player.facingAngle);
          dy -= Math.sin(this.player.facingAngle);
        }

        // Tactical Strafe Left & Right
        if (this.keys["a"]) {
          dx += Math.cos(this.player.facingAngle - Math.PI / 2);
          dy += Math.sin(this.player.facingAngle - Math.PI / 2);
        }
        if (this.keys["d"]) {
          dx += Math.cos(this.player.facingAngle + Math.PI / 2);
          dy += Math.sin(this.player.facingAngle + Math.PI / 2);
        }

        if (dx !== 0 && dy !== 0) {
          const mag = Math.hypot(dx, dy);
          if (mag > 0.001) {
            dx /= mag;
            dy /= mag;
          }
        }
      } else {
        // ── Classic 2.5D Isometric Movement ──
        if (this.keys["w"] || this.keys["arrowup"]) dy -= 1;
        if (this.keys["s"] || this.keys["arrowdown"]) dy += 1;
        if (this.keys["a"] || this.keys["arrowleft"]) dx -= 1;
        if (this.keys["d"] || this.keys["arrowright"]) dx += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }
      }
    } else if (this.moveTarget) {
      const tdx = this.moveTarget.x - this.player.x;
      const tdy = this.moveTarget.y - this.player.y;
      const tdist = Math.hypot(tdx, tdy);

      if (tdist > 10) {
        dx = tdx / tdist;
        dy = tdy / tdist;
        this.player.facingAngle = Math.atan2(tdy, tdx);
      } else {
        if (this.moveTarget.targetObj) {
          this.moveTarget.targetObj.action(this.moveTarget.targetObj);
        }
        this.moveTarget = null;
      }
    }

    const isMoving = dx !== 0 || dy !== 0;
    this.player.isMoving = isMoving;

    // Tea Buff Handling
    if (this.teaBuffTimer > 0) {
      this.teaBuffTimer = Math.max(0, this.teaBuffTimer - dt);
      this.player.stamina = 100;
      this.health = Math.min(100, this.health + 1.5 * dt);
    }

    // Leech Repellent Balm Buff Handling
    if (this.repellentTimer > 0) {
      this.repellentTimer = Math.max(0, this.repellentTimer - dt);
      this.bleeding = false; // continuous cure
    }

    // Dynamic Ambient Light Transition: Trailhead dusk (0.70) to Deep Jungle & Cave (0.95)
    const depthFactor = Math.min(1.0, Math.max(0, (this.player.x + this.player.y - 600) / 2500));
    this.ambientLight = 0.70 + depthFactor * 0.25;

    const shift = this.keys["shift"];
    if (shift && isMoving && (this.player.stamina > 5 || this.teaBuffTimer > 0)) {
      this.player.isSprinting = true;
      if (this.teaBuffTimer <= 0) {
        this.player.stamina = Math.max(0, this.player.stamina - 20 * dt);
      }
    } else {
      this.player.isSprinting = false;
      this.player.stamina = Math.min(100, this.player.stamina + 12 * dt);
    }

    let speed = this.player.speed;
    if (this.player.isSprinting) speed *= this.player.sprintMultiplier;
    if (this.magpieCharmActive) {
      speed *= 1.20; // +20% move speed boost from 3 sacred feathers!
      this.player.stamina = Math.min(100, this.player.stamina + 8 * dt);
    }
    if ((this.attachedLeeches || 0) > 0) {
      speed *= Math.max(0.48, 1 - (this.attachedLeeches * 0.13)); // Clinging leeches slow you down!
    }

    // Dynamic Acoustic Noise Calculation
    if (isMoving) {
      if (this.player.isSprinting) {
        this.noiseLevel = Math.min(95, (this.noiseLevel || 15) + 55 * dt);
      } else {
        this.noiseLevel = Math.max(28, Math.min(48, (this.noiseLevel || 15) + 20 * dt));
      }
    } else {
      this.noiseLevel = Math.max(14, (this.noiseLevel || 15) - 30 * dt);
    }

    // Check if player is walking on fallen giant log bridges
    const onLogBridge = this.logBridges.some((bridge) => {
      const minX = Math.min(bridge.x1, bridge.x2) - 12;
      const maxX = Math.max(bridge.x1, bridge.x2) + 12;
      const minY = bridge.y1 - bridge.width / 2;
      const maxY = bridge.y1 + bridge.width / 2;
      return (
        this.player.x >= minX &&
        this.player.x <= maxX &&
        this.player.y >= minY &&
        this.player.y <= maxY
      );
    });
    this.player.onLogBridge = onLogBridge;

    // Mission Timer & Initial Welcome Radio Dispatch
    this.elapsedTime += dt;
    if (this.chapter === 1 && this.elapsedTime > 3.2 && !this.radioHistory.has("welcome")) {
      this.triggerRadio(
        "welcome",
        "SINHA-BASE // ALPHA",
        "රේන්ජර් සිංහ-01 වෙත: කුඩව මාවතේ ඝන මීදුමක් පවතී. මුලින්ම ඉදිරියෙන් ඇති මුරපොළ කුටිය (Outpost Cabin) වෙත ගොස් උපකරණ පරීක්ෂා කරන්න!"
      );
    }

    // Shelter Detection: Inside Outpost Cabin (x: 450-650, y: 640-840)
    const inShelter = this.chapter === 1 && (this.player.x >= 450 && this.player.x <= 650 && this.player.y >= 640 && this.player.y <= 840);
    this.player.inShelter = inShelter;
    if (inShelter) {
      this.sanity = Math.min(100, this.sanity + 3.5 * dt);
      this.battery = Math.min(100, this.battery + 2.0 * dt); // Solar trickle
    }

    // Cave Detection: Deep Limestone Cave (x: 1620-1880, y: 1100-1450)
    const inCave = this.chapter === 1 && (this.player.x >= 1620 && this.player.x <= 1880 && this.player.y >= 1100 && this.player.y <= 1450);
    this.player.inCave = inCave;
    if (inCave) {
      this.caveDripTimer -= dt;
      if (this.caveDripTimer <= 0) {
        this.caveDripTimer = 2.5 + Math.random() * 2.5;
        this.playSfx("cave_drip");
      }
    }

    // Mud Terrain Physics (when storm is active near river marsh and off bridge)
    const inMud = this.stormActive && !onLogBridge && (this.player.x >= 850 && this.player.x <= 1350 && this.player.y >= 650 && this.player.y <= 950);
    this.player.inMud = inMud;
    if (inMud) speed *= 0.74; // Mud slowdown

    const onSteppingStone = (this.steppingStones || []).some(
      (stone) => Math.hypot(this.player.x - stone.x, this.player.y - stone.y) < stone.r + 14
    );

    const inWater = !onLogBridge && !onSteppingStone && this.waterZones.some(
      (w) =>
        this.player.x > w.x &&
        this.player.x < w.x + w.w &&
        this.player.y > w.y &&
        this.player.y < w.y + w.h
    );
    if (inWater) speed *= 0.65; // Water slow
    if (onLogBridge || onSteppingStone) speed *= 1.15; // Smooth quick footing on logs and rocks!

    // Bamboo Raft Riding Physics (Chapter 2)
    if (this.raft && this.raft.riding) {
      this.raft.y += (this.raft.targetY - this.raft.y) * 2 * dt;
      this.player.x = this.raft.x;
      this.player.y = this.raft.y;
      const raftObj = this.interactiveObjects.find((o) => o.id === "bamboo_raft");
      if (raftObj) {
        raftObj.x = this.raft.x;
        raftObj.y = this.raft.y;
      }
      if (Math.abs(this.raft.targetY - this.raft.y) < 6) {
        this.raft.riding = false;
        this.raft.y = this.raft.targetY;
        this.player.y = this.raft.targetY;
        if (raftObj) {
          raftObj.x = this.raft.x;
          raftObj.y = this.raft.targetY;
        }
        this.cb.onNotify("🎋 ඔබ ගංගාවෙන් එතෙර වී සාර්ථකව ගොඩබිමට ළඟා විය!");
        if (this.cb.onAchievementUnlocked) {
          this.cb.onAchievementUnlocked("raft_master", "ගංගා නාවිකයා (Raft Navigator)", "🎋");
        }
      }
    } else if (this.cableway && this.cableway.riding) {
      this.cableway.y += (this.cableway.targetY - this.cableway.y) * 2.2 * dt;
      this.player.x = this.cableway.x;
      this.player.y = this.cableway.y;
      const cableObj = this.interactiveObjects.find((o) => o.id === "cable_trolley");
      if (cableObj) {
        cableObj.x = this.cableway.x;
        cableObj.y = this.cableway.y;
      }
      if (Math.abs(this.cableway.targetY - this.cableway.y) < 6) {
        this.cableway.riding = false;
        this.cableway.y = this.cableway.targetY;
        this.player.y = this.cableway.targetY;
        if (cableObj) {
          cableObj.x = this.cableway.x;
          cableObj.y = this.cableway.targetY;
        }
        this.cb.onNotify("🚠 ඔබ කේබල් කරත්තයෙන් ගිරි අගාධය සාර්ථකව තරණය කරන ලදී!");
      }
    } else {
      const moveDelta = speed * Math.min(dt * 60, 2.0);
      const nextX = Math.max(20, Math.min(this.worldWidth - 20, this.player.x + dx * moveDelta));
      const nextY = Math.max(20, Math.min(this.worldHeight - 20, this.player.y + dy * moveDelta));

      if (!this.checkCollision(nextX, this.player.y)) this.player.x = nextX;
      if (!this.checkCollision(this.player.x, nextY)) this.player.y = nextY;
    }

    if (isMoving && (!this.raft || !this.raft.riding) && (!this.cableway || !this.cableway.riding)) {
      const moveDelta = speed * Math.min(dt * 60, 2.0);
      this.player.walkFrame += dt * 10;
      this.player.stepDistance = (this.player.stepDistance || 0) + moveDelta;
      if (this.player.stepDistance >= 40) {
        this.player.stepDistance = 0;
        if (inWater) {
          this.playSfx("splash");
          if (!this.waterRipples) this.waterRipples = [];
          this.waterRipples.push({
            x: this.player.x,
            y: this.player.y + 4,
            r: 3,
            maxR: 28,
            alpha: 0.85,
            speed: 22
          });
        } else {
          if (onLogBridge || inShelter) {
            this.playSfx("step_wood");
          } else if (inCave) {
            this.playSfx("step_cave");
          } else if (inMud) {
            this.playSfx("step_mud");
          } else {
            this.playSfx("step");
          }
          if (!this.footsteps) this.footsteps = [];
          if (this.footsteps.length > 60) this.footsteps.shift();
          const footSide = (this.footstepCount = (this.footstepCount || 0) + 1) % 2 === 0 ? 1 : -1;
          const perpAngle = this.player.facingAngle + Math.PI / 2;
          this.footsteps.push({
            x: this.player.x + Math.cos(perpAngle) * (4 * footSide),
            y: this.player.y + Math.sin(perpAngle) * (4 * footSide),
            angle: this.player.facingAngle,
            alpha: inMud ? 0.65 : 0.38,
            isMud: inMud
          });
        }
      }
    }

    // 2. Camera Smooth Follow (Adjusted for Zoom)
    const targetCamX = this.player.x - (this.canvas.width / 2) / this.zoom;
    const targetCamY = this.player.y - (this.canvas.height / 2) / this.zoom;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;
    this.camera.x = Math.max(0, Math.min(this.worldWidth - this.canvas.width / this.zoom, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.worldHeight - this.canvas.height / this.zoom, this.camera.y));

    // 3. Campfire Rest & Safety Check
    const nearCampfire = this.campfires.some((fire) => {
      const dist = Math.hypot(this.player.x - fire.x, this.player.y - fire.y);
      return dist < 130;
    });

    const diffMult = this.difficulty === "hardcore" ? 1.55 : 1.0;

    if (nearCampfire) {
      // Warmth restores health & sanity!
      this.health = Math.min(100, this.health + 5 * dt);
      this.sanity = Math.min(100, this.sanity + 7 * dt);
      if (this.venomToxicity > 0) this.venomToxicity = Math.max(0, this.venomToxicity - 3.5 * dt);
    }

    if (this.torchOn) {
      this.battery = Math.max(0, this.battery - (0.85 * diffMult) * dt);
      if (this.battery <= 0) {
        this.torchOn = false;
        this.cb.onNotify("🔋 විදුලි පන්දමේ බැටරිය අවසන්! [R] ඔබා හෑන්ඩ් ක්‍රෑන්ක් මඟින් ආරෝපණය කරන්න!");
      }
    } else {
      if (!nearCampfire && !this.player.inShelter) {
        this.sanity = Math.max(0, this.sanity - (2.2 * diffMult) * dt);
      }
    }

    if (this.crankCooldown > 0) {
      this.crankCooldown = Math.max(0, this.crankCooldown - dt);
    }

    // ═══ CHAPTER 2: COLD MIST & BODY TEMPERATURE MECHANICS ══════════════
    if (this.chapter === 2) {
      const inTent = Math.hypot(this.player.x - 420, this.player.y - 380) < 65;
      const inHotSpring = Math.hypot(this.player.x - 1350, this.player.y - 420) < 70;

      if (nearCampfire || inTent || inHotSpring) {
        this.temperature = Math.min(100, (this.temperature || 100) + 15 * dt);
        if (this.cb.onAchievementUnlocked && this.temperature >= 95) {
          this.cb.onAchievementUnlocked("frost_ward", "ශීතලෙන් මිදීම (Frost Ward)", "❄️");
        }
      } else {
        const nearFalls = this.waterZones.some((w) => {
          return (
            this.player.x >= w.x - 60 &&
            this.player.x <= w.x + w.w + 60 &&
            this.player.y >= w.y - 60 &&
            this.player.y <= w.y + w.h + 60
          );
        });
        const dropRate = inWater ? 4.8 : nearFalls ? 2.5 : 1.3;
        this.temperature = Math.max(0, (this.temperature || 100) - dropRate * dt);
      }

      // Hypothermia effects: shivering, health drain, shivering audio
      if (this.temperature < 25) {
        this.health = Math.max(0, this.health - 1.4 * dt);
        this.shiverTimer = (this.shiverTimer || 0) - dt;
        if (this.shiverTimer <= 0) {
          this.shiverTimer = 3.6;
          this.playSfx("shiver_cold");
          this.triggerScreenShake(2.5, 0.2);
          this.spawnFloatingText(this.player.x, this.player.y - 22, "FREEZING! ❄️", "#80d8ff");
        }
      }

      // Waterfall ambient roar sound loop
      this.waterfallSoundTimer = (this.waterfallSoundTimer || 0) - dt;
      if (this.waterfallSoundTimer <= 0) {
        this.waterfallSoundTimer = 0.55;
        const nearFalls = this.waterZones.some((w) => {
          return (
            this.player.x >= w.x - 120 &&
            this.player.x <= w.x + w.w + 120 &&
            this.player.y >= w.y - 120 &&
            this.player.y <= w.y + w.h + 120
          );
        });
        if (nearFalls) {
          this.playSfx("waterfall_roar");
        }
      }

      // EMF Proximity Scanner
      if (this.hasEmf) {
        const tapeDist = Math.hypot(this.player.x - 1800, this.player.y - 1750);
        const gemDist = Math.hypot(this.player.x - 2400, this.player.y - 1500);
        const closest = Math.min(tapeDist, gemDist);
        if (closest < 520) {
          this.emfProximity = Math.max(0, 1 - closest / 520);
          this.emfTimer = (this.emfTimer || 0) - dt;
          const interval = 0.15 + (1 - this.emfProximity) * 1.0;
          if (this.emfTimer <= 0) {
            this.emfTimer = interval;
            this.playSfx("emf_beep");
          }
        } else {
          this.emfProximity = 0;
        }
      }
    }

    // ═══ CHAPTER 3: SUBTERRANEAN CAVERNS TOXIC SULFUR GAS ═══════════════
    if (this.chapter === 3) {
      const inGasZone = this.player.x >= 950 && this.player.x <= 1350 && this.player.y >= 350 && this.player.y <= 750;
      if (inGasZone && !this.hasGasMask) {
        this.health = Math.max(0, this.health - 3.2 * dt);
        this.gasTimer = (this.gasTimer || 0) - dt;
        if (this.gasTimer <= 0) {
          this.gasTimer = 2.2;
          this.playSfx("hurt");
          this.triggerScreenShake(3.5, 0.3);
          this.spawnFloatingText(this.player.x, this.player.y - 25, "TOXIC GAS! ☣️", "#c6ff00");
        }
      }
    }

    // ═══ CHAPTER 4: THE FORGOTTEN FACILITY ELECTRIFIED PUDDLE ═══════════
    if (this.chapter === 4) {
      const inElectricPool = this.player.x >= 1100 && this.player.x <= 1420 && this.player.y >= 800 && this.player.y <= 1020;
      if (inElectricPool && !this.breakerOff) {
        this.health = Math.max(0, this.health - 8.0 * dt);
        this.shockTimer = (this.shockTimer || 0) - dt;
        if (this.shockTimer <= 0) {
          this.shockTimer = 1.4;
          this.playSfx("hurt");
          this.triggerScreenShake(6, 0.35);
          this.spawnFloatingText(this.player.x, this.player.y - 25, "HIGH VOLTAGE! ⚡", "#00e5ff");
        }
      }
    }

    // ═══ CHAPTER 5: HIGH ALTITUDE CANOPY WIND DRIFT ═════════════════════
    if (this.chapter === 5) {
      this.canopyWindTimer = (this.canopyWindTimer || 0) - dt;
      if (this.canopyWindTimer <= 0) {
        this.canopyWindTimer = 5.0 + Math.random() * 4.0;
        this.windStrength = 1.2 + Math.random() * 0.8;
      }
    }

    // Campfire Spark Embers Physics
    if (Math.random() < 0.65) {
      this.campfires.forEach((fire) => {
        if (this.campfireEmbers.length < 50) {
          this.campfireEmbers.push({
            x: fire.x + (Math.random() - 0.5) * 20,
            y: fire.y - 6,
            vx: (Math.random() - 0.5) * 16,
            vy: -22 - Math.random() * 32,
            radius: 1.2 + Math.random() * 2,
            alpha: 1,
            color: Math.random() > 0.35 ? "#ff9800" : "#ffeb3b",
          });
        }
      });
    }

    for (let i = this.campfireEmbers.length - 1; i >= 0; i--) {
      const ember = this.campfireEmbers[i];
      ember.x += ember.vx * dt;
      ember.y += ember.vy * dt;
      ember.alpha -= 1.3 * dt;
      if (ember.alpha <= 0) {
        this.campfireEmbers.splice(i, 1);
      }
    }

    // Helicopter rotor blade spinning
    this.heliRotorAngle += dt * 35;

    // 4. Bleeding Damage from Leech bites & Attached Clinging Leeches
    if (this.bleeding || (this.attachedLeeches || 0) > 0) {
      this.bleedTimer += dt;
      if (this.bleedTimer > 1) {
        this.bleedTimer = 0;
        const bleedDmg = Math.max(2, (this.attachedLeeches || 1) * 3) * diffMult;
        this.health = Math.max(0, this.health - bleedDmg);
        this.playSfx("hurt");
        this.triggerScreenShake(3.5, 0.2);
        this.spawnFloatingText(this.player.x, this.player.y - 22, `-${Math.round(bleedDmg)} HP 🩸`, "#ff4d4d");
      }
    }

    // 4.1 Venom Toxicity Damage (Neurotoxin from Pit Vipers)
    if (this.venomToxicity > 0) {
      this.venomTimer += dt;
      if (this.venomTimer > 1.2) {
        this.venomTimer = 0;
        const venomDmg = Math.max(2, Math.round(this.venomToxicity * 0.08 * diffMult));
        this.health = Math.max(0, this.health - venomDmg);
        this.playSfx("hurt");
        this.triggerScreenShake(4.5, 0.25);
        this.spawnFloatingText(this.player.x, this.player.y - 28, `TOXIC VENOM! -${venomDmg} 🐍`, "#a855f7");
      }
    }

    // 4.2 Active Pit Vipers Encounter AI
    if (this.vipers && this.vipers.length > 0) {
      this.vipers.forEach((v) => {
        if (v.strikeCooldown > 0) v.strikeCooldown -= dt;
        if (v.hissCooldown > 0) v.hissCooldown -= dt;
        const vDist = Math.hypot(this.player.x - v.x, this.player.y - v.y);
        if (vDist < 160) {
          const angleToViper = Math.atan2(v.y - this.player.y, v.x - this.player.x);
          const angleDiff = Math.abs(this.player.facingAngle - angleToViper);
          const inLightCone = this.torchOn && (angleDiff < 0.65 || angleDiff > Math.PI * 2 - 0.65);
          if (inLightCone) {
            v.state = "retreated";
          } else {
            if (vDist < 120 && v.hissCooldown <= 0) {
              v.hissCooldown = 3.0;
              this.playSfx("viper_hiss");
              this.spawnFloatingText(v.x, v.y - 18, "HISSS! 🐍", "#22c55e");
              this.cb.onNotify("⚠️ අවවාදයයි: පළා පොළඟෙකුගේ පිඹින හඬක් ඇසේ! විදුලි පන්දම දල්වන්න!");
            }
            if (vDist < 52 && v.strikeCooldown <= 0) {
              v.strikeCooldown = 4.5;
              this.playSfx("venom_strike");
              const biteDmg = Math.round(24 * diffMult);
              this.health = Math.max(0, this.health - biteDmg);
              this.venomToxicity = Math.min(100, (this.venomToxicity || 0) + 40);
              this.triggerScreenShake(12, 0.45);
              this.spawnFloatingText(this.player.x, this.player.y - 30, `VIPER BITE! -${biteDmg} HP 🐍`, "#9333ea");
              this.cb.onNotify("⚠️ පළා පොළඟා දෂ්ට කළා! විෂ ශරීරගත විය! වහාම ඖෂධ [H] භාවිතා කරන්න!");
            }
          }
        }
      });
    }

    // 4.3 Sinharaja Shadow Stalker (Apex Jungle Leopard AI - Ambush Predator)
    if (this.shadowStalker && (this.chapter === 1 || this.chapter === 3 || this.chapter === 5)) {
      const s = this.shadowStalker;
      if (s.roarCooldown > 0) s.roarCooldown -= dt;
      if (s.attackCooldown > 0) s.attackCooldown -= dt;
      const sDist = Math.hypot(this.player.x - s.x, this.player.y - s.y);

      if (nearCampfire || this.player.inShelter) {
        s.state = "lurking";
        s.eyesAlpha = Math.max(0, s.eyesAlpha - 1.8 * dt);
        if (sDist < 450) {
          const awayAngle = Math.atan2(s.y - this.player.y, s.x - this.player.x);
          s.x += Math.cos(awayAngle) * (140 * dt);
          s.y += Math.sin(awayAngle) * (140 * dt);
        }
      } else {
        // Flashlight beam detection (direct light cone deterrence)
        const angleToStalker = Math.atan2(s.y - this.player.y, s.x - this.player.x);
        let angleDiff = Math.abs(this.player.facingAngle - angleToStalker);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        const caughtInBeam = this.torchOn && (this.battery > 0) && (angleDiff < 0.65) && (sDist < 380);

        if (caughtInBeam) {
          // Direct light beam repels the stealth predator!
          s.state = "repelled";
          s.eyesAlpha = Math.min(1.0, s.eyesAlpha + 2.5 * dt); // Amber glare reflection!
          const awayAngle = Math.atan2(s.y - this.player.y, s.x - this.player.x);
          s.x += Math.cos(awayAngle) * (210 * dt);
          s.y += Math.sin(awayAngle) * (210 * dt);
          s.stalkTimer = 0;
          if (s.roarCooldown <= 0 && sDist < 280) {
            s.roarCooldown = 5.0;
            this.playSfx("leopard_growl");
            this.triggerScreenShake(3.0, 0.25);
            this.spawnFloatingText(s.x, s.y - 25, "HISS! (Deterred by Flashlight) 🐾", "#f59e0b");
            this.cb.onNotify("🐾 ආලෝකය වැදීමෙන් දිවියා අඳුරට පසුබැස්සේය! ආලෝකය නොනවත්වා තබාගන්න!");
          }
        } else if (s.state === "repelled") {
          // Retreat into darkness until safe distance, then resume stalking
          const awayAngle = Math.atan2(s.y - this.player.y, s.x - this.player.x);
          s.x += Math.cos(awayAngle) * (160 * dt);
          s.y += Math.sin(awayAngle) * (160 * dt);
          s.eyesAlpha = Math.max(0, s.eyesAlpha - 1.2 * dt);
          if (sDist > 360) {
            s.state = "lurking";
          }
        } else {
          // Stealth Ambush Stalking: Circle toward player's rear blind spot!
          const rearAngle = this.player.facingAngle + Math.PI;
          const stalkTargetX = this.player.x + Math.cos(rearAngle) * 210;
          const stalkTargetY = this.player.y + Math.sin(rearAngle) * 210;

          const toTargetAngle = Math.atan2(stalkTargetY - s.y, stalkTargetX - s.x);
          const stalkSpeed = (s.state === "charging") ? 270 : 85;
          s.x += Math.cos(toTargetAngle) * (stalkSpeed * dt);
          s.y += Math.sin(toTargetAngle) * (stalkSpeed * dt);
          s.stalkFrame = (s.stalkFrame || 0) + dt * (s.state === "charging" ? 14 : 5);

          // If in rear quadrant and close, stalking timer advances
          const isBehind = angleDiff > 1.2;
          if (isBehind && sDist < 280) {
            s.stalkTimer = (s.stalkTimer || 0) + dt;
            s.eyesAlpha = Math.min(1.0, s.eyesAlpha + 0.7 * dt);

            if (s.roarCooldown <= 0) {
              s.roarCooldown = 4.0;
              this.playSfx("leopard_growl");
              this.triggerScreenShake(3.5, 0.3);
              this.spawnFloatingText(s.x, s.y - 20, "STALKING BEHIND YOU... 🐾", "#ef4444");
              this.cb.onNotify("🐾 පිටුපසින් කැලෑ දිවියෙකුගේ ගෙරවුම් හඬක් ඇසේ! විදුලි පන්දම හරවා ආලෝකය විහිදුවන්න!");
            }

            // Ambush charge triggered if unspotted for 3.5s, or flashlight off, or very close!
            if (s.stalkTimer > 3.5 || !this.torchOn || sDist < 120) {
              s.state = "charging";
            }
          } else {
            s.stalkTimer = Math.max(0, (s.stalkTimer || 0) - dt * 0.5);
            s.eyesAlpha = Math.max(0, s.eyesAlpha - dt * 0.5);
          }

          // If charging, rush straight at player!
          if (s.state === "charging") {
            const chargeAngle = Math.atan2(this.player.y - s.y, this.player.x - s.x);
            s.x += Math.cos(chargeAngle) * (260 * dt);
            s.y += Math.sin(chargeAngle) * (260 * dt);
            s.eyesAlpha = 1.0;

            if (sDist < 44 && (s.attackCooldown <= 0)) {
              s.attackCooldown = 2.0;
              const pounceDmg = Math.round(36 * diffMult);
              this.health = Math.max(0, this.health - pounceDmg);
              this.sanity = Math.max(0, this.sanity - 22);
              this.bleeding = true;
              this.playSfx("hurt");
              this.triggerScreenShake(16, 0.55);
              this.spawnFloatingText(this.player.x, this.player.y - 32, `LEOPARD AMBUSH! -${pounceDmg} HP 🩸`, "#dc2626");
              this.cb.onNotify("🐾 දිවියා පිටුපසින් කඩා පැන්නේය! ලුණු [1] දමා ලේ ගැලීම නවත්වන්න හෝ ගිනිමැලය වෙත දිවයන්න!");
              s.state = "repelled";
              s.stalkTimer = 0;
              s.x += (Math.random() - 0.5) * 450;
              s.y += (Math.random() - 0.5) * 450;
            }
          }
        }
      }
    }

    // 4.4 Psychological Paranoia & Sanity Breakdown
    if (this.sanity < 50) {
      this.heartbeatTimer = (this.heartbeatTimer || 0) - dt;
      if (this.heartbeatTimer <= 0) {
        this.heartbeatTimer = 0.6 + (this.sanity / 50) * 0.7;
        this.playSfx("heartbeat_fast");
      }
    }
    if (this.sanity < 25) {
      this.paranoiaTimer = (this.paranoiaTimer || 5.0) - dt;
      if (this.paranoiaTimer <= 0) {
        this.paranoiaTimer = 7.0 + Math.random() * 5.0;
        this.playSfx("whisper_paranoia");
        this.triggerScreenShake(2.5, 0.2);
        const whispers = [
          "ඔවුන් මෙහි ඉන්නවා...",
          "පස්ස බලන්න එපා...",
          "අඳුරේ ඇස් ඔබ දෙස බලා සිටී...",
          "Look behind you...",
          "You will never leave Sinharaja...",
        ];
        const text = whispers[Math.floor(Math.random() * whispers.length)];
        this.spawnFloatingText(this.player.x + (Math.random() - 0.5) * 100, this.player.y - 36, text, "#c084fc");
      }
    }

    // 5. Leeches AI (Chase player, latch on as clinging parasites!)
    this.leeches.forEach((l) => {
      if (!l.alive) return;

      const repellentActive = this.repellentTimer > 0;
      const dist = Math.hypot(this.player.x - l.x, this.player.y - l.y);

      // Check if near any campfire or if repellent active -> flee!
      const nearFire = this.campfires.some(
        (fire) => Math.hypot(l.x - fire.x, l.y - fire.y) < 180
      );
      if (nearFire || repellentActive) {
        if (dist < 240) {
          const angle = Math.atan2(l.y - this.player.y, l.x - this.player.x);
          l.x += Math.cos(angle) * (l.speed * 1.6);
          l.y += Math.sin(angle) * (l.speed * 1.6);
        }
        return;
      }

      // If player is on fallen log bridge, leeches cannot reach them
      if (this.player.onLogBridge) return;

      if (dist < 260) {
        const angle = Math.atan2(this.player.y - l.y, this.player.x - l.x);
        l.x += Math.cos(angle) * (l.speed * 0.95);
        l.y += Math.sin(angle) * (l.speed * 0.95);
        l.crawlFrame += dt * 7;

        if (dist < this.player.radius + l.radius) {
          if ((this.attachedLeeches || 0) < 4) {
            this.attachedLeeches = (this.attachedLeeches || 0) + 1;
            l.alive = false;
            this.bleeding = true;
            this.health = Math.max(0, this.health - 6 * diffMult);
            this.sanity = Math.max(0, this.sanity - 8);
            this.playSfx("hurt");
            this.triggerScreenShake(7, 0.35);
            this.spawnFloatingText(this.player.x, this.player.y - 26, `LEECH CLUNG! [x${this.attachedLeeches}] 🩸`, "#ff1744");
            this.cb.onNotify(`🩸 කූඩැල්ලෙක් ශරීරයට එල්ලුණි! (x${this.attachedLeeches}) [1] හෝ SPACE ඔබා ලුණු දමන්න!`);
          }
        }
      }
    });

    // 6. Smooth Auto-Loot Item Pickups
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const dist = Math.hypot(this.player.x - it.x, this.player.y - it.y);
      if (dist < this.player.radius + 28) {
        this.playSfx("pickup");
        if (it.type === "salt") {
          this.saltCount += 2;
          this.spawnFloatingText(it.x, it.y - 20, "+2 ලුණු කුඩු 🧂", "#ffffff");
          this.cb.onNotify("🧂 ලුණු කුඩු පැකට් 2ක් බඩු මල්ලට එක්විය!");
        } else if (it.type === "herb") {
          this.herbCount += 1;
          this.spawnFloatingText(it.x, it.y - 20, "+1 ඖෂධීය පැළෑටිය 🌿", "#76ff03");
          this.cb.onNotify("🌿 ඖෂධීය පැළෑටියක් එකතු කරගත්තා! (H ඔබා සුවපත් වන්න)");
        } else if (it.type === "feather") {
          this.sanity = Math.min(100, this.sanity + 25);
          this.spawnFloatingText(it.x, it.y - 20, "+1 කැහිබෙලි පිහාටුව ✨", "#00e5ff");
          this.cb.onNotify("🪶 අලංකාර කැහිබෙලි පිහාටුවක් හමුවිය! (Sanity +25)");
          if (this.cb.onAchievementUnlocked) {
            this.cb.onAchievementUnlocked("magpie_feather", "නිල් කැහිබෙල්ලා (Magpie Seeker)", "🪶");
          }
        } else if (it.type === "ginger_tea") {
          this.gingerTeaCount = (this.gingerTeaCount || 0) + 1;
          this.temperature = Math.min(100, (this.temperature || 100) + 25);
          this.spawnFloatingText(it.x, it.y - 20, "+1 ඉඟුරු තේ 🫖", "#ffb300");
          this.cb.onNotify("🫖 උණුසුම් ඉඟුරු තේ බෝතලයක් හමුවිය! [G] ඔබා පානය කරන්න.");
        }
        this.items.splice(i, 1);
      }
    }

    // 7. Wildlife Simulation (Blue Magpie & Langurs)
    if (this.blueMagpie) {
      this.blueMagpie.timer -= dt;
      if (this.blueMagpie.timer <= 0) {
        this.blueMagpie.timer = 18 + Math.random() * 15;
        this.blueMagpie.x = -120;
        this.blueMagpie.y = this.player.y - 120 + (Math.random() - 0.5) * 160;
        this.blueMagpie.active = true;
        this.playSfx("bird_call");
      }

      if (this.blueMagpie.active) {
        this.blueMagpie.x += 190 * dt;
        this.blueMagpie.wingAngle = Math.sin(performance.now() * 0.018) * 0.7;

        // Chance to drop a sacred blue feather once near player
        if (Math.abs(this.blueMagpie.x - this.player.x) < 45 && this.blueMagpie.feathersDropped < 3) {
          this.blueMagpie.feathersDropped++;
          this.items.push({
            type: "feather",
            x: this.blueMagpie.x,
            y: this.blueMagpie.y,
            icon: "🪶",
            title: "කැහිබෙලි පිහාටුව",
          });
          this.cb.onNotify("🪶 නිල් කැහිබෙල්ලෙකු පියාඹා යමින් පිහාටුවක් බිම හෙළීය!");
        }

        if (this.blueMagpie.x > this.worldWidth + 120) {
          this.blueMagpie.active = false;
        }
      }
    }

    // Langurs Monkey vocalizations
    this.langurs.forEach((langur) => {
      langur.callTimer -= dt;
      if (langur.callTimer <= 0) {
        langur.callTimer = 22 + Math.random() * 18;
        const dist = Math.hypot(this.player.x - langur.x, this.player.y - langur.y);
        if (dist < 450) {
          this.playSfx("monkey_call");
          langur.shake = 1.0;
        }
      }
      if (langur.shake > 0) langur.shake = Math.max(0, langur.shake - dt * 2);
    });

    // Ambient cicadas & forest frogs audio loop
    this.ambientTimer -= dt;
    if (this.ambientTimer <= 0) {
      this.ambientTimer = 12 + Math.random() * 8;
      if (Math.random() < 0.65) {
        this.playSfx("ambient_cicada");
      }
    }

    // 8. Fireflies & Weather Animations
    this.fireflies.forEach((f) => {
      f.x += f.speedX;
      f.y += f.speedY;
      f.phase += dt * 3;
    });

    if (this.chapter !== 1) {
      // CHAPTERS 2, 3, 4, 5: UNIQUE ATMOSPHERES (NO RAIN)
      this.rainDrops = [];
      this.stormActive = false;
      this.lightningActive = false;
      if (this.chapter === 2 && this.mistClouds) {
        this.mistClouds.forEach((m) => {
          m.x += m.speed * 20 * dt;
          if (m.x - m.radius > this.worldWidth) {
            m.x = -m.radius;
            m.y = Math.random() * this.worldHeight;
          }
        });
      }
    } else {
      // CHAPTER 1: Rain & Thunderstorms
      this.rainDrops.forEach((r) => {
        r.y += r.speed;
        r.x -= 2;
        if (r.y > this.canvas.height) {
          r.y = -20;
          r.x = Math.random() * (this.canvas.width + 100);
        }
      });

      // 8.1 Dynamic Rainstorm Simulation
      if (this.stormActive) {
        if (this.stormIntensity < 1) this.stormIntensity = Math.min(1, this.stormIntensity + dt * 0.4);
        while (this.rainDrops.length < 240) {
          this.rainDrops.push({
            x: Math.random() * (this.canvas.width + 100),
            y: Math.random() * -60,
            length: 18 + Math.random() * 16,
            speed: 22 + Math.random() * 10,
          });
        }
        // Camera lens water droplets in rain
        if (Math.random() < 0.25 && this.lensDroplets.length < 18) {
          this.lensDroplets.push({
            x: 20 + Math.random() * (this.canvas.width - 40),
            y: 20 + Math.random() * (this.canvas.height - 40),
            r: 3 + Math.random() * 6,
            alpha: 0.5 + Math.random() * 0.4,
            life: 2.5 + Math.random() * 3,
          });
        }
      }

      // Lens droplets update
      for (let i = this.lensDroplets.length - 1; i >= 0; i--) {
        const ld = this.lensDroplets[i];
        ld.life -= dt;
        ld.y += 4 * dt;
        ld.alpha = Math.max(0, ld.life / 3);
        if (ld.life <= 0) this.lensDroplets.splice(i, 1);
      }

      this.lightningTimer += dt;
      const lightningThreshold = this.stormActive ? 7.5 : 18;
      if (this.lightningTimer > lightningThreshold) {
        this.lightningTimer = 0;
        this.lightningActive = true;
        this.playSfx("thunder");
        this.triggerScreenShake(this.stormActive ? 11 : 6, 0.45);
        setTimeout(() => {
          this.lightningActive = false;
        }, 150);
      }
    }

    // 8.2 Emergency Flare & Rescue Helicopter Arrival Physics
    if (this.flareEntity) {
      if (!this.flareEntity.exploded) {
        this.flareEntity.altitude += 280 * dt;
        if (this.flareEntity.altitude >= 360) {
          this.flareEntity.exploded = true;
          this.playSfx("flare_burst");
          this.triggerScreenShake(8, 0.6);
        }
      } else {
        this.flareEntity.timer += dt;
        this.chopperSearchlightAngle += dt * 1.8;
        if (this.flareEntity.timer > 4.5) {
          this.flareEntity = null;
          this.cb.onGameWon("hero");
        }
      }
    }

    // ═══ AAA: Wind & Particle Systems Update ═════════════════════════════
    this.windTimer += dt * 0.4;
    this.windAngle = Math.sin(this.windTimer) * 0.35 + 0.15;
    this.windStrength = this.stormActive ? 1.5 : 0.4 + Math.sin(this.windTimer * 0.9) * 0.25;

    // Jungle particles (pollen, drifting leaves)
    this.jungleParticles.forEach((p) => {
      p.x += (p.vx + Math.cos(this.windAngle) * this.windStrength) * 36 * dt;
      p.y += (p.vy + (this.stormActive ? 0.9 : 0.25)) * 36 * dt;
      p.rotation += p.rotSpeed;
      if (p.x > this.worldWidth) p.x = 0;
      if (p.x < 0) p.x = this.worldWidth;
      if (p.y > this.worldHeight) p.y = 0;
      if (p.y < 0) p.y = this.worldHeight;
    });

    // Butterflies flight wander
    this.butterflies.forEach((b) => {
      b.wanderTimer -= dt;
      if (b.wanderTimer <= 0) {
        b.wanderTimer = 1.2 + Math.random() * 2.2;
        b.vx += (Math.random() - 0.5) * 1.4;
        b.vy += (Math.random() - 0.5) * 1.4;
        b.vx = Math.max(-1.8, Math.min(1.8, b.vx));
        b.vy = Math.max(-1.4, Math.min(1.4, b.vy));
      }
      b.x += b.vx * 32 * dt;
      b.y += b.vy * 32 * dt;
      b.wingPhase += dt * b.wingSpeed;
      if (b.x < 80) b.vx = Math.abs(b.vx);
      if (b.x > this.worldWidth - 80) b.vx = -Math.abs(b.vx);
      if (b.y < 80) b.vy = Math.abs(b.vy);
      if (b.y > this.worldHeight - 80) b.vy = -Math.abs(b.vy);
    });

    // Screen Shake Decay
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= dt;
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 2;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * 2;
      this.screenShake.intensity = Math.max(0, this.screenShake.intensity - dt * 14);
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
      this.screenShake.intensity = 0;
    }

    // Floating text messages (damage numbers, pickup labels)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.timer += dt;
      ft.y += ft.vy * 45 * dt;
      ft.alpha = Math.max(0, 1 - ft.timer / ft.maxTime);
      if (ft.timer >= ft.maxTime) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Low Health/Sanity Heartbeat Audio
    if (this.health < 35 || this.sanity < 30 || this.bleeding) {
      this.heartbeatTimer -= dt;
      if (this.heartbeatTimer <= 0) {
        this.heartbeatTimer = this.health < 20 ? 0.65 : 1.15;
        this.playSfx("heartbeat");
      }
    }

    // Fade footsteps & clean up expired
    if (this.footsteps) {
      for (let i = this.footsteps.length - 1; i >= 0; i--) {
        this.footsteps[i].alpha -= 0.04 * dt;
        if (this.footsteps[i].alpha <= 0) {
          this.footsteps.splice(i, 1);
        }
      }
    }

    // Expand and fade water ripples
    if (this.waterRipples) {
      for (let i = this.waterRipples.length - 1; i >= 0; i--) {
        const rip = this.waterRipples[i];
        rip.r += (rip.speed || 20) * dt;
        rip.alpha -= 0.65 * dt;
        if (rip.alpha <= 0 || rip.r >= rip.maxR) {
          this.waterRipples.splice(i, 1);
        }
      }
    }

    // Report stats to UI (Throttled to ~15 Hz to eliminate React virtual DOM thrashing)
    this.statsUpdateTimer = (this.statsUpdateTimer || 0) + dt;
    if (this.cb.onStatsUpdate && this.statsUpdateTimer >= 0.066) {
      this.statsUpdateTimer = 0;

      let nearInteractable = null;
      let minInteractDist = 9999;
      if (this.interactiveObjects) {
        for (let obj of this.interactiveObjects) {
          const d = Math.hypot(this.player.x - obj.x, this.player.y - obj.y);
          const interactRadius = (obj.radius || 35) + 65;
          if (d < interactRadius && d < minInteractDist) {
            minInteractDist = d;
            nearInteractable = {
              id: obj.id,
              title: obj.title || "අන්තර්ක්‍රියාකාරී වස්තුව",
              prompt: obj.prompt || "[E] පරීක්ෂා කරන්න",
              icon: obj.icon || "🔍"
            };
          }
        }
      }

      this.cb.onStatsUpdate({
        health: Math.round(this.health),
        sanity: Math.round(this.sanity),
        battery: Math.round(this.battery),
        stamina: Math.round(this.player.stamina),
        torchOn: this.torchOn,
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
        nearCampfire,
        nearInteractable,
        hasKey: this.hasKey,
        hasSample: this.hasSample,
        bleeding: this.bleeding,
        teaBuffTimer: Math.round(this.teaBuffTimer),
        chapter: this.chapter,
        zoom: this.zoom,
        playerX: Math.round(this.player.x),
        playerY: Math.round(this.player.y),
        playerAngle: this.player.angle || 0,
        elapsedTime: Math.floor(this.elapsedTime),
        inShelter: !!this.player.inShelter,
        inCave: !!this.player.inCave,
        inMud: !!this.player.inMud,
        temperature: Math.round(this.temperature ?? 100),
        gingerTeaCount: this.gingerTeaCount || 0,
        hasGears: !!this.hasGears,
        hasEmf: !!this.hasEmf,
        emfProximity: this.emfProximity || 0,
        cableRepaired: !!this.cableway?.repaired,
        attachedLeeches: this.attachedLeeches || 0,
        venomToxicity: Math.round(this.venomToxicity || 0),
        noiseLevel: Math.round(this.noiseLevel || 15),
        stalkerAlert: this.shadowStalker?.state || "lurking",
        stalkerEyes: (this.shadowStalker?.eyesAlpha || 0) > 0.25,
        viewMode: this.viewMode,
        difficulty: this.difficulty || "tactical",
        tasks: { ...this.tasks },
      });
    }
  }

  checkCollision(x, y) {
    for (let obs of this.obstacles) {
      if (obs.radius) {
        if (Math.hypot(x - obs.x, y - obs.y) < obs.radius + this.player.radius) return true;
      } else if (obs.w && obs.h) {
        if (
          x + this.player.radius > obs.x &&
          x - this.player.radius < obs.x + obs.w &&
          y + this.player.radius > obs.y &&
          y - this.player.radius < obs.y + obs.h
        ) {
          return true;
        }
      }
    }
    return false;
  }

  // ── Realistic 3D Ground Items Renderer ─────────────────────────────────────
  renderRealisticGroundItem(ctx, it, time) {
    ctx.save();
    ctx.translate(it.x, it.y);

    // Soft drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const t = it.type || "";
    if (t === "salt") {
      // 3D Canvas Salt Pouch
      ctx.fillStyle = "#8d704b"; // Shadow side
      ctx.beginPath();
      ctx.ellipse(2, 0, 9, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#bca37f"; // Light side
      ctx.beginPath();
      ctx.ellipse(-1, -1, 8, 7.5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Tied neck with dark cord
      ctx.strokeStyle = "#4a3525";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -6, 4, 0, Math.PI);
      ctx.stroke();

      // Spilling white salt crystals with sparkle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(0, -7, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(-2, -9, 2, 2);
      ctx.fillRect(2, -8, 1.5, 1.5);
    } else if (t === "herb") {
      // 3D Medicinal Jungle Herb Cluster
      const sway = Math.sin(time * 2 + it.x) * 0.1;
      ctx.rotate(sway);

      // Radial fern fronds
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = i % 2 === 0 ? "#1b5e20" : "#2e7d32";
        ctx.beginPath();
        ctx.ellipse(0, -8, 3.5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#81c784";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -15);
        ctx.stroke();
        ctx.restore();
      }

      // Central medicinal golden blossom & dewdrop
      ctx.fillStyle = "#ffd54f";
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(-1, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Subtle emerald aura
      ctx.strokeStyle = "rgba(74, 222, 128, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14 + Math.sin(time * 3) * 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (t === "ginger_tea") {
      // 3D Steaming Terracotta Tea Pot
      const potGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 10);
      potGrad.addColorStop(0, "#d97706");
      potGrad.addColorStop(1, "#78350f");
      ctx.fillStyle = potGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Rim & lid
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.ellipse(0, -6, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(0, -8, 2, 0, Math.PI * 2);
      ctx.fill();

      // Handle and spout
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-8, 0, 4, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(7, -2);
      ctx.lineTo(12, -7);
      ctx.stroke();

      // Animated rising steam wisps
      const steamY = ((time * 20 + it.x) % 25);
      const steamAlpha = Math.max(0, 1 - steamY / 25);
      ctx.strokeStyle = `rgba(254, 243, 199, ${steamAlpha * 0.65})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(11, -8 - steamY);
      ctx.quadraticCurveTo(15 + Math.sin(time * 4) * 3, -14 - steamY, 11, -20 - steamY);
      ctx.stroke();
    } else if (t === "feather") {
      // 3D Iridescent Sacred Blue Magpie Feather
      const hoverY = Math.sin(time * 3 + it.x) * 4;
      ctx.translate(0, hoverY - 4);
      ctx.rotate(0.35 + Math.sin(time * 2) * 0.08);

      // Feather vane
      ctx.fillStyle = "#1d4ed8"; // Royal blue
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tip pattern (Chestnut and white bands)
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.ellipse(0, 8, 3.8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(0, 11, 2.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // White quill shaft
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 13);
      ctx.stroke();

      // Sacred shimmer particle
      ctx.fillStyle = "rgba(96, 165, 250, 0.85)";
      ctx.beginPath();
      ctx.arc(Math.sin(time * 5) * 6, Math.cos(time * 4) * 8, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Generic Rugged Survival Supply Kit
      ctx.fillStyle = "#334155";
      ctx.fillRect(-8, -6, 16, 12);
      ctx.fillStyle = "#475569";
      ctx.fillRect(-7, -5, 14, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-2, -3, 4, 6);
      ctx.fillRect(-4, -1, 8, 2);
    }

    ctx.restore();
  }

  // ── Realistic 3D Interactive Objects Renderer ─────────────────────────────
  render3DInteractiveObject(ctx, obj, time) {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    const id = obj.id || "";
    const distToPlayer = Math.hypot(obj.x - this.player.x, obj.y - this.player.y);
    const isNearby = distToPlayer < (obj.radius || 30) + 55;

    // ── 1. OLD RANGER GUNADASA NPC (Pro 2.5D Upright Elder Ranger) ──
    if (id === "gunadasa_npc" || id === "npc") {
      // A. Ground Contact Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 3, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. Direction Facing & Upright Model
      // When player walks to his left, flip horizontally so he faces towards the player
      const faceLeft = this.player.x < obj.x;
      const breath = Math.sin(time * 0.0022) * 0.7;

      ctx.save();
      if (faceLeft) {
        ctx.scale(-1, 1);
      }

      // 1. Tall Bamboo Walking Staff (Planted into the soil on player-facing side)
      // Brass ferrule tip on ground
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(11.5, 1, 3, 3);

      // Bamboo Shaft
      const staffGrad = ctx.createLinearGradient(11, 0, 14, 0);
      staffGrad.addColorStop(0, "#d4a359");
      staffGrad.addColorStop(0.5, "#eed088");
      staffGrad.addColorStop(1, "#9c6f28");
      ctx.fillStyle = staffGrad;
      ctx.fillRect(11.5, -46, 3, 47);

      // Bamboo segments & dark knot rings
      ctx.fillStyle = "#5d4037";
      [-4, -14, -24, -34, -42].forEach(ky => {
        ctx.fillRect(10.5, ky, 5, 2);
      });

      // 2. Leather Sandals & Feet at ground level
      // Left foot & leather sandal
      ctx.fillStyle = "#271810";
      ctx.fillRect(-8, -1, 7, 4);
      ctx.fillStyle = "#c68a4c"; // Weathered skin
      ctx.fillRect(-7, -4, 5, 4);
      ctx.fillStyle = "#422817"; // Leather strap
      ctx.fillRect(-8, -2, 7, 1.5);

      // Right foot & leather sandal
      ctx.fillStyle = "#271810";
      ctx.fillRect(1, -1, 7, 4);
      ctx.fillStyle = "#c68a4c";
      ctx.fillRect(2, -4, 5, 4);
      ctx.fillStyle = "#422817";
      ctx.fillRect(1, -2, 7, 1.5);

      // 3. Traditional Sri Lankan Sarong (කයිලි / සරම)
      const sarongGrad = ctx.createLinearGradient(-10, 0, 10, 0);
      sarongGrad.addColorStop(0, "#293e26");
      sarongGrad.addColorStop(0.3, "#3d5c38");
      sarongGrad.addColorStop(0.8, "#2e462b");
      sarongGrad.addColorStop(1, "#1e2e1c");
      ctx.fillStyle = sarongGrad;

      ctx.beginPath();
      ctx.moveTo(-9, -22);
      ctx.lineTo(9, -22);
      ctx.lineTo(10, -4);
      ctx.lineTo(-10, -4);
      ctx.closePath();
      ctx.fill();

      // Subtle traditional woven checkered pattern lines
      ctx.strokeStyle = "rgba(20, 32, 18, 0.55)";
      ctx.lineWidth = 1;
      for (let sy = -19; sy <= -6; sy += 4) {
        ctx.beginPath();
        ctx.moveTo(-9.5, sy);
        ctx.lineTo(9.5, sy);
        ctx.stroke();
      }
      for (let sx = -6; sx <= 6; sx += 4) {
        ctx.beginPath();
        ctx.moveTo(sx, -22);
        ctx.lineTo(sx * 1.05, -4);
        ctx.stroke();
      }

      // Sarong rolled waistband knot (සරම් ගැටය / බණ්ඩලය)
      ctx.fillStyle = "#223520";
      ctx.beginPath();
      ctx.ellipse(0, -22, 10, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Leather Utility Field Belt & Pouch
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(-9, -24, 18, 3);
      ctx.fillStyle = "#d4af37"; // Brass buckle
      ctx.fillRect(-2, -25, 4, 4);

      // Field pouch & canvas canteen on hip
      ctx.fillStyle = "#4e342e";
      ctx.fillRect(-9, -21, 5, 6);
      ctx.fillStyle = "#8d6e63";
      ctx.beginPath();
      ctx.ellipse(-7, -15, 3, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // 5. Khaki Ranger Jacket & Torso (With breathing motion)
      const torsoY = -37 + breath * 0.4;
      const jacketGrad = ctx.createLinearGradient(-10, 0, 10, 0);
      jacketGrad.addColorStop(0, "#4a5b42");
      jacketGrad.addColorStop(0.5, "#607255");
      jacketGrad.addColorStop(1, "#36432f");
      ctx.fillStyle = jacketGrad;
      ctx.fillRect(-10, torsoY, 20, 14);

      ctx.strokeStyle = "#253020";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-10, torsoY, 20, 14);

      // Ranger pockets & button placket
      ctx.fillStyle = "#3e4d37";
      ctx.fillRect(-8, torsoY + 3, 5, 5);
      ctx.fillRect(3, torsoY + 3, 5, 5);
      ctx.strokeStyle = "#1b2417";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, torsoY);
      ctx.lineTo(0, torsoY + 14);
      ctx.stroke();

      // Brass buttons
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(-0.75, torsoY + 3, 1.5, 1.5);
      ctx.fillRect(-0.75, torsoY + 7, 1.5, 1.5);
      ctx.fillRect(-0.75, torsoY + 11, 1.5, 1.5);

      // 6. Arms & Hands
      // Right Arm holding bamboo staff
      ctx.fillStyle = "#4a5b42"; // Sleeve
      ctx.beginPath();
      ctx.moveTo(8, torsoY + 2);
      ctx.lineTo(12, torsoY + 11);
      ctx.lineTo(10, torsoY + 12);
      ctx.lineTo(6, torsoY + 4);
      ctx.closePath();
      ctx.fill();

      // Weathered hand gripping staff
      ctx.fillStyle = "#c68a4c";
      ctx.beginPath();
      ctx.arc(11.5, torsoY + 12, 3, 0, Math.PI * 2);
      ctx.fill();

      // Left Arm relaxed at side
      ctx.fillStyle = "#36432f";
      ctx.beginPath();
      ctx.moveTo(-8, torsoY + 2);
      ctx.lineTo(-11, torsoY + 12);
      ctx.lineTo(-9, torsoY + 13);
      ctx.lineTo(-6, torsoY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c68a4c";
      ctx.beginPath();
      ctx.arc(-10, torsoY + 13, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 7. Elder Head, Weathered Skin, Facial Features & Grand Silver Beard
      const headY = torsoY - 7;
      // Neck
      ctx.fillStyle = "#b57b42";
      ctx.fillRect(-3, torsoY - 2, 6, 4);

      // Head
      ctx.fillStyle = "#c68a4c";
      ctx.beginPath();
      ctx.arc(0, headY, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Wise eyes & eyebrows
      ctx.fillStyle = "#94a3b8"; // Silver eyebrows
      ctx.fillRect(1, headY - 3, 3, 1.2);
      ctx.fillRect(-4, headY - 3, 3, 1.2);
      ctx.fillStyle = "#1e293b"; // Eyes
      ctx.fillRect(2, headY - 1.5, 1.5, 1.5);
      ctx.fillRect(-3, headY - 1.5, 1.5, 1.5);

      // Flowing Silver-White Elder Beard (Drapes over chest)
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.moveTo(-5, headY + 1);
      ctx.quadraticCurveTo(-6, headY + 7, -2, headY + 12);
      ctx.lineTo(0, headY + 13);
      ctx.lineTo(2, headY + 12);
      ctx.quadraticCurveTo(6, headY + 7, 5, headY + 1);
      ctx.closePath();
      ctx.fill();

      // Subtle beard strands & shading
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, headY + 2); ctx.lineTo(0, headY + 12);
      ctx.moveTo(-2, headY + 3); ctx.lineTo(-1, headY + 11);
      ctx.moveTo(2, headY + 3); ctx.lineTo(1, headY + 11);
      ctx.stroke();

      // 8. Wide-Brimmed Ranger Safari Hat
      const hatY = headY - 4;

      // Hat Brim (2.5D elliptical slant)
      ctx.fillStyle = "#4a3c28";
      ctx.beginPath();
      ctx.ellipse(0, hatY, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#271d11";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hat Leather Band & Buckle
      ctx.fillStyle = "#1c140d";
      ctx.fillRect(-7, hatY - 4, 14, 2.5);
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(2, hatY - 4, 2, 2.5);

      // Hat Crown
      const hatGrad = ctx.createLinearGradient(-6, 0, 6, 0);
      hatGrad.addColorStop(0, "#5a4933");
      hatGrad.addColorStop(0.5, "#705c42");
      hatGrad.addColorStop(1, "#3d2e1c");
      ctx.fillStyle = hatGrad;
      ctx.beginPath();
      ctx.roundRect(-6.5, hatY - 9, 13, 7, [4, 4, 0, 0]);
      ctx.fill();

      ctx.restore();

      // 9. Floating Speech Beacon if not yet helped (Rendered outside scale flip)
      if (!this.npc.helped) {
        const pulse = (time * 0.003) % 1;
        ctx.strokeStyle = `rgba(74, 222, 128, ${1 - pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -58, 16 + pulse * 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#4ade80";
        ctx.beginPath();
        ctx.arc(0, -58, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // ── 2. CHESTS, BOXES & SUPPLY CRATES ──
    else if (id.includes("chest") || id.includes("crate") || id.includes("box")) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 12, 22, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Front Face
      const frontGrad = ctx.createLinearGradient(0, -5, 0, 12);
      frontGrad.addColorStop(0, "#4e342e");
      frontGrad.addColorStop(1, "#271612");
      ctx.fillStyle = frontGrad;
      ctx.fillRect(-18, -4, 36, 16);

      // Top Face (Isometric Tilt)
      ctx.fillStyle = "#6d4c41";
      ctx.beginPath();
      ctx.moveTo(-18, -4);
      ctx.lineTo(-12, -14);
      ctx.lineTo(24, -14);
      ctx.lineTo(18, -4);
      ctx.closePath();
      ctx.fill();

      // Right Side Face
      ctx.fillStyle = "#3e2723";
      ctx.beginPath();
      ctx.moveTo(18, -4);
      ctx.lineTo(24, -14);
      ctx.lineTo(24, 2);
      ctx.lineTo(18, 12);
      ctx.closePath();
      ctx.fill();

      // Iron corner brackets & strapping
      ctx.fillStyle = "#212121";
      ctx.fillRect(-18, -4, 4, 16);
      ctx.fillRect(14, -4, 4, 16);
      ctx.fillRect(-18, 3, 36, 3);

      // Brass Lock Hasp & Padlock
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(0, 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.fillRect(-1, 2, 2, 3);

      if (isNearby) {
        ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-19, -5, 38, 18);
      }
    }
    // ── 3. FIELD LOGBOOKS, RESEARCH PAPERS & ANCIENT SLATES ──
    else if (id.includes("diary") || id.includes("slate") || id.includes("doc") || id.includes("truth") || id.includes("tape")) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(0, 8, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (id.includes("slate")) {
        ctx.fillStyle = "#475569";
        ctx.fillRect(-14, -16, 28, 22);
        ctx.fillStyle = "#334155";
        ctx.fillRect(-12, -14, 24, 18);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-7, -10); ctx.lineTo(-2, -5); ctx.lineTo(-7, 0);
        ctx.moveTo(3, -10); ctx.lineTo(7, -10); ctx.lineTo(5, -2);
        ctx.stroke();

        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(-1, -7, 2, 2);
        ctx.shadowBlur = 0;
      } else if (id.includes("tape")) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-13, -9, 26, 17);
        ctx.fillStyle = "#475569";
        ctx.fillRect(-9, -6, 18, 11);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-4, 0, 3, 0, Math.PI * 2);
        ctx.arc(4, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(-4, 0, 1.5, 0, Math.PI * 2);
        ctx.arc(4, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#3e2723";
        ctx.beginPath();
        ctx.ellipse(0, 4, 16, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#7c2d12";
        ctx.fillRect(-13, -11, 26, 16);
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(-11, -10, 22, 13);
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(0, 3);
        ctx.stroke();

        ctx.fillStyle = "#dc2626";
        ctx.fillRect(1, 1, 2.5, 8);
      }
    }
    // ── 4. KEYS, KEYCARDS & ANCIENT CRYSTAL / DNA CORES ──
    else if (id.includes("key") || id.includes("sample") || id.includes("core") || id.includes("gem") || id.includes("mask")) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(0, 6, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (id.includes("keycard")) {
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(-10, -6, 20, 12);
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(-10, -6, 20, 3.5);
        ctx.fillStyle = "#eab308";
        ctx.fillRect(-6, -1, 4, 4);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, -1, 8, 4);
      } else if (id.includes("core") || id.includes("gem") || id.includes("crystal") || id.includes("sample")) {
        const pulse = Math.sin(time * 0.005) * 4;
        ctx.shadowColor = "#00f5d4";
        ctx.shadowBlur = 12 + pulse;

        ctx.fillStyle = "#334155";
        ctx.fillRect(-8, 2, 16, 6);

        ctx.fillStyle = "rgba(6, 182, 212, 0.35)";
        ctx.fillRect(-6, -14, 12, 16);

        ctx.fillStyle = "#00f5d4";
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(4, -6);
        ctx.lineTo(0, 1);
        ctx.lineTo(-4, -6);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(-6, -2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#451a03";
        ctx.beginPath();
        ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#d97706";
        ctx.fillRect(-2, -3.5, 16, 3);
        ctx.fillRect(8, -0.5, 3, 5);
        ctx.fillRect(12, -0.5, 2.5, 3.5);
      }
    }
    // ── 5. HEAVY DIESEL GENERATOR, BREAKER & HIGH-TECH TERMINALS ──
    else if (id.includes("generator") || id.includes("breaker") || id.includes("terminal")) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.beginPath();
      ctx.ellipse(0, 16, 28, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      const vShudder = (this.generatorOn ? Math.sin(time * 40) * 0.6 : 0);
      ctx.translate(vShudder, 0);

      const genGrad = ctx.createLinearGradient(0, -18, 0, 14);
      genGrad.addColorStop(0, "#475569");
      genGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = genGrad;
      ctx.fillRect(-22, -16, 44, 30);

      ctx.fillStyle = "#334155";
      ctx.fillRect(-18, -24, 36, 10);

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      for (let y = -8; y <= 6; y += 4) {
        ctx.beginPath();
        ctx.moveTo(-16, y);
        ctx.lineTo(6, y);
        ctx.stroke();
      }

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(12, -28, 5, 14);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(11, -30, 7, 3);

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(12, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, -2);
      ctx.lineTo(14, -4);
      ctx.stroke();

      const isRunning = this.generatorOn || this.breakerOff;
      ctx.fillStyle = isRunning ? "#22c55e" : "#ef4444";
      ctx.shadowColor = isRunning ? "#22c55e" : "#ef4444";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(12, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // ── 6. RADIO TOWER, RADAR, SATELLITE DISH & EXTRACTION HELIPAD ──
    else if (id.includes("tower") || id.includes("satellite") || id.includes("beacon") || id.includes("helipad") || id.includes("monorail") || id.includes("elevator")) {
      if (id.includes("helipad")) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-12, -14, 5, 28);
        ctx.fillRect(7, -14, 5, 28);
        ctx.fillRect(-12, -2.5, 24, 5);

        const strobe = Math.floor((time * 0.006) % 4);
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI) / 2 + Math.PI / 4;
          const lx = Math.cos(ang) * 28;
          const ly = Math.sin(ang) * 28;
          ctx.fillStyle = i === strobe ? "#22c55e" : "#14532d";
          ctx.beginPath();
          ctx.arc(lx, ly, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(0, 14, 24, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-16, 12); ctx.lineTo(0, -18); ctx.lineTo(16, 12);
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(0, -18, 12, Math.PI * 0.7, Math.PI * 1.8);
        ctx.stroke();

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(0, -38);
        ctx.stroke();

        const beaconOn = Math.sin(time * 0.008) > 0.2;
        ctx.fillStyle = beaconOn ? "#ef4444" : "#450a0a";
        ctx.shadowColor = beaconOn ? "#ef4444" : "transparent";
        ctx.shadowBlur = beaconOn ? 14 : 0;
        ctx.beginPath();
        ctx.arc(0, -39, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    // ── 7. DIRECTIONAL TRAIL SIGNS & INFORMATION POSTS ──
    else if (id.includes("sign")) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
      ctx.beginPath();
      ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3e2723";
      ctx.beginPath();
      ctx.ellipse(0, 5, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#5d4037";
      ctx.fillRect(-3, -24, 6, 30);
      ctx.fillStyle = "#795548";
      ctx.fillRect(-3, -24, 2, 30);

      // Upper plank
      ctx.fillStyle = "#8d6e63";
      ctx.beginPath();
      ctx.moveTo(-16, -22);
      ctx.lineTo(14, -22);
      ctx.lineTo(20, -16);
      ctx.lineTo(14, -10);
      ctx.lineTo(-16, -10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#3e2723";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Lower plank
      ctx.fillStyle = "#6d4c41";
      ctx.beginPath();
      ctx.moveTo(16, -10);
      ctx.lineTo(-14, -10);
      ctx.lineTo(-20, -4);
      ctx.lineTo(-14, 2);
      ctx.lineTo(16, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-1, -17, 2, 2);
      ctx.fillRect(-1, -5, 2, 2);
    }
    // ── 8. SACRED FEATHERS & NATURAL FOUNTAINS ──
    else if (id.includes("feather")) {
      const hoverY = Math.sin(time * 0.004 + obj.x) * 5;
      ctx.translate(0, hoverY - 6);

      ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1d4ed8";
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-0.5, -14, 1.2, 28);
    }
    // ── 9. DEFAULT AAA EXPEDITION CRATE FALLBACK ──
    else {
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(0, 10, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#334155";
      ctx.fillRect(-14, -8, 28, 16);
      ctx.fillStyle = "#475569";
      ctx.fillRect(-14, -8, 28, 4);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-14, -8, 28, 16);
    }

    // ── TACTICAL DIEGETIC IN-WORLD HOVER BADGE ──
    if (isNearby) {
      const tw = Math.min(220, ctx.measureText(obj.title).width + 30);
      ctx.fillStyle = "rgba(10, 15, 12, 0.94)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-tw / 2, -obj.radius - 38, tw, 26, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 12px 'Noto Sans Sinhala', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(obj.title, 0, -obj.radius - 25);
    }

    ctx.restore();
  }

  // ── Realistic 3D Campfire Renderer ────────────────────────────────────────
  renderRealisticCampfire(ctx, fire, time) {
    ctx.save();
    ctx.translate(fire.x, fire.y);

    // Charcoal ash bed
    ctx.fillStyle = "rgba(15, 12, 10, 0.75)";
    ctx.beginPath();
    ctx.ellipse(0, 4, fire.radius + 6, fire.radius * 0.65 + 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ring of 3D river rocks surrounding fire pit
    const numRocks = 9;
    for (let i = 0; i < numRocks; i++) {
      const angle = (i * Math.PI * 2) / numRocks;
      const rx = Math.cos(angle) * (fire.radius - 2);
      const ry = Math.sin(angle) * (fire.radius * 0.65 - 1) + 2;
      const rockRadius = 6.5 + (i % 3) * 1.5;

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.ellipse(rx + 1, ry + 2, rockRadius, rockRadius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      const rockGrad = ctx.createRadialGradient(rx - 2, ry - 2, 1, rx, ry, rockRadius);
      rockGrad.addColorStop(0, i % 2 === 0 ? "#78716c" : "#57534e");
      rockGrad.addColorStop(1, i % 2 === 0 ? "#292524" : "#1c1917");
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.ellipse(rx, ry, rockRadius, rockRadius * 0.75, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crossed 3D charred logs
    ctx.strokeStyle = "#271612";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-14, -8); ctx.lineTo(14, 8);
    ctx.moveTo(-14, 8); ctx.lineTo(14, -8);
    ctx.moveTo(0, -14); ctx.lineTo(0, 10);
    ctx.stroke();

    // Glowing hot ember core
    const emberPulse = Math.sin(time * 0.01) * 3;
    ctx.fillStyle = "#ea580c";
    ctx.shadowColor = "#f97316";
    ctx.shadowBlur = 16 + emberPulse;
    ctx.beginPath();
    ctx.arc(0, 0, 10 + emberPulse * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Multi-layer dynamic flame tongues
    const f1 = Math.sin(time * 0.02) * 3;
    const f2 = Math.cos(time * 0.025) * 4;
    const f3 = Math.sin(time * 0.035) * 3;

    // Outer flame (Deep Orange / Red)
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.quadraticCurveTo(-14 + f1, -12, f1, -26 + f2);
    ctx.quadraticCurveTo(14 + f3, -12, 10, 4);
    ctx.closePath();
    ctx.fill();

    // Mid flame (Golden Amber)
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(-7, 3);
    ctx.quadraticCurveTo(-9 + f2, -8, f2 * 0.5, -20 + f1);
    ctx.quadraticCurveTo(9 + f1, -8, 7, 3);
    ctx.closePath();
    ctx.fill();

    // Core flame (Warm Yellow)
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(0, -2, 6 + Math.abs(f1 * 0.5), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── Realistic 3D Granite Boulder / Obstacle Renderer ──────────────────────
  renderRealisticBoulder(ctx, obs) {
    if (obs.radius) {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      const r = obs.radius;
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(r * 0.15, r * 0.25, r * 1.15, r * 0.75, 0.2, 0, Math.PI * 2);
      ctx.fill();

      const rockGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
      rockGrad.addColorStop(0, "#64748b");
      rockGrad.addColorStop(0.65, "#334155");
      rockGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.88, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Top highlighted facet
      ctx.fillStyle = "rgba(203, 213, 225, 0.25)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.25, -r * 0.3, r * 0.5, r * 0.35, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // North-face rainforest moss patches
      ctx.fillStyle = "#365314";
      ctx.beginPath();
      ctx.ellipse(-r * 0.1, -r * 0.45, r * 0.65, r * 0.25, -0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4d7c0f";
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, -r * 0.48, r * 0.45, r * 0.15, -0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (obs.w && obs.h) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(obs.x + 4, obs.y + 4, obs.w, obs.h);

      ctx.fillStyle = "#3e2723";
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeStyle = "#1b0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

      ctx.strokeStyle = "#271612";
      ctx.lineWidth = 1;
      const step = obs.w > obs.h ? obs.h / 3 : obs.w / 3;
      if (obs.w > obs.h) {
        for (let py = obs.y + step; py < obs.y + obs.h; py += step) {
          ctx.beginPath();
          ctx.moveTo(obs.x, py); ctx.lineTo(obs.x + obs.w, py);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // ── Realistic Segmented Jungle Leech Renderer ─────────────────────────────
  renderRealisticLeech(ctx, l) {
    if (!l.alive) return;
    ctx.save();
    ctx.translate(l.x, l.y);

    const angle = Math.atan2(this.player.y - l.y, this.player.x - l.x);
    ctx.rotate(angle);

    const stretch = Math.sin(l.crawlFrame || 0);
    const bodyLen = Math.max(8, l.radius * 1.5 + stretch * 3.5);
    const bodyW = Math.max(3, l.radius * 0.7 - stretch * 1.0);

    // Ground cast shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 2, bodyLen + 2, bodyW + 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Posterior anchor sucker
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(-bodyLen * 0.65, 0, bodyW * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Segmented muscular annelid body (7 distinct segments)
    for (let i = -3; i <= 3; i++) {
      const segX = (i / 3) * (bodyLen * 0.52);
      const segR = bodyW * (1 - Math.abs(i) * 0.14);
      ctx.fillStyle = i % 2 === 0 ? "#1c1917" : "#450a0a";
      ctx.beginPath();
      ctx.arc(segX, 0, Math.max(1.8, segR), 0, Math.PI * 2);
      ctx.fill();
    }

    // Anterior searching sucker head
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.ellipse(bodyLen * 0.7, 0, 2.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wet specular glint along moist cuticle
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillRect(0, -1, 3, 1);

    ctx.restore();
  }

  // ── 3D Realistic Rainforest Tree (Buttress roots, cylindrical trunk, parallax canopy) ──
  render3DTree(ctx, tree, time, camCenterX, camCenterY, isMajorEndemic = false) {
    const vLeft = this.camera.x - 180;
    const vRight = this.camera.x + (this.canvas.width / this.zoom) + 180;
    const vTop = this.camera.y - 250;
    const vBottom = this.camera.y + (this.canvas.height / this.zoom) + 180;

    const foliageR = tree.foliageR || tree.fr || 72;
    const height = tree.height || (tree.fr ? Math.max(120, tree.fr * 1.75) : 115);
    const trunkR = tree.r || (tree.fr ? Math.max(13, tree.fr * 0.36) : 18);

    if (tree.x + foliageR < vLeft || tree.x - foliageR > vRight ||
        tree.y + foliageR < vTop || tree.y - height - foliageR > vBottom) {
      return;
    }

    // Camera height parallax offset: elevated treetop shifts relative to ground camera
    const pX = (tree.x - camCenterX) * 0.055;
    const pY = (tree.y - camCenterY) * 0.055;
    const topX = tree.x + pX;
    const topY = tree.y - height + pY;

    // Wind rustle sway
    const sway = Math.sin(time * 0.0018 + (tree.phase || tree.x * 0.01)) * (this.windStrength * 4.5);

    // Player proximity transparency check: when player walks underneath the canopy
    const distToPlayer = Math.hypot(this.player.x - tree.x, this.player.y - (tree.y - height * 0.45));
    const underCanopy = distToPlayer < foliageR * 1.1;
    const canopyAlpha = underCanopy ? 0.32 : 1.0;

    ctx.save();

    // A. Buttress Roots spreading onto muddy soil
    ctx.fillStyle = "#1e130c";
    ctx.strokeStyle = "#120a06";
    ctx.lineWidth = 1.5;
    const buttresses = [
      { dx: -trunkR * 1.35, dy: trunkR * 0.35 },
      { dx: trunkR * 1.25, dy: trunkR * 0.3 },
      { dx: -trunkR * 0.65, dy: trunkR * 0.75 },
      { dx: trunkR * 0.65, dy: trunkR * 0.7 },
    ];
    buttresses.forEach((b) => {
      ctx.beginPath();
      ctx.moveTo(tree.x, tree.y);
      ctx.quadraticCurveTo(tree.x + b.dx * 0.5, tree.y + b.dy * 0.2, tree.x + b.dx, tree.y + b.dy);
      ctx.lineTo(tree.x + b.dx * 0.65, tree.y + b.dy + 4);
      ctx.lineTo(tree.x, tree.y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // B. Cylindrical 3D Vertical Trunk
    const trunkGrad = ctx.createLinearGradient(tree.x - trunkR, 0, tree.x + trunkR, 0);
    trunkGrad.addColorStop(0, "#4a3022"); // Highlight side
    trunkGrad.addColorStop(0.35, "#321e14"); // Base bark
    trunkGrad.addColorStop(0.85, "#1c100a"); // Shadow side
    trunkGrad.addColorStop(1, "#0d0604"); // Ambient crease
    ctx.fillStyle = trunkGrad;

    ctx.beginPath();
    ctx.moveTo(tree.x - trunkR, tree.y);
    ctx.lineTo(topX - trunkR * 0.65, topY);
    ctx.lineTo(topX + trunkR * 0.65, topY);
    ctx.lineTo(tree.x + trunkR, tree.y);
    ctx.closePath();
    ctx.fill();

    // Bark ridges & climbing tropical liana vines
    ctx.strokeStyle = "rgba(12, 7, 4, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tree.x - trunkR * 0.3, tree.y);
    ctx.lineTo(topX - trunkR * 0.2, topY);
    ctx.moveTo(tree.x + trunkR * 0.3, tree.y);
    ctx.lineTo(topX + trunkR * 0.2, topY);
    ctx.stroke();

    // Epiphytic moss patch on trunk
    ctx.fillStyle = "rgba(46, 125, 50, 0.75)";
    ctx.beginPath();
    ctx.ellipse(tree.x - trunkR * 0.35, tree.y - height * 0.3, trunkR * 0.3, height * 0.14, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // C. Elevated 3D Canopy Cluster
    ctx.globalAlpha = canopyAlpha;

    // Underside deep ambient occlusion foliage
    ctx.fillStyle = this.chapter === 2 ? "#1e3320" : "#0d1f10";
    ctx.beginPath();
    ctx.arc(topX + sway, topY + 8, foliageR * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Mid-tier lush rainforest foliage
    const treeHue = tree.hue || 124;
    const treeSat = tree.saturation || 42;
    const treeLit = this.chapter === 2 ? (tree.lightness || 18) + 16 : (tree.lightness || 18);
    ctx.fillStyle = `hsl(${treeHue}, ${treeSat}%, ${treeLit}%)`;
    ctx.beginPath();
    ctx.arc(topX + sway - 6, topY - 4, foliageR * 0.88, 0, Math.PI * 2);
    ctx.arc(topX + sway + 10, topY - 2, foliageR * 0.75, 0, Math.PI * 2);
    ctx.arc(topX + sway, topY - 16, foliageR * 0.82, 0, Math.PI * 2);
    ctx.fill();

    // Top Sunlight Highlights (Spherical 3D shading)
    const sunGrad = ctx.createRadialGradient(
      topX + sway - foliageR * 0.3, topY - 16 - foliageR * 0.3, foliageR * 0.1,
      topX + sway, topY - 10, foliageR
    );
    sunGrad.addColorStop(0, `hsla(${treeHue + 12}, ${treeSat + 15}%, ${treeLit + 18}%, 0.9)`);
    sunGrad.addColorStop(0.65, `hsla(${treeHue}, ${treeSat}%, ${treeLit}%, 0.35)`);
    sunGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(topX + sway, topY - 14, foliageR * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // Under-canopy subtle guide ring if player is inside
    if (underCanopy) {
      ctx.strokeStyle = "rgba(104, 211, 112, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, trunkR + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // ── 3D Realistic Kudawa Outpost Cabin (Timber logs, cutaway roof, warm interior) ──
  render3DOutpostCabin(ctx, time) {
    const x = 450;
    const y = 640;
    const w = 200;
    const h = 180;
    const wallH = 65; // Height of 3D walls
    const inShelter = this.player.inShelter;

    ctx.save();

    // 1. Raised Wooden Foundation Deck & Porch Steps
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 8, y + h + 2, w + 16, 26); // Deck shadow

    ctx.fillStyle = "#3e2723";
    ctx.fillRect(x - 10, y + h - 15, w + 20, 22);
    ctx.strokeStyle = "#1b0000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 10, y + h - 15, w + 20, 22);

    // Steps leading to porch
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(x + 75, y + h + 7, 50, 10);
    ctx.fillRect(x + 80, y + h + 17, 40, 9);

    // 2. 3D Interior Floor (Visible always, highlighted when inside)
    ctx.fillStyle = "#271612";
    ctx.fillRect(x, y, w, h);
    // Plank floorboards
    ctx.strokeStyle = "rgba(62, 39, 35, 0.6)";
    ctx.lineWidth = 1.5;
    for (let py = y + 15; py < y + h; py += 16) {
      ctx.beginPath();
      ctx.moveTo(x, py); ctx.lineTo(x + w, py);
      ctx.stroke();
    }

    // Interior furniture
    // Cot / bunk bed in corner
    ctx.fillStyle = "#37474f";
    ctx.fillRect(x + 15, y + 20, 45, 80);
    ctx.fillStyle = "#546e7a";
    ctx.fillRect(x + 15, y + 20, 45, 25); // Pillow
    ctx.fillStyle = "#263238";
    ctx.strokeRect(x + 15, y + 20, 45, 80);

    // Radio desk table
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(x + 75, y + 20, 70, 35);
    ctx.fillStyle = "#37474f";
    ctx.fillRect(x + 85, y + 24, 18, 14); // Radio receiver
    ctx.strokeStyle = "#cfd8dc";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 94, y + 24); ctx.lineTo(x + 94, y + 10); // Antenna
    ctx.stroke();

    // Solar battery bank
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 155, y + 22, 32, 28);
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(x + 165, y + 32, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. 3D Solid Timber Log Walls
    // Back Wall (North)
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(x, y - wallH, w, wallH);
    // Left Wall (West - in light)
    ctx.fillStyle = "#4e342e";
    ctx.beginPath();
    ctx.moveTo(x, y - wallH);
    ctx.lineTo(x - 14, y - wallH + 15);
    ctx.lineTo(x - 14, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#1b0000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Front Wall with Doorway (South)
    // Left front section
    ctx.fillStyle = "#2e1c14";
    ctx.fillRect(x, y + h - 18, 70, 18);
    // Right front section
    ctx.fillRect(x + 130, y + h - 18, 70, 18);

    // Right Wall (East - in shadow)
    ctx.fillStyle = "#1e130c";
    ctx.beginPath();
    ctx.moveTo(x + w, y - wallH);
    ctx.lineTo(x + w + 14, y - wallH + 15);
    ctx.lineTo(x + w + 14, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#120a06";
    ctx.stroke();

    // 4. 3D Pitch Shingle Roof (Cutaway fade when inside!)
    const roofAlpha = inShelter ? 0.12 : 1.0;
    ctx.globalAlpha = roofAlpha;

    // Roof shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x - 20, y + h - wallH, w + 40, wallH + 10);

    // West Roof Slope
    const ridgeY = y - wallH - 35;
    const ridgeX = x + w / 2;
    ctx.fillStyle = "#5d4037"; // Lit slope
    ctx.beginPath();
    ctx.moveTo(x - 18, y - wallH + 15);
    ctx.lineTo(ridgeX, ridgeY);
    ctx.lineTo(ridgeX, ridgeY + h);
    ctx.lineTo(x - 18, y + h);
    ctx.closePath();
    ctx.fill();

    // East Roof Slope
    ctx.fillStyle = "#3e2723"; // Shadowed slope
    ctx.beginPath();
    ctx.moveTo(ridgeX, ridgeY);
    ctx.lineTo(x + w + 18, y - wallH + 15);
    ctx.lineTo(x + w + 18, y + h);
    ctx.lineTo(ridgeX, ridgeY + h);
    ctx.closePath();
    ctx.fill();

    // Corrugated tin lines on roof
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    for (let rx = x; rx < x + w; rx += 22) {
      ctx.beginPath();
      ctx.moveTo(rx, y - wallH + 10);
      ctx.lineTo(rx, y + h - 5);
      ctx.stroke();
    }

    // Ridge cap
    ctx.strokeStyle = "#8d6e63";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ridgeX, ridgeY);
    ctx.lineTo(ridgeX, ridgeY + h);
    ctx.stroke();

    // Chimney pipe with smoke
    ctx.fillStyle = "#263238";
    ctx.fillRect(x + 35, ridgeY + 15, 10, 22);
    const smokeY = (time * 0.03) % 40;
    ctx.fillStyle = "rgba(200, 200, 200, 0.4)";
    ctx.beginPath();
    ctx.arc(x + 40 + Math.sin(time * 0.003) * 5, ridgeY + 10 - smokeY, 4 + smokeY * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1.0;

    // Cabin Name Signboard
    ctx.fillStyle = "#ffe082";
    ctx.font = "bold 12px 'Noto Sans Sinhala', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏡 කුඩව මුරපොළ කුටිය (Outpost Shelter)", x + w / 2, y - wallH - 42);

    ctx.restore();
  }

  // ── 3D Realistic Evacuation Helicopter & Helipad ──
  render3DHelicopter(ctx, time) {
    const hx = 2700;
    const hy = 1800;

    ctx.save();
    ctx.translate(hx, hy);

    // 1. Helipad Concrete Pad & Markings
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px 'Share Tech Mono', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("H", 0, 0);

    // Perimeter warning flashers
    const flasherOn = Math.sin(time * 0.008) > 0;
    [
      { x: -82, y: -82 }, { x: 82, y: -82 },
      { x: -82, y: 82 }, { x: 82, y: 82 }
    ].forEach((b) => {
      ctx.fillStyle = flasherOn ? "#ef4444" : "#450a0a";
      ctx.shadowColor = flasherOn ? "#ef4444" : "transparent";
      ctx.shadowBlur = flasherOn ? 12 : 0;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // 2. 3D Helicopter Tubular Landing Skids
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(-28, 8, 56, 12); // Ground shadow

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 4;
    // Left Skid
    ctx.beginPath();
    ctx.moveTo(-24, -30); ctx.lineTo(-24, 30);
    ctx.moveTo(-24, 30); ctx.quadraticCurveTo(-24, 36, -20, 38);
    ctx.stroke();
    // Right Skid
    ctx.beginPath();
    ctx.moveTo(24, -30); ctx.lineTo(24, 30);
    ctx.moveTo(24, 30); ctx.quadraticCurveTo(24, 36, 20, 38);
    ctx.stroke();
    // Skid Cross-struts
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, -14); ctx.lineTo(24, -14);
    ctx.moveTo(-24, 16); ctx.lineTo(24, 16);
    ctx.stroke();

    // 3. 3D Fuselage Body (Olive drab tactical finish)
    const fuseGrad = ctx.createLinearGradient(-18, 0, 18, 0);
    fuseGrad.addColorStop(0, "#2d4a2d"); // Highlight
    fuseGrad.addColorStop(0.5, "#1b301b"); // Base
    fuseGrad.addColorStop(1, "#0d1a0d"); // Shadow

    ctx.fillStyle = fuseGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#081008";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Cockpit Canopy Glass (Glossy specular reflection)
    const glassGrad = ctx.createLinearGradient(0, 15, 0, 38);
    glassGrad.addColorStop(0, "rgba(56, 189, 248, 0.85)");
    glassGrad.addColorStop(0.5, "rgba(14, 116, 144, 0.95)");
    glassGrad.addColorStop(1, "rgba(8, 47, 73, 0.98)");
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.ellipse(0, 25, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glass glare reflection stripe
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.ellipse(-4, 22, 3, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Tail Boom & Fin
    ctx.fillStyle = "#1b301b";
    ctx.fillRect(-5, -68, 10, 40);
    ctx.fillStyle = "#334155";
    ctx.fillRect(-15, -72, 30, 6); // Stabilizer wing

    // Spinning Tail Rotor
    const tailAngle = time * 0.05;
    ctx.save();
    ctx.translate(0, -72);
    ctx.rotate(tailAngle);
    ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
    ctx.fillRect(-14, -2, 28, 4);
    ctx.restore();

    // 6. Spinning Main 4-Blade Rotor Disc with motion blur
    ctx.save();
    ctx.rotate(this.heliRotorAngle);

    // Translucent Motion Blur Disc
    ctx.fillStyle = "rgba(203, 213, 225, 0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, 85, 0, Math.PI * 2);
    ctx.fill();

    // High-speed carbon rotor blades
    ctx.fillStyle = "rgba(241, 245, 249, 0.85)";
    ctx.fillRect(-85, -3, 170, 6);
    ctx.fillRect(-3, -85, 6, 170);

    // Blade yellow safety tips
    ctx.fillStyle = "#facc15";
    ctx.fillRect(-85, -3, 14, 6);
    ctx.fillRect(71, -3, 14, 6);
    ctx.fillRect(-3, -85, 6, 14);
    ctx.fillRect(-3, 71, 6, 14);

    // Rotor hub
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. Volumetric Aerial Searchlight Cone
    const searchAngle = this.chopperSearchlightAngle || 0;
    const beamDist = 180;
    const beamTargetX = Math.cos(searchAngle) * beamDist;
    const beamTargetY = Math.sin(searchAngle) * beamDist;

    const sLightGrad = ctx.createRadialGradient(beamTargetX, beamTargetY, 15, beamTargetX, beamTargetY, 140);
    sLightGrad.addColorStop(0, "rgba(254, 240, 138, 0.45)");
    sLightGrad.addColorStop(0.5, "rgba(254, 240, 138, 0.18)");
    sLightGrad.addColorStop(1, "rgba(254, 240, 138, 0)");

    ctx.fillStyle = sLightGrad;
    ctx.beginPath();
    ctx.arc(beamTargetX, beamTargetY, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── 3D Realistic Shadow Stalker Leopard (Panthera pardus kotiya) ──
  // ── 3D Realistic Shadow Stalker Leopard (2.5D Quadruped Prowling Big Cat) ──
  render3DShadowStalker(ctx, s, time) {
    if (!s || s.eyesAlpha <= 0.04) return;
    ctx.save();
    ctx.translate(s.x, s.y);

    const toPlayer = Math.atan2(this.player.y - s.y, this.player.x - s.x);
    const facingLeft = Math.cos(toPlayer) < 0;
    if (facingLeft) {
      ctx.scale(-1, 1); // Face left towards player!
    }

    const alpha = Math.min(1.0, s.eyesAlpha);
    ctx.globalAlpha = alpha;

    // 1. Ground Cast Shadow (Elongated under 4 paws)
    ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 28, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stalking paw swing gait
    const stalkCycle = (s.stalkFrame || time * 0.005) * 6;
    const legFrontL = Math.sin(stalkCycle) * 6;
    const legFrontR = -Math.sin(stalkCycle) * 6;
    const legBackL = -Math.cos(stalkCycle) * 6;
    const legBackR = Math.cos(stalkCycle) * 6;

    // 2. Rear Paws & Hocks (Standing upright on ground)
    ctx.fillStyle = "#6d3b14"; // Shaded back leg
    ctx.fillRect(-18 + legBackR, -10, 5, 11);
    ctx.fillStyle = "#8d5b24"; // Front-facing back leg
    ctx.fillRect(-15 + legBackL, -12, 6, 13);
    ctx.fillStyle = "#271206"; // Rear paws
    ctx.fillRect(-16 + legBackL, 0, 7, 3);

    // 3. Front Paws & Shoulders
    ctx.fillStyle = "#6d3b14"; // Shaded front leg
    ctx.fillRect(8 + legFrontR, -9, 5, 10);
    ctx.fillStyle = "#8d5b24"; // Front-facing front leg
    ctx.fillRect(11 + legFrontL, -11, 6, 12);
    ctx.fillStyle = "#271206"; // Front paws
    ctx.fillRect(10 + legFrontL, 0, 7, 3);

    // 4. Muscular Feline Flank & Torso
    const torsoY = -14 + Math.sin(stalkCycle * 2) * 1.5;
    const bodyGrad = ctx.createLinearGradient(0, torsoY - 8, 0, torsoY + 8);
    bodyGrad.addColorStop(0, "#b47832"); // Golden tawny spine
    bodyGrad.addColorStop(0.65, "#8d5b24"); // Ribs
    bodyGrad.addColorStop(1, "#f5deb3"); // Cream underbelly
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(-2, torsoY, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#381a05";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Rosette camouflage coat spots
    ctx.fillStyle = "rgba(28, 14, 4, 0.75)";
    [
      { x: -14, y: torsoY - 2 }, { x: -8, y: torsoY + 2 }, { x: -2, y: torsoY - 4 },
      { x: 4, y: torsoY + 1 }, { x: 10, y: torsoY - 3 }, { x: -4, y: torsoY + 3 }
    ].forEach((spot) => {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Twitching Long Tail with black tip
    const tailWiggle = Math.sin(time * 0.007) * 7;
    ctx.strokeStyle = "#8d5b24";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-20, torsoY);
    ctx.quadraticCurveTo(-30, torsoY - 12 + tailWiggle * 0.4, -36, torsoY - 16 + tailWiggle);
    ctx.stroke();
    ctx.strokeStyle = "#170e08"; // Black tail tip
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-34, torsoY - 14 + tailWiggle * 0.9);
    ctx.lineTo(-36, torsoY - 16 + tailWiggle);
    ctx.stroke();

    // 6. Feline Head & Ears
    const headX = 18;
    const headY = torsoY - 4;
    ctx.fillStyle = "#a16828";
    ctx.beginPath();
    ctx.ellipse(headX, headY, 7.5, 6.5, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Pointed feline ears
    ctx.fillStyle = "#1e1008";
    ctx.beginPath();
    ctx.moveTo(headX - 3, headY - 6); ctx.lineTo(headX - 1, headY - 12); ctx.lineTo(headX + 4, headY - 6);
    ctx.closePath();
    ctx.fill();

    // White snout & whiskers
    ctx.fillStyle = "#f5f5dc";
    ctx.beginPath();
    ctx.ellipse(headX + 5, headY + 1.5, 3.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#170e08"; // Black nose
    ctx.fillRect(headX + 7, headY, 1.5, 1.5);

    // Glowing Amber Eyes (Tapetum Lucidum reflection in the dark!)
    ctx.fillStyle = "#f59e0b";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(headX + 3.5, headY - 1.5, 2.2, 1.6, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Slit pupil
    ctx.fillStyle = "#000000";
    ctx.fillRect(headX + 3.5, headY - 2.2, 0.9, 1.8);

    // Snarling fangs if charging
    if (s.state === "charging") {
      ctx.fillStyle = "#dc2626"; // Open red mouth
      ctx.beginPath();
      ctx.arc(headX + 6, headY + 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff"; // White sharp fangs
      ctx.fillRect(headX + 5.5, headY + 1.5, 1.2, 2);
    }

    ctx.restore();
  }

  // ── Realistic Green Pit Viper (Trimeresurus trigonocephalus) ──
  renderRealisticViper(ctx, v, time) {
    ctx.save();
    ctx.translate(v.x, v.y);

    const toPlayerAngle = Math.atan2(this.player.y - v.y, this.player.x - v.x);
    const distToPlayer = Math.hypot(this.player.x - v.x, this.player.y - v.y);
    const isAlert = distToPlayer < 150;

    // Ground cast shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coiled S-shaped Viper Body (Vibrant Emerald Pit Viper)
    ctx.strokeStyle = v.state === "retreated" ? "rgba(46, 125, 50, 0.45)" : "#2e7d32";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 1.5);
    ctx.stroke();

    ctx.strokeStyle = "#43a047";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(2, -1, 7, 0, Math.PI * 1.4);
    ctx.stroke();

    // Chevron pattern bands
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Triangular Pit Viper Head pointing toward player
    ctx.save();
    ctx.rotate(toPlayerAngle);

    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(19, 0);
    ctx.lineTo(8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Golden Yellow Viper Eyes
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(12, -3.5, 1.8, 0, Math.PI * 2);
    ctx.arc(12, 3.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.fillRect(12, -4, 0.8, 2);
    ctx.fillRect(12, 2.5, 0.8, 2);

    // Forked Scarlet Tongue flicking when alert
    if (isAlert && Math.sin(time * 0.015) > 0.25) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(19, 0); ctx.lineTo(26, 0);
      ctx.lineTo(29, -2.5);
      ctx.moveTo(26, 0); ctx.lineTo(29, 2.5);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  // ── Pro 2.5D Isometric Standing Ranger Character (8-Directional Procedural Sprites) ──
  renderRealisticPlayer(ctx, time) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    const angle = this.player.facingAngle; // In radians (-PI to PI)
    const isMoving = this.player.isMoving;
    const walkCycle = this.player.walkFrame || 0;
    const legSwing = isMoving ? Math.sin(walkCycle) * 7 : 0;
    const armSwing = isMoving ? Math.cos(walkCycle) * 6 : 0;
    const breath = Math.sin(time * 0.003) * 0.6;

    // Determine 4 main 2.5D viewing directions:
    // angle: 0 = East (Right), PI/2 = South (Down / Front), PI or -PI = West (Left), -PI/2 = North (Up / Back)
    let viewDir = "south";
    if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75) {
      viewDir = "south"; // Walking towards camera (Front)
    } else if (angle <= -Math.PI * 0.25 && angle > -Math.PI * 0.75) {
      viewDir = "north"; // Walking away from camera (Back)
    } else if (Math.abs(angle) <= Math.PI * 0.25) {
      viewDir = "east"; // Walking right (Side East)
    } else {
      viewDir = "west"; // Walking left (Side West)
    }

    // 1. Ground Contact Shadow (Soft directional oval under boots)
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Render Upright Character Based on 2.5D Direction
    if (viewDir === "south") {
      // ═══════════════════════════════════════════════════════════════
      // FRONT VIEW (Facing Player / Walking South)
      // ═══════════════════════════════════════════════════════════════

      // A. Legs & Boots (Standing on ground, animated walking)
      // Left Boot
      ctx.fillStyle = "#1e281e"; // Olive pants
      ctx.fillRect(-8, -18 + legSwing * 0.4, 6, 12);
      ctx.fillStyle = "#271810"; // Leather boot
      ctx.fillRect(-9, -6 + legSwing * 0.4, 7, 7);
      ctx.fillStyle = "#140a05"; // Sole
      ctx.fillRect(-9, 1 + legSwing * 0.4, 7, 2);

      // Right Boot
      ctx.fillStyle = "#1e281e";
      ctx.fillRect(2, -18 - legSwing * 0.4, 6, 12);
      ctx.fillStyle = "#271810";
      ctx.fillRect(2, -6 - legSwing * 0.4, 7, 7);
      ctx.fillStyle = "#140a05";
      ctx.fillRect(2, 1 - legSwing * 0.4, 7, 2);

      // B. Pelvis & Utility Belt
      ctx.fillStyle = "#263626";
      ctx.fillRect(-9, -23, 18, 6);
      ctx.fillStyle = "#3e2723"; // Leather belt
      ctx.fillRect(-9, -25, 18, 3);
      ctx.fillStyle = "#d4af37"; // Brass buckle
      ctx.fillRect(-2, -26, 4, 4);

      // C. Torso & Tactical Vest (Front View)
      const torsoY = -38 + breath * 0.3;
      ctx.fillStyle = "#2f4d2f"; // Olive ranger uniform
      ctx.fillRect(-10, torsoY, 20, 14);
      ctx.strokeStyle = "#1b2e1b";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, torsoY, 20, 14);

      // Chest pockets & harness straps
      ctx.fillStyle = "#243a24";
      ctx.fillRect(-8, torsoY + 2, 6, 5); // Left pocket
      ctx.fillRect(2, torsoY + 2, 6, 5);  // Right pocket
      ctx.fillStyle = "#d4af37"; // Ranger badge
      ctx.fillRect(-6, torsoY + 3, 2, 2);

      // Tactical harness cross-straps
      ctx.strokeStyle = "#1b1b1b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, torsoY); ctx.lineTo(-4, torsoY + 14);
      ctx.moveTo(7, torsoY); ctx.lineTo(4, torsoY + 14);
      ctx.stroke();

      // D. Arms & Hands holding Flashlight / Device
      // Left Arm
      ctx.fillStyle = "#2f4d2f";
      ctx.fillRect(-14, torsoY + 2, 4, 11);
      ctx.fillStyle = "#c68a4c"; // Skin hand
      ctx.fillRect(-14, torsoY + 13, 4, 4);

      // Right Arm (holding flashlight)
      ctx.fillStyle = "#2f4d2f";
      ctx.fillRect(10, torsoY + 2, 4, 11);
      ctx.fillStyle = "#c68a4c"; // Hand
      ctx.fillRect(10, torsoY + 13, 4, 4);

      // Flashlight body pointing down-forward
      ctx.fillStyle = "#37474f";
      ctx.fillRect(8, torsoY + 16, 7, 10);
      ctx.fillStyle = "#78909c";
      ctx.fillRect(7, torsoY + 26, 9, 3); // Flashlight bezel
      if (this.torchOn && this.battery > 0) {
        ctx.fillStyle = this.uvMode ? "#d500f9" : "#ffeb3b";
        ctx.shadowColor = this.uvMode ? "#d500f9" : "#ffeb3b";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(11.5, torsoY + 29, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // E. Neck & Face (Front View)
      ctx.fillStyle = "#c68a4c"; // Neck
      ctx.fillRect(-3, torsoY - 4, 6, 5);

      // Face
      ctx.fillStyle = "#dfa968"; // Skin tone
      ctx.beginPath();
      ctx.ellipse(0, torsoY - 8, 6.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes & Brow
      ctx.fillStyle = "#1e1008";
      ctx.fillRect(-4, torsoY - 9, 2.5, 1.5);
      ctx.fillRect(1.5, torsoY - 9, 2.5, 1.5);

      // F. Safari Brim Hat (Front 3D View)
      // Wide curved oval brim
      ctx.fillStyle = "#4a3b2c"; // Dark khaki hat brim
      ctx.beginPath();
      ctx.ellipse(0, torsoY - 12, 14, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2e2318";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Crown of Hat
      ctx.fillStyle = "#63503a"; // Light khaki hat crown
      ctx.beginPath();
      ctx.ellipse(0, torsoY - 16, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Forest green hatband
      ctx.fillStyle = "#1b381b";
      ctx.fillRect(-8, torsoY - 15, 16, 2.5);

    } else if (viewDir === "north") {
      // ═══════════════════════════════════════════════════════════════
      // BACK VIEW (Facing North / Away from Camera)
      // ═══════════════════════════════════════════════════════════════

      // A. Legs & Boots (Walking away)
      // Left Boot
      ctx.fillStyle = "#1e281e";
      ctx.fillRect(-8, -18 - legSwing * 0.4, 6, 12);
      ctx.fillStyle = "#271810";
      ctx.fillRect(-9, -6 - legSwing * 0.4, 7, 7);
      ctx.fillStyle = "#140a05";
      ctx.fillRect(-9, 1 - legSwing * 0.4, 7, 2);

      // Right Boot
      ctx.fillStyle = "#1e281e";
      ctx.fillRect(2, -18 + legSwing * 0.4, 6, 12);
      ctx.fillStyle = "#271810";
      ctx.fillRect(2, -6 + legSwing * 0.4, 7, 7);
      ctx.fillStyle = "#140a05";
      ctx.fillRect(2, 1 + legSwing * 0.4, 7, 2);

      // B. Torso & Massive Expedition Backpack (Back View)
      const torsoY = -38 + breath * 0.3;

      // Heavy Expedition Backpack
      ctx.fillStyle = "#1f2d1f"; // Dark army canvas
      ctx.fillRect(-12, torsoY - 2, 24, 18);
      ctx.strokeStyle = "#121b12";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-12, torsoY - 2, 24, 18);

      // Bedroll strapped to top of pack
      ctx.fillStyle = "#4e342e"; // Brown roll
      ctx.beginPath();
      ctx.ellipse(0, torsoY - 4, 13, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#271612";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Canteen strapped to side of pack
      ctx.fillStyle = "#546e7a";
      ctx.fillRect(11, torsoY + 4, 4, 7);

      // Back of neck & collar
      ctx.fillStyle = "#243a24";
      ctx.fillRect(-5, torsoY - 6, 10, 4);

      // C. Safari Hat (Back View)
      ctx.fillStyle = "#4a3b2c"; // Hat brim back
      ctx.beginPath();
      ctx.ellipse(0, torsoY - 11, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#63503a"; // Crown back
      ctx.beginPath();
      ctx.ellipse(0, torsoY - 15, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hatband
      ctx.fillStyle = "#1b381b";
      ctx.fillRect(-8, torsoY - 14, 16, 2.5);

    } else {
      // ═══════════════════════════════════════════════════════════════
      // SIDE PROFILE VIEW (East or West)
      // ═══════════════════════════════════════════════════════════════
      ctx.save();
      if (viewDir === "west") {
        ctx.scale(-1, 1); // Flip horizontally for west!
      }

      // A. Walking Legs in Scissors Stride
      const stride = isMoving ? Math.sin(walkCycle) * 9 : 0;

      // Back leg
      ctx.fillStyle = "#172017";
      ctx.fillRect(-4 - stride * 0.5, -17, 5, 11);
      ctx.fillStyle = "#20120a";
      ctx.fillRect(-5 - stride * 0.7, -6, 7, 7);

      // Front leg
      ctx.fillStyle = "#223322";
      ctx.fillRect(-2 + stride * 0.5, -17, 6, 11);
      ctx.fillStyle = "#2e1a10";
      ctx.fillRect(-2 + stride * 0.7, -6, 8, 7);
      ctx.fillStyle = "#140a05";
      ctx.fillRect(-2 + stride * 0.7, 1, 8, 2);

      // B. Torso Side View & Backpack
      const torsoY = -38 + breath * 0.3;

      // Backpack hanging on rear (left side)
      ctx.fillStyle = "#1f2d1f";
      ctx.fillRect(-13, torsoY, 8, 16);
      ctx.fillStyle = "#4e342e"; // Bedroll on top
      ctx.beginPath();
      ctx.ellipse(-9, torsoY - 2, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Torso side
      ctx.fillStyle = "#2f4d2f";
      ctx.fillRect(-6, torsoY, 13, 15);
      ctx.strokeStyle = "#1b2e1b";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6, torsoY, 13, 15);

      // C. Arm holding Flashlight pointing East
      ctx.fillStyle = "#2f4d2f";
      ctx.fillRect(-1 + armSwing * 0.3, torsoY + 2, 5, 10);
      ctx.fillStyle = "#c68a4c"; // Hand
      ctx.fillRect(4 + armSwing * 0.3, torsoY + 8, 5, 4);

      // Flashlight body extending horizontally to the right
      ctx.fillStyle = "#37474f";
      ctx.fillRect(8, torsoY + 7, 12, 5);
      ctx.fillStyle = "#78909c";
      ctx.fillRect(19, torsoY + 6, 3, 7); // Bezel
      if (this.torchOn && this.battery > 0) {
        ctx.fillStyle = this.uvMode ? "#d500f9" : "#ffeb3b";
        ctx.shadowColor = this.uvMode ? "#d500f9" : "#ffeb3b";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(23, torsoY + 9.5, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // D. Head & Face Profile
      ctx.fillStyle = "#dfa968"; // Face profile
      ctx.beginPath();
      ctx.arc(1, torsoY - 8, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Nose & chin profile pointing right
      ctx.fillStyle = "#dfa968";
      ctx.beginPath();
      ctx.moveTo(5, torsoY - 10);
      ctx.lineTo(9, torsoY - 7);
      ctx.lineTo(6, torsoY - 5);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = "#1e1008";
      ctx.fillRect(4, torsoY - 9, 2, 1.5);

      // E. Safari Hat in Side Profile
      // Brim tilted forward
      ctx.fillStyle = "#4a3b2c";
      ctx.beginPath();
      ctx.ellipse(2, torsoY - 12, 14, 4.5, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Crown
      ctx.fillStyle = "#63503a";
      ctx.beginPath();
      ctx.arc(1, torsoY - 15, 6.5, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Hatband
      ctx.fillStyle = "#1b381b";
      ctx.fillRect(-5, torsoY - 14, 13, 2.5);

      ctx.restore();
    }

    // 3. Bleeding Blood Drops
    if (this.bleeding) {
      const bloodGlow = Math.sin(time * 0.01) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(213, 0, 0, ${bloodGlow})`;
      ctx.beginPath();
      ctx.arc(-6, -15, 3.5, 0, Math.PI * 2);
      ctx.arc(6, -8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Magpie Charm Aura
    if (this.magpieCharmActive) {
      const charmPulse = Math.sin(time * 0.006) * 0.2 + 0.35;
      ctx.strokeStyle = `rgba(0, 229, 255, ${charmPulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -22, 16, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── Directional 3D Cast Shadows on Ground Plane ───────────────────────────
  renderDirectionalCastShadows(ctx) {
    ctx.save();
    if (this.chapter === 2) {
      // CHAPTER 2: High mountain morning sun (sun from top-left, shadows cast down-right)
      const sunOffsetX = 32;
      const sunOffsetY = 24;

      ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
      this.jungleTrees.forEach((t) => {
        ctx.beginPath();
        ctx.ellipse(t.x + sunOffsetX, t.y + sunOffsetY, (t.foliageR || 45) * 1.1, (t.foliageR || 45) * 0.55, 0.38, 0, Math.PI * 2);
        ctx.fill();
      });
      this.trees.forEach((t) => {
        ctx.beginPath();
        ctx.ellipse(t.x + sunOffsetX * 1.2, t.y + sunOffsetY * 1.2, t.foliageR * 1.2, t.foliageR * 0.6, 0.38, 0, Math.PI * 2);
        ctx.fill();
      });
      this.obstacles.forEach((obs) => {
        const r = obs.radius || 30;
        ctx.beginPath();
        ctx.ellipse(obs.x + sunOffsetX * 0.6, obs.y + sunOffsetY * 0.6, r * 1.1, r * 0.6, 0.38, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (this.chapter === 5) {
      // CHAPTER 5: Twilight sunset (dramatic elongated east shadows)
      const sunOffsetX = 55;
      const sunOffsetY = 15;
      ctx.fillStyle = "rgba(18, 8, 4, 0.45)";
      this.trees.forEach((t) => {
        ctx.beginPath();
        ctx.ellipse(t.x + sunOffsetX, t.y + sunOffsetY, t.foliageR * 1.4, t.foliageR * 0.5, 0.15, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // CHAPTER 1, 3, 4: Night / Cave Flashlight & Ambient Shadows
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";

      // Static ground contact shadows under trees
      this.jungleTrees.forEach((t) => {
        ctx.beginPath();
        ctx.ellipse(t.x + 4, t.y + 6, (t.r || 16) * 1.3, (t.r || 16) * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      this.trees.forEach((t) => {
        ctx.beginPath();
        ctx.ellipse(t.x + 6, t.y + 8, (t.r || 40) * 1.4, (t.r || 40) * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Dynamic Flashlight Projection Shadows (Stretching away from player's torch!)
      if (this.torchOn && this.battery > 0) {
        const px = this.player.x;
        const py = this.player.y;

        const shadowCasters = [...this.trees, ...this.obstacles];
        shadowCasters.forEach((obj) => {
          const dx = obj.x - px;
          const dy = obj.y - py;
          const dist = Math.hypot(dx, dy);

          // Only cast elongated shadow if within flashlight radius (360px)
          if (dist > 35 && dist < 360) {
            const angleToObj = Math.atan2(dy, dx);
            let angleDiff = Math.abs(this.player.facingAngle - angleToObj);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            if (angleDiff < 0.75) {
              const nx = dx / dist;
              const ny = dy / dist;
              const shadowLen = Math.min(130, (360 - dist) * 0.65);
              const objR = obj.r || obj.radius || 24;

              ctx.fillStyle = `rgba(0, 0, 0, ${(1 - dist / 360) * 0.55})`;
              ctx.beginPath();
              const perpX = -ny * objR;
              const perpY = nx * objR;
              ctx.moveTo(obj.x + perpX, obj.y + perpY);
              ctx.lineTo(obj.x + nx * shadowLen + perpX * 1.4, obj.y + ny * shadowLen + perpY * 1.4);
              ctx.lineTo(obj.x + nx * shadowLen - perpX * 1.4, obj.y + ny * shadowLen - perpY * 1.4);
              ctx.lineTo(obj.x - perpX, obj.y - perpY);
              ctx.closePath();
              ctx.fill();
            }
          }
        });
      }
    }
    ctx.restore();
  }

  // ── 8. First-Person Tactical I.G.I. Mode (True 3D Eye-Level Perspective Engine) ──
  renderFirstPersonIGI(ctx) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    const time = performance.now();

    // 1. Camera Eye-Level & Dynamic Head-Bobbing
    this.headBob = (this.headBob || 0);
    if (this.player.isMoving) {
      this.headBob += 0.15 * (this.player.isSprinting ? 1.55 : 1.0);
    }
    const bobX = this.player.isMoving
      ? Math.cos(this.headBob * 0.5) * (this.player.isSprinting ? 7 : 4)
      : Math.sin(time * 0.002) * 1.0;
    const bobY = this.player.isMoving
      ? Math.sin(this.headBob) * (this.player.isSprinting ? 9 : 5)
      : Math.sin(time * 0.0028) * 1.5;
    const shakeX = this.screenShake?.x || 0;
    const shakeY = this.screenShake?.y || 0;

    const horizonY = h * 0.50 + bobY + shakeY;
    const camZ = 34; // Eye height in units above ground plane
    const fovRad = 74 * (Math.PI / 180);
    const F = (w * 0.5) / Math.tan(fovRad * 0.5); // Perspective focal distance
    const camX = this.player.x;
    const camY = this.player.y;
    const yaw = this.player.facingAngle || 0;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);

    // 2. Nocturnal Rainforest Sky Dome & Parallax Mountain Horizon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (this.chapter === 2) {
      skyGrad.addColorStop(0, "#020814");
      skyGrad.addColorStop(0.65, "#0a1e30");
      skyGrad.addColorStop(1, "#163852");
    } else if (this.chapter === 3) {
      skyGrad.addColorStop(0, "#010106");
      skyGrad.addColorStop(0.65, "#0b0817");
      skyGrad.addColorStop(1, "#17102e");
    } else if (this.chapter === 4) {
      skyGrad.addColorStop(0, "#04070a");
      skyGrad.addColorStop(0.65, "#0d1620");
      skyGrad.addColorStop(1, "#192634");
    } else if (this.chapter === 5) {
      skyGrad.addColorStop(0, "#0b0407");
      skyGrad.addColorStop(0.6, "#220c15");
      skyGrad.addColorStop(1, "#451c14");
    } else {
      skyGrad.addColorStop(0, "#020a04");
      skyGrad.addColorStop(0.65, "#08200f");
      skyGrad.addColorStop(1, "#0f361a");
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY + 2);

    // Parallax Mountain Ranges (Rotates as player turns view)
    ctx.fillStyle = this.chapter === 2 ? "#061320" : (this.chapter === 3 ? "#07040f" : "#041008");
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    const step = 20;
    for (let x = 0; x <= w + step; x += step) {
      const peak = Math.sin((x / w) * 10 + yaw * 2.2) * 32 + Math.cos((x / w) * 5 + yaw * 1.4) * 18;
      ctx.lineTo(x, horizonY - 18 - peak);
    }
    ctx.lineTo(w, horizonY);
    ctx.closePath();
    ctx.fill();

    // Thunder Flash
    if (this.stormActive && Math.random() < 0.012) {
      ctx.fillStyle = "rgba(220, 245, 255, 0.4)";
      ctx.fillRect(0, 0, w, h);
    }

    // 3. Perspective Ground Plane (Rainforest Soil / Mud / Moss)
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    if (this.chapter === 2) {
      groundGrad.addColorStop(0, "#101e14");
      groundGrad.addColorStop(0.4, "#213d28");
      groundGrad.addColorStop(1, "#32573d");
    } else if (this.chapter === 3) {
      groundGrad.addColorStop(0, "#08060e");
      groundGrad.addColorStop(0.5, "#140f21");
      groundGrad.addColorStop(1, "#1e1830");
    } else if (this.chapter === 4) {
      groundGrad.addColorStop(0, "#0a0f14");
      groundGrad.addColorStop(0.5, "#162029");
      groundGrad.addColorStop(1, "#22303c");
    } else if (this.chapter === 5) {
      groundGrad.addColorStop(0, "#140905");
      groundGrad.addColorStop(0.5, "#2c150c");
      groundGrad.addColorStop(1, "#442416");
    } else {
      groundGrad.addColorStop(0, "#051105");
      groundGrad.addColorStop(0.35, "#0c240c");
      groundGrad.addColorStop(0.75, "#143314");
      groundGrad.addColorStop(1, "#1a421a");
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // ── Ultra-Realistic Forest Floor: Mud Trails, Puddles & Leaf Litter ──
    // A. Winding perspective muddy footpath
    ctx.save();
    const trailGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    trailGrad.addColorStop(0, "rgba(18, 12, 6, 0.15)");
    trailGrad.addColorStop(0.5, "rgba(28, 18, 10, 0.45)");
    trailGrad.addColorStop(1, "rgba(35, 22, 12, 0.70)");
    ctx.fillStyle = trailGrad;

    const trailWBottom = w * 0.46;
    const trailWTop = 18;
    const trailCenterX = w * 0.50 + Math.sin(time * 0.0005) * 15;
    ctx.beginPath();
    ctx.moveTo(trailCenterX - trailWTop, horizonY);
    ctx.quadraticCurveTo(trailCenterX - trailWBottom * 0.35, horizonY + (h - horizonY) * 0.55, trailCenterX - trailWBottom, h);
    ctx.lineTo(trailCenterX + trailWBottom, h);
    ctx.quadraticCurveTo(trailCenterX + trailWBottom * 0.35, horizonY + (h - horizonY) * 0.55, trailCenterX + trailWTop, horizonY);
    ctx.closePath();
    ctx.fill();

    // B. Rainwater puddles reflecting the night sky & lightning
    const puddles = [
      { rx: 0.44, ry: 0.68, rw: 48, rh: 14, rot: 0.1 },
      { rx: 0.58, ry: 0.82, rw: 65, rh: 18, rot: -0.15 },
      { rx: 0.36, ry: 0.88, rw: 85, rh: 22, rot: 0.08 },
    ];
    puddles.forEach((pud) => {
      const px = w * pud.rx + bobX * 0.4;
      const py = horizonY + (h - horizonY) * pud.ry;
      const pudGrad = ctx.createRadialGradient(px, py, 2, px, py, pud.rw);
      pudGrad.addColorStop(0, "rgba(60, 110, 140, 0.45)");
      pudGrad.addColorStop(0.7, "rgba(30, 60, 80, 0.28)");
      pudGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = pudGrad;
      ctx.beginPath();
      ctx.ellipse(px, py, pud.rw, pud.rh, pud.rot, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight ripple
      ctx.strokeStyle = "rgba(186, 230, 253, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(px, py, pud.rw * 0.7, pud.rh * 0.6, pud.rot, 0, Math.PI * 2);
      ctx.stroke();
    });

    // C. Perspective depth terrain bands & leaf litter
    const numStripes = 16;
    for (let i = 0; i < numStripes; i++) {
      const t = (i + 1) / numStripes;
      const sy = horizonY + (h - horizonY) * (t * t);
      const bandHeight = (h - horizonY) * (0.04 + t * 0.10);
      ctx.fillStyle = i % 2 === 0 ? "rgba(0, 0, 0, 0.12)" : "rgba(35, 65, 30, 0.09)";
      ctx.fillRect(0, sy, w, bandHeight);
    }
    ctx.restore();

    // D. Volumetric Flashlight Ground Spot (with specular wet ground reflection)
    if (this.torchOn) {
      const spotX = w * 0.5 + bobX * 0.6;
      const spotY = h * 0.74 + bobY;
      const spotGrad = ctx.createRadialGradient(spotX, spotY, 25, spotX, spotY, w * 0.44);
      if (this.uvMode) {
        spotGrad.addColorStop(0, "rgba(168, 85, 247, 0.58)");
        spotGrad.addColorStop(0.35, "rgba(126, 34, 206, 0.35)");
        spotGrad.addColorStop(0.7, "rgba(56, 189, 248, 0.18)");
        spotGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        spotGrad.addColorStop(0, "rgba(255, 250, 220, 0.65)");
        spotGrad.addColorStop(0.35, "rgba(230, 215, 165, 0.35)");
        spotGrad.addColorStop(0.7, "rgba(180, 160, 110, 0.15)");
        spotGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);
    }

    // 4. Transform & Project All Game Entities into 3D Depth
    const fpsEntities = [];

    // Helper to transform world coords (ox, oy, oz) to camera space
    const projectPoint = (ox, oy, oz = 0) => {
      const dx = ox - camX;
      const dy = oy - camY;
      const fwd = dx * cosYaw + dy * sinYaw;
      const rgt = -dx * sinYaw + dy * cosYaw;
      if (fwd < 10 || fwd > 950) return null;
      const scale = F / fwd;
      const Sx = w * 0.5 + rgt * scale + bobX + shakeX;
      const Sy = horizonY + (camZ - oz) * scale;
      const angle = Math.atan2(rgt, fwd);
      const inTorch = this.torchOn && Math.abs(angle) < 0.40;
      const fog = Math.max(0, Math.min(1.0, 1.0 - (fwd - 60) / 800));
      const light = Math.min(1.0, 0.22 + (inTorch ? Math.max(0.3, 1.0 - (fwd / 520)) * 0.85 : 0));
      return { fwd, rgt, scale, Sx, Sy, fog, light, inTorch, angle };
    };

    // A. Trees
    const allTrees = [...(this.ambientTrees || []), ...(this.trees || [])];
    allTrees.forEach((t) => {
      const p = projectPoint(t.x, t.y, 0);
      if (p) {
        fpsEntities.push({
          type: "tree",
          fwd: p.fwd,
          p,
          tree: t,
        });
      }
    });

    // B. Boulders & Obstacles
    (this.obstacles || []).forEach((obs) => {
      const p = projectPoint(obs.x, obs.y, 0);
      if (p) {
        fpsEntities.push({
          type: "boulder",
          fwd: p.fwd,
          p,
          obs,
        });
      }
    });

    // C. Campfires
    (this.campfires || []).forEach((fire) => {
      const p = projectPoint(fire.x, fire.y, 0);
      if (p) {
        fpsEntities.push({
          type: "campfire",
          fwd: p.fwd,
          p,
          fire,
        });
      }
    });

    // D. Interactive Objects (Cabin, Gunadasa, Crates, Keys, Slates, etc.)
    (this.interactiveObjects || []).forEach((obj) => {
      const p = projectPoint(obj.x, obj.y, 0);
      if (p) {
        fpsEntities.push({
          type: "interactive",
          fwd: p.fwd,
          p,
          obj,
        });
      }
    });

    // E. Ground Items (Salt, Herbs, Tea, Flares)
    (this.items || []).forEach((it) => {
      const p = projectPoint(it.x, it.y, 0);
      if (p) {
        fpsEntities.push({
          type: "item",
          fwd: p.fwd,
          p,
          item: it,
        });
      }
    });

    // F. Fauna: Shadow Stalker Leopard
    if (this.shadowStalker) {
      const p = projectPoint(this.shadowStalker.x, this.shadowStalker.y, 0);
      if (p) {
        fpsEntities.push({
          type: "stalker",
          fwd: p.fwd,
          p,
          stalker: this.shadowStalker,
        });
      }
    }

    // G. Fauna: Leeches & Vipers
    (this.leeches || []).forEach((l) => {
      const p = projectPoint(l.x, l.y, 0);
      if (p && p.fwd < 260) {
        fpsEntities.push({
          type: "leech",
          fwd: p.fwd,
          p,
          leech: l,
        });
      }
    });
    (this.vipers || []).forEach((v) => {
      const p = projectPoint(v.x, v.y, 0);
      if (p && p.fwd < 340) {
        fpsEntities.push({
          type: "viper",
          fwd: p.fwd,
          p,
          viper: v,
        });
      }
    });

    // Sort entities descending by distance (Painter's Algorithm: Far -> Near)
    fpsEntities.sort((a, b) => b.fwd - a.fwd);

    // Keep track of the entity closest to the center crosshair for interaction
    let crosshairTarget = null;
    let minCrosshairDist = 75;

    // 5. Render 3D Entities
    fpsEntities.forEach((ent) => {
      const { p } = ent;
      const { Sx, Sy, scale, light, fog } = p;

      // ── Tree (Realistic Buttress Roots, Furrowed Bark & Volumetric Canopy) ──
      if (ent.type === "tree") {
        const t = ent.tree;
        const trunkR = Math.max(8, (t.r || 18) * scale);
        const treeH = Math.max(40, (t.height || 135) * scale);
        const foliageR = Math.max(25, (t.foliageR || 72) * scale);
        const sway = Math.sin(time * 0.0018 + t.x * 0.01) * (8 * scale);

        ctx.save();
        ctx.globalAlpha = fog;

        // Ground Contact Occlusion Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(Sx, Sy + 2, trunkR * 2.2, trunkR * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // Organic Flanged Buttress Roots (කැපොක් / හෝර ගස් මුල්)
        const rootColor = `rgb(${Math.round(48 * light)}, ${Math.round(32 * light)}, ${Math.round(20 * light)})`;
        const rootDark = `rgb(${Math.round(24 * light)}, ${Math.round(16 * light)}, ${Math.round(10 * light)})`;
        const mossColor = `rgba(${Math.round(34 * light)}, ${Math.round(130 * light)}, ${Math.round(52 * light)}, 0.85)`;

        // Left Buttress Flange
        ctx.fillStyle = rootDark;
        ctx.beginPath();
        ctx.moveTo(Sx - trunkR * 2.2, Sy + 2);
        ctx.quadraticCurveTo(Sx - trunkR * 1.2, Sy - treeH * 0.18, Sx - trunkR * 0.3, Sy - treeH * 0.28);
        ctx.lineTo(Sx - trunkR * 0.7, Sy);
        ctx.closePath();
        ctx.fill();

        // Right Buttress Flange
        ctx.fillStyle = rootColor;
        ctx.beginPath();
        ctx.moveTo(Sx + trunkR * 2.2, Sy + 2);
        ctx.quadraticCurveTo(Sx + trunkR * 1.2, Sy - treeH * 0.18, Sx + trunkR * 0.3, Sy - treeH * 0.28);
        ctx.lineTo(Sx + trunkR * 0.7, Sy);
        ctx.closePath();
        ctx.fill();

        // Center Root Buttress & Valley
        ctx.fillStyle = rootColor;
        ctx.beginPath();
        ctx.moveTo(Sx - trunkR * 0.9, Sy + 2);
        ctx.lineTo(Sx, Sy - treeH * 0.24);
        ctx.lineTo(Sx + trunkR * 0.9, Sy + 2);
        ctx.closePath();
        ctx.fill();

        // Moss on damp root base
        ctx.fillStyle = mossColor;
        ctx.beginPath();
        ctx.ellipse(Sx - trunkR * 0.6, Sy - treeH * 0.05, trunkR * 0.5, trunkR * 0.25, 0.3, 0, Math.PI * 2);
        ctx.ellipse(Sx + trunkR * 0.5, Sy - treeH * 0.04, trunkR * 0.4, trunkR * 0.2, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // 3D Cylindrical Shaded Trunk
        const trunkGrad = ctx.createLinearGradient(Sx - trunkR, 0, Sx + trunkR, 0);
        trunkGrad.addColorStop(0, `rgb(${Math.round(75 * light)}, ${Math.round(50 * light)}, ${Math.round(32 * light)})`);
        trunkGrad.addColorStop(0.35, `rgb(${Math.round(105 * light)}, ${Math.round(72 * light)}, ${Math.round(48 * light)})`);
        trunkGrad.addColorStop(0.75, `rgb(${Math.round(58 * light)}, ${Math.round(38 * light)}, ${Math.round(24 * light)})`);
        trunkGrad.addColorStop(1, `rgb(${Math.round(26 * light)}, ${Math.round(16 * light)}, ${Math.round(11 * light)})`);
        ctx.fillStyle = trunkGrad;
        ctx.fillRect(Sx - trunkR, Sy - treeH, trunkR * 2, treeH);

        // Furrowed Bark Texture Lines
        ctx.strokeStyle = `rgba(${Math.round(20 * light)}, ${Math.round(12 * light)}, ${Math.round(8 * light)}, 0.6)`;
        ctx.lineWidth = Math.max(1, 1.2 * scale);
        ctx.beginPath();
        ctx.moveTo(Sx - trunkR * 0.4, Sy - treeH * 0.85); ctx.lineTo(Sx - trunkR * 0.35, Sy - treeH * 0.15);
        ctx.moveTo(Sx + trunkR * 0.1, Sy - treeH * 0.9); ctx.lineTo(Sx + trunkR * 0.15, Sy - treeH * 0.2);
        ctx.moveTo(Sx + trunkR * 0.5, Sy - treeH * 0.8); ctx.lineTo(Sx + trunkR * 0.45, Sy - treeH * 0.12);
        ctx.stroke();

        // Climbing Liana Vines (වැල්)
        ctx.strokeStyle = `rgba(${Math.round(45 * light)}, ${Math.round(75 * light)}, ${Math.round(35 * light)}, 0.85)`;
        ctx.lineWidth = Math.max(1.2, 2.2 * scale);
        ctx.beginPath();
        ctx.moveTo(Sx - trunkR * 0.8, Sy);
        ctx.quadraticCurveTo(Sx + trunkR * 1.1, Sy - treeH * 0.35, Sx - trunkR * 0.7, Sy - treeH * 0.7);
        ctx.quadraticCurveTo(Sx + trunkR * 0.9, Sy - treeH * 0.85, Sx - trunkR * 0.2, Sy - treeH);
        ctx.stroke();

        // Epiphytic Bird's-Nest Fern (කුරුළු කූඩු මීවන)
        if (treeH > 60) {
          const epiphyteY = Sy - treeH * 0.52;
          ctx.fillStyle = `rgb(${Math.round(35 * light)}, ${Math.round(110 * light)}, ${Math.round(45 * light)})`;
          for (let f = -3; f <= 3; f++) {
            const fAngle = f * 0.25;
            const frondLen = (14 + Math.abs(f) * 3) * scale;
            ctx.beginPath();
            ctx.ellipse(
              Sx + trunkR * 0.4 + Math.sin(fAngle) * frondLen * 0.5,
              epiphyteY - Math.cos(fAngle) * frondLen * 0.5,
              Math.max(1.5, 3 * scale),
              frondLen * 0.5,
              fAngle, 0, Math.PI * 2
            );
            ctx.fill();
          }
        }

        // Multi-Tier Volumetric Canopy
        const canopyY = Sy - treeH;
        // Tier 1: Dark Under-Canopy
        ctx.fillStyle = `rgb(${Math.round(14 * light)}, ${Math.round(38 * light)}, ${Math.round(18 * light)})`;
        ctx.beginPath();
        ctx.arc(Sx + sway, canopyY + foliageR * 0.15, foliageR * 0.95, 0, Math.PI * 2);
        ctx.fill();

        // Tier 2: Mid-Level Lush Jungle Canopy
        ctx.fillStyle = `rgb(${Math.round(24 * light)}, ${Math.round(65 * light)}, ${Math.round(30 * light)})`;
        ctx.beginPath();
        ctx.arc(Sx + sway - foliageR * 0.35, canopyY - foliageR * 0.1, foliageR * 0.75, 0, Math.PI * 2);
        ctx.arc(Sx + sway + foliageR * 0.35, canopyY - foliageR * 0.08, foliageR * 0.72, 0, Math.PI * 2);
        ctx.arc(Sx + sway, canopyY - foliageR * 0.35, foliageR * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Tier 3: Sunlit / Flashlight Highlight Clusters
        ctx.fillStyle = `rgb(${Math.round(42 * light)}, ${Math.round(98 * light)}, ${Math.round(46 * light)})`;
        ctx.beginPath();
        ctx.arc(Sx + sway - foliageR * 0.18, canopyY - foliageR * 0.28, foliageR * 0.45, 0, Math.PI * 2);
        ctx.arc(Sx + sway + foliageR * 0.18, canopyY - foliageR * 0.22, foliageR * 0.42, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ── Boulder / Granite Rock (Faceted 3D Geometry with Moss & Fissures) ──
      else if (ent.type === "boulder") {
        const obs = ent.obs;
        const bR = Math.max(12, (obs.radius || 28) * scale);
        ctx.save();
        ctx.globalAlpha = fog;

        // Ground Contact Occlusion Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
        ctx.beginPath();
        ctx.ellipse(Sx, Sy + 2, bR * 1.4, bR * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Faceted 3D Chiseled Granite Polygon Base
        ctx.fillStyle = `rgb(${Math.round(40 * light)}, ${Math.round(45 * light)}, ${Math.round(42 * light)})`;
        ctx.beginPath();
        ctx.moveTo(Sx - bR * 1.1, Sy - bR * 0.2);
        ctx.lineTo(Sx - bR * 0.8, Sy - bR * 0.85);
        ctx.lineTo(Sx - bR * 0.2, Sy - bR * 1.15);
        ctx.lineTo(Sx + bR * 0.6, Sy - bR * 1.05);
        ctx.lineTo(Sx + bR * 1.15, Sy - bR * 0.65);
        ctx.lineTo(Sx + bR * 0.95, Sy - bR * 0.1);
        ctx.lineTo(Sx + bR * 0.3, Sy + bR * 0.15);
        ctx.lineTo(Sx - bR * 0.7, Sy + bR * 0.12);
        ctx.closePath();
        ctx.fill();

        // Lit Top Facet
        ctx.fillStyle = `rgb(${Math.round(115 * light)}, ${Math.round(122 * light)}, ${Math.round(118 * light)})`;
        ctx.beginPath();
        ctx.moveTo(Sx - bR * 0.8, Sy - bR * 0.85);
        ctx.lineTo(Sx - bR * 0.2, Sy - bR * 1.15);
        ctx.lineTo(Sx + bR * 0.6, Sy - bR * 1.05);
        ctx.lineTo(Sx + bR * 0.3, Sy - bR * 0.55);
        ctx.lineTo(Sx - bR * 0.4, Sy - bR * 0.58);
        ctx.closePath();
        ctx.fill();

        // Medium Angle Facet
        ctx.fillStyle = `rgb(${Math.round(75 * light)}, ${Math.round(82 * light)}, ${Math.round(78 * light)})`;
        ctx.beginPath();
        ctx.moveTo(Sx - bR * 1.1, Sy - bR * 0.2);
        ctx.lineTo(Sx - bR * 0.8, Sy - bR * 0.85);
        ctx.lineTo(Sx - bR * 0.4, Sy - bR * 0.58);
        ctx.lineTo(Sx - bR * 0.5, Sy - bR * 0.05);
        ctx.closePath();
        ctx.fill();

        // Right Shaded Facet
        ctx.fillStyle = `rgb(${Math.round(52 * light)}, ${Math.round(58 * light)}, ${Math.round(54 * light)})`;
        ctx.beginPath();
        ctx.moveTo(Sx + bR * 0.6, Sy - bR * 1.05);
        ctx.lineTo(Sx + bR * 1.15, Sy - bR * 0.65);
        ctx.lineTo(Sx + bR * 0.95, Sy - bR * 0.1);
        ctx.lineTo(Sx + bR * 0.3, Sy - bR * 0.55);
        ctx.closePath();
        ctx.fill();

        // Fissure Fracture Lines
        ctx.strokeStyle = `rgba(${Math.round(20 * light)}, ${Math.round(22 * light)}, ${Math.round(20 * light)}, 0.8)`;
        ctx.lineWidth = Math.max(1, 1.2 * scale);
        ctx.beginPath();
        ctx.moveTo(Sx - bR * 0.3, Sy - bR * 0.95);
        ctx.lineTo(Sx - bR * 0.15, Sy - bR * 0.5);
        ctx.lineTo(Sx + bR * 0.1, Sy - bR * 0.2);
        ctx.stroke();

        // Damp Rainforest Moss on Upward Crest
        ctx.fillStyle = `rgba(${Math.round(38 * light)}, ${Math.round(115 * light)}, ${Math.round(48 * light)}, 0.88)`;
        ctx.beginPath();
        ctx.ellipse(Sx - bR * 0.2, Sy - bR * 0.9, bR * 0.45, bR * 0.22, -0.15, 0, Math.PI * 2);
        ctx.ellipse(Sx + bR * 0.3, Sy - bR * 0.8, bR * 0.35, bR * 0.18, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ── Campfire (River Stones, Charred Firewood & Turbulent Flame Tongues) ──
      else if (ent.type === "campfire") {
        const cRad = Math.max(18, (ent.fire?.radius || 36) * scale);
        ctx.save();
        ctx.globalAlpha = fog;

        // Dynamic Ground Light Emission
        const fireGlow = ctx.createRadialGradient(Sx, Sy, 5, Sx, Sy, cRad * 4.2);
        fireGlow.addColorStop(0, "rgba(255, 145, 25, 0.65)");
        fireGlow.addColorStop(0.35, "rgba(230, 85, 12, 0.28)");
        fireGlow.addColorStop(0.7, "rgba(180, 50, 5, 0.10)");
        fireGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = fireGlow;
        ctx.beginPath();
        ctx.ellipse(Sx, Sy + 2, cRad * 4.2, cRad * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ring of 3D River Granite Hearth Stones
        const stoneCount = 9;
        for (let s = 0; s < stoneCount; s++) {
          const sAngle = (s / stoneCount) * Math.PI * 2;
          const stX = Sx + Math.cos(sAngle) * (cRad * 0.85);
          const stY = Sy + Math.sin(sAngle) * (cRad * 0.38);
          const stR = (6.5 + (s % 3) * 2) * scale;

          ctx.fillStyle = "#1e1e1e";
          ctx.beginPath();
          ctx.ellipse(stX, stY + 2, stR * 1.1, stR * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();

          const stGrad = ctx.createRadialGradient(stX - Math.cos(sAngle) * 3, stY - Math.sin(sAngle) * 2, 1, stX, stY, stR);
          stGrad.addColorStop(0, "#a8a29e");
          stGrad.addColorStop(0.6, "#57534e");
          stGrad.addColorStop(1, "#292524");
          ctx.fillStyle = stGrad;
          ctx.beginPath();
          ctx.arc(stX, stY, Math.max(2, stR), 0, Math.PI * 2);
          ctx.fill();
        }

        // Incandescent Glowing Ember Bed
        const emberPulse = Math.sin(time * 0.015) * 0.15;
        const emberGrad = ctx.createRadialGradient(Sx, Sy, 2, Sx, Sy, cRad * 0.6);
        emberGrad.addColorStop(0, `rgba(255, 255, 240, ${0.9 + emberPulse})`);
        emberGrad.addColorStop(0.3, `rgba(255, 140, 20, ${0.85 + emberPulse})`);
        emberGrad.addColorStop(0.7, "rgba(220, 38, 38, 0.7)");
        emberGrad.addColorStop(1, "rgba(69, 10, 10, 0.5)");
        ctx.fillStyle = emberGrad;
        ctx.beginPath();
        ctx.ellipse(Sx, Sy, cRad * 0.65, cRad * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Charred Criss-Crossed Firewood Logs
        ctx.save();
        ctx.translate(Sx, Sy);
        ctx.rotate(-0.35);
        ctx.fillStyle = "#1c1917";
        ctx.fillRect(-cRad * 0.6, -3 * scale, cRad * 1.2, 6 * scale);
        ctx.fillStyle = "#ff5500";
        ctx.fillRect(-cRad * 0.2, -1 * scale, cRad * 0.4, 2 * scale);
        ctx.restore();

        ctx.save();
        ctx.translate(Sx, Sy);
        ctx.rotate(0.42);
        ctx.fillStyle = "#292524";
        ctx.fillRect(-cRad * 0.55, -2.5 * scale, cRad * 1.1, 5 * scale);
        ctx.fillStyle = "#ff7700";
        ctx.fillRect(-cRad * 0.15, -0.8 * scale, cRad * 0.3, 1.6 * scale);
        ctx.restore();

        // Multi-Phase Turbulent Dancing Flames
        const flameBaseH = (38 + Math.sin(time * 0.02) * 9) * scale;

        // 1. Blue Ignition Zone (Combustion zone at base)
        ctx.fillStyle = "rgba(59, 130, 246, 0.75)";
        ctx.beginPath();
        ctx.ellipse(Sx, Sy - 3 * scale, cRad * 0.35, cRad * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Main Outer Golden Flame
        const f1H = flameBaseH * (0.95 + Math.sin(time * 0.024) * 0.15);
        const f1W = cRad * 0.5;
        const flameGrad1 = ctx.createLinearGradient(Sx, Sy, Sx, Sy - f1H);
        flameGrad1.addColorStop(0, "#ea580c");
        flameGrad1.addColorStop(0.45, "#f59e0b");
        flameGrad1.addColorStop(0.85, "#fde047");
        flameGrad1.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = flameGrad1;
        ctx.beginPath();
        ctx.moveTo(Sx - f1W, Sy);
        ctx.quadraticCurveTo(
          Sx - f1W * 0.6 + Math.sin(time * 0.018) * 8 * scale,
          Sy - f1H * 0.55,
          Sx + Math.sin(time * 0.022) * 6 * scale,
          Sy - f1H
        );
        ctx.quadraticCurveTo(
          Sx + f1W * 0.6 + Math.cos(time * 0.02) * 8 * scale,
          Sy - f1H * 0.55,
          Sx + f1W,
          Sy
        );
        ctx.closePath();
        ctx.fill();

        // 3. Inner White-Hot Core Flame
        const f2H = f1H * 0.62;
        const f2W = f1W * 0.55;
        const flameGrad2 = ctx.createLinearGradient(Sx, Sy, Sx, Sy - f2H);
        flameGrad2.addColorStop(0, "#f97316");
        flameGrad2.addColorStop(0.5, "#fef08a");
        flameGrad2.addColorStop(1, "#ffffff");

        ctx.fillStyle = flameGrad2;
        ctx.beginPath();
        ctx.moveTo(Sx - f2W, Sy);
        ctx.quadraticCurveTo(
          Sx - f2W * 0.4 + Math.sin(time * 0.03) * 4 * scale,
          Sy - f2H * 0.5,
          Sx,
          Sy - f2H
        );
        ctx.quadraticCurveTo(
          Sx + f2W * 0.4 + Math.cos(time * 0.03) * 4 * scale,
          Sy - f2H * 0.5,
          Sx + f2W,
          Sy
        );
        ctx.closePath();
        ctx.fill();

        // Rising Sparks & Embers
        for (let i = 0; i < 7; i++) {
          const spProgress = ((time * 0.035 + i * 22) % 100) / 100;
          const spSwirl = Math.sin(time * 0.008 + i * 1.5) * (cRad * 0.7);
          const spX = Sx + spSwirl;
          const spY = Sy - flameBaseH * 0.6 - spProgress * (85 * scale);
          const spAlpha = Math.max(0, 1.0 - spProgress);
          const spR = Math.max(1, (2.8 - spProgress * 1.5) * scale);

          ctx.fillStyle = i % 2 === 0 ? `rgba(254, 240, 138, ${spAlpha})` : `rgba(249, 115, 22, ${spAlpha})`;
          ctx.beginPath();
          ctx.arc(spX, spY, spR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ── Interactive Objects ──
      else if (ent.type === "interactive") {
        const obj = ent.obj;
        const id = obj.id || "";
        ctx.save();
        ctx.globalAlpha = fog;

        // Check if aimed near crosshair (center of screen)
        const distToCenter = Math.hypot(Sx - w * 0.5, (Sy - 25 * scale) - h * 0.5);
        if (distToCenter < minCrosshairDist && p.fwd < 160) {
          minCrosshairDist = distToCenter;
          crosshairTarget = obj;
        }

        // 1. Old Ranger Gunadasa (ගුණදාස මාමා - Realistic Anatomical Model)
        if (id === "gunadasa_npc" || id === "npc") {
          const gH = Math.max(38, 74 * scale);
          const gW = Math.max(16, 32 * scale);
          const breath = Math.sin(time * 0.0022) * (1.2 * scale);

          // Soft Contact Ground Shadow
          ctx.fillStyle = "rgba(0, 0, 0, 0.46)";
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, gW * 0.85, gW * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tall Knotted Bamboo Walking Staff (බට ලී සැරයටිය)
          const staffX = Sx + gW * 0.45;
          const staffY = Sy - gH * 0.88;
          const staffW = Math.max(2, 3.8 * scale);
          const staffH = gH * 0.90;

          const staffGrad = ctx.createLinearGradient(staffX, 0, staffX + staffW, 0);
          staffGrad.addColorStop(0, `rgb(${Math.round(180 * light)}, ${Math.round(138 * light)}, ${Math.round(75 * light)})`);
          staffGrad.addColorStop(0.5, `rgb(${Math.round(230 * light)}, ${Math.round(195 * light)}, ${Math.round(120 * light)})`);
          staffGrad.addColorStop(1, `rgb(${Math.round(140 * light)}, ${Math.round(100 * light)}, ${Math.round(50 * light)})`);
          ctx.fillStyle = staffGrad;
          ctx.fillRect(staffX, staffY, staffW, staffH);

          // Bamboo knot rings & brass ferrule
          ctx.fillStyle = "#3e2723";
          [-0.15, -0.35, -0.55, -0.75].forEach((frac) => {
            ctx.fillRect(staffX - 1, Sy + staffH * frac, staffW + 2, Math.max(1, 2.2 * scale));
          });
          ctx.fillStyle = "#d4af37";
          ctx.fillRect(staffX - 0.5, Sy - 2, staffW + 1, 4 * scale);

          // Leather Strapped Sandals & Feet on Ground
          ctx.fillStyle = `rgb(${Math.round(38 * light)}, ${Math.round(24 * light)}, ${Math.round(16 * light)})`;
          ctx.fillRect(Sx - gW * 0.28, Sy - 3 * scale, gW * 0.22, 4 * scale);
          ctx.fillRect(Sx + gW * 0.06, Sy - 3 * scale, gW * 0.22, 4 * scale);
          ctx.fillStyle = "#5d4037";
          ctx.fillRect(Sx - gW * 0.26, Sy - 4 * scale, gW * 0.18, 1.8 * scale);
          ctx.fillRect(Sx + gW * 0.08, Sy - 4 * scale, gW * 0.18, 1.8 * scale);

          // Traditional Sri Lankan Sarong (කයිලි / සරම)
          const sarongY = Sy - gH * 0.50;
          const sarongH = gH * 0.48;
          const sarongW = gW * 0.74;

          const sarongGrad = ctx.createLinearGradient(Sx - sarongW * 0.5, 0, Sx + sarongW * 0.5, 0);
          sarongGrad.addColorStop(0, `rgb(${Math.round(35 * light)}, ${Math.round(56 * light)}, ${Math.round(32 * light)})`);
          sarongGrad.addColorStop(0.35, `rgb(${Math.round(52 * light)}, ${Math.round(85 * light)}, ${Math.round(48 * light)})`);
          sarongGrad.addColorStop(0.7, `rgb(${Math.round(42 * light)}, ${Math.round(68 * light)}, ${Math.round(38 * light)})`);
          sarongGrad.addColorStop(1, `rgb(${Math.round(22 * light)}, ${Math.round(36 * light)}, ${Math.round(20 * light)})`);
          ctx.fillStyle = sarongGrad;
          ctx.beginPath();
          ctx.moveTo(Sx - sarongW * 0.45, sarongY);
          ctx.lineTo(Sx + sarongW * 0.45, sarongY);
          ctx.lineTo(Sx + sarongW * 0.52, sarongY + sarongH);
          ctx.lineTo(Sx - sarongW * 0.52, sarongY + sarongH);
          ctx.closePath();
          ctx.fill();

          // Sarong Checkered Weave Pattern & Pleats
          ctx.strokeStyle = `rgba(${Math.round(90 * light)}, ${Math.round(130 * light)}, ${Math.round(80 * light)}, 0.45)`;
          ctx.lineWidth = Math.max(1, 1.2 * scale);
          ctx.beginPath();
          [-0.3, 0, 0.3].forEach((off) => {
            ctx.moveTo(Sx + sarongW * off, sarongY);
            ctx.lineTo(Sx + sarongW * off * 1.1, sarongY + sarongH);
          });
          ctx.stroke();

          // Rolled Waistband Knot (බණ්ඩලය)
          ctx.fillStyle = `rgb(${Math.round(28 * light)}, ${Math.round(46 * light)}, ${Math.round(26 * light)})`;
          ctx.beginPath();
          ctx.ellipse(Sx, sarongY, sarongW * 0.42, 3.5 * scale, 0, 0, Math.PI * 2);
          ctx.fill();

          // Leather Utility Belt with Brass Canteen & Pouch
          const beltY = sarongY - 3 * scale;
          ctx.fillStyle = `rgb(${Math.round(50 * light)}, ${Math.round(32 * light)}, ${Math.round(20 * light)})`;
          ctx.fillRect(Sx - sarongW * 0.45, beltY, sarongW * 0.9, 3.5 * scale);
          ctx.fillStyle = "#d4af37";
          ctx.fillRect(Sx - 2.5 * scale, beltY, 5 * scale, 3.5 * scale);
          // Canteen
          ctx.fillStyle = "#b45309";
          ctx.beginPath();
          ctx.ellipse(Sx + sarongW * 0.42, beltY + 4 * scale, 3.5 * scale, 5 * scale, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#d4af37";
          ctx.fillRect(Sx + sarongW * 0.40, beltY - 1 * scale, 2.5 * scale, 2 * scale);

          // Khaki Safari Ranger Jacket
          const jacketY = Sy - gH * 0.78 + breath;
          const jacketH = gH * 0.32;
          const jacketW = gW * 0.88;

          const jacketGrad = ctx.createLinearGradient(Sx - jacketW * 0.5, 0, Sx + jacketW * 0.5, 0);
          jacketGrad.addColorStop(0, `rgb(${Math.round(85 * light)}, ${Math.round(102 * light)}, ${Math.round(78 * light)})`);
          jacketGrad.addColorStop(0.4, `rgb(${Math.round(120 * light)}, ${Math.round(138 * light)}, ${Math.round(108 * light)})`);
          jacketGrad.addColorStop(1, `rgb(${Math.round(65 * light)}, ${Math.round(78 * light)}, ${Math.round(58 * light)})`);
          ctx.fillStyle = jacketGrad;
          ctx.beginPath();
          ctx.roundRect(Sx - jacketW * 0.5, jacketY, jacketW, jacketH, [4 * scale, 4 * scale, 2 * scale, 2 * scale]);
          ctx.fill();

          // Pockets & Lapels
          ctx.fillStyle = `rgb(${Math.round(70 * light)}, ${Math.round(85 * light)}, ${Math.round(65 * light)})`;
          ctx.fillRect(Sx - jacketW * 0.42, jacketY + jacketH * 0.35, jacketW * 0.35, jacketH * 0.25);
          ctx.fillRect(Sx + jacketW * 0.07, jacketY + jacketH * 0.35, jacketW * 0.35, jacketH * 0.25);

          // Brass Buttons
          ctx.fillStyle = "#d4af37";
          [-0.1, 0.15, 0.4].forEach((bFrac) => {
            ctx.beginPath();
            ctx.arc(Sx, jacketY + jacketH * (0.4 + bFrac), Math.max(1, 1.4 * scale), 0, Math.PI * 2);
            ctx.fill();
          });

          // Hand Gripping Staff
          ctx.fillStyle = `rgb(${Math.round(195 * light)}, ${Math.round(135 * light)}, ${Math.round(75 * light)})`;
          ctx.beginPath();
          ctx.arc(staffX + staffW * 0.5, jacketY + jacketH * 0.65, 3.5 * scale, 0, Math.PI * 2);
          ctx.fill();

          // Elder Head & Facial Features
          const headY = jacketY - gH * 0.12;
          const headR = gW * 0.28;

          ctx.fillStyle = `rgb(${Math.round(175 * light)}, ${Math.round(120 * light)}, ${Math.round(65 * light)})`;
          ctx.fillRect(Sx - headR * 0.4, jacketY - 2 * scale, headR * 0.8, 5 * scale);

          ctx.fillStyle = `rgb(${Math.round(195 * light)}, ${Math.round(135 * light)}, ${Math.round(75 * light)})`;
          ctx.beginPath();
          ctx.arc(Sx, headY, headR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#cbd5e1";
          ctx.fillRect(Sx - headR * 0.7, headY - headR * 0.35, headR * 0.55, 1.8 * scale);
          ctx.fillRect(Sx + headR * 0.15, headY - headR * 0.35, headR * 0.55, 1.8 * scale);
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(Sx - headR * 0.55, headY - headR * 0.1, 2.2 * scale, 2.2 * scale);
          ctx.fillRect(Sx + headR * 0.3, headY - headR * 0.1, 2.2 * scale, 2.2 * scale);

          // Flowing Silver-White Elder Beard
          ctx.fillStyle = "#f8fafc";
          ctx.beginPath();
          ctx.moveTo(Sx - headR * 0.85, headY + headR * 0.15);
          ctx.quadraticCurveTo(Sx - headR * 1.0, headY + gH * 0.22, Sx, headY + gH * 0.28);
          ctx.quadraticCurveTo(Sx + headR * 1.0, headY + gH * 0.22, Sx + headR * 0.85, headY + headR * 0.15);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = Math.max(1, 1 * scale);
          ctx.beginPath();
          ctx.moveTo(Sx, headY + headR * 0.4); ctx.lineTo(Sx, headY + gH * 0.26);
          ctx.moveTo(Sx - headR * 0.35, headY + headR * 0.5); ctx.lineTo(Sx - headR * 0.2, headY + gH * 0.24);
          ctx.moveTo(Sx + headR * 0.35, headY + headR * 0.5); ctx.lineTo(Sx + headR * 0.2, headY + gH * 0.24);
          ctx.stroke();

          // Wide-Brimmed Ranger Safari Hat
          const hatY = headY - headR * 0.65;
          ctx.fillStyle = "#3d2e1e";
          ctx.beginPath();
          ctx.ellipse(Sx, hatY, gW * 0.65, gW * 0.22, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#241a0f";
          ctx.lineWidth = Math.max(1, 1.2 * scale);
          ctx.stroke();

          const crownW = gW * 0.52;
          const crownH = gH * 0.10;
          ctx.fillStyle = "#5c4731";
          ctx.beginPath();
          ctx.roundRect(Sx - crownW * 0.5, hatY - crownH, crownW, crownH, [4 * scale, 4 * scale, 0, 0]);
          ctx.fill();
          ctx.fillStyle = "#1e140a";
          ctx.fillRect(Sx - crownW * 0.5, hatY - 3.5 * scale, crownW, 3.5 * scale);
          ctx.fillStyle = "#d4af37";
          ctx.fillRect(Sx - 1.5 * scale, hatY - 3.5 * scale, 3 * scale, 3.5 * scale);

          // Dialogue Beacon
          if (!this.npc.helped) {
            const bPulse = Math.sin(time * 0.005) * 5 * scale;
            ctx.fillStyle = "#4ade80";
            ctx.shadowColor = "#4ade80";
            ctx.shadowBlur = 12 * scale;
            ctx.beginPath();
            ctx.arc(Sx, hatY - crownH - 12 * scale - bPulse, Math.max(3, 5.5 * scale), 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
        // 2. Kudawa Outpost Cabin (කුඩව ලී මුරපොළ)
        else if (id.includes("cabin") || id.includes("outpost") || id.includes("shelter")) {
          const cW = Math.max(60, 150 * scale);
          const cH = Math.max(45, 110 * scale);
          const stiltH = cH * 0.22;

          ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, cW * 0.65, stiltH * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Raised Timber Stilt Foundation & Crawlspace
          const stiltY = Sy - stiltH;
          ctx.fillStyle = `rgb(${Math.round(30 * light)}, ${Math.round(20 * light)}, ${Math.round(14 * light)})`;
          ctx.fillRect(Sx - cW * 0.46, stiltY, cW * 0.92, stiltH);

          ctx.fillStyle = `rgb(${Math.round(65 * light)}, ${Math.round(44 * light)}, ${Math.round(32 * light)})`;
          [-0.45, -0.15, 0.15, 0.45].forEach((pileFrac) => {
            ctx.fillRect(Sx + cW * pileFrac - 3 * scale, stiltY, 6 * scale, stiltH);
          });

          ctx.fillStyle = `rgb(${Math.round(90 * light)}, ${Math.round(62 * light)}, ${Math.round(45 * light)})`;
          ctx.fillRect(Sx - cW * 0.5, stiltY - 4 * scale, cW, 6 * scale);

          // Weatherboard Timber Cabin Walls
          const wallY = stiltY - 4 * scale - (cH - stiltH);
          const wallH = cH - stiltH;
          const wallGrad = ctx.createLinearGradient(0, wallY, 0, wallY + wallH);
          wallGrad.addColorStop(0, `rgb(${Math.round(105 * light)}, ${Math.round(74 * light)}, ${Math.round(52 * light)})`);
          wallGrad.addColorStop(1, `rgb(${Math.round(65 * light)}, ${Math.round(44 * light)}, ${Math.round(30 * light)})`);
          ctx.fillStyle = wallGrad;
          ctx.fillRect(Sx - cW * 0.48, wallY, cW * 0.96, wallH);

          // Weatherboard Slat Grooves
          ctx.strokeStyle = `rgba(${Math.round(35 * light)}, ${Math.round(22 * light)}, ${Math.round(14 * light)}, 0.65)`;
          ctx.lineWidth = Math.max(1, 1.4 * scale);
          const slatStep = wallH / 8;
          ctx.beginPath();
          for (let sl = 1; sl < 8; sl++) {
            ctx.moveTo(Sx - cW * 0.48, wallY + sl * slatStep);
            ctx.lineTo(Sx + cW * 0.48, wallY + sl * slatStep);
          }
          ctx.stroke();

          // Z-Braced Timber Door
          const doorW = cW * 0.26;
          const doorH = wallH * 0.78;
          const doorX = Sx - cW * 0.34;
          const doorY = wallY + (wallH - doorH);

          ctx.fillStyle = `rgb(${Math.round(48 * light)}, ${Math.round(30 * light)}, ${Math.round(20 * light)})`;
          ctx.fillRect(doorX, doorY, doorW, doorH);
          ctx.strokeStyle = `rgb(${Math.round(32 * light)}, ${Math.round(18 * light)}, ${Math.round(10 * light)})`;
          ctx.lineWidth = Math.max(1, 2.5 * scale);
          ctx.strokeRect(doorX, doorY, doorW, doorH);
          ctx.beginPath();
          ctx.moveTo(doorX, doorY); ctx.lineTo(doorX + doorW, doorY + doorH);
          ctx.stroke();
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.arc(doorX + doorW * 0.8, doorY + doorH * 0.5, Math.max(1.5, 3 * scale), 0, Math.PI * 2);
          ctx.fill();

          // Signboard above Door
          ctx.fillStyle = "#271c14";
          ctx.fillRect(doorX - 2 * scale, doorY - 10 * scale, doorW + 4 * scale, 8 * scale);
          ctx.fillStyle = "#e2e8f0";
          ctx.font = `bold ${Math.max(6, Math.round(5.5 * scale))}px monospace`;
          ctx.textAlign = "center";
          ctx.fillText("KUDAWA", doorX + doorW * 0.5, doorY - 4 * scale);

          // Illuminated 4-Pane Window with Warm Lantern Light
          const winW = cW * 0.28;
          const winH = wallH * 0.42;
          const winX = Sx + cW * 0.12;
          const winY = wallY + wallH * 0.22;

          const winLight = ctx.createRadialGradient(winX + winW * 0.5, winY + winH * 0.5, 5, winX + winW * 0.5, winY + winH * 0.5, winW * 2.5);
          winLight.addColorStop(0, "rgba(251, 191, 36, 0.55)");
          winLight.addColorStop(0.5, "rgba(245, 158, 11, 0.20)");
          winLight.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = winLight;
          ctx.beginPath();
          ctx.arc(winX + winW * 0.5, winY + winH * 0.5, winW * 2.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(winX, winY, winW, winH);
          ctx.fillStyle = "#3e2723";
          ctx.fillRect(winX + winW * 0.5 - 1.5 * scale, winY, 3 * scale, winH);
          ctx.fillRect(winX, winY + winH * 0.5 - 1.5 * scale, winW, 3 * scale);
          ctx.strokeRect(winX, winY, winW, winH);

          // Corrugated Zinc Gabled Roof with Rust Streaks
          const roofOverhang = cW * 0.08;
          const roofApexY = wallY - cH * 0.38;
          const roofBaseY = wallY + 2 * scale;

          const roofGrad = ctx.createLinearGradient(0, roofApexY, 0, roofBaseY);
          roofGrad.addColorStop(0, `rgb(${Math.round(145 * light)}, ${Math.round(152 * light)}, ${Math.round(160 * light)})`);
          roofGrad.addColorStop(0.5, `rgb(${Math.round(110 * light)}, ${Math.round(118 * light)}, ${Math.round(126 * light)})`);
          roofGrad.addColorStop(1, `rgb(${Math.round(75 * light)}, ${Math.round(82 * light)}, ${Math.round(90 * light)})`);
          ctx.fillStyle = roofGrad;

          ctx.beginPath();
          ctx.moveTo(Sx - cW * 0.5 - roofOverhang, roofBaseY);
          ctx.lineTo(Sx, roofApexY);
          ctx.lineTo(Sx + cW * 0.5 + roofOverhang, roofBaseY);
          ctx.closePath();
          ctx.fill();

          // Corrugated Roof Ridges & Rust Streaks
          ctx.strokeStyle = `rgba(${Math.round(180 * light)}, ${Math.round(80 * light)}, ${Math.round(40 * light)}, 0.4)`;
          ctx.lineWidth = Math.max(1, 1.8 * scale);
          ctx.beginPath();
          [-0.35, -0.2, -0.05, 0.1, 0.25, 0.4].forEach((rOff) => {
            ctx.moveTo(Sx + cW * rOff * 0.2, roofApexY);
            ctx.lineTo(Sx + cW * rOff * 1.1, roofBaseY);
          });
          ctx.stroke();

          // Roof Antenna & Blinking Beacon
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = Math.max(1.2, 2 * scale);
          ctx.beginPath();
          ctx.moveTo(Sx, roofApexY); ctx.lineTo(Sx, roofApexY - 24 * scale);
          ctx.moveTo(Sx - 6 * scale, roofApexY - 14 * scale); ctx.lineTo(Sx + 6 * scale, roofApexY - 14 * scale);
          ctx.stroke();

          const beaconFlash = Math.sin(time * 0.008) > 0.2;
          ctx.fillStyle = beaconFlash ? "#ef4444" : "#450a0a";
          ctx.shadowColor = beaconFlash ? "#ef4444" : "transparent";
          ctx.shadowBlur = beaconFlash ? 14 * scale : 0;
          ctx.beginPath();
          ctx.arc(Sx, roofApexY - 25 * scale, Math.max(2, 3.5 * scale), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        // 3. Military / Field Research Canvas Tent
        else if (id.includes("tent")) {
          const tW = Math.max(50, 110 * scale);
          const tH = Math.max(35, 75 * scale);

          ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, tW * 0.65, tW * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();

          const tentGrad = ctx.createLinearGradient(0, Sy - tH, 0, Sy);
          tentGrad.addColorStop(0, `rgb(${Math.round(85 * light)}, ${Math.round(98 * light)}, ${Math.round(75 * light)})`);
          tentGrad.addColorStop(1, `rgb(${Math.round(45 * light)}, ${Math.round(58 * light)}, ${Math.round(40 * light)})`);
          ctx.fillStyle = tentGrad;

          ctx.beginPath();
          ctx.moveTo(Sx - tW * 0.5, Sy);
          ctx.lineTo(Sx, Sy - tH);
          ctx.lineTo(Sx + tW * 0.5, Sy);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = `rgba(${Math.round(150 * light)}, ${Math.round(140 * light)}, ${Math.round(110 * light)}, 0.6)`;
          ctx.lineWidth = Math.max(1, 1.2 * scale);
          ctx.beginPath();
          ctx.moveTo(Sx, Sy - tH); ctx.lineTo(Sx - tW * 0.68, Sy + 2);
          ctx.moveTo(Sx, Sy - tH); ctx.lineTo(Sx + tW * 0.68, Sy + 2);
          ctx.stroke();

          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.moveTo(Sx - tW * 0.18, Sy);
          ctx.lineTo(Sx, Sy - tH * 0.65);
          ctx.lineTo(Sx + tW * 0.18, Sy);
          ctx.closePath();
          ctx.fill();

          const tentGlow = ctx.createRadialGradient(Sx, Sy - tH * 0.35, 2, Sx, Sy - tH * 0.35, tW * 0.22);
          tentGlow.addColorStop(0, "rgba(251, 191, 36, 0.75)");
          tentGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = tentGlow;
          ctx.beginPath();
          ctx.arc(Sx, Sy - tH * 0.35, tW * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        // 4. Military Supply Crates & Chests
        else if (id.includes("chest") || id.includes("crate") || id.includes("box") || id.includes("mine_cart_cache")) {
          const cW = Math.max(22, 46 * scale);
          const cH = Math.max(16, 34 * scale);

          ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, cW * 0.68, cH * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();

          const crateGrad = ctx.createLinearGradient(0, Sy - cH, 0, Sy);
          crateGrad.addColorStop(0, `rgb(${Math.round(112 * light)}, ${Math.round(80 * light)}, ${Math.round(55 * light)})`);
          crateGrad.addColorStop(1, `rgb(${Math.round(58 * light)}, ${Math.round(38 * light)}, ${Math.round(24 * light)})`);
          ctx.fillStyle = crateGrad;
          ctx.fillRect(Sx - cW * 0.5, Sy - cH, cW, cH);

          ctx.strokeStyle = `rgba(${Math.round(25 * light)}, ${Math.round(15 * light)}, ${Math.round(10 * light)}, 0.65)`;
          ctx.lineWidth = Math.max(1, 1.2 * scale);
          ctx.beginPath();
          ctx.moveTo(Sx - cW * 0.5, Sy - cH * 0.66); ctx.lineTo(Sx + cW * 0.5, Sy - cH * 0.66);
          ctx.moveTo(Sx - cW * 0.5, Sy - cH * 0.33); ctx.lineTo(Sx + cW * 0.5, Sy - cH * 0.33);
          ctx.stroke();

          const bW = Math.max(2.5, 5 * scale);
          ctx.fillStyle = `rgb(${Math.round(30 * light)}, ${Math.round(35 * light)}, ${Math.round(40 * light)})`;
          ctx.fillRect(Sx - cW * 0.5, Sy - cH, bW, cH);
          ctx.fillRect(Sx + cW * 0.5 - bW, Sy - cH, bW, cH);
          ctx.fillRect(Sx - cW * 0.5, Sy - cH, cW, bW * 0.8);
          ctx.fillRect(Sx - cW * 0.5, Sy - bW * 0.8, cW, bW * 0.8);

          ctx.fillStyle = `rgb(${Math.round(180 * light)}, ${Math.round(190 * light)}, ${Math.round(200 * light)})`;
          const rivR = Math.max(1, 1.3 * scale);
          [0.2, 0.5, 0.8].forEach((rFrac) => {
            ctx.beginPath();
            ctx.arc(Sx - cW * 0.5 + bW * 0.5, Sy - cH * rFrac, rivR, 0, Math.PI * 2);
            ctx.arc(Sx + cW * 0.5 - bW * 0.5, Sy - cH * rFrac, rivR, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.fillStyle = `rgba(${Math.round(230 * light)}, ${Math.round(230 * light)}, ${Math.round(230 * light)}, 0.75)`;
          ctx.font = `bold ${Math.max(6, Math.round(5.5 * scale))}px monospace`;
          ctx.textAlign = "center";
          ctx.fillText("HQ-87", Sx, Sy - cH * 0.44);

          const stripeW = 3.5 * scale;
          ctx.fillStyle = "#eab308";
          for (let st = -cW * 0.35; st < cW * 0.35; st += stripeW * 2) {
            ctx.fillRect(Sx + st, Sy - cH + 1, stripeW, 2.5 * scale);
          }

          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.arc(Sx, Sy - cH * 0.5, Math.max(2, 4 * scale), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(Sx - 1 * scale, Sy - cH * 0.5, 2 * scale, 3.5 * scale);
        }
        // 5. Heavy Diesel Generator, Breakers & Consoles
        else if (id.includes("generator") || id.includes("breaker") || id.includes("terminal") || id.includes("workbench")) {
          const gW = Math.max(28, 54 * scale);
          const gH = Math.max(22, 42 * scale);
          const vShudder = (this.generatorOn ? Math.sin(time * 45) * (0.8 * scale) : 0);

          ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
          ctx.beginPath();
          ctx.ellipse(Sx + vShudder, Sy + 2, gW * 0.65, gH * 0.30, 0, 0, Math.PI * 2);
          ctx.fill();

          const genGrad = ctx.createLinearGradient(0, Sy - gH, 0, Sy);
          genGrad.addColorStop(0, `rgb(${Math.round(75 * light)}, ${Math.round(85 * light)}, ${Math.round(98 * light)})`);
          genGrad.addColorStop(1, `rgb(${Math.round(28 * light)}, ${Math.round(36 * light)}, ${Math.round(48 * light)})`);
          ctx.fillStyle = genGrad;
          ctx.fillRect(Sx - gW * 0.5 + vShudder, Sy - gH, gW, gH);

          ctx.strokeStyle = `rgb(${Math.round(15 * light)}, ${Math.round(20 * light)}, ${Math.round(28 * light)})`;
          ctx.lineWidth = Math.max(1, 1.5 * scale);
          ctx.beginPath();
          for (let lv = -gH * 0.35; lv <= gH * 0.25; lv += 4.5 * scale) {
            ctx.moveTo(Sx - gW * 0.42 + vShudder, Sy - gH * 0.5 + lv);
            ctx.lineTo(Sx + gW * 0.05 + vShudder, Sy - gH * 0.5 + lv);
          }
          ctx.stroke();

          ctx.fillStyle = `rgb(${Math.round(40 * light)}, ${Math.round(45 * light)}, ${Math.round(52 * light)})`;
          ctx.fillRect(Sx + gW * 0.28 + vShudder, Sy - gH - 12 * scale, 6 * scale, 14 * scale);
          ctx.fillStyle = `rgb(${Math.round(120 * light)}, ${Math.round(130 * light)}, ${Math.round(140 * light)})`;
          ctx.fillRect(Sx + gW * 0.26 + vShudder, Sy - gH - 14 * scale, 9 * scale, 3 * scale);

          const dialX = Sx + gW * 0.25 + vShudder;
          const dialY = Sy - gH * 0.65;
          const dialR = Math.max(2, 4.5 * scale);

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(dialX, dialY, dialR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.strokeStyle = "#ef4444";
          ctx.beginPath();
          ctx.moveTo(dialX, dialY);
          ctx.lineTo(dialX + Math.cos(time * 0.005) * dialR * 0.8, dialY + Math.sin(time * 0.005) * dialR * 0.8);
          ctx.stroke();

          const isRunning = this.generatorOn || this.breakerOff;
          const ledColor = isRunning ? "#22c55e" : "#ef4444";
          ctx.fillStyle = ledColor;
          ctx.shadowColor = ledColor;
          ctx.shadowBlur = 10 * scale;
          ctx.beginPath();
          ctx.arc(dialX, dialY + 12 * scale, Math.max(1.5, 3 * scale), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = Math.max(1.5, 3 * scale);
          ctx.beginPath();
          ctx.moveTo(Sx - gW * 0.25 + vShudder, Sy);
          ctx.quadraticCurveTo(Sx - gW * 0.5, Sy + 8 * scale, Sx - gW * 0.8, Sy + 4 * scale);
          ctx.stroke();
        }
        // 6. Extraction Helipad & Tactical Rescue Helicopter
        else if (id.includes("helipad")) {
          const hR = Math.max(30, 95 * scale);
          ctx.fillStyle = `rgb(${Math.round(40 * light)}, ${Math.round(45 * light)}, ${Math.round(52 * light)})`;
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, hR, hR * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = Math.max(1.5, 3.5 * scale);
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, hR * 0.85, hR * 0.32, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#f8fafc";
          ctx.font = `bold ${Math.max(10, Math.round(28 * scale))}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("H", Sx, Sy + 2);

          const strobe = Math.floor((time * 0.005) % 4);
          for (let b = 0; b < 4; b++) {
            const bAngle = (b / 4) * Math.PI * 2;
            const bx = Sx + Math.cos(bAngle) * (hR * 0.85);
            const by = Sy + 2 + Math.sin(bAngle) * (hR * 0.32);
            ctx.fillStyle = b === strobe ? "#22c55e" : "#14532d";
            ctx.beginPath();
            ctx.arc(bx, by, Math.max(1.5, 3 * scale), 0, Math.PI * 2);
            ctx.fill();
          }

          const heliH = hR * 0.45;
          const heliY = Sy - heliH * 0.6;
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = Math.max(1, 2 * scale);
          ctx.beginPath();
          ctx.moveTo(Sx - hR * 0.35, Sy - 2); ctx.lineTo(Sx + hR * 0.35, Sy - 2);
          ctx.stroke();

          ctx.fillStyle = `rgb(${Math.round(45 * light)}, ${Math.round(58 * light)}, ${Math.round(42 * light)})`;
          ctx.beginPath();
          ctx.ellipse(Sx, heliY, hR * 0.42, heliH * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
          ctx.beginPath();
          ctx.ellipse(Sx + hR * 0.15, heliY - heliH * 0.08, hR * 0.18, heliH * 0.28, 0.2, 0, Math.PI * 2);
          ctx.fill();

          const rotorR = hR * 0.75;
          ctx.strokeStyle = "rgba(226, 232, 240, 0.45)";
          ctx.lineWidth = Math.max(1, 2 * scale);
          ctx.beginPath();
          ctx.ellipse(Sx, heliY - heliH * 0.55, rotorR, rotorR * 0.18, time * 0.02, 0, Math.PI * 2);
          ctx.stroke();
        }
        // 7. Bamboo River Raft (උණ බට පහුර)
        else if (id.includes("raft")) {
          const rW = Math.max(30, 75 * scale);
          const rH = Math.max(16, 38 * scale);

          ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
          ctx.lineWidth = Math.max(1, 1.5 * scale);
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, rW * 0.7, rH * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();

          const poleCount = 6;
          const poleH = rH / poleCount;
          for (let p = 0; p < poleCount; p++) {
            const py = Sy - rH * 0.5 + p * poleH;
            const bGrad = ctx.createLinearGradient(Sx - rW * 0.5, 0, Sx + rW * 0.5, 0);
            bGrad.addColorStop(0, `rgb(${Math.round(160 * light)}, ${Math.round(120 * light)}, ${Math.round(60 * light)})`);
            bGrad.addColorStop(0.5, `rgb(${Math.round(210 * light)}, ${Math.round(175 * light)}, ${Math.round(95 * light)})`);
            bGrad.addColorStop(1, `rgb(${Math.round(130 * light)}, ${Math.round(95 * light)}, ${Math.round(45 * light)})`);
            ctx.fillStyle = bGrad;
            ctx.beginPath();
            ctx.roundRect(Sx - rW * 0.48, py, rW * 0.96, poleH * 0.85, 2 * scale);
            ctx.fill();
          }

          ctx.fillStyle = `rgb(${Math.round(40 * light)}, ${Math.round(25 * light)}, ${Math.round(15 * light)})`;
          ctx.fillRect(Sx - rW * 0.25, Sy - rH * 0.55, 4 * scale, rH * 1.1);
          ctx.fillRect(Sx + rW * 0.25, Sy - rH * 0.55, 4 * scale, rH * 1.1);

          ctx.strokeStyle = "#854d0e";
          ctx.lineWidth = Math.max(1, 2.5 * scale);
          ctx.beginPath();
          ctx.moveTo(Sx - rW * 0.3, Sy - rH * 0.4);
          ctx.lineTo(Sx + rW * 0.65, Sy + rH * 0.6);
          ctx.stroke();
        }
        // 8. Natural Mountain Spring & Bubbling Hot Basin
        else if (id.includes("spring") || id.includes("basin")) {
          const sR = Math.max(22, 54 * scale);

          ctx.fillStyle = `rgb(${Math.round(65 * light)}, ${Math.round(72 * light)}, ${Math.round(68 * light)})`;
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, sR, sR * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();

          const poolGrad = ctx.createRadialGradient(Sx, Sy + 2, 2, Sx, Sy + 2, sR * 0.85);
          poolGrad.addColorStop(0, "rgba(6, 182, 212, 0.85)");
          poolGrad.addColorStop(0.7, "rgba(14, 116, 144, 0.65)");
          poolGrad.addColorStop(1, "rgba(15, 23, 42, 0.85)");
          ctx.fillStyle = poolGrad;
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, sR * 0.82, sR * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();

          const rPhase = (time * 0.003) % 1;
          ctx.strokeStyle = `rgba(165, 243, 252, ${0.8 - rPhase})`;
          ctx.lineWidth = Math.max(1, 1.2 * scale);
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, sR * 0.75 * rPhase, sR * 0.28 * rPhase, 0, 0, Math.PI * 2);
          ctx.stroke();

          for (let st = 0; st < 3; st++) {
            const stY = Sy - ((time * 0.02 + st * 15) % 40) * scale;
            const stX = Sx + Math.sin(time * 0.004 + st * 2) * (sR * 0.3);
            ctx.fillStyle = "rgba(224, 242, 254, 0.22)";
            ctx.beginPath();
            ctx.arc(stX, stY, Math.max(2, 4.5 * scale), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // 9. Steel Lattice Radio Tower & Skyhook Pylon
        else if (id.includes("tower") || id.includes("antenna") || id.includes("beacon") || id.includes("skyhook") || id.includes("monorail") || id.includes("elevator")) {
          const tW = Math.max(25, 55 * scale);
          const tH = Math.max(50, 140 * scale);

          ctx.fillStyle = "#334155";
          ctx.fillRect(Sx - tW * 0.5 - 3 * scale, Sy - 3 * scale, 6 * scale, 5 * scale);
          ctx.fillRect(Sx + tW * 0.5 - 3 * scale, Sy - 3 * scale, 6 * scale, 5 * scale);

          ctx.strokeStyle = `rgb(${Math.round(110 * light)}, ${Math.round(120 * light)}, ${Math.round(135 * light)})`;
          ctx.lineWidth = Math.max(1.5, 3 * scale);
          ctx.beginPath();
          ctx.moveTo(Sx - tW * 0.5, Sy);
          ctx.lineTo(Sx, Sy - tH);
          ctx.lineTo(Sx + tW * 0.5, Sy);
          ctx.stroke();

          ctx.lineWidth = Math.max(1, 1.4 * scale);
          const levels = 6;
          for (let lv = 1; lv <= levels; lv++) {
            const frac = lv / levels;
            const ly = Sy - tH * frac;
            const lw = tW * 0.5 * (1 - frac);
            ctx.beginPath();
            ctx.moveTo(Sx - lw, ly); ctx.lineTo(Sx + lw, ly);
            if (lv < levels) {
              const nextFrac = (lv + 1) / levels;
              const nly = Sy - tH * nextFrac;
              const nlw = tW * 0.5 * (1 - nextFrac);
              ctx.moveTo(Sx - lw, ly); ctx.lineTo(Sx + nlw, nly);
            }
            ctx.stroke();
          }

          ctx.fillStyle = "#94a3b8";
          ctx.beginPath();
          ctx.ellipse(Sx, Sy - tH * 0.7, 8 * scale, 12 * scale, 0.4, 0, Math.PI * 2);
          ctx.fill();

          const beaconOn = Math.sin(time * 0.008) > 0.2;
          ctx.fillStyle = beaconOn ? "#ef4444" : "#450a0a";
          ctx.shadowColor = beaconOn ? "#ef4444" : "transparent";
          ctx.shadowBlur = beaconOn ? 18 * scale : 0;
          ctx.beginPath();
          ctx.arc(Sx, Sy - tH - 4 * scale, Math.max(2, 4.5 * scale), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        // 10. Forest Trail Signpost (සිංහරාජ මාර්ග පුවරුව)
        else if (id.includes("sign") || id.includes("trail")) {
          const sH = Math.max(22, 50 * scale);
          const sW = Math.max(20, 48 * scale);

          ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, 8 * scale, 4 * scale, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgb(${Math.round(85 * light)}, ${Math.round(58 * light)}, ${Math.round(38 * light)})`;
          ctx.fillRect(Sx - 2.5 * scale, Sy - sH, 5 * scale, sH);

          ctx.fillStyle = `rgb(${Math.round(135 * light)}, ${Math.round(95 * light)}, ${Math.round(62 * light)})`;
          ctx.beginPath();
          ctx.moveTo(Sx - sW * 0.45, Sy - sH * 0.95);
          ctx.lineTo(Sx + sW * 0.35, Sy - sH * 0.95);
          ctx.lineTo(Sx + sW * 0.52, Sy - sH * 0.82);
          ctx.lineTo(Sx + sW * 0.35, Sy - sH * 0.69);
          ctx.lineTo(Sx - sW * 0.45, Sy - sH * 0.69);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#3e2723";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = `rgb(${Math.round(115 * light)}, ${Math.round(80 * light)}, ${Math.round(52 * light)})`;
          ctx.beginPath();
          ctx.moveTo(Sx + sW * 0.45, Sy - sH * 0.65);
          ctx.lineTo(Sx - sW * 0.35, Sy - sH * 0.65);
          ctx.lineTo(Sx - sW * 0.52, Sy - sH * 0.52);
          ctx.lineTo(Sx - sW * 0.35, Sy - sH * 0.39);
          ctx.lineTo(Sx + sW * 0.45, Sy - sH * 0.39);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        // 11. Ancient Rune Slates, Field Journals & Audio Tapes
        else if (id.includes("slate") || id.includes("diary") || id.includes("log") || id.includes("tape") || id.includes("doc") || id.includes("truth") || id.includes("blackbox")) {
          const itemH = Math.max(14, 28 * scale);
          const itemW = Math.max(16, 32 * scale);

          ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
          ctx.beginPath();
          ctx.ellipse(Sx, Sy + 2, itemW * 0.6, itemH * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();

          if (id.includes("slate")) {
            ctx.fillStyle = `rgb(${Math.round(55 * light)}, ${Math.round(65 * light)}, ${Math.round(75 * light)})`;
            ctx.beginPath();
            ctx.roundRect(Sx - itemW * 0.5, Sy - itemH, itemW, itemH, 3 * scale);
            ctx.fill();
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 8 * scale;
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = Math.max(1, 1.4 * scale);
            ctx.beginPath();
            ctx.moveTo(Sx - itemW * 0.25, Sy - itemH * 0.7); ctx.lineTo(Sx, Sy - itemH * 0.45); ctx.lineTo(Sx + itemW * 0.25, Sy - itemH * 0.7);
            ctx.moveTo(Sx, Sy - itemH * 0.85); ctx.lineTo(Sx, Sy - itemH * 0.25);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else if (id.includes("diary") || id.includes("log") || id.includes("doc")) {
            ctx.fillStyle = "#78350f";
            ctx.fillRect(Sx - itemW * 0.48, Sy - itemH, itemW * 0.96, itemH);
            ctx.fillStyle = "#fef3c7";
            ctx.fillRect(Sx - itemW * 0.42, Sy - itemH + 2 * scale, itemW * 0.84, itemH - 4 * scale);
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(Sx - 1 * scale, Sy - itemH, 2.5 * scale, itemH * 0.8);
          } else {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(Sx - itemW * 0.45, Sy - itemH * 0.75, itemW * 0.9, itemH * 0.75);
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(Sx - itemW * 0.2, Sy - itemH * 0.38, 2.5 * scale, 0, Math.PI * 2);
            ctx.arc(Sx + itemW * 0.2, Sy - itemH * 0.38, 2.5 * scale, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // 12. Keys, Keycards, Bio-Crystals & Sacred Feathers
        else {
          const itemR = Math.max(8, 16 * scale);

          if (id.includes("feather")) {
            const fFloat = Math.sin(time * 0.004) * (6 * scale);
            const fy = Sy - 18 * scale + fFloat;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 12 * scale;
            ctx.fillStyle = "#0284c7";
            ctx.beginPath();
            ctx.ellipse(Sx, fy, itemR * 0.4, itemR * 1.1, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#dc2626";
            ctx.beginPath();
            ctx.arc(Sx + itemR * 0.25, fy - itemR * 0.8, 3.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = Math.max(1, 1.2 * scale);
            ctx.beginPath();
            ctx.moveTo(Sx - itemR * 0.2, fy + itemR * 0.9);
            ctx.lineTo(Sx + itemR * 0.25, fy - itemR * 0.8);
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else if (id.includes("keycard")) {
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(Sx - 10 * scale, Sy - 14 * scale, 20 * scale, 13 * scale);
            ctx.fillStyle = "#0284c7";
            ctx.fillRect(Sx - 10 * scale, Sy - 14 * scale, 20 * scale, 3.5 * scale);
            ctx.fillStyle = "#eab308";
            ctx.fillRect(Sx - 6 * scale, Sy - 8 * scale, 4 * scale, 4 * scale);
          } else if (id.includes("core") || id.includes("crystal") || id.includes("sample") || id.includes("gem")) {
            const cFloat = Math.sin(time * 0.005) * (4 * scale);
            const cy = Sy - 16 * scale + cFloat;
            ctx.shadowColor = "#00f5d4";
            ctx.shadowBlur = 14 * scale;
            ctx.fillStyle = "#00f5d4";
            ctx.beginPath();
            ctx.moveTo(Sx, cy - itemR);
            ctx.lineTo(Sx + itemR * 0.5, cy);
            ctx.lineTo(Sx, cy + itemR * 0.8);
            ctx.lineTo(Sx - itemR * 0.5, cy);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = "#d4af37";
            ctx.beginPath();
            ctx.arc(Sx - 5 * scale, Sy - 10 * scale, 5 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(Sx - 2 * scale, Sy - 11.5 * scale, 15 * scale, 3 * scale);
            ctx.fillRect(Sx + 8 * scale, Sy - 9 * scale, 3 * scale, 4.5 * scale);
          }
        }

        ctx.restore();
      }

      // ── Ground Item (Salt, Herbs, Minerals, Flares) ──
      else if (ent.type === "item") {
        const it = ent.item;
        const iR = Math.max(6, 12 * scale);
        ctx.save();
        ctx.globalAlpha = fog;

        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(Sx, Sy + 2, iR * 1.2, iR * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        if (it?.type === "salt") {
          // Sea Salt Pouch with Spilled Glittering White Crystals
          ctx.fillStyle = "#e2e8f0";
          ctx.beginPath();
          ctx.arc(Sx, Sy - iR * 0.7, iR * 0.85, 0, Math.PI * 2);
          ctx.fill();
          // Salt shimmer crystals
          ctx.fillStyle = "#ffffff";
          [-0.3, 0.1, 0.4].forEach((cx, idx) => {
            ctx.fillRect(Sx + iR * cx, Sy - 2 + (idx % 2) * 2, 2 * scale, 2 * scale);
          });
        } else if (it?.type === "herb") {
          // Bushy Endemic Rainforest Herb with Serrated Leaves
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.ellipse(Sx - iR * 0.35, Sy - iR * 0.7, iR * 0.55, iR * 0.3, 0.4, 0, Math.PI * 2);
          ctx.ellipse(Sx + iR * 0.35, Sy - iR * 0.7, iR * 0.55, iR * 0.3, -0.4, 0, Math.PI * 2);
          ctx.ellipse(Sx, Sy - iR * 1.1, iR * 0.3, iR * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          // Small wild yellow flower
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.arc(Sx, Sy - iR * 0.9, 2.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Tech / Equipment Capsule
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.roundRect(Sx - iR * 0.5, Sy - iR * 1.2, iR, iR * 1.2, 3 * scale);
          ctx.fill();
        }
        ctx.restore();
      }

      // ── Shadow Stalker Leopard (3D Tactical Predator in the Mist) ──
      else if (ent.type === "stalker") {
        const stalker = ent.stalker;
        const catH = Math.max(18, 42 * scale);
        const catW = Math.max(26, 62 * scale);
        ctx.save();
        ctx.globalAlpha = fog;

        // Ground Contact Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.beginPath();
        ctx.ellipse(Sx, Sy + 2, catW * 0.75, catH * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sleek Melanistic Black Leopard Body (low prowling muscular silhouette)
        ctx.fillStyle = `rgb(${Math.round(20 * light)}, ${Math.round(18 * light)}, ${Math.round(16 * light)})`;
        ctx.beginPath();
        ctx.ellipse(Sx, Sy - catH * 0.45, catW * 0.45, catH * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Muscular Shoulders & Stalking Paws
        ctx.fillRect(Sx - catW * 0.35, Sy - catH * 0.35, 6 * scale, catH * 0.4);
        ctx.fillRect(Sx + catW * 0.22, Sy - catH * 0.35, 6 * scale, catH * 0.4);

        // Curving Sinuous Tail with Animated Twitching Tip
        const tailTwitch = Math.sin(time * 0.005) * (8 * scale);
        ctx.strokeStyle = `rgb(${Math.round(20 * light)}, ${Math.round(18 * light)}, ${Math.round(16 * light)})`;
        ctx.lineWidth = Math.max(2, 3.5 * scale);
        ctx.beginPath();
        ctx.moveTo(Sx - catW * 0.42, Sy - catH * 0.48);
        ctx.quadraticCurveTo(Sx - catW * 0.75, Sy - catH * 0.75, Sx - catW * 0.78 + tailTwitch, Sy - catH * 0.95);
        ctx.stroke();

        // Low Predatory Feline Head & Ears
        const catHeadX = Sx + catW * 0.38;
        const catHeadY = Sy - catH * 0.55;
        ctx.beginPath();
        ctx.ellipse(catHeadX, catHeadY, catH * 0.32, catH * 0.26, 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Pointed ears
        ctx.beginPath();
        ctx.moveTo(catHeadX - 4 * scale, catHeadY - catH * 0.22);
        ctx.lineTo(catHeadX - 7 * scale, catHeadY - catH * 0.45);
        ctx.lineTo(catHeadX - 1 * scale, catHeadY - catH * 0.3);
        ctx.moveTo(catHeadX + 2 * scale, catHeadY - catH * 0.25);
        ctx.lineTo(catHeadX + 6 * scale, catHeadY - catH * 0.45);
        ctx.lineTo(catHeadX + 6 * scale, catHeadY - catH * 0.2);
        ctx.fill();

        // Eerie Glowing Amber Eyes (Tapetum Lucidum Flares when Flashlight Hits)
        const eyeGlow = p.inTorch ? 1.0 : (stalker.eyesAlpha || 0.4);
        ctx.fillStyle = `rgba(251, 191, 36, ${eyeGlow})`;
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = (p.inTorch ? 18 : 8) * scale;
        ctx.beginPath();
        ctx.arc(catHeadX - 2 * scale, catHeadY - 2 * scale, Math.max(1.5, 2.8 * scale), 0, Math.PI * 2);
        ctx.arc(catHeadX + 5 * scale, catHeadY - 2 * scale, Math.max(1.5, 2.8 * scale), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // ── Rainforest Leech (Haemadipsa zeylanica) ──
      else if (ent.type === "leech") {
        const l = ent.leech;
        const lR = Math.max(3, 8 * scale);
        ctx.save();
        ctx.globalAlpha = fog;

        // Ground shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(Sx, Sy + 1, lR * 1.5, lR * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Segmented dark crimson body in looping inchworm motion
        const inchLoop = Math.abs(Math.sin(time * 0.008 + (l?.id || 0))) * (4 * scale);
        ctx.fillStyle = "#5c0606";
        ctx.beginPath();
        ctx.ellipse(Sx, Sy - lR * 0.5 - inchLoop, lR * 1.4, lR * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // Anterior searching sucker head
        ctx.fillStyle = "#831843";
        ctx.beginPath();
        ctx.arc(Sx + lR * 1.2, Sy - lR * 0.7 - inchLoop * 1.5, Math.max(1.5, 2.5 * scale), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
      // ── Green Pit Viper (Trimeresurus trigonocephalus) ──
      else if (ent.type === "viper") {
        const vR = Math.max(5, 12 * scale);
        ctx.save();
        ctx.globalAlpha = fog;

        // Ground shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(Sx, Sy + 2, vR * 1.4, vR * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Coiled Emerald-Green Scaled Body
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.ellipse(Sx, Sy - vR * 0.5, vR * 1.2, vR * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Black Chevron Dorsal Markings
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = Math.max(1, 1.2 * scale);
        ctx.beginPath();
        ctx.moveTo(Sx - vR * 0.5, Sy - vR * 0.7); ctx.lineTo(Sx, Sy - vR * 0.5); ctx.lineTo(Sx + vR * 0.5, Sy - vR * 0.7);
        ctx.stroke();

        // Distinctive Triangular Viper Head & Black Tongue
        const headX = Sx + vR * 0.85;
        const headY = Sy - vR * 0.8;
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.moveTo(headX + 5 * scale, headY);
        ctx.lineTo(headX - 4 * scale, headY - 4 * scale);
        ctx.lineTo(headX - 4 * scale, headY + 4 * scale);
        ctx.closePath();
        ctx.fill();

        // Flickering forked tongue
        if (Math.sin(time * 0.01) > 0.4) {
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(headX + 5 * scale, headY);
          ctx.lineTo(headX + 9 * scale, headY);
          ctx.stroke();
        }

        ctx.restore();
      }
    });

    // 6. Volumetric Night Darkness & Rainforest Vignette
    ctx.save();
    const vigGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.28, w * 0.5, h * 0.5, w * 0.72);
    vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    vigGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.45)");
    vigGrad.addColorStop(1, "rgba(0, 0, 0, 0.88)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 7. First-Person Viewmodel: I.G.I. Tactical Hands & Military Maglite
    ctx.save();
    const handBobX = bobX * 0.85;
    const handBobY = bobY * 0.85;
    const torchBaseX = w * 0.72 + handBobX;
    const torchBaseY = h * 0.82 + handBobY;

    // Volumetric Flashlight Beam Emanating from Torch Head
    if (this.torchOn) {
      const beamGrad = ctx.createRadialGradient(
        w * 0.5, h * 0.5, 10,
        torchBaseX - 35, torchBaseY - 45, w * 0.65
      );
      if (this.uvMode) {
        beamGrad.addColorStop(0, "rgba(168, 85, 247, 0.35)");
        beamGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.12)");
        beamGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        beamGrad.addColorStop(0, "rgba(255, 248, 220, 0.40)");
        beamGrad.addColorStop(0.4, "rgba(220, 205, 160, 0.15)");
        beamGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(torchBaseX - 30, torchBaseY - 40);
      ctx.lineTo(w * 0.05, h * 0.15);
      ctx.lineTo(w * 0.95, h * 0.15);
      ctx.closePath();
      ctx.fill();

      // Atmospheric Dust Motes Scattering in the Light Beam
      for (let dm = 0; dm < 6; dm++) {
        const dmX = w * 0.3 + ((time * 0.02 + dm * 95) % (w * 0.4));
        const dmY = h * 0.25 + Math.sin(time * 0.002 + dm * 3) * 60;
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(dmX, dmY, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Heavy-Duty Tactical Flashlight Body (Anodized Aircraft Aluminum Maglite)
    const torchAngle = -0.42;
    ctx.translate(torchBaseX, torchBaseY);
    ctx.rotate(torchAngle);

    // Tactical Gloved Arm & Wrist Cuff with Digital Chronometer
    ctx.fillStyle = "#161f18";
    ctx.fillRect(-28, 28, 56, 75);
    // Digital Tactical Wrist Unit
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-18, 48, 36, 18);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.strokeRect(-18, 48, 36, 18);
    // Green digital readout
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("IGI-OPS", 0, 61);

    // Tactical Assault Glove Gripping Torch
    ctx.fillStyle = "#1e2920";
    ctx.beginPath();
    ctx.roundRect(-26, -22, 52, 68, 8);
    ctx.fill();

    // Carbon Fiber Knuckle Armor Plate
    ctx.fillStyle = "#0a0e0b";
    ctx.beginPath();
    ctx.roundRect(-23, -18, 46, 16, 4);
    ctx.fill();
    // Knuckle divider grooves
    ctx.strokeStyle = "#1e2920";
    ctx.lineWidth = 1.5;
    [-10, 0, 10].forEach((kg) => {
      ctx.beginPath();
      ctx.moveTo(kg, -18); ctx.lineTo(kg, -2);
      ctx.stroke();
    });

    // Anodized Aluminum Torch Barrel
    const barrelGrad = ctx.createLinearGradient(-15, 0, 15, 0);
    barrelGrad.addColorStop(0, "#334155");
    barrelGrad.addColorStop(0.35, "#94a3b8");
    barrelGrad.addColorStop(0.7, "#475569");
    barrelGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(-15, -95, 30, 95);

    // Diamond Cross-Hatch Knurled Grip Texture
    ctx.strokeStyle = "rgba(15, 23, 42, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let kn = -80; kn <= -25; kn += 6) {
      ctx.moveTo(-14, kn); ctx.lineTo(14, kn + 8);
      ctx.moveTo(14, kn); ctx.lineTo(-14, kn + 8);
    }
    ctx.stroke();

    // Machined Aluminum Strike Bezel Head
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(-19, -95);
    ctx.lineTo(-21, -118);
    ctx.lineTo(21, -118);
    ctx.lineTo(19, -95);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Recessed Rubber Push-Button Switch
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(0, -50, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Lens & Reflector
    if (this.torchOn) {
      ctx.fillStyle = this.uvMode ? "#a855f7" : "#fef08a";
      ctx.shadowColor = this.uvMode ? "#a855f7" : "#fde047";
      ctx.shadowBlur = 22;
      ctx.fillRect(-19, -121, 38, 5);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = "#334155";
      ctx.fillRect(-19, -121, 38, 5);
    }

    ctx.restore();

    // 8. Project I.G.I. Tactical HUD Overlay

    // A. Top Center Military Compass Tape
    ctx.save();
    const compW = 260;
    const compH = 26;
    const compX = (w - compW) * 0.5;
    const compY = 16;

    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.strokeStyle = "rgba(74, 222, 128, 0.4)";
    ctx.lineWidth = 1.2;
    ctx.fillRect(compX, compY, compW, compH);
    ctx.strokeRect(compX, compY, compW, compH);

    // Compass Tape Marks
    const degYaw = Math.round(((yaw * (180 / Math.PI)) % 360 + 360) % 360);
    const cardinals = [
      { deg: 0, label: "E" },
      { deg: 45, label: "SE" },
      { deg: 90, label: "S" },
      { deg: 135, label: "SW" },
      { deg: 180, label: "W" },
      { deg: 225, label: "NW" },
      { deg: 270, label: "N" },
      { deg: 315, label: "NE" },
    ];
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    cardinals.forEach((c) => {
      let diff = c.deg - degYaw;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;
      if (Math.abs(diff) < 55) {
        const markX = compX + compW * 0.5 + (diff / 55) * (compW * 0.45);
        ctx.fillText(c.label, markX, compY + compH * 0.5);
      }
    });

    // Center Compass Reticle Arrow
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(compX + compW * 0.5, compY + compH - 2);
    ctx.lineTo(compX + compW * 0.5 - 5, compY + compH + 5);
    ctx.lineTo(compX + compW * 0.5 + 5, compY + compH + 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // B. Center Crosshair (Reticle) & Interactive Action Banner
    ctx.save();
    const cx = w * 0.5;
    const cy = h * 0.5;
    const hasTarget = !!crosshairTarget;

    ctx.strokeStyle = hasTarget ? "#f59e0b" : "rgba(74, 222, 128, 0.75)";
    ctx.lineWidth = 1.5;

    // Reticle Brackets
    const rSize = hasTarget ? 14 : 9;
    ctx.beginPath();
    // Dot
    ctx.arc(cx, cy, hasTarget ? 2.5 : 1.5, 0, Math.PI * 2);
    // 4 brackets
    ctx.moveTo(cx - rSize - 4, cy); ctx.lineTo(cx - 4, cy);
    ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + rSize + 4, cy);
    ctx.moveTo(cx, cy - rSize - 4); ctx.lineTo(cx, cy - 4);
    ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + rSize + 4);
    ctx.stroke();

    // Contextual Action Prompt
    if (hasTarget) {
      const promptText = crosshairTarget.prompt || "[E] පරීක්ෂා කරන්න";
      const titleText = crosshairTarget.title || "අන්තර්ක්‍රියාකාරී වස්තුව";

      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.2;
      const bW = 240;
      const bH = 38;
      ctx.fillRect(cx - bW * 0.5, cy + 24, bW, bH);
      ctx.strokeRect(cx - bW * 0.5, cy + 24, bW, bH);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(promptText, cx, cy + 39);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px sans-serif";
      ctx.fillText(titleText, cx, cy + 54);
    }
    ctx.restore();

    // C. Bottom-Left: Project I.G.I. Tactical GPS Radar PDA
    ctx.save();
    const radarR = 56;
    const radarX = 22 + radarR;
    const radarY = h - 22 - radarR;

    // Outer PDA Bezel
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarR + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Radar Screen Grid
    ctx.fillStyle = "rgba(6, 78, 59, 0.45)";
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(74, 222, 128, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarR * 0.5, 0, Math.PI * 2);
    ctx.arc(radarX, radarY, radarR, 0, Math.PI * 2);
    ctx.moveTo(radarX - radarR, radarY); ctx.lineTo(radarX + radarR, radarY);
    ctx.moveTo(radarX, radarY - radarR); ctx.lineTo(radarX + radarR, radarY);
    ctx.stroke();

    // Radar Rotating Sweep Beam
    const sweepAngle = (time * 0.003) % (Math.PI * 2);
    ctx.strokeStyle = "rgba(74, 222, 128, 0.8)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(radarX, radarY);
    ctx.lineTo(radarX + Math.cos(sweepAngle) * radarR, radarY + Math.sin(sweepAngle) * radarR);
    ctx.stroke();

    // Player Direction Arrow
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(radarX + Math.cos(yaw) * 8, radarY + Math.sin(yaw) * 8);
    ctx.lineTo(radarX + Math.cos(yaw + 2.5) * 6, radarY + Math.sin(yaw + 2.5) * 6);
    ctx.lineTo(radarX, radarY);
    ctx.lineTo(radarX + Math.cos(yaw - 2.5) * 6, radarY + Math.sin(yaw - 2.5) * 6);
    ctx.closePath();
    ctx.fill();

    // Radar Blips for Campfires & Objectives
    (this.campfires || []).forEach((cf) => {
      const rx = (cf.x - camX) * 0.08;
      const ry = (cf.y - camY) * 0.08;
      if (Math.hypot(rx, ry) < radarR - 4) {
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(radarX + rx, radarY + ry, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Stealth Noise Level Waves (I.G.I. Acoustic Detection Sensor)
    const noiseNorm = Math.min(1.0, (this.noiseLevel || 15) / 100);
    ctx.strokeStyle = noiseNorm > 0.65 ? "#ef4444" : (noiseNorm > 0.35 ? "#f59e0b" : "#4ade80");
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarR + 6 + noiseNorm * 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("I.G.I. GPS // RADAR", radarX, radarY + radarR + 15);
    ctx.restore();

    // D. Rain Droplets on Visor / Camera Lens during storms
    if (this.stormActive && this.fpsRainVisor) {
      ctx.save();
      ctx.strokeStyle = "rgba(186, 230, 253, 0.35)";
      ctx.lineWidth = 1.2;
      this.fpsRainVisor.forEach((drop) => {
        drop.y += drop.speed * 0.015;
        if (drop.y > 1.0) {
          drop.y = 0;
          drop.x = Math.random();
        }
        const dx = drop.x * w;
        const dy = drop.y * h;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx + 2, dy + drop.len);
        ctx.stroke();
      });
      ctx.restore();
    }

    // E. Top-Right Clickable Camera Mode Pill Button
    ctx.save();
    const pillW = 195;
    const pillH = 34;
    const pillX = w - pillW - 20;
    const pillY = 16;

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎯 [V] 1ST PERSON (I.G.I.)", pillX + pillW * 0.5, pillY + pillH * 0.5);
    ctx.restore();
  }

  // ── 9. Main Render Dispatcher ─────────────────────────────────────────────
  render() {
    if (this.viewMode === "fps") {
      this.renderFirstPersonIGI(this.ctx);
    } else {
      this.renderIsometric();
    }
  }

  // ── 10. 2.5D Isometric Render Loop (Tactical Expedition Mode) ──────────────
  renderIsometric() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Smooth Binoculars Zoom
    this.zoom += (this.targetZoom - this.zoom) * 0.1;

    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.camera.x + this.screenShake.x, -this.camera.y + this.screenShake.y);

    // 1. Rainforest / Highland Canyon / Subterranean / Facility / Canopy Ground
    if (this.chapter === 2) {
      ctx.fillStyle = "#425640"; // Highland canyon
    } else if (this.chapter === 3) {
      ctx.fillStyle = "#15121e"; // Deep basalt cave
    } else if (this.chapter === 4) {
      ctx.fillStyle = "#1c2227"; // Industrial bunker steel floor
    } else if (this.chapter === 5) {
      ctx.fillStyle = "#2d1c14"; // Giant canopy branches & golden twilight
    } else {
      ctx.fillStyle = "#0d1b0d"; // Tropical rainforest
    }
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Subtle forest soil / mountain bedrock / steel plate variations
    if (this.chapter === 2) ctx.fillStyle = "#4e654c";
    else if (this.chapter === 3) ctx.fillStyle = "#1c1728";
    else if (this.chapter === 4) ctx.fillStyle = "#242c33";
    else if (this.chapter === 5) ctx.fillStyle = "#382419";
    else ctx.fillStyle = "#122512";
    for (let gx = 0; gx < this.worldWidth; gx += 400) {
      for (let gy = 0; gy < this.worldHeight; gy += 400) {
        if ((gx + gy) % 800 === 0) {
          ctx.fillRect(gx, gy, 400, 400);
        }
      }
    }

    // AAA Terrain Seeds: Moss carpets & Rocks & Roots
    this.terrainSeeds.forEach((seed) => {
      if (seed.type === "moss") {
        ctx.fillStyle = this.chapter === 2 ? "rgba(90, 150, 85, 0.45)" : seed.color;
        ctx.beginPath();
        ctx.ellipse(seed.x, seed.y, seed.rx, seed.ry, 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (seed.type === "rock") {
        ctx.fillStyle = this.chapter === 2 ? "#78877a" : seed.color;
        ctx.beginPath();
        ctx.arc(seed.x, seed.y, seed.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (seed.type === "root") {
        ctx.strokeStyle = seed.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        seed.pts.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      }
    });

    // Footpaths (Distinct for each of the 5 Chapters)
    if (this.chapter === 2) {
      ctx.strokeStyle = "rgba(95, 110, 100, 0.9)";
    } else if (this.chapter === 3) {
      ctx.strokeStyle = "rgba(75, 45, 110, 0.75)"; // Bioluminescent cave path
    } else if (this.chapter === 4) {
      ctx.strokeStyle = "rgba(45, 55, 65, 0.9)"; // Industrial steel grating walkway
    } else if (this.chapter === 5) {
      ctx.strokeStyle = "rgba(110, 70, 40, 0.85)"; // Wood suspension bridge plank path
    } else {
      ctx.strokeStyle = "rgba(22, 15, 10, 0.75)"; // Mud jungle path
    }
    ctx.lineWidth = 92;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (this.chapter === 2) {
      ctx.moveTo(300, 450);
      ctx.lineTo(820, 950);
      ctx.moveTo(820, 1320);
      ctx.lineTo(1400, 1600);
      ctx.lineTo(1800, 1750);
      ctx.lineTo(2400, 1500);
      ctx.lineTo(2850, 1900);
    } else if (this.chapter === 3) {
      ctx.moveTo(350, 460);
      ctx.lineTo(650, 550);
      ctx.lineTo(920, 620);
      ctx.lineTo(1010, 850);
      ctx.lineTo(1450, 650);
      ctx.lineTo(1650, 1450);
      ctx.lineTo(2350, 1550);
      ctx.lineTo(2800, 1850);
    } else if (this.chapter === 4) {
      ctx.moveTo(350, 460);
      ctx.lineTo(650, 420);
      ctx.lineTo(850, 650);
      ctx.lineTo(1050, 720);
      ctx.lineTo(1350, 620);
      ctx.lineTo(2350, 1350);
      ctx.lineTo(2850, 1850);
    } else if (this.chapter === 5) {
      ctx.moveTo(350, 460);
      ctx.lineTo(750, 550);
      ctx.lineTo(1200, 850);
      ctx.lineTo(1750, 1150);
      ctx.lineTo(2350, 1400);
      ctx.lineTo(2850, 1850);
    } else {
      ctx.moveTo(250, 350);
      ctx.lineTo(520, 750);
      ctx.lineTo(860, 720);
      ctx.lineTo(1350, 500);
      ctx.lineTo(1730, 1120);
      ctx.lineTo(2700, 1800);
    }
    ctx.stroke();

    // Inner path core
    if (this.chapter === 2) {
      ctx.strokeStyle = "#7a8a7f";
    } else if (this.chapter === 3) {
      ctx.strokeStyle = "#8a5db5";
    } else if (this.chapter === 4) {
      ctx.strokeStyle = "#607482";
    } else if (this.chapter === 5) {
      ctx.strokeStyle = "#a06f47";
    } else {
      ctx.strokeStyle = "#2e1e14";
    }
    ctx.lineWidth = 60;
    ctx.beginPath();
    if (this.chapter === 2) {
      ctx.moveTo(300, 450);
      ctx.lineTo(820, 950);
      ctx.moveTo(820, 1320);
      ctx.lineTo(1400, 1600);
      ctx.lineTo(1800, 1750);
      ctx.lineTo(2400, 1500);
      ctx.lineTo(2850, 1900);
    } else if (this.chapter === 3) {
      ctx.moveTo(350, 460);
      ctx.lineTo(650, 550);
      ctx.lineTo(920, 620);
      ctx.lineTo(1010, 850);
      ctx.lineTo(1450, 650);
      ctx.lineTo(1650, 1450);
      ctx.lineTo(2350, 1550);
      ctx.lineTo(2800, 1850);
    } else if (this.chapter === 4) {
      ctx.moveTo(350, 460);
      ctx.lineTo(650, 420);
      ctx.lineTo(850, 650);
      ctx.lineTo(1050, 720);
      ctx.lineTo(1350, 620);
      ctx.lineTo(2350, 1350);
      ctx.lineTo(2850, 1850);
    } else if (this.chapter === 5) {
      ctx.moveTo(350, 460);
      ctx.lineTo(750, 550);
      ctx.lineTo(1200, 850);
      ctx.lineTo(1750, 1150);
      ctx.lineTo(2350, 1400);
      ctx.lineTo(2850, 1850);
    } else {
      ctx.moveTo(250, 350);
      ctx.lineTo(520, 750);
      ctx.lineTo(860, 720);
      ctx.lineTo(1350, 500);
      ctx.lineTo(1730, 1120);
      ctx.lineTo(2700, 1800);
    }
    ctx.stroke();

    const vLeft = this.camera.x - 120;
    const vRight = this.camera.x + (this.canvas.width / this.zoom) + 120;
    const vTop = this.camera.y - 120;
    const vBottom = this.camera.y + (this.canvas.height / this.zoom) + 120;

    // Grass tufts swaying with wind
    const windOffset = Math.sin(performance.now() * 0.003) * (this.windStrength * 5);
    this.terrainSeeds.forEach((seed) => {
      if (seed.x < vLeft || seed.x > vRight || seed.y < vTop || seed.y > vBottom) return;
      if (seed.type === "grass") {
        ctx.strokeStyle = seed.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(seed.x, seed.y);
        ctx.quadraticCurveTo(seed.x + windOffset, seed.y - seed.size * 0.6, seed.x + windOffset * 1.4, seed.y - seed.size);
        ctx.moveTo(seed.x, seed.y);
        ctx.quadraticCurveTo(seed.x - 3 + windOffset, seed.y - seed.size * 0.5, seed.x - 4 + windOffset * 1.2, seed.y - seed.size * 0.85);
        ctx.stroke();
      }
    });

    // ── 2. Directional 3D Cast Shadows on Ground Plane ──
    this.renderDirectionalCastShadows(ctx);

    // Purple-faced Langurs perched on canopy
    this.langurs.forEach((langur) => {
      const shakeOffset = Math.sin(performance.now() * 0.03) * (langur.shake * 8);
      ctx.save();
      ctx.translate(langur.x + shakeOffset, langur.y);
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6d4c41";
      ctx.beginPath();
      ctx.arc(0, -12, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#eeeeee";
      ctx.beginPath();
      ctx.arc(-6, -9, 3.5, 0, Math.PI * 2);
      ctx.arc(6, -9, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.quadraticCurveTo(15, 28, 25, 18);
      ctx.stroke();
      ctx.restore();
    });

    // Click-to-Move Ripple Indicator
    if (this.moveTarget) {
      const pulse = (performance.now() % 1000) / 1000;
      ctx.save();
      ctx.strokeStyle = `rgba(104, 211, 112, ${1 - pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.moveTarget.x, this.moveTarget.y, 8 + pulse * 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#68d370";
      ctx.beginPath();
      ctx.arc(this.moveTarget.x, this.moveTarget.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Dynamic Concentric Water Ripples
    if (this.waterRipples && this.waterRipples.length > 0) {
      ctx.save();
      this.waterRipples.forEach((rip) => {
        ctx.strokeStyle = `rgba(180, 225, 255, ${Math.max(0, rip.alpha)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, rip.r, rip.r * 0.52, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (rip.r > 8) {
          ctx.strokeStyle = `rgba(140, 200, 240, ${Math.max(0, rip.alpha * 0.5)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.ellipse(rip.x, rip.y, rip.r * 0.6, rip.r * 0.32, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    // Dynamic Explorer Boot Footsteps Trail
    if (this.footsteps && this.footsteps.length > 0) {
      this.footsteps.forEach((f) => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate((f.angle || 0) + Math.PI / 2);
        ctx.fillStyle = f.isMud ? `rgba(22, 14, 8, ${f.alpha})` : `rgba(32, 22, 16, ${f.alpha})`;
        // Boot heel
        ctx.beginPath();
        ctx.ellipse(0, 3, 2.4, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Boot sole
        ctx.beginPath();
        ctx.ellipse(0, -2, 3.2, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // ── Chapter 1 Facilities ──
    if (this.chapter === 1) {
      // Kudawa Outpost Wooden Deck Platform
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(170, 280, 160, 180);
      ctx.strokeStyle = "#271612";
      ctx.lineWidth = 2;
      for (let py = 295; py < 460; py += 16) {
        ctx.beginPath();
        ctx.moveTo(170, py);
        ctx.lineTo(330, py);
        ctx.stroke();
      }
      ctx.strokeRect(170, 280, 160, 180);

      // Kudawa Welcome Archway
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(175, 260, 12, 35);
      ctx.fillRect(315, 260, 12, 35);
      ctx.fillRect(170, 250, 162, 14);
      ctx.fillStyle = "#ffe082";
      ctx.font = "bold 11px 'Noto Sans Sinhala', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🌿 කුඩව වන පිවිසුම (KUDAWA TRAILHEAD)", 251, 243);

      // Kudawa Camp Tent at (180, 280)
      ctx.save();
      ctx.translate(180, 280);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.ellipse(0, 14, 38, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tent Body
      ctx.fillStyle = "#37474f";
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(-34, 14);
      ctx.lineTo(34, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#263238";
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(0, 14);
      ctx.lineTo(-34, 14);
      ctx.closePath();
      ctx.fill();
      // Flap
      ctx.fillStyle = "#0f171b";
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(-12, 14);
      ctx.lineTo(12, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e0e0e0";
      ctx.font = "bold 10px 'Noto Sans Sinhala', sans-serif";
      ctx.fillText("⛺ කූඩාරම (Rest)", 0, -38);
      ctx.restore();

      // Fallen Giant Tree Log Bridges (Chapter 1 Shortcuts)
      this.logBridges.forEach((bridge) => {
        ctx.save();
        const minX = Math.min(bridge.x1, bridge.x2);
        const logLen = Math.abs(bridge.x2 - bridge.x1);
        const topY = bridge.y1 - bridge.width / 2;

        // Shadow under log
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(minX, topY + 8, logLen, bridge.width + 10);

        // Giant tree trunk bark
        ctx.fillStyle = "#3e2723";
        ctx.fillRect(minX, topY, logLen, bridge.width);

        // Inner wood top surface
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(minX + 8, topY + 4, logLen - 16, bridge.width - 8);

        // Green velvet moss patches
        ctx.fillStyle = "rgba(46, 125, 50, 0.85)";
        for (let mx = minX + 22; mx < minX + logLen - 20; mx += 36) {
          ctx.beginPath();
          ctx.ellipse(mx, topY + 8, 14, 5, 0.1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Tree ring ends
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath();
        ctx.ellipse(minX, bridge.y1, 6, bridge.width / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(minX + logLen, bridge.y1, 6, bridge.width / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#271612";
        ctx.lineWidth = 2;
        ctx.strokeRect(minX, topY, logLen, bridge.width);

        // Name tag
        ctx.fillStyle = "#a5d6a7";
        ctx.font = "bold 11px 'Noto Sans Sinhala', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎋 හොර ගස් පාලම (Safe Bridge)", minX + logLen / 2, topY - 8);
        ctx.restore();
      });

      // Tree Blaze directional markings
      this.treeBlazes.forEach((blaze) => {
        ctx.save();
        const pulse = Math.sin(performance.now() * 0.005 + blaze.x) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(104, 211, 112, ${pulse})`;
        ctx.shadowColor = "#68d370";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(blaze.x, blaze.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 11px 'Noto Sans Sinhala', sans-serif";
        ctx.fillStyle = "#e8f5e9";
        ctx.fillText(blaze.text, blaze.x + 10, blaze.y + 4);
        ctx.restore();
      });

      // Illuminated Trail Cairn Stone Markers
      this.trailCairns.forEach((cairn) => {
        ctx.save();
        ctx.translate(cairn.x, cairn.y);

        // Stone pile
        ctx.fillStyle = "#455a64";
        ctx.beginPath();
        ctx.arc(0, 4, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#546e7a";
        ctx.beginPath();
        ctx.arc(-2, -2, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#78909c";
        ctx.beginPath();
        ctx.arc(1, -7, 6, 0, Math.PI * 2);
        ctx.fill();

        // Lichen / moss patch
        ctx.fillStyle = "#689f38";
        ctx.beginPath();
        ctx.arc(3, -1, 4, 0, Math.PI * 2);
        ctx.fill();

        // Directional Label
        ctx.font = "bold 10px 'Noto Sans Sinhala', sans-serif";
        ctx.fillStyle = "#cfd8dc";
        ctx.textAlign = "center";
        ctx.fillText(cairn.name, 0, 22);

        // UV Glowing Rune Overlay on stone
        if (this.torchOn && this.uvMode) {
          const uvPulse = Math.sin(performance.now() * 0.007 + cairn.x) * 0.25 + 0.75;
          ctx.fillStyle = `rgba(0, 240, 255, ${uvPulse})`;
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 12;
          ctx.font = "bold 11px 'Share Tech Mono', monospace";
          ctx.fillText(`⚡ ${cairn.uvArrow}`, 0, -16);
        }

        ctx.restore();
      });

      // Outpost Interior Cozy Warmth Glow (when player is inside)
      if (this.player.inShelter) {
        ctx.save();
        const cabinGrad = ctx.createRadialGradient(550, 730, 20, 550, 730, 150);
        cabinGrad.addColorStop(0, "rgba(255, 183, 77, 0.45)");
        cabinGrad.addColorStop(1, "rgba(255, 183, 77, 0)");
        ctx.fillStyle = cabinGrad;
        ctx.fillRect(435, 650, 210, 180);
        ctx.restore();
      }

      // Cave Stalactite Water Dripping Ripple on Cave Floor
      if (this.player.inCave) {
        ctx.save();
        const ripple = (performance.now() % 2200) / 2200;
        ctx.strokeStyle = `rgba(100, 220, 255, ${1 - ripple})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(1730, 1260, 15 + ripple * 25, 8 + ripple * 12, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Bioluminescent wall fungi patches
        const fungiPulse = Math.sin(performance.now() * 0.005) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(0, 229, 255, ${fungiPulse * 0.7})`;
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(1630, 1150, 6, 0, Math.PI * 2);
        ctx.arc(1645, 1165, 4, 0, Math.PI * 2);
        ctx.arc(1830, 1190, 7, 0, Math.PI * 2);
        ctx.arc(1840, 1210, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Outpost Solar Charger on Cabin Roof (615, 810)
      ctx.save();
      ctx.fillStyle = "#1a237e";
      ctx.fillRect(600, 800, 32, 22);
      ctx.strokeStyle = "#90caf9";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(600, 800, 32, 22);
      ctx.beginPath();
      ctx.moveTo(616, 800); ctx.lineTo(616, 822);
      ctx.moveTo(600, 811); ctx.lineTo(632, 811);
      ctx.stroke();
      const ledGlow = Math.sin(performance.now() * 0.006) > 0;
      ctx.fillStyle = ledGlow ? "#00e676" : "#00b0ff";
      ctx.beginPath();
      ctx.arc(626, 805, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Outpost Broken Radio on Desk (495, 670)
      ctx.fillStyle = "#37474f";
      ctx.fillRect(490, 665, 14, 18);
      ctx.strokeStyle = "#cfd8dc";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(497, 665); ctx.lineTo(497, 650);
      ctx.stroke();

      // Outpost Herbal Balm Bottle (465, 690)
      ctx.fillStyle = "#2e7d32";
      ctx.beginPath();
      ctx.arc(465, 690, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe082";
      ctx.fillRect(463, 682, 4, 3);

      // Kudawa Post Lantern
      ctx.fillStyle = "#795548";
      ctx.fillRect(256, 335, 6, 25);
      ctx.fillStyle = "#ffb300";
      ctx.beginPath();
      ctx.arc(259, 332, 7, 0, Math.PI * 2);
      ctx.fill();

      // Fresh Water Spring Well Basin at (210, 440)
      ctx.fillStyle = "#37474f";
      ctx.beginPath();
      ctx.arc(210, 440, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#263238";
      ctx.lineWidth = 4;
      ctx.stroke();
      const wellRipple = Math.sin(performance.now() * 0.005) * 2;
      ctx.fillStyle = "#00bcd4";
      ctx.beginPath();
      ctx.arc(210, 440, 15 + wellRipple, 0, Math.PI * 2);
      ctx.fill();

      // River Crossing Ferry Wooden Dock & Moored Canoe
      ctx.fillStyle = "#4e342e";
      ctx.fillRect(840, 670, 36, 60);
      ctx.strokeStyle = "#2e1c14";
      ctx.lineWidth = 2;
      ctx.strokeRect(840, 670, 36, 60);

      const canoeBob = Math.sin(performance.now() * 0.003) * 3;
      ctx.save();
      ctx.translate(885, 695 + canoeBob);
      ctx.rotate(0.15);
      ctx.fillStyle = "#6d4c41";
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3e2723";
      ctx.stroke();
      ctx.restore();

      // Stepping stones with glowing green guide dots
      this.steppingStones.forEach((s) => {
        ctx.fillStyle = "#4a4a42";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2c2c25";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "rgba(104, 211, 112, 0.85)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ancient Runic Cave Stone Arch Structure & Glowing Fungi
      ctx.fillStyle = "#263238";
      ctx.beginPath();
      ctx.arc(1730, 1120, 52, Math.PI, 0);
      ctx.lineTo(1782, 1150);
      ctx.lineTo(1678, 1150);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      [
        { x: 1670, y: 1145 },
        { x: 1690, y: 1155 },
        { x: 1770, y: 1152 },
        { x: 1790, y: 1140 },
      ].forEach((mush, idx) => {
        const shroomGlow = Math.sin(performance.now() * 0.004 + idx) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 229, 255, ${shroomGlow})`;
        ctx.beginPath();
        ctx.arc(mush.x, mush.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // ── Chapter 2 Facilities ──
    if (this.chapter === 2) {
      // 1. Bamboo Raft
      if (this.raft) {
        ctx.fillStyle = "#795548";
        ctx.fillRect(this.raft.x - 42, this.raft.y - 25, 84, 50);
        ctx.strokeStyle = "#4e342e";
        ctx.lineWidth = 3;
        for (let ly = this.raft.y - 20; ly <= this.raft.y + 20; ly += 10) {
          ctx.beginPath();
          ctx.moveTo(this.raft.x - 42, ly);
          ctx.lineTo(this.raft.x + 42, ly);
          ctx.stroke();
        }
        ctx.strokeRect(this.raft.x - 42, this.raft.y - 25, 84, 50);
        ctx.fillStyle = "#ffe082";
        ctx.font = "bold 13px 'Noto Sans Sinhala', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎋 උණ බම්බු පහුර", this.raft.x, this.raft.y - 32);
      }

      // 2. High-Tension Suspended Cableway (Cable Trolley over Gorge)
      ctx.strokeStyle = "#455a64"; // Steel cable
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(1800, 890);
      ctx.lineTo(1800, 1370);
      ctx.stroke();

      // Support towers on north and south cliff edges
      [890, 1370].forEach((towerY) => {
        ctx.fillStyle = "#263238";
        ctx.fillRect(1786, towerY - 15, 28, 30);
        ctx.fillStyle = "#78909c";
        ctx.beginPath();
        ctx.arc(1800, towerY, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Suspended Wooden Trolley Cart
      if (this.cableway) {
        const cw = this.cableway;
        ctx.save();
        ctx.translate(cw.x, cw.y);

        // Pulley wheels on wire
        ctx.fillStyle = cw.repaired ? "#4caf50" : "#ff5252";
        ctx.beginPath();
        ctx.arc(0, -22, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#263238";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hanger bars
        ctx.strokeStyle = "#37474f";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(-18, 0);
        ctx.moveTo(0, -18); ctx.lineTo(18, 0);
        ctx.stroke();

        // Wooden Cart Box
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(-24, 0, 48, 32);
        ctx.strokeStyle = "#3e2723";
        ctx.lineWidth = 2;
        ctx.strokeRect(-24, 0, 48, 32);

        // Label
        ctx.fillStyle = cw.repaired ? "#b9f6ca" : "#ffcdd2";
        ctx.font = "bold 11px 'Noto Sans Sinhala', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(cw.repaired ? "🚠 කේබල් කරත්තය [ක්‍රියාකාරී]" : "🚠 කේබල් කරත්තය [කැඩී ඇත]", 0, -28);
        ctx.restore();
      }

      // 3. Natural River Stepping Stones
      (this.steppingStones || []).forEach((stone) => {
        ctx.fillStyle = "#37474f";
        ctx.beginPath();
        ctx.arc(stone.x, stone.y, stone.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#546e7a";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Moss rim on stone
        ctx.fillStyle = "#689f38";
        ctx.beginPath();
        ctx.arc(stone.x - 4, stone.y - 4, stone.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Geologist Highland Camp Tent & Workbench
      ctx.save();
      ctx.translate(420, 380);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(0, 12, 38, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tent body
      ctx.fillStyle = "#455a64";
      ctx.beginPath();
      ctx.moveTo(0, -32); ctx.lineTo(-34, 12); ctx.lineTo(34, 12); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffb300"; // Warm lantern inside tent
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px 'Noto Sans Sinhala', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⛺ භූවිද්‍යා කූඩාරම (Warmth)", 0, -38);
      ctx.restore();

      // Field Research Workbench at (520, 440)
      ctx.fillStyle = "#4e342e";
      ctx.fillRect(500, 428, 44, 26);
      ctx.strokeStyle = "#271612";
      ctx.lineWidth = 2;
      ctx.strokeRect(500, 428, 44, 26);
      ctx.fillStyle = "#90a4ae"; // Brass gears & tools
      ctx.beginPath();
      ctx.arc(522, 441, 5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Geothermal Steaming Hot Spring at (1350, 420)
      ctx.fillStyle = "#263238";
      ctx.beginPath();
      ctx.ellipse(1350, 420, 46, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0, 229, 255, 0.75)";
      ctx.beginPath();
      ctx.ellipse(1350, 420, 36, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      // Rising geothermal steam particles
      const steamY = (performance.now() * 0.04) % 35;
      ctx.fillStyle = "rgba(230, 250, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(1340, 410 - steamY, 12, 0, Math.PI * 2);
      ctx.arc(1360, 405 - steamY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e0f7fa";
      ctx.font = "bold 11px 'Noto Sans Sinhala', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("♨️ උණුදිය උල්පත (Hot Spring)", 1350, 375);

      // 6. Mine Rails & Abandoned Cart at (2150, 1550)
      ctx.strokeStyle = "#37474f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(2100, 1530); ctx.lineTo(2450, 1530);
      ctx.moveTo(2100, 1550); ctx.lineTo(2450, 1550);
      ctx.stroke();
      // Rail ties
      for (let rx = 2100; rx <= 2450; rx += 20) {
        ctx.beginPath();
        ctx.moveTo(rx, 1526); ctx.lineTo(rx, 1554);
        ctx.stroke();
      }
      // Mine Cart
      ctx.fillStyle = "#263238";
      ctx.fillRect(2135, 1532, 34, 22);
      ctx.fillStyle = "#00e5ff"; // Mineral crystals in cart
      ctx.fillRect(2145, 1536, 6, 6);

      // 7. Glowing Blue Crystal Mine Tunnel at (2400, 1500)
      const crystalPulse = Math.sin(performance.now() * 0.006) * 0.25 + 0.75;
      ctx.fillStyle = `rgba(0, 229, 255, ${crystalPulse * 0.85})`;
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(2400, 1500, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 8. Three Giant Cascades Falling Foam & Spray
      [{ x: 760, y: 150 }, { x: 1670, y: 160 }, { x: 2560, y: 150 }].forEach((wf) => {
        ctx.fillStyle = "rgba(220, 245, 255, 0.6)";
        ctx.fillRect(wf.x - 70, wf.y, 140, 750);
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        for (let fx = wf.x - 60; fx < wf.x + 60; fx += 18) {
          const dropH = 20 + Math.sin(performance.now() * 0.02 + fx) * 12;
          ctx.fillRect(fx, wf.y + (performance.now() * 0.4 + fx * 10) % 700, 6, dropH);
        }
        const sprayPulse = Math.sin(performance.now() * 0.006) * 10;
        ctx.fillStyle = "rgba(230, 250, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(wf.x, wf.y + 750, 65 + sprayPulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // 9. Mountain Signal Tower at (2850, 1900)
      ctx.strokeStyle = "#90a4ae";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(2800, 1950);
      ctx.lineTo(2850, 1840);
      ctx.lineTo(2900, 1950);
      ctx.stroke();
      const towerFlash = Math.sin(performance.now() * 0.009) > 0;
      ctx.fillStyle = towerFlash ? "#ff1744" : "#455a64";
      ctx.beginPath();
      ctx.arc(2850, 1840, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Water Zones
    this.waterZones.forEach((water) => {
      // Chapter 2: Glacial Azure Cascades / Chapter 1: Murky Dark River
      ctx.fillStyle = this.chapter === 2 ? "#0077b6" : "#0c2838";
      ctx.fillRect(water.x, water.y, water.w, water.h);

      ctx.strokeStyle = this.chapter === 2 ? "rgba(144, 224, 239, 0.45)" : "rgba(70, 160, 210, 0.25)";
      ctx.lineWidth = 3;
      for (let y = water.y + 20; y < water.y + water.h; y += 40) {
        ctx.beginPath();
        const offset = Math.sin(performance.now() * 0.003 + y) * 15;
        ctx.moveTo(water.x + 10, y + offset);
        ctx.lineTo(water.x + water.w - 10, y + offset);
        ctx.stroke();
      }

      // Foaming Rapids (always churning in Chapter 2 cascades, or during storm in Chapter 1)
      if (this.chapter === 2 || this.stormActive) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 2.5;
        for (let y = water.y + 12; y < water.y + water.h; y += 28) {
          ctx.beginPath();
          const foamOffset = Math.sin(performance.now() * 0.012 + y) * 20;
          ctx.moveTo(water.x + 8, y + foamOffset);
          ctx.lineTo(water.x + water.w - 8, y + foamOffset);
          ctx.stroke();
        }
      }
    });

    // Sri Lanka Blue Magpie (කැහිබෙල්ලා)
    if (this.blueMagpie && this.blueMagpie.active) {
      ctx.save();
      ctx.translate(this.blueMagpie.x, this.blueMagpie.y);
      ctx.fillStyle = "#1e88e5";
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8d6e63";
      ctx.beginPath();
      ctx.arc(14, -2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e53935";
      ctx.beginPath();
      ctx.moveTo(20, -2);
      ctx.lineTo(26, 0);
      ctx.lineTo(20, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#1565c0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-12, 2);
      ctx.lineTo(-38, 8);
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-36, 7);
      ctx.lineTo(-44, 9);
      ctx.stroke();
      ctx.fillStyle = "rgba(30, 136, 229, 0.85)";
      ctx.beginPath();
      ctx.ellipse(-2, -6, 12, 6, this.blueMagpie.wingAngle, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── 3. Unified 2.5D / 3D Y-Sorted Entity Depth Pipeline ──
    const renderTime = performance.now();
    const camCenterX = this.camera.x + (this.canvas.width / (2 * this.zoom));
    const camCenterY = this.camera.y + (this.canvas.height / (2 * this.zoom));
    const yEntities = [];

    // A. 3D Jungle Trees & Towering Endemic Giants
    this.jungleTrees.forEach((t) => {
      if (t.x >= vLeft - 140 && t.x <= vRight + 140 && t.y >= vTop - 250 && t.y <= vBottom + 160) {
        yEntities.push({
          y: t.y,
          render: () => this.render3DTree(ctx, t, renderTime, camCenterX, camCenterY, false),
        });
      }
    });
    this.trees.forEach((t) => {
      if (t.x >= vLeft - 140 && t.x <= vRight + 140 && t.y >= vTop - 250 && t.y <= vBottom + 160) {
        yEntities.push({
          y: t.y,
          render: () => this.render3DTree(ctx, t, renderTime, camCenterX, camCenterY, true),
        });
      }
    });

    // B. Obstacles & Granite Boulders
    this.obstacles.forEach((obs) => {
      const obsY = obs.y + (obs.radius || (obs.h ? obs.h / 2 : 0));
      yEntities.push({
        y: obsY,
        render: () => this.renderRealisticBoulder(ctx, obs),
      });
    });

    // C. Realistic 3D Campfires
    this.campfires.forEach((fire) => {
      yEntities.push({
        y: fire.y,
        render: () => this.renderRealisticCampfire(ctx, fire, renderTime),
      });
    });

    // D. Ground Items
    this.items.forEach((it) => {
      yEntities.push({
        y: it.y,
        render: () => this.renderRealisticGroundItem(ctx, it, renderTime),
      });
    });

    // E. Interactive Objects & Props
    this.interactiveObjects.forEach((obj) => {
      yEntities.push({
        y: obj.y,
        render: () => this.render3DInteractiveObject(ctx, obj, renderTime),
      });
    });

    // F. Wildlife (Leeches & Vipers)
    this.leeches.forEach((l) => {
      if (l.alive) {
        yEntities.push({
          y: l.y,
          render: () => this.renderRealisticLeech(ctx, l),
        });
      }
    });
    if (this.vipers) {
      this.vipers.forEach((v) => {
        yEntities.push({
          y: v.y,
          render: () => this.renderRealisticViper(ctx, v, renderTime),
        });
      });
    }

    // G. Shadow Stalker Leopard (3D Stealth Predator)
    if (this.shadowStalker && this.shadowStalker.eyesAlpha > 0.04) {
      yEntities.push({
        y: this.shadowStalker.y,
        render: () => this.render3DShadowStalker(ctx, this.shadowStalker, renderTime),
      });
    }

    // H. Player Character (3D Ranger Model)
    yEntities.push({
      y: this.player.y,
      render: () => this.renderRealisticPlayer(ctx, renderTime),
    });

    // I. Chapter 1 Outpost Cabin & Evacuation Helipad Helicopter
    if (this.chapter === 1) {
      yEntities.push({
        y: 740,
        render: () => this.render3DOutpostCabin(ctx, renderTime),
      });
      yEntities.push({
        y: 1800,
        render: () => this.render3DHelicopter(ctx, renderTime),
      });
    }

    // Sort strictly by Y coordinate (front-to-back depth order)
    yEntities.sort((a, b) => a.y - b.y);

    // Execute back-to-front render
    yEntities.forEach((ent) => ent.render());

    // Campfire Floating Embers (render in air above ground)
    this.campfireEmbers.forEach((ember) => {
      ctx.fillStyle = ember.color;
      ctx.globalAlpha = Math.max(0, ember.alpha);
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // ═══ AAA: Butterflies Fluttering in Forest ════════════════════════════
    this.butterflies.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      const flap = Math.sin(b.wingPhase);
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.ellipse(-b.size * 0.6, 0, b.size * Math.abs(flap), b.size * 0.7, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(b.size * 0.6, 0, b.size * Math.abs(flap), b.size * 0.7, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1b1b1b";
      ctx.fillRect(-1, -b.size * 0.5, 2, b.size);
      ctx.restore();
    });

    // ═══ AAA: Drifting Jungle Pollen & Leaves Particles ══════════════════
    this.jungleParticles.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      if (p.type === "leaf") {
        ctx.fillStyle = `rgba(180, 130, 40, ${p.alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.8, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const glow = Math.sin(performance.now() * 0.004 + p.phase) * 0.2 + 0.5;
        ctx.fillStyle = `rgba(255, 245, 180, ${glow * p.alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // ═══ AAA: Floating Numbers & Text Messages ════════════════════════════
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.font = "bold 14px 'Share Tech Mono', sans-serif";
      ctx.fillStyle = ft.color;
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 6;
      ctx.globalAlpha = ft.alpha;
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 9.5 1987 Glowing UV Footprints Trail & Secret Runic Glyphs
    if (this.torchOn && this.uvMode) {
      // Draw Glowing Footprints
      this.uvFootprints.forEach((pt, idx) => {
        const dist = Math.hypot(pt.x - this.player.x, pt.y - this.player.y);
        if (dist < 420) {
          const glow = Math.sin(performance.now() * 0.006 + idx) * 0.25 + 0.75;
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.fillStyle = `rgba(0, 240, 255, ${glow * 0.85})`;
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.ellipse(0, 0, 7, 13, (idx % 2 === 0 ? 0.35 : -0.35), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Secret Ancient Cave Glyphs
      this.uvGlyphs.forEach((g) => {
        const dist = Math.hypot(g.x - this.player.x, g.y - this.player.y);
        if (dist < 380) {
          const pulse = Math.sin(performance.now() * 0.008) * 0.2 + 0.8;
          ctx.save();
          ctx.fillStyle = `rgba(255, 60, 240, ${pulse})`;
          ctx.shadowColor = "#ff00ea";
          ctx.shadowBlur = 16;
          ctx.font = "bold 15px 'Noto Sans Sinhala', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(g.text, g.x, g.y);
          ctx.restore();
        }
      });
    }

    // 9.8 Emergency Flare Launch & Aerial Chopper Searchlight
    if (this.flareEntity) {
      ctx.save();
      const flareY = this.flareEntity.y - this.flareEntity.altitude;
      if (!this.flareEntity.exploded) {
        ctx.fillStyle = "#ff1744";
        ctx.shadowColor = "#ff5252";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.flareEntity.x, flareY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 100, 100, 0.4)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.flareEntity.x, this.flareEntity.y);
        ctx.lineTo(this.flareEntity.x, flareY);
        ctx.stroke();
      } else {
        const flicker = Math.sin(performance.now() * 0.02) * 5;
        ctx.fillStyle = "#ff1744";
        ctx.shadowColor = "#ff1744";
        ctx.shadowBlur = 35;
        ctx.beginPath();
        ctx.arc(this.flareEntity.x, flareY, 18 + flicker, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(this.flareEntity.x, flareY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Helicopter Searchlight cone sweeping across the helipad
        const beamX = 2700 + Math.cos(this.chopperSearchlightAngle) * 90;
        const beamY = 1800 + Math.sin(this.chopperSearchlightAngle) * 90;
        const searchlightGrad = ctx.createRadialGradient(beamX, beamY, 10, beamX, beamY, 140);
        searchlightGrad.addColorStop(0, "rgba(255, 255, 230, 0.65)");
        searchlightGrad.addColorStop(1, "rgba(255, 255, 230, 0)");
        ctx.fillStyle = searchlightGrad;
        ctx.beginPath();
        ctx.arc(beamX, beamY, 140, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore(); // Restore world camera

    // ── 10. Dynamic Lighting & Atmosphere ──
    if (this.chapter === 2) {
      // CHAPTER 2: High Mountain Daylight & Crisp Morning Sun!
      ctx.save();
      const skyGrad = ctx.createLinearGradient(0, 0, w, h * 0.8);
      skyGrad.addColorStop(0, "rgba(255, 250, 220, 0.12)");
      skyGrad.addColorStop(0.5, "rgba(225, 248, 255, 0.04)");
      skyGrad.addColorStop(1, "rgba(190, 230, 255, 0.07)");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Volumetric Morning Sunbeams
      const sunTime = performance.now() * 0.0008;
      for (let i = 0; i < 6; i++) {
        const rayX = (w * 0.1) + i * (w * 0.18) + Math.sin(sunTime + i) * 35;
        const rayW = 90 + Math.sin(sunTime * 1.4 + i) * 30;
        const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + 160, h);
        rayGrad.addColorStop(0, "rgba(255, 250, 210, 0.14)");
        rayGrad.addColorStop(0.6, "rgba(255, 255, 240, 0.06)");
        rayGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rayX - rayW * 0.4, 0);
        ctx.lineTo(rayX + rayW * 0.4, 0);
        ctx.lineTo(rayX + 240 + rayW, h);
        ctx.lineTo(rayX + 240 - rayW, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if (this.chapter === 3) {
      // CHAPTER 3: Subterranean Bioluminescent Cavern Ambient!
      ctx.save();
      // Deep violet subterranean ambient
      ctx.fillStyle = "rgba(18, 10, 30, 0.35)";
      ctx.fillRect(0, 0, w, h);

      // Cyan / Violet crystal aura around player's headlamp
      const pScreenX = this.player.x - this.camera.x;
      const pScreenY = this.player.y - this.camera.y;
      const lampGrad = ctx.createRadialGradient(pScreenX, pScreenY, 20, pScreenX, pScreenY, 260);
      lampGrad.addColorStop(0, "rgba(200, 180, 255, 0.3)");
      lampGrad.addColorStop(0.5, "rgba(130, 220, 255, 0.15)");
      lampGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = lampGrad;
      ctx.beginPath();
      ctx.arc(pScreenX, pScreenY, 260, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.chapter === 4) {
      // CHAPTER 4: The Forgotten Facility - Cold-War Industrial Bunker Lighting
      ctx.save();
      // Cool fluorescent industrial ambient
      ctx.fillStyle = "rgba(18, 24, 28, 0.28)";
      ctx.fillRect(0, 0, w, h);

      // Fluorescent tube light flicker simulation
      const tubeFlicker = Math.sin(performance.now() * 0.05) > 0.96 ? 0.03 : 0.08;
      ctx.fillStyle = `rgba(210, 245, 255, ${tubeFlicker})`;
      ctx.fillRect(0, 0, w, h);

      // Red emergency warning light beacon pulse near generator
      const genScreenX = 650 - this.camera.x;
      const genScreenY = 420 - this.camera.y;
      const beaconPulse = Math.sin(performance.now() * 0.005) * 0.5 + 0.5;
      const beaconGrad = ctx.createRadialGradient(genScreenX, genScreenY, 10, genScreenX, genScreenY, 180);
      beaconGrad.addColorStop(0, `rgba(255, 40, 40, ${0.35 * beaconPulse})`);
      beaconGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
      ctx.fillStyle = beaconGrad;
      ctx.beginPath();
      ctx.arc(genScreenX, genScreenY, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.chapter === 5) {
      // CHAPTER 5: The Colossus Canopy - Golden Sunset Twilight at 150ft
      ctx.save();
      // Rich golden hour evening sunset gradient
      const sunsetGrad = ctx.createLinearGradient(0, 0, w, h);
      sunsetGrad.addColorStop(0, "rgba(255, 140, 40, 0.18)");
      sunsetGrad.addColorStop(0.5, "rgba(255, 180, 70, 0.12)");
      sunsetGrad.addColorStop(1, "rgba(120, 60, 140, 0.14)");
      ctx.fillStyle = sunsetGrad;
      ctx.fillRect(0, 0, w, h);

      // Sunset golden god-rays
      const sunsetTime = performance.now() * 0.0006;
      for (let i = 0; i < 5; i++) {
        const rayX = (w * 0.15) + i * (w * 0.2) + Math.sin(sunsetTime + i) * 40;
        const rayW = 120 + Math.sin(sunsetTime * 1.2 + i) * 35;
        const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + 200, h);
        rayGrad.addColorStop(0, "rgba(255, 190, 80, 0.18)");
        rayGrad.addColorStop(0.7, "rgba(255, 130, 40, 0.07)");
        rayGrad.addColorStop(1, "rgba(255, 100, 30, 0)");
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rayX - rayW * 0.4, 0);
        ctx.lineTo(rayX + rayW * 0.4, 0);
        ctx.lineTo(rayX + 300 + rayW, h);
        ctx.lineTo(rayX + 300 - rayW, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if (!this.lightningActive) {
      // CHAPTER 1: Night darkness & flashlight cone
      ctx.save();
      const pScreenX = this.player.x - this.camera.x;
      const pScreenY = this.player.y - this.camera.y;

      if (this.darknessCanvas.width !== w || this.darknessCanvas.height !== h) {
        this.darknessCanvas.width = w;
        this.darknessCanvas.height = h;
      }
      const dCtx = this.dCtx;

      dCtx.globalCompositeOperation = "source-over";
      dCtx.fillStyle = `rgba(4, 8, 4, ${this.ambientLight || 0.92})`;
      dCtx.fillRect(0, 0, w, h);

      dCtx.globalCompositeOperation = "destination-out";

      // A. Carve Campfire Warm Safe Lighting Zones!
      this.campfires.forEach((fire) => {
        const fScreenX = fire.x - this.camera.x;
        const fScreenY = fire.y - this.camera.y;
        const fireRad = 170 + Math.sin(performance.now() * 0.008) * 12;
        const grad = dCtx.createRadialGradient(fScreenX, fScreenY, 15, fScreenX, fScreenY, fireRad);
        grad.addColorStop(0, "rgba(0,0,0,1)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        dCtx.fillStyle = grad;
        dCtx.beginPath();
        dCtx.arc(fScreenX, fScreenY, fireRad, 0, Math.PI * 2);
        dCtx.fill();
      });

      // Carve Kudawa Camp Tent Ambient Light (180, 280)
      const tScreenX = 180 - this.camera.x;
      const tScreenY = 280 - this.camera.y;
      const tGrad = dCtx.createRadialGradient(tScreenX, tScreenY, 5, tScreenX, tScreenY, 80);
      tGrad.addColorStop(0, "rgba(0,0,0,0.8)");
      tGrad.addColorStop(1, "rgba(0,0,0,0)");
      dCtx.fillStyle = tGrad;
      dCtx.beginPath();
      dCtx.arc(tScreenX, tScreenY, 80, 0, Math.PI * 2);
      dCtx.fill();

      // B. Carve Kudawa Lantern Warm Glow (259, 332)
      const kScreenX = 259 - this.camera.x;
      const kScreenY = 332 - this.camera.y;
      const kGrad = dCtx.createRadialGradient(kScreenX, kScreenY, 5, kScreenX, kScreenY, 120);
      kGrad.addColorStop(0, "rgba(0,0,0,1)");
      kGrad.addColorStop(1, "rgba(0,0,0,0)");
      dCtx.fillStyle = kGrad;
      dCtx.beginPath();
      dCtx.arc(kScreenX, kScreenY, 120, 0, Math.PI * 2);
      dCtx.fill();

      // C. Carve Water Spring Well Glow (210, 440)
      const sScreenX = 210 - this.camera.x;
      const sScreenY = 440 - this.camera.y;
      const sGrad = dCtx.createRadialGradient(sScreenX, sScreenY, 4, sScreenX, sScreenY, 70);
      sGrad.addColorStop(0, "rgba(0,0,0,0.85)");
      sGrad.addColorStop(1, "rgba(0,0,0,0)");
      dCtx.fillStyle = sGrad;
      dCtx.beginPath();
      dCtx.arc(sScreenX, sScreenY, 70, 0, Math.PI * 2);
      dCtx.fill();

      // D. Carve Ancient Cave Entrance Azure Glow (1730, 1120)
      const cScreenX = 1730 - this.camera.x;
      const cScreenY = 1120 - this.camera.y;
      const cGrad = dCtx.createRadialGradient(cScreenX, cScreenY, 10, cScreenX, cScreenY, 140);
      cGrad.addColorStop(0, "rgba(0,0,0,1)");
      cGrad.addColorStop(1, "rgba(0,0,0,0)");
      dCtx.fillStyle = cGrad;
      dCtx.beginPath();
      dCtx.arc(cScreenX, cScreenY, 140, 0, Math.PI * 2);
      dCtx.fill();

      // E. Carve Helipad Spotlight Beacons (2700, 1800)
      const hScreenX = 2700 - this.camera.x;
      const hScreenY = 1800 - this.camera.y;
      const hGrad = dCtx.createRadialGradient(hScreenX, hScreenY, 20, hScreenX, hScreenY, 190);
      hGrad.addColorStop(0, "rgba(0,0,0,1)");
      hGrad.addColorStop(1, "rgba(0,0,0,0)");
      dCtx.fillStyle = hGrad;
      dCtx.beginPath();
      dCtx.arc(hScreenX, hScreenY, 190, 0, Math.PI * 2);
      dCtx.fill();

      // F. Carve Flashlight Light Beam Cone
      if (this.torchOn) {
        const isFlickering = this.battery < 20 && Math.random() < 0.28;
        const beamLength = isFlickering ? 140 + Math.random() * 80 : 340;
        const angle = this.player.facingAngle;
        const coneWidth = isFlickering ? 0.35 : 0.55;

        dCtx.beginPath();
        dCtx.moveTo(pScreenX, pScreenY);
        dCtx.arc(pScreenX, pScreenY, beamLength, angle - coneWidth, angle + coneWidth);
        dCtx.closePath();
        dCtx.fill();

        const glowRadius = isFlickering ? 35 : 70;
        const radGlow = dCtx.createRadialGradient(pScreenX, pScreenY, 10, pScreenX, pScreenY, glowRadius);
        radGlow.addColorStop(0, "rgba(0,0,0,1)");
        radGlow.addColorStop(1, "rgba(0,0,0,0)");
        dCtx.fillStyle = radGlow;
        dCtx.beginPath();
        dCtx.arc(pScreenX, pScreenY, glowRadius, 0, Math.PI * 2);
        dCtx.fill();
      } else {
        const radGlow = dCtx.createRadialGradient(pScreenX, pScreenY, 5, pScreenX, pScreenY, 35);
        radGlow.addColorStop(0, "rgba(0,0,0,0.75)");
        radGlow.addColorStop(1, "rgba(0,0,0,0)");
        dCtx.fillStyle = radGlow;
        dCtx.beginPath();
        dCtx.arc(pScreenX, pScreenY, 35, 0, Math.PI * 2);
        dCtx.fill();
      }

      ctx.drawImage(this.darknessCanvas, 0, 0);

      // Pro Survival: Toxic Venom Vignette Overlay
      if (this.venomToxicity > 0) {
        const vAlpha = (this.venomToxicity / 100) * (0.38 + Math.sin(performance.now() * 0.005) * 0.15);
        const vGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75);
        vGrad.addColorStop(0, "rgba(0,0,0,0)");
        vGrad.addColorStop(1, `rgba(147, 51, 234, ${vAlpha})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Pro Survival: Psychological Paranoia Tunnel Vision
      if (this.sanity < 35) {
        const pPulse = (1 - this.sanity / 35) * (0.42 + Math.sin(performance.now() * 0.008) * 0.16);
        const pGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.18, w / 2, h / 2, h * 0.68);
        pGrad.addColorStop(0, "rgba(0,0,0,0)");
        pGrad.addColorStop(1, `rgba(18, 0, 24, ${pPulse})`);
        ctx.fillStyle = pGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // UV Blacklight Cone Ambient Overlay
      if (this.torchOn && this.uvMode) {
        ctx.save();
        const beamLength = 340;
        const angle = this.player.facingAngle;
        const coneWidth = 0.55;
        const uvGrad = ctx.createRadialGradient(pScreenX, pScreenY, 20, pScreenX, pScreenY, beamLength);
        uvGrad.addColorStop(0, "rgba(170, 0, 255, 0.4)");
        uvGrad.addColorStop(0.65, "rgba(120, 0, 240, 0.22)");
        uvGrad.addColorStop(1, "rgba(0, 240, 255, 0)");
        ctx.fillStyle = uvGrad;
        ctx.beginPath();
        ctx.moveTo(pScreenX, pScreenY);
        ctx.arc(pScreenX, pScreenY, beamLength, angle - coneWidth, angle + coneWidth);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    // Emergency Flare Sky Pulsing Illumination
    if (this.flareEntity && this.flareEntity.exploded) {
      const pulseRed = Math.sin(performance.now() * 0.015) * 0.08 + 0.18;
      ctx.fillStyle = `rgba(255, 30, 30, ${pulseRed})`;
      ctx.fillRect(0, 0, w, h);
    }

    // ── 11. Weather Screen Effects ───────────────────
    if (this.chapter === 2) {
      // CHAPTER 2: Mountain Clouds & Drifting Canyon Mist (NO RAIN)
      this.mistClouds.forEach((m) => {
        const mx = m.x - this.camera.x;
        const my = m.y - this.camera.y;
        if (mx > -m.radius && mx < w + m.radius && my > -m.radius && my < h + m.radius) {
          ctx.save();
          const mistGrad = ctx.createRadialGradient(mx, my, m.radius * 0.1, mx, my, m.radius);
          mistGrad.addColorStop(0, `rgba(240, 250, 255, ${m.opacity || 0.18})`);
          mistGrad.addColorStop(0.65, `rgba(220, 242, 255, ${(m.opacity || 0.18) * 0.5})`);
          mistGrad.addColorStop(1, "rgba(220, 242, 255, 0)");
          ctx.fillStyle = mistGrad;
          ctx.beginPath();
          ctx.arc(mx, my, m.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    } else if (this.chapter === 3) {
      // CHAPTER 3: Bioluminescent Spores & Crystal Dust Motes (NO RAIN)
      const t = performance.now() * 0.001;
      ctx.save();
      for (let i = 0; i < 28; i++) {
        const px = ((i * 113 + t * 25) % w);
        const py = ((i * 79 + Math.sin(t + i) * 35 + t * 15) % h);
        const pSize = 1.5 + (i % 3);
        const pGlow = Math.sin(t * 2 + i) * 0.3 + 0.6;
        ctx.fillStyle = i % 2 === 0 ? `rgba(180, 130, 255, ${pGlow * 0.5})` : `rgba(100, 220, 255, ${pGlow * 0.4})`;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (this.chapter === 4) {
      // CHAPTER 4: Facility Electrical Sparks & Dust (NO RAIN)
      if (Math.random() < 0.15 && !this.breakerOff) {
        ctx.save();
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (Math.random() - 0.5) * 16, sy + (Math.random() - 0.5) * 16);
        ctx.stroke();
        ctx.restore();
      }
    } else if (this.chapter === 5) {
      // CHAPTER 5: Golden Sunset Leaves Drifting in High-Altitude Wind (NO RAIN)
      const t = performance.now() * 0.0012;
      ctx.save();
      for (let i = 0; i < 22; i++) {
        const lx = ((i * 145 + t * 45) % (w + 100)) - 50;
        const ly = ((i * 95 + t * 30 + Math.sin(t * 1.5 + i) * 25) % (h + 80)) - 40;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(t + i);
        ctx.fillStyle = i % 2 === 0 ? "rgba(255, 175, 60, 0.7)" : "rgba(230, 100, 40, 0.65)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    } else {
      // CHAPTER 1: Rain & Lightning Flash
      if (this.lightningActive) {
        ctx.fillStyle = "rgba(220, 240, 255, 0.4)";
        ctx.fillRect(0, 0, w, h);
      }

      ctx.strokeStyle = this.player.inShelter ? "rgba(180, 220, 240, 0.15)" : "rgba(180, 220, 240, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      this.rainDrops.forEach((r) => {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 4, r.y + r.length);
      });
      ctx.stroke();

      // AAA: Rain Droplets on Camera Lens
      if (this.stormActive && this.lensDroplets.length > 0) {
        this.lensDroplets.forEach((ld) => {
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${ld.alpha * 0.22})`;
          ctx.beginPath();
          ctx.arc(ld.x, ld.y, ld.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 255, 255, ${ld.alpha * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          // Highlight speck
          ctx.fillStyle = `rgba(255, 255, 255, ${ld.alpha * 0.65})`;
          ctx.beginPath();
          ctx.arc(ld.x - ld.r * 0.3, ld.y - ld.r * 0.3, ld.r * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
    }

    // ── 12. Bleeding Red Screen Tint ─────────────────────────────────────────
    if (this.bleeding) {
      ctx.fillStyle = "rgba(180, 0, 0, 0.18)";
      ctx.fillRect(0, 0, w, h);
    }

    // ── 12B. Chapter 2: Frost & Hypothermia Screen Vignette ──────────────────
    if (this.chapter === 2 && this.temperature < 50) {
      const coldSeverity = (50 - this.temperature) / 50; // 0.0 to 1.0
      ctx.save();
      const frostGrad = ctx.createRadialGradient(
        w / 2, h / 2, Math.min(w, h) * 0.32,
        w / 2, h / 2, Math.max(w, h) * 0.72
      );
      const alpha = coldSeverity * 0.58;
      frostGrad.addColorStop(0, "rgba(200, 235, 255, 0)");
      frostGrad.addColorStop(0.65, `rgba(180, 225, 255, ${alpha * 0.42})`);
      frostGrad.addColorStop(1, `rgba(135, 215, 255, ${alpha})`);
      ctx.fillStyle = frostGrad;
      ctx.fillRect(0, 0, w, h);

      // Frost edge ice crystals / shivering vignette
      if (this.temperature < 25) {
        ctx.fillStyle = `rgba(220, 245, 255, ${0.16 + Math.sin(performance.now() * 0.008) * 0.08})`;
        ctx.fillRect(0, 0, w, 8);
        ctx.fillRect(0, h - 8, w, 8);
        ctx.fillRect(0, 0, 8, h);
        ctx.fillRect(w - 8, 0, 8, h);
      }
      ctx.restore();
    }

    // ── 13. Holographic Mission Waypoint & Off-Screen Edge Indicator ──────────
    const obj = this.getActiveObjective();
    if (obj) {
      const objDist = Math.round(Math.hypot(obj.x - this.player.x, obj.y - this.player.y) / 10);
      const scrX = obj.x - this.camera.x;
      const scrY = obj.y - this.camera.y;

      const margin = 80;
      const isOnScreen = scrX >= margin && scrX <= w - margin && scrY >= margin && scrY <= h - margin;

      ctx.save();
      if (isOnScreen) {
        // Floating 3D Waypoint over target
        const bob = Math.sin(performance.now() * 0.005) * 6;
        const wpY = scrY - 45 + bob;

        // Pulsing radar ring on ground
        const pulse = (performance.now() % 1600) / 1600;
        ctx.strokeStyle = `rgba(0, 229, 255, ${1 - pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(scrX, scrY, 15 + pulse * 25, 0, Math.PI * 2);
        ctx.stroke();

        // Neon diamond
        ctx.fillStyle = "#00e5ff";
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(scrX, wpY - 12);
        ctx.lineTo(scrX + 10, wpY);
        ctx.lineTo(scrX, wpY + 12);
        ctx.lineTo(scrX - 10, wpY);
        ctx.closePath();
        ctx.fill();

        // Downward pointer
        ctx.beginPath();
        ctx.moveTo(scrX - 6, wpY + 14);
        ctx.lineTo(scrX + 6, wpY + 14);
        ctx.lineTo(scrX, wpY + 22);
        ctx.closePath();
        ctx.fill();

        // Holographic label
        ctx.font = "bold 13px 'Share Tech Mono', sans-serif";
        ctx.shadowBlur = 0;
        const tag = `${obj.icon} ${obj.title} [${objDist}m]`;
        const tw = ctx.measureText(tag).width + 16;
        ctx.fillStyle = "rgba(4, 16, 20, 0.88)";
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 1;
        ctx.fillRect(scrX - tw / 2, wpY - 32, tw, 20);
        ctx.strokeRect(scrX - tw / 2, wpY - 32, tw, 20);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tag, scrX, wpY - 22);
      } else {
        // Off-screen edge pointer
        const centerX = w / 2;
        const centerY = h / 2;
        const angle = Math.atan2(scrY - centerY, scrX - centerX);

        // Edge clamped position
        const edgeMarginX = 65;
        const edgeMarginY = 90;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        let edgeX, edgeY;
        const slope = sin / (cos || 0.0001);
        const halfW = w / 2 - edgeMarginX;
        const halfH = h / 2 - edgeMarginY;

        if (Math.abs(slope * halfW) <= halfH) {
          edgeX = centerX + (cos > 0 ? halfW : -halfW);
          edgeY = centerY + (cos > 0 ? halfW : -halfW) * slope;
        } else {
          edgeY = centerY + (sin > 0 ? halfH : -halfH);
          edgeX = centerX + (sin > 0 ? halfH : -halfH) / slope;
        }

        // Draw directional pointer arrow
        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);

        ctx.fillStyle = "#00e5ff";
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-10, -9);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw Distance & Icon badge
        ctx.shadowBlur = 0;
        ctx.font = "bold 12px 'Share Tech Mono', sans-serif";
        const edgeText = `${obj.icon} ${objDist}m`;
        const ew = ctx.measureText(edgeText).width + 12;
        ctx.fillStyle = "rgba(4, 16, 20, 0.9)";
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 1;

        const textOffsetX = -cos * 36;
        const textOffsetY = -sin * 36;
        const badgeX = edgeX + textOffsetX;
        const badgeY = edgeY + textOffsetY;

        ctx.fillRect(badgeX - ew / 2, badgeY - 10, ew, 20);
        ctx.strokeRect(badgeX - ew / 2, badgeY - 10, ew, 20);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(edgeText, badgeX, badgeY);
      }
      ctx.restore();
    }
  }

  getActiveObjective() {
    if (this.chapter === 2) {
      if (!this.tasks.mapFound) {
        return {
          x: 950,
          y: 650,
          icon: "🗺️",
          title: "භූවිද්‍යා සිතියම",
          id: "map",
        };
      }
      if (!this.hasGears) {
        return {
          x: 520,
          y: 440,
          icon: "⚙️",
          title: "කේබල් කරත්ත ගියර් (වැඩ මේසය)",
          id: "gears",
        };
      }
      if (!this.tasks.raftUsed && !this.cableway?.repaired) {
        return {
          x: 1800,
          y: 920,
          icon: "🚠",
          title: "කේබල් කරත්තය අලුත්වැඩියාව",
          id: "cableway",
        };
      }
      if (!this.tasks.tapeFound) {
        return {
          x: 1800,
          y: 1750,
          icon: "📼",
          title: "අභිරහස් කැසට් පටිය",
          id: "tape",
        };
      }
      if (!this.tasks.gemFound) {
        return {
          x: 2400,
          y: 1500,
          icon: "💎",
          title: "නිල් මැණික් ස්ඵටිකය (මයිකා පතල)",
          id: "gem",
        };
      }
      return {
        x: 2850,
        y: 1900,
        icon: "🗼",
        title: "කඳු මුදුනේ මුරකුළුණ",
        id: "tower",
      };
    }

    if (this.chapter === 3) {
      if (!this.tasks.slateFound) {
        return {
          x: 650,
          y: 550,
          icon: "📜",
          title: "පුරාණ ශිලා ලේඛනය",
          id: "slate",
        };
      }
      if (!this.tasks.maskFound) {
        return {
          x: 920,
          y: 620,
          icon: "🎭",
          title: "වායු මුහුණු ආවරණය (Gas Mask)",
          id: "mask",
        };
      }
      if (!this.tasks.floodgateUsed) {
        return {
          x: 1450,
          y: 650,
          icon: "⚙️",
          title: "භූගත සොරොව් චක්‍රය",
          id: "floodgate",
        };
      }
      if (!this.tasks.coreFound) {
        return {
          x: 1650,
          y: 1450,
          icon: "🔮",
          title: "ප්‍රතිදීප්ත අගාධ පාෂාණය",
          id: "core",
        };
      }
      if (!this.tasks.logFound) {
        return {
          x: 2350,
          y: 1550,
          icon: "🪔",
          title: "පතල් කම්කරු සටහන",
          id: "log",
        };
      }
      return {
        x: 2800,
        y: 1850,
        icon: "🛗",
        title: "භූගත එසවුම් යන්ත්‍රය (Hydraulic Lift)",
        id: "elevator",
      };
    }

    if (this.chapter === 4) {
      if (!this.tasks.generatorFixed) {
        return {
          x: 650,
          y: 420,
          icon: "⚡",
          title: "ප්‍රධාන ජෙනරේටරය (Diesel Generator)",
          id: "generator",
        };
      }
      if (!this.tasks.docsFound) {
        return {
          x: 850,
          y: 650,
          icon: "📁",
          title: "පරිගණක ලිපිගොනු (Mainframe Terminal)",
          id: "docs",
        };
      }
      if (!this.tasks.breakerPulled) {
        return {
          x: 1050,
          y: 720,
          icon: "🔌",
          title: "විදුලි විසන්ධිකාරකය (Breaker Switch)",
          id: "breaker",
        };
      }
      if (!this.tasks.keycardFound) {
        return {
          x: 1350,
          y: 620,
          icon: "💳",
          title: "Level 3 ප්‍රවේශ කාඩ්පත",
          id: "keycard",
        };
      }
      if (!this.tasks.dnaFound) {
        return {
          x: 2350,
          y: 1350,
          icon: "🧬",
          title: "ක්‍රයෝ-පර්යේෂණ කුටිය (DNA Sample)",
          id: "dna",
        };
      }
      return {
        x: 2850,
        y: 1850,
        icon: "🚇",
        title: "වියන් මොනොරේල් පිවිසුම (Canopy Airlock)",
        id: "monorail",
      };
    }

    if (this.chapter === 5) {
      if (!this.tasks.blackboxFound) {
        return {
          x: 750,
          y: 550,
          icon: "📦",
          title: "ගවේෂණ කළු පෙට්ටිය (Blackbox)",
          id: "blackbox",
        };
      }
      if (!this.tasks.bridgeCrossed) {
        return {
          x: 1200,
          y: 850,
          icon: "🌉",
          title: "සුළඟට පැද්දෙන ලණු පාලම",
          id: "bridge",
        };
      }
      if (!this.tasks.truthFound) {
        return {
          x: 1750,
          y: 1150,
          icon: "📜",
          title: "මහාචාර්ය ඩග්ලස්ගේ අවසාන සටහන",
          id: "truth",
        };
      }
      if (!this.tasks.beaconActivated) {
        return {
          x: 2350,
          y: 1400,
          icon: "📡",
          title: "සැටලයිට් සම්ප්‍රේෂක ඇන්ටනාව",
          id: "beacon",
        };
      }
      return {
        x: 2850,
        y: 1850,
        icon: "🗼",
        title: "මහා නාවෘක්ෂ මුරකුළුණ (Skyhook Tower)",
        id: "skyhook",
      };
    }

    if (!this.npc.helped) {
      return {
        x: this.npc.x,
        y: this.npc.y,
        icon: "🧙‍♂️",
        title: "ගුණදාස මාමා",
        id: "npc",
      };
    }
    if (!this.tasks.diaryFound) {
      return {
        x: 580,
        y: 700,
        icon: "📖",
        title: "මුරපොළේ දිනපොත",
        id: "diary",
      };
    }
    if (!this.tasks.keyFound) {
      return {
        x: 1100,
        y: 850,
        icon: "🔑",
        title: "පිත්තල යතුර",
        id: "key",
      };
    }
    if (!this.tasks.sampleFound) {
      return {
        x: 1730,
        y: 1120,
        icon: "⛩️",
        title: "ලෙන් දොරටුව & සාම්පලය",
        id: "sample",
      };
    }
    return {
      x: 2700,
      y: 1800,
      icon: "🚁",
      title: "ගලවා ගැනීමේ හෙලිපෑඩ්",
      id: "helipad",
    };
  }

  // ── 9. Main Loop ──────────────────────────────────────────────────────────
  loop(currentTime) {
    if (!this.running) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
  }
}
