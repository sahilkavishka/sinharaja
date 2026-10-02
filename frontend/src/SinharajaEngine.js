// ═══════════════════════════════════════════════════════════════════════════════
// SINHARAJA 2D SURVIVAL EXPLORATION ENGINE — CHAPTER 01 DEEP EXPANSION
// (Campfires, Friendly Ranger NPC, Secret Areas, Puzzles, Wildlife & Fireflies)
// ═══════════════════════════════════════════════════════════════════════════════

export class SinharajaEngine {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cb = callbacks || {};

    // World Dimensions (Large explorable open-world map)
    this.worldWidth = 3200;
    this.worldHeight = 2400;

    // Camera
    this.camera = { x: 0, y: 0 };

    // Player Entity
    this.player = {
      x: 250,
      y: 350,
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
    };

    // Controls State
    this.keys = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };

    // Survival Stats
    this.health = 100;
    this.sanity = 100;
    this.battery = 100;
    this.torchOn = true;
    this.saltCount = 3;
    this.herbCount = 1;
    this.hasKey = false;
    this.hasSample = false;
    this.bleeding = false;
    this.bleedTimer = 0;
    this.paused = false;

    // Chapter 1 Objectives & Evidence Tasks
    this.tasks = {
      diaryFound: false,
      keyFound: false,
      sampleFound: false,
      helipadReached: false,
    };

    // Dynamic Campfire Safe Zones (Health/Sanity recovery, Leeches flee)
    this.campfires = [
      { x: 480, y: 880, radius: 24, lit: true, name: "මුරපොළේ ගිනිමැලය" },
      { x: 1620, y: 1380, radius: 24, lit: true, name: "ලෙන් දොරටුවේ ගිනිමැලය" },
    ];

    // Friendly Ranger NPC (ගුණදාස මාමා)
    this.npc = {
      x: 340,
      y: 400,
      radius: 26,
      name: "ගුණදාස මාමා (Old Ranger Gunadasa)",
      icon: "🧙‍♂️",
      helped: false,
    };

    // Wildlife: Fireflies & Footsteps
    this.fireflies = [];
    this.footsteps = [];
    this.initFireflies();

    // Weather & Atmosphere
    this.rainDrops = [];
    this.mistClouds = [];
    this.lightningTimer = 0;
    this.lightningActive = false;

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

  // ── 3. Build World Map Entities ───────────────────────────────────────────
  buildWorld() {
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
            this.saltCount += 2;
            this.herbCount += 1;
            this.playSfx("pickup");
            this.cb.onTriggerStory({
              title: "පැරණි වන පාලක ගුණදාස මාමා",
              text: "'ආ මහත්තයෝ! මීට අවුරුදු 30කට කලින් ආපු සුදු මහත්වරුත් ගියේ ඔය ගංගාවෙන් එහා පැත්තට තමයි. රෑට කූඩැල්ලන්ගෙන් පරිස්සම් වෙන්න. මං ගාව තිබ්බ ලුණු පැකට් දෙකකුයි සුවදායක කොළ වගයකුයි මම ඔයාට දෙන්නම්!'",
              item: "ලුණු x2 සහ ඖෂධ පැළෑටි x1",
            });
          } else {
            this.cb.onTriggerStory({
              title: "ගුණදාස මාමාගේ උපදෙස",
              text: "'ගංගා ඉවුරේ පැරණි ඔරුව අසල ලෙන අරින පිත්තල යතුර සඟවලා ඇති බව අහලා තියෙනවා. ගල් ලෙනට ගිහින් ඒකෙන් දොර අරින්න!'",
            });
          }
        },
      },
      {
        id: "sign_entrance",
        x: 320,
        y: 280,
        radius: 30,
        title: "කුඩව පිවිසුම් පුවරුව",
        prompt: "[E] කියවන්න",
        icon: "📜",
        action: () =>
          this.cb.onTriggerStory({
            title: "කුඩව පිවිසුම (The Kudawa Gateway)",
            text: "මීට වසර 30කට පෙර අතුරුදහන් වූ බ්‍රිතාන්‍ය ගවේෂණ කණ්ඩායම අවසන් වරට දුටු ස්ථානය මෙයයි. අඳුර වැටීමට පෙර ගංගාව තරණය කර මුරපොළ සොයාගන්න.",
          }),
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
          this.cb.onTriggerStory({
            title: "දිනපොතේ අභිරහස (සාක්ෂි අංක 01)",
            text: "'1987 නොවැම්බර් 14: ඔවුන් ගල් ලෙන තුළට ගියා. ලෙන් දොරටුවේ රහස් සංකේත තුන: [සූර්යයා, ගංගාව, සිංහයා]. දොර විවෘත කිරීමට ගංගා ඉවුරේ සැඟවූ පිත්තල යතුර අවශ්‍යයි!'",
            item: "ලෙයින් පෙඟුණු දිනපොත (Evidence 1)",
            lore: {
              title: "සිංහරාජයේ රහස් දිනපොත",
              desc: "අතුරුදහන් වූ කණ්ඩායමේ ගමන් මාර්ගය හෙළි කරන වැදගත් සාක්ෂියකි.",
            },
          });
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
            this.playSfx("pickup");
            this.cb.onTriggerStory({
              title: "පුරාණ පිත්තල යතුර (සාක්ෂි අංක 02)",
              text: "ඔබට ගල් ලෙනේ දොරටුව විවෘත කළ හැකි පුරාණ පිත්තල යතුර හමුවිය!",
              item: "පුරාණ පිත්තල යතුර (Evidence 2)",
            });
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
            this.cb.onTriggerStory({
              title: "අභිරහස හෙළි විය! (සාක්ෂි අංක 03)",
              text: "වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ පර්යේෂණ සාම්පල බඳුන ඔබට හමුවිය! දැන් කඳු මුදුනේ ඇති හෙලිපෑඩ් වෙත ගොස් සංඥා කරන්න!",
              item: "පර්යේෂණ සාම්පල (Evidence 3)",
              lore: {
                title: "ප්‍රතිදීප්ත හතු (Bioluminescent Fungi)",
                desc: "සිංහරාජයේ ගුහා තුළ ස්වභාවිකව නිල් ආලෝකය විහිදුවන දුර්ලභ දිලීර විශේෂයකි.",
              },
            });
          }
        },
      },
      {
        id: "rescue_helipad",
        x: 2700,
        y: 1800,
        radius: 70,
        title: "යෝධ නාවෘක්ෂය සහ හෙලිකොප්ටර් කලාපය",
        prompt: "[E] සංඥා කරන්න",
        icon: "🚁",
        action: () => {
          this.tasks.helipadReached = true;
          if (this.hasSample) {
            this.cb.onGameWon("hero");
          } else {
            this.cb.onGameWon("survivor");
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
      // Escape -> Pause Menu
      if (e.key === "Escape") {
        if (this.cb.onTogglePause) this.cb.onTogglePause();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.worldX = this.mouse.x + this.camera.x;
      this.mouse.worldY = this.mouse.y + this.camera.y;

      const dx = this.mouse.worldX - this.player.x;
      const dy = this.mouse.worldY - this.player.y;
      this.player.facingAngle = Math.atan2(dy, dx);
    });

    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.interactNearest() || this.throwSalt();
      }
    });
  }

  // ── 6. Actions ────────────────────────────────────────────────────────────
  useHerb() {
    if (this.herbCount <= 0) {
      this.cb.onNotify("⚠️ ඖෂධීය පැළෑටි අවසන්! කැලයෙන් සොයාගන්න.");
      return;
    }
    if (this.health >= 100) {
      this.cb.onNotify("ඔබේ සෞඛ්‍යය (Health) දැනටමත් උපරිම මට්ටමේ ඇත.");
      return;
    }
    this.herbCount--;
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
        if (dist < 160) {
          l.alive = false;
          killed++;
        }
      }
    });

    if (this.bleeding) {
      this.bleeding = false;
      this.cb.onNotify("✨ ලුණු දමා කූඩැල්ලන් ඉවත් කළා! ලේ ගැලීම නැවතුණි.");
    } else if (killed > 0) {
      this.cb.onNotify(`✨ ලුණු කුඩු ප්‍රහාරයෙන් කූඩැල්ලන් ${killed}ක් විනාශ විය!`);
    } else {
      this.cb.onNotify(`🧂 ලුණු කුඩු විසි කළා! (ඉතිරි: ${this.saltCount})`);
    }
  }

  interactNearest() {
    for (let obj of this.interactiveObjects) {
      const dist = Math.hypot(obj.x - this.player.x, obj.y - this.player.y);
      if (dist < obj.radius + 35) {
        obj.action(obj);
        return true;
      }
    }
    return false;
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

    // 1. Movement Handling
    let dx = 0;
    let dy = 0;
    if (this.keys["w"] || this.keys["arrowup"]) dy -= 1;
    if (this.keys["s"] || this.keys["arrowdown"]) dy += 1;
    if (this.keys["a"] || this.keys["arrowleft"]) dx -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) dx += 1;

    const isMoving = dx !== 0 || dy !== 0;
    this.player.isMoving = isMoving;

    const shift = this.keys["shift"];
    if (shift && isMoving && this.player.stamina > 5) {
      this.player.isSprinting = true;
      this.player.stamina = Math.max(0, this.player.stamina - 20 * dt);
    } else {
      this.player.isSprinting = false;
      this.player.stamina = Math.min(100, this.player.stamina + 12 * dt);
    }

    let speed = this.player.speed;
    if (this.player.isSprinting) speed *= this.player.sprintMultiplier;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    const inWater = this.waterZones.some(
      (w) =>
        this.player.x > w.x &&
        this.player.x < w.x + w.w &&
        this.player.y > w.y &&
        this.player.y < w.y + w.h
    );
    if (inWater) speed *= 0.55;

    const nextX = Math.max(20, Math.min(this.worldWidth - 20, this.player.x + dx * speed));
    const nextY = Math.max(20, Math.min(this.worldHeight - 20, this.player.y + dy * speed));

    if (!this.checkCollision(nextX, this.player.y)) this.player.x = nextX;
    if (!this.checkCollision(this.player.x, nextY)) this.player.y = nextY;

    if (isMoving) {
      this.player.walkFrame += dt * 10;
      if (Math.floor(this.player.walkFrame) % 4 === 0) {
        this.playSfx("step");
        // Add footstep mud mark
        if (this.footsteps.length > 30) this.footsteps.shift();
        this.footsteps.push({ x: this.player.x, y: this.player.y, alpha: 0.5 });
      }
    }

    // 2. Camera Smooth Follow
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;
    this.camera.x = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.camera.y));

    // 3. Campfire Rest & Safety Check
    const nearCampfire = this.campfires.some((fire) => {
      const dist = Math.hypot(this.player.x - fire.x, this.player.y - fire.y);
      return dist < 120;
    });

    if (nearCampfire) {
      // Warmth restores health & sanity!
      this.health = Math.min(100, this.health + 4 * dt);
      this.sanity = Math.min(100, this.sanity + 6 * dt);
    } else if (this.torchOn) {
      this.battery = Math.max(0, this.battery - 0.7 * dt);
      if (this.battery <= 0) this.torchOn = false;
    } else {
      this.sanity = Math.max(0, this.sanity - 1.8 * dt);
    }

    // 4. Bleeding Damage from Leech bites
    if (this.bleeding) {
      this.bleedTimer += dt;
      if (this.bleedTimer > 1) {
        this.bleedTimer = 0;
        this.health = Math.max(0, this.health - 2);
        this.playSfx("hurt");
      }
    }

    // 5. Leeches AI (Chase player, but flee from campfires!)
    this.leeches.forEach((l) => {
      if (!l.alive) return;

      // Check if near any campfire -> flee!
      const nearFire = this.campfires.some(
        (fire) => Math.hypot(l.x - fire.x, l.y - fire.y) < 180
      );
      if (nearFire) return;

      const dist = Math.hypot(this.player.x - l.x, this.player.y - l.y);

      if (dist < 280) {
        const angle = Math.atan2(this.player.y - l.y, this.player.x - l.x);
        l.x += Math.cos(angle) * l.speed;
        l.y += Math.sin(angle) * l.speed;
        l.crawlFrame += dt * 8;

        if (dist < this.player.radius + l.radius) {
          if (!this.bleeding) {
            this.bleeding = true;
            this.health = Math.max(0, this.health - 5);
            this.sanity = Math.max(0, this.sanity - 8);
            this.playSfx("hurt");
            this.cb.onNotify("🩸 කූඩැල්ලෙක් එල්ලී ලේ උරා බොයි! (ඉක්මනින් SPACE ඔබා ලුණු දමන්න!)");
          }
        }
      }
    });

    // 6. Item Pickups
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const dist = Math.hypot(this.player.x - it.x, this.player.y - it.y);
      if (dist < this.player.radius + 20) {
        this.playSfx("pickup");
        if (it.type === "salt") {
          this.saltCount += 2;
          this.cb.onNotify("🧂 ලුණු කුඩු පැකට් 2ක් බඩු මල්ලට එක්විය!");
        } else if (it.type === "herb") {
          this.herbCount += 1;
          this.cb.onNotify("🌿 ඖෂධීය පැළෑටියක් එකතු කරගත්තා! (H ඔබා සුවපත් වන්න)");
        }
        this.items.splice(i, 1);
      }
    }

    // 7. Fireflies & Weather Animations
    this.fireflies.forEach((f) => {
      f.x += f.speedX;
      f.y += f.speedY;
      f.phase += dt * 3;
    });

    this.rainDrops.forEach((r) => {
      r.y += r.speed;
      r.x -= 2;
      if (r.y > this.canvas.height) {
        r.y = -20;
        r.x = Math.random() * (this.canvas.width + 100);
      }
    });

    this.mistClouds.forEach((m) => {
      m.x += m.speed;
      if (m.x > this.worldWidth + m.radius) m.x = -m.radius;
    });

    this.lightningTimer += dt;
    if (this.lightningTimer > 18) {
      this.lightningTimer = 0;
      this.lightningActive = true;
      this.playSfx("thunder");
      setTimeout(() => {
        this.lightningActive = false;
      }, 120);
    }

    // Fade footsteps
    this.footsteps.forEach((f) => {
      f.alpha = Math.max(0, f.alpha - 0.05 * dt);
    });

    // Report stats to UI
    this.cb.onStatsUpdate({
      health: Math.round(this.health),
      sanity: Math.round(this.sanity),
      battery: Math.round(this.battery),
      stamina: Math.round(this.player.stamina),
      torchOn: this.torchOn,
      saltCount: this.saltCount,
      herbCount: this.herbCount,
      nearCampfire,
      hasKey: this.hasKey,
      hasSample: this.hasSample,
      bleeding: this.bleeding,
      playerX: Math.round(this.player.x),
      playerY: Math.round(this.player.y),
      tasks: { ...this.tasks },
    });
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

  // ── 8. Render Loop ────────────────────────────────────────────────────────
  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Rainforest Ground (Deep lush green tile terrain)
    ctx.fillStyle = "#122512";
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Mud trails
    ctx.strokeStyle = "#251c14";
    ctx.lineWidth = 90;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(250, 350);
    ctx.lineTo(520, 750);
    ctx.lineTo(860, 720);
    ctx.lineTo(1350, 500);
    ctx.lineTo(1730, 1120);
    ctx.lineTo(2700, 1800);
    ctx.stroke();

    // Footsteps
    this.footsteps.forEach((f) => {
      ctx.fillStyle = `rgba(30, 20, 15, ${f.alpha})`;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Water Zones
    this.waterZones.forEach((water) => {
      ctx.fillStyle = "#0c2838";
      ctx.fillRect(water.x, water.y, water.w, water.h);

      ctx.strokeStyle = "rgba(70, 160, 210, 0.25)";
      ctx.lineWidth = 3;
      for (let y = water.y + 20; y < water.y + water.h; y += 40) {
        ctx.beginPath();
        const offset = Math.sin(performance.now() * 0.003 + y) * 15;
        ctx.moveTo(water.x + 10, y + offset);
        ctx.lineTo(water.x + water.w - 10, y + offset);
        ctx.stroke();
      }
    });

    // Stepping stones
    this.steppingStones.forEach((s) => {
      ctx.fillStyle = "#4a4a42";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2c2c25";
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // 3. Campfires (Animated Flames)
    this.campfires.forEach((fire) => {
      ctx.fillStyle = "#2c1a0e";
      ctx.beginPath();
      ctx.arc(fire.x, fire.y, fire.radius, 0, Math.PI * 2);
      ctx.fill();

      // Flame core
      const flicker = Math.sin(performance.now() * 0.015) * 4;
      ctx.fillStyle = "#ff6f00";
      ctx.beginPath();
      ctx.arc(fire.x, fire.y - 2, 14 + flicker, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffd54f";
      ctx.beginPath();
      ctx.arc(fire.x, fire.y - 4, 8 + flicker / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Obstacles (Boulders & Cabin Walls)
    this.obstacles.forEach((obs) => {
      if (obs.radius) {
        ctx.fillStyle = "#3a423a";
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1b241b";
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (obs.w) {
        ctx.fillStyle = "#3e2723";
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = "#1b0000";
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      }
    });

    // 5. Ground Items
    this.items.forEach((it) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.arc(it.x, it.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.icon, it.x, it.y);
    });

    // 6. Interactive Objects & Markers
    this.interactiveObjects.forEach((obj) => {
      ctx.fillStyle = "rgba(104, 211, 112, 0.2)";
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.icon, obj.x, obj.y);

      const dist = Math.hypot(obj.x - this.player.x, obj.y - this.player.y);
      if (dist < obj.radius + 50) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.strokeStyle = "#68d370";
        ctx.lineWidth = 1.5;
        const text = `${obj.title} ${obj.prompt}`;
        ctx.font = "14px 'Noto Sans Sinhala', sans-serif";
        const tw = ctx.measureText(text).width + 16;
        ctx.fillRect(obj.x - tw / 2, obj.y - obj.radius - 28, tw, 24);
        ctx.strokeRect(obj.x - tw / 2, obj.y - obj.radius - 28, tw, 24);
        ctx.fillStyle = "#fff";
        ctx.fillText(text, obj.x, obj.y - obj.radius - 15);
      }
    });

    // 7. Enemy Leeches
    this.leeches.forEach((l) => {
      if (!l.alive) return;
      ctx.fillStyle = "#8b0000";
      ctx.beginPath();
      const stretch = Math.sin(l.crawlFrame) * 4;
      ctx.ellipse(l.x, l.y, l.radius + stretch, l.radius - stretch / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 8. Fireflies
    this.fireflies.forEach((f) => {
      const glow = Math.sin(f.phase) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(220, 255, 100, ${glow})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 9. Player Character
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.facingAngle);

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#335533";
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1b331b";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#795548";
    ctx.fillRect(-15, -10, 8, 20);

    ctx.fillStyle = "#ffb74d";
    ctx.beginPath();
    ctx.arc(12, 10, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore(); // Restore world camera

    // ── 10. Dynamic 2D Lighting (Darkness + Flashlight + Campfire Illuminations) ──
    if (!this.lightningActive) {
      ctx.save();
      const pScreenX = this.player.x - this.camera.x;
      const pScreenY = this.player.y - this.camera.y;

      const darknessCanvas = document.createElement("canvas");
      darknessCanvas.width = w;
      darknessCanvas.height = h;
      const dCtx = darknessCanvas.getContext("2d");

      dCtx.fillStyle = "rgba(4, 8, 4, 0.94)";
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

      // B. Carve Flashlight Light Beam Cone
      if (this.torchOn) {
        const beamLength = 340;
        const angle = this.player.facingAngle;
        const coneWidth = 0.55;

        dCtx.beginPath();
        dCtx.moveTo(pScreenX, pScreenY);
        dCtx.arc(pScreenX, pScreenY, beamLength, angle - coneWidth, angle + coneWidth);
        dCtx.closePath();
        dCtx.fill();

        const radGlow = dCtx.createRadialGradient(pScreenX, pScreenY, 10, pScreenX, pScreenY, 70);
        radGlow.addColorStop(0, "rgba(0,0,0,1)");
        radGlow.addColorStop(1, "rgba(0,0,0,0)");
        dCtx.fillStyle = radGlow;
        dCtx.beginPath();
        dCtx.arc(pScreenX, pScreenY, 70, 0, Math.PI * 2);
        dCtx.fill();
      } else {
        const radGlow = dCtx.createRadialGradient(pScreenX, pScreenY, 5, pScreenX, pScreenY, 45);
        radGlow.addColorStop(0, "rgba(0,0,0,0.8)");
        radGlow.addColorStop(1, "rgba(0,0,0,0)");
        dCtx.fillStyle = radGlow;
        dCtx.beginPath();
        dCtx.arc(pScreenX, pScreenY, 45, 0, Math.PI * 2);
        dCtx.fill();
      }

      ctx.drawImage(darknessCanvas, 0, 0);
      ctx.restore();
    }

    // ── 11. Weather Screen Effects (Rain & Lightning Flash) ───────────────────
    if (this.lightningActive) {
      ctx.fillStyle = "rgba(220, 240, 255, 0.4)";
      ctx.fillRect(0, 0, w, h);
    }

    ctx.strokeStyle = "rgba(180, 220, 240, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    this.rainDrops.forEach((r) => {
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 4, r.y + r.length);
    });
    ctx.stroke();

    // ── 12. Bleeding Red Screen Tint ─────────────────────────────────────────
    if (this.bleeding) {
      ctx.fillStyle = "rgba(180, 0, 0, 0.18)";
      ctx.fillRect(0, 0, w, h);
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
  }
}
