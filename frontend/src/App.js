import React, { useState, useEffect, useRef, useCallback } from "react";
import { SinharajaEngine } from "./SinharajaEngine";
import "./App.css";

// ── Chapters Data ─────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 1,
    title: "CHAPTER 01",
    nameSinhala: "කුඩව අඳුරු මාවත",
    nameEnglish: "The Kudawa Trailhead",
    tagline: "අතුරුදහන් වූ ගවේෂකයන්ගේ ආරම්භක හෝඩුවාවන් සෙවීම",
    desc: "කූඩැල්ලන් පිරි මඩ වගුර සහ ගංගා නිම්නය තරණය කර අතහැර දැමූ මුරපොළේ දිනපොත සහ භූගත ලෙනේ සාම්පල සොයාගෙන හෙලිපෑඩ් වෙත ළඟා වන්න.",
    image: "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200",
    status: "active",
    evidenceList: [
      { id: "diary", name: "ලෙයින් පෙඟුණු දිනපොත", icon: "📖" },
      { id: "key", name: "පුරාණ පිත්තල යතුර", icon: "🔑" },
      { id: "sample", name: "පර්යේෂණ සාම්පලය", icon: "🧪" },
    ],
  },
  {
    id: 2,
    title: "CHAPTER 02",
    nameSinhala: "නිහඬ දියඇලි නිම්නය",
    nameEnglish: "The Silent Cascades",
    tagline: "ධාරානිපාත දියඇලි සහ පැරණි පතල් පිවිසුම",
    desc: "සිංහරාජයේ ගැඹුරු දෙවන කලාපය: දියඇලි ජල කඳ අතරින් ගමන් කර අතුරුදහන් වූ දෙවන කඳවුරේ හෝඩුවාවන් සොයාගැනීම.",
    image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=1200",
    status: "locked",
    reqMsg: "Chapter 01 අවසන් කර සාක්ෂි 3ම එකතු කරන්න.",
  },
  {
    id: 3,
    title: "CHAPTER 03",
    nameSinhala: "යක්ෂ ගිරි අගාධය",
    nameEnglish: "The Bioluminescent Abyss",
    tagline: "පොළොව යට සැඟවුණු ප්‍රාග් ඓතිහාසික ලෙන් සංකීර්ණය",
    desc: "අන්ධකාරයේ වෙසෙන අද්භූත සතුන් සහ පැරණි නටබුන් මැදින් සිංහරාජයේ රහස් පර්යේෂණාගාරය සෙවීම.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200",
    status: "locked",
    reqMsg: "Chapter 02 සාර්ථකව නිම කරන්න.",
  },
  {
    id: 4,
    title: "CHAPTER 04",
    nameSinhala: "මහා නාවෘක්ෂය සහ සත්‍යය",
    nameEnglish: "The Colossus & Final Truth",
    tagline: "අවසාන රහස හෙළිදරව් වන හෝරාව",
    desc: "සියලු සාක්ෂි එකලස් කර අතුරුදහන් වීමේ මහා අභිරහස විසඳන තීරණාත්මක අවසානය.",
    image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1200",
    status: "locked",
    reqMsg: "සියලු පරිච්ඡේදවල සාක්ෂි එකතු කිරීමෙන් පසු අගුළු හැරේ.",
  },
];

// ── Dial Puzzle Options ───────────────────────────────────────────────────
const DIAL_1_OPTIONS = ["🌙 සඳ", "☀️ සූර්යයා", "⭐ තාරකාව", "🔥 ගින්න"];
const DIAL_2_OPTIONS = ["⛰️ කන්ද", "🌊 ගංගාව", "🌳 වෘක්ෂය", "💨 සුළඟ"];
const DIAL_3_OPTIONS = ["🐘 හස්තියා", "🦁 සිංහයා", "🦅 පක්ෂියා", "🐍 සර්පයා"];

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // App Navigation States
  const [currentView, setCurrentView] = useState("chapters"); // 'chapters' | 'playing'
  const [activeChapter, setActiveChapter] = useState(1);
  const [gameOver, setGameOver] = useState(null); // 'dead' | 'insane' | 'won'
  const [victoryType, setVictoryType] = useState("survivor");
  const [isPaused, setIsPaused] = useState(false);
  const [showControlsGuide, setShowControlsGuide] = useState(false);

  // UI Panels
  const [showEvidenceBoard, setShowEvidenceBoard] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showTacticalMap, setShowTacticalMap] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [inspectDiaryOpen, setInspectDiaryOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [dialogue, setDialogue] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  // Interactive Rune Puzzle Modal State
  const [runePuzzleOpen, setRunePuzzleOpen] = useState(false);
  const [dial1, setDial1] = useState(0);
  const [dial2, setDial2] = useState(0);
  const [dial3, setDial3] = useState(0);
  const [puzzleError, setPuzzleError] = useState("");
  const unlockCallbackRef = useRef(null);

  // Master Collected Evidence Record
  const [evidence, setEvidence] = useState({
    map: true,
    diary: false,
    key: false,
    sample: false,
  });

  const [journal, setJournal] = useState([
    {
      title: "කුඩව පිවිසුම (Kudawa Trailhead)",
      desc: "සිංහරාජ ලෝක උරුම වැසි වනාන්තරයේ ප්‍රධාන පිවිසුම් මාවතයි.",
    },
  ]);

  // Real-time Stats from Engine
  const [stats, setStats] = useState({
    health: 100,
    sanity: 100,
    battery: 100,
    stamina: 100,
    torchOn: true,
    saltCount: 3,
    herbCount: 1,
    nearCampfire: false,
    hasKey: false,
    hasSample: false,
    bleeding: false,
    playerX: 250,
    playerY: 350,
    tasks: {
      diaryFound: false,
      keyFound: false,
      sampleFound: false,
      helipadReached: false,
    },
  });

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  }, []);

  // Launch Active Chapter
  const launchChapter = (chapId) => {
    if (chapId !== 1) {
      showToast("🔒 මෙම පරිච්ඡේදය තවමත් අගුළු වැටී ඇත! Chapter 01 අවසන් කරන්න.");
      return;
    }
    setActiveChapter(chapId);
    setGameOver(null);
    setIsPaused(false);
    setCurrentView("playing");
    setDialogue({
      title: "CHAPTER 01: කුඩව අඳුරු මාවත",
      speaker: "EXPEDITION HQ",
      avatar: "📡",
      text: "ඔබේ ප්‍රධාන ඉලක්කය: අතුරුදහන් වූ ගවේෂකයන්ගේ සාක්ෂි 3ම (දිනපොත, පිත්තල යතුර, පර්යේෂණ සාම්පලය) සොයාගෙන කඳු මුදුනේ ඇති හෙලිපෑඩ් වෙත ළඟා වන්න!",
    });
  };

  // Toggle Pause
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (engineRef.current) engineRef.current.paused = next;
      return next;
    });
  }, []);

  // Initialize Canvas when playing starts
  useEffect(() => {
    if (currentView !== "playing" || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const engine = new SinharajaEngine(canvas, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
        setEvidence((prev) => ({
          ...prev,
          diary: prev.diary || (newStats.tasks && newStats.tasks.diaryFound),
          key: prev.key || (newStats.tasks && newStats.tasks.keyFound),
          sample: prev.sample || (newStats.tasks && newStats.tasks.sampleFound),
        }));
      },
      onTogglePause: () => {
        togglePause();
      },
      onToggleMap: () => {
        setShowTacticalMap((prev) => {
          if (engineRef.current) {
            engineRef.current.playSfx(prev ? "pda_close" : "pda_open");
          }
          return !prev;
        });
      },
      onToggleInventory: () => {
        setShowInventory((prev) => {
          if (engineRef.current) {
            engineRef.current.playSfx(prev ? "pda_close" : "pda_open");
          }
          return !prev;
        });
      },
      onToggleEvidence: () => {
        setShowEvidenceBoard((prev) => !prev);
      },
      onOpenRunePuzzle: (unlockCallback) => {
        unlockCallbackRef.current = unlockCallback;
        setRunePuzzleOpen(true);
      },
      onTriggerStory: (story) => {
        setDialogue(story);
        if (story.lore) {
          setJournal((prev) => {
            if (prev.some((j) => j.title === story.lore.title)) return prev;
            return [...prev, story.lore];
          });
        }
      },
      onNotify: (msg) => {
        showToast(msg);
      },
      onGameOver: (type) => {
        setGameOver(type);
      },
      onGameWon: (type) => {
        setVictoryType(type);
        setGameOver("won");
      },
    });

    engineRef.current = engine;

    return () => {
      window.removeEventListener("resize", handleResize);
      engine.destroy();
    };
  }, [currentView, gameOver, showToast, togglePause]);

  // Audio Mute Toggle
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.setMuted(next);
      }
      return next;
    });
  };

  // Touch Virtual Controls
  const handleVirtualDir = (key, isDown) => {
    if (engineRef.current) engineRef.current.keys[key] = isDown;
  };

  const handleVirtualAction = (action) => {
    if (!engineRef.current) return;
    if (action === "salt") engineRef.current.throwSalt();
    if (action === "herb") engineRef.current.useHerb();
    if (action === "interact") engineRef.current.interactNearest();
    if (action === "torch") {
      engineRef.current.torchOn = !engineRef.current.torchOn;
    }
  };

  // Dial Turn with Mechanical Click SFX
  const handleDialTurn = (dialIndex, delta) => {
    if (engineRef.current) engineRef.current.playSfx("dial");
    if (dialIndex === 1) {
      setDial1((prev) => (prev + delta + DIAL_1_OPTIONS.length) % DIAL_1_OPTIONS.length);
    } else if (dialIndex === 2) {
      setDial2((prev) => (prev + delta + DIAL_2_OPTIONS.length) % DIAL_2_OPTIONS.length);
    } else if (dialIndex === 3) {
      setDial3((prev) => (prev + delta + DIAL_3_OPTIONS.length) % DIAL_3_OPTIONS.length);
    }
  };

  // Dial Lock Puzzle Submit
  const handleRuneSubmit = () => {
    const choice1 = DIAL_1_OPTIONS[dial1];
    const choice2 = DIAL_2_OPTIONS[dial2];
    const choice3 = DIAL_3_OPTIONS[dial3];

    if (choice1.includes("සූර්යයා") && choice2.includes("ගංගාව") && choice3.includes("සිංහයා")) {
      setRunePuzzleOpen(false);
      showToast("✨ රහස් සංකේත නිවැරදියි! ලෙන් දොරටුව විවෘත විය.");
      if (engineRef.current) engineRef.current.playSfx("pickup");
      if (unlockCallbackRef.current) {
        unlockCallbackRef.current();
      }
    } else {
      if (engineRef.current) engineRef.current.playSfx("hurt");
      setPuzzleError("⚠️ සංකේත ගැලපීම වැරදියි! දිනපොතේ සටහන නැවත සිතා බලන්න.");
      setTimeout(() => setPuzzleError(""), 3500);
    }
  };

  const collectedCount = [evidence.diary, evidence.key, evidence.sample].filter(Boolean).length;

  // Dynamic Active Mission Objective Tracking
  const getActiveObjectiveInfo = () => {
    if (!stats.tasks?.diaryFound) {
      return {
        title: "මුරපොළේ දිනපොත (Ranger Diary)",
        icon: "📖",
        x: 580,
        y: 700,
        desc: "අතහැර දැමූ මුරපොළේ දිනපොත කියවා සාක්ෂි සොයන්න",
      };
    }
    if (!stats.tasks?.keyFound) {
      return {
        title: "පුරාණ පිත්තල යතුර (Ancient Key)",
        icon: "🔑",
        x: 1100,
        y: 850,
        desc: "ගංගා නිම්නයේ ඔරු තොටින් පැරණි පිත්තල යතුර සොයාගන්න",
      };
    }
    if (!stats.tasks?.sampleFound) {
      return {
        title: "භූගත ලෙන & සාම්පලය (Rune Cave)",
        icon: "⛩️",
        x: 1730,
        y: 1120,
        desc: "රහස් සංකේත ගලපා ලෙන් දොරටුව විවෘත කරන්න",
      };
    }
    return {
      title: "ගලවා ගැනීමේ හෙලිපෑඩ් (Rescue Helipad)",
      icon: "🚁",
      x: 2700,
      y: 1800,
      desc: "හෙලිකොප්ටර් කලාපයට ගොස් මෙහෙයුම අවසන් කරන්න",
    };
  };

  const activeObj = getActiveObjectiveInfo();
  const distToActiveObj = Math.round(
    Math.hypot(activeObj.x - stats.playerX, activeObj.y - stats.playerY) / 10
  );

  // Heart Rate BPM (Simulated based on health/danger)
  const heartBpm = stats.bleeding || stats.health < 40 ? 138 : stats.health < 75 ? 96 : 72;

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1: CHAPTER SELECT SCREEN (FLASHCARDS & MISSION DOSSIER)
  // ══════════════════════════════════════════════════════════════════════════
  if (currentView === "chapters") {
    return (
      <div className="chapter-select-screen">
        <div className="fog-overlay" />

        <div className="select-header">
          <div className="header-titles">
            <span className="sub-badge">EXPEDITION DOSSIER // සිංහරාජ අභිරහස</span>
            <h1 className="main-title">SELECT MISSION CHAPTER</h1>
            <p className="main-subtitle">
              පරිච්ඡේද තෝරා එක් එක් මෙහෙයුමේ ඇති සාක්ෂි එකතු කර ප්‍රධාන අභිරහස විසඳන්න.
            </p>
          </div>

          <div className="top-action-bar">
            <button
              className="action-pill evidence-pill"
              onClick={() => setShowEvidenceBoard(true)}
            >
              🔍 සාක්ෂි පුවරුව ({collectedCount} / 3 සාක්ෂි)
            </button>
            <button
              className="action-pill journal-pill"
              onClick={() => setShowJournal(true)}
            >
              📖 වනජීවී සටහන් ({journal.length})
            </button>
          </div>
        </div>

        <div className="chapters-grid">
          {CHAPTERS.map((chap) => {
            const isUnlocked = chap.id === 1;
            return (
              <div
                key={chap.id}
                className={`chapter-flashcard ${isUnlocked ? "unlocked" : "locked"}`}
                onClick={() => isUnlocked && launchChapter(chap.id)}
              >
                <div
                  className="flashcard-image"
                  style={{ backgroundImage: `url(${chap.image})` }}
                >
                  <div className="card-badge-row">
                    <span className="chap-num-badge">{chap.title}</span>
                    <span className={`status-badge ${chap.status}`}>
                      {isUnlocked ? "PLAYABLE" : "LOCKED"}
                    </span>
                  </div>
                </div>

                <div className="flashcard-body">
                  <h2 className="chap-sinhala">{chap.nameSinhala}</h2>
                  <h3 className="chap-english">{chap.nameEnglish}</h3>
                  <p className="chap-tagline">“{chap.tagline}”</p>
                  <p className="chap-desc">{chap.desc}</p>

                  {chap.evidenceList && (
                    <div className="card-evidence-box">
                      <span className="evidence-box-title">🔎 එක්රැස් කළ යුතු සාක්ෂි:</span>
                      <div className="evidence-tags">
                        {chap.evidenceList.map((ev) => {
                          const isFound = evidence[ev.id];
                          return (
                            <span
                              key={ev.id}
                              className={`ev-tag ${isFound ? "found" : "missing"}`}
                            >
                              {ev.icon} {ev.name} {isFound ? "✓" : "○"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!isUnlocked && (
                    <div className="lock-reason">
                      🔒 {chap.reqMsg}
                    </div>
                  )}

                  <button
                    className={`chap-play-btn ${isUnlocked ? "btn-primary" : "btn-locked"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      launchChapter(chap.id);
                    }}
                  >
                    {isUnlocked ? "START CHAPTER 01 ▶" : "LOCKED 🔒"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {toastMsg && <div className="game-toast-floating">{toastMsg}</div>}

        {/* Evidence Board Modal */}
        {showEvidenceBoard && (
          <div className="evidence-modal" onClick={() => setShowEvidenceBoard(false)}>
            <div className="evidence-board" onClick={(e) => e.stopPropagation()}>
              <div className="board-header">
                <h2>📌 සිංහරාජ රහස් සාක්ෂි පුවරුව (EVIDENCE CASE BOARD)</h2>
                <button className="close-btn" onClick={() => setShowEvidenceBoard(false)}>✕</button>
              </div>

              <div className="case-progress-wrap">
                <span>ප්‍රධාන ඉලක්කයේ ප්‍රගතිය:</span>
                <div className="case-progress-bar">
                  <div
                    className="case-progress-fill"
                    style={{ width: `${(collectedCount / 3) * 100}%` }}
                  />
                </div>
                <span>{Math.round((collectedCount / 3) * 100)}% සාක්ෂි හමුවී ඇත</span>
              </div>

              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.diary ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon">📖</div>
                  <h3>ලෙයින් පෙඟුණු දිනපොත</h3>
                  <p>
                    {evidence.diary
                      ? "1987 නොවැම්බර් 14: ඔවුන් ගල් ලෙන තුළට ගිය බවත් ලෙන් දොරටුවේ රහස් සංකේත [සූර්යයා, ගංගාව, සිංහයා] බවත් තහවුරු කරයි."
                      : "තවමත් හමුවී නැත. අතහැර දැමූ මුරපොළ පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.diary ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.key ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon">🔑</div>
                  <h3>පුරාණ පිත්තල යතුර</h3>
                  <p>
                    {evidence.key
                      ? "සිංහරාජයේ රහස් භූගත ලෙනේ අගුළු විවෘත කළ හැකි පැරණි පිත්තල යතුර."
                      : "තවමත් හමුවී නැත. ගංගා නිම්නයේ ඔරු තොට පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.key ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.sample ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon">🧪</div>
                  <h3>පර්යේෂණ සාම්පලය</h3>
                  <p>
                    {evidence.sample
                      ? "වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ ප්‍රතිදීප්ත දිලීර අඩංගු අභිරහස් බඳුන."
                      : "තවමත් හමුවී නැත. අගුළු දැමූ ගල් ලෙන තුළ ඇත..."}
                  </p>
                  <span className="status-tag">{evidence.sample ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Field Journal Modal */}
        {showJournal && (
          <div className="journal-modal" onClick={() => setShowJournal(false)}>
            <div className="journal-content" onClick={(e) => e.stopPropagation()}>
              <div className="journal-header">
                <h2>🌿 සිංහරාජ වනජීවී සටහන් (Field Guide)</h2>
                <button className="close-btn" onClick={() => setShowJournal(false)}>✕</button>
              </div>
              <div className="journal-list">
                {journal.map((item, i) => (
                  <div key={i} className="journal-card">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2: PLAYING GAMEPLAY (NEXT-GEN GAMING HUD INTERFACE)
  // ══════════════════════════════════════════════════════════════════════════
  if (gameOver) {
    let title = "YOU DIED";
    let msg = "කැලේ මැද ඔබේ ජීවිතය අවසන් විය...";
    let cls = "dead-screen";

    if (gameOver === "insane") {
      title = "MIND LOST";
      msg = "අන්ධකාරයේ බිය සහ පිස්සුව නිසා ඔබ සිංහරාජයේ සදහටම අතරමං විය...";
      cls = "insane-screen";
    } else if (gameOver === "won") {
      cls = "won-screen";
      if (victoryType === "hero") {
        title = "MISSION COMPLETE: LEGEND OF SINHARAJA";
        msg = "ඔබ සාක්ෂි 3ම එකතු කර අතුරුදහන් වූ ගවේෂකයන්ගේ අභිරහස හෙළිදරව් කළා! Chapter 01 සාර්ථකව අවසන්!";
      } else {
        title = "CHAPTER 01 SURVIVED";
        msg = "ඔබ දිවි ගලවා ගත්තා! සියලු සාක්ෂි එකතු කිරීමට නැවත උත්සාහ කරන්න.";
      }
    }

    return (
      <div className={`game-over-screen ${cls}`}>
        <div className="game-over-modal">
          <h1 className="game-over-title">{title}</h1>
          <p className="game-over-msg">{msg}</p>
          <div className="modal-buttons">
            <button className="start-btn" onClick={() => launchChapter(1)}>
              නැවත සෙල්ලම් කරන්න (RETRY CHAPTER)
            </button>
            <button className="start-btn secondary-btn" onClick={() => setCurrentView("chapters")}>
              පරිච්ඡේද තෝරන්න (CHAPTER SELECT)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`playable-game-viewport ${stats.health < 30 ? "low-health-vignette" : ""} ${
        stats.sanity < 30 ? "insanity-glitch" : ""
      }`}
    >
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Screen Effects */}
      <div className="crt-scanline-overlay" />

      {/* ── TOP HUD CLUSTER (Tactical Biometric + Compass + Radar) ── */}
      <div className="gaming-hud-top-bar">
        {/* Left: Biometric Survival Pod */}
        <div className="biometric-pod">
          <div className="survivor-profile-tag">
            <span className="profile-callsign">RANGER CALLSIGN: KAVISHKA</span>
            <span className={`profile-status ${stats.bleeding ? "status-danger" : stats.nearCampfire ? "status-safe" : "status-ok"}`}>
              {stats.bleeding ? "🩸 BLEEDING" : stats.nearCampfire ? "🔥 WARMED" : "🟢 STABLE"}
            </span>
          </div>

          {/* ECG Heart Monitor */}
          <div className={`ecg-heart-row ${stats.bleeding || stats.health < 40 ? "danger-ecg" : ""}`}>
            <span className="heart-icon">❤️</span>
            <svg className="ecg-wave-svg" viewBox="0 0 100 24">
              <path
                className="ecg-wave-path"
                d="M0 12 L20 12 L25 4 L30 20 L35 8 L40 14 L45 12 L100 12"
              />
            </svg>
            <span className="ecg-bpm-val">{heartBpm} BPM</span>
          </div>

          {/* Health Bar */}
          <div className="tactical-gauge-row">
            <span className="gauge-label">HP</span>
            <div className="tactical-gauge-track">
              <div className="gauge-fill health-glow" style={{ width: `${stats.health}%` }} />
            </div>
            <span className="gauge-val">{stats.health}</span>
          </div>

          {/* Sanity Bar */}
          <div className="tactical-gauge-row">
            <span className="gauge-label">SAN</span>
            <div className="tactical-gauge-track">
              <div className="gauge-fill sanity-glow" style={{ width: `${stats.sanity}%` }} />
            </div>
            <span className="gauge-val">{stats.sanity}</span>
          </div>

          {/* Stamina & Battery Row */}
          <div className="sub-gauges-row">
            <div className="mini-gauge">
              <span className="mini-icon">⚡</span>
              <div className="mini-track">
                <div className="mini-fill stamina-fill" style={{ width: `${stats.stamina}%` }} />
              </div>
            </div>
            <div className="mini-gauge">
              <span className="mini-icon">🔦</span>
              <div className="mini-track">
                <div className="mini-fill battery-fill" style={{ width: `${stats.battery}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Tactical Expedition Compass Bar */}
        <div className="tactical-compass-pod">
          <div className="compass-tape">
            <span className="compass-mark">NW</span>
            <span className="compass-mark dot">·</span>
            <span className="compass-mark primary-mark">N</span>
            <span className="compass-mark dot">·</span>
            <span className="compass-mark">NE</span>
            <span className="compass-mark dot">·</span>
            <span className="compass-mark primary-mark">E</span>
          </div>
          <div className="compass-nav-pointer">▲</div>
          <div className="compass-objective-chip">
            <span className="chip-icon">{activeObj.icon}</span>
            <span className="chip-text">{activeObj.title}: <strong>{distToActiveObj}m</strong></span>
          </div>
        </div>

        {/* Right: Handheld GPS Terminal & Audio/Pause Buttons */}
        <div className="gps-terminal-pod">
          <div className="gps-header">
            <span className="gps-label">SINHARAJA GPS // PDA</span>
            <span className="gps-coords">LAT 6.40°N | LON 80.45°E</span>
          </div>

          <div
            className="gps-radar-screen"
            title="ක්ලික් කර සම්පූර්ණ සිතියම බලන්න [M]"
            onClick={() => {
              if (engineRef.current) engineRef.current.playSfx("pda_open");
              setShowTacticalMap(true);
            }}
          >
            <div className="radar-sweep-beam" />
            <div
              className="player-radar-dot"
              style={{
                left: `${(stats.playerX / 3200) * 100}%`,
                top: `${(stats.playerY / 2400) * 100}%`,
              }}
            />
            <div
              className="obj-radar-dot"
              style={{
                left: `${(activeObj.x / 3200) * 100}%`,
                top: `${(activeObj.y / 2400) * 100}%`,
              }}
            />
            <span className="radar-click-hint">MAP [M]</span>
          </div>

          <div className="gps-controls-row">
            <button
              className={`tactical-audio-btn ${isMuted ? "muted" : ""}`}
              onClick={toggleMute}
              title="ශබ්ද පාලනය"
            >
              {isMuted ? "🔇 MUTED" : "🔊 SFX ON"}
            </button>
            <button
              className="tactical-map-btn"
              onClick={() => {
                if (engineRef.current) engineRef.current.playSfx("pda_open");
                setShowTacticalMap(true);
              }}
              title="සිතියම [M]"
            >
              🗺️ MAP [M]
            </button>
            <button className="tactical-pause-btn" onClick={togglePause}>
              ⏸️ ESC
            </button>
          </div>
        </div>
      </div>

      {/* ── Left Side Floating Mission Objective HUD ── */}
      <div className="tactical-mission-panel">
        <div className="mission-panel-header">
          <span className="mission-badge">ACTIVE OP</span>
          <span className="mission-chap-title">CHAPTER 0{activeChapter}</span>
        </div>
        <div className="evidence-counter-strip">
          <span>සාක්ෂි ප්‍රගතිය:</span>
          <span className="counter-val">{collectedCount} / 3</span>
        </div>
        <ul className="mission-checklist">
          <li className={stats.tasks?.diaryFound ? "task-complete" : "task-active"}>
            <span className="check-box">{stats.tasks?.diaryFound ? "✓" : "○"}</span>
            <span>මුරපොළේ දිනපොත කියවන්න</span>
          </li>
          <li className={stats.tasks?.keyFound ? "task-complete" : "task-active"}>
            <span className="check-box">{stats.tasks?.keyFound ? "✓" : "○"}</span>
            <span>පුරාණ පිත්තල යතුර සොයාගන්න</span>
          </li>
          <li className={stats.tasks?.sampleFound ? "task-complete" : "task-active"}>
            <span className="check-box">{stats.tasks?.sampleFound ? "✓" : "○"}</span>
            <span>පර්යේෂණ සාම්පලය අහුලාගන්න</span>
          </li>
          <li className={stats.tasks?.helipadReached ? "task-complete" : "task-active"}>
            <span className="check-box">{stats.tasks?.helipadReached ? "✓" : "○"}</span>
            <span>හෙලිකොප්ටර් කලාපයට යන්න</span>
          </li>
        </ul>
      </div>

      {/* Campfire Warmth Alert */}
      {stats.nearCampfire && (
        <div className="campfire-safe-badge">
          🔥 ගිනිමැලය අසල: Health & Sanity සුවපත් වෙමින් පවතී
        </div>
      )}

      {/* Danger Bleeding Alert */}
      {stats.bleeding && (
        <div className="bleeding-alert">
          🩸 කූඩැල්ලා එල්ලී ඇත! ලුණු දමන්න [1] හෝ [SPACE]
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && <div className="game-toast-floating">{toastMsg}</div>}

      {/* ── Cinematic Letterbox Dialogue Box with Character Portrait ── */}
      {dialogue && (
        <div className="cinematic-dialogue-screen" onClick={() => setDialogue(null)}>
          <div className="letterbox-bar top-bar" />
          <div className="cinematic-dialogue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dialogue-avatar-frame">
              <span className="dialogue-avatar-icon">{dialogue.avatar || "🧙‍♂️"}</span>
            </div>
            <div className="dialogue-text-wrap">
              <div className="dialogue-speaker-tag">
                {dialogue.speaker || "ගවේෂණ සටහන // LOG"}
              </div>
              <h2 className="dialogue-scene-title">{dialogue.title}</h2>
              <p className="dialogue-paragraph">{dialogue.text}</p>
              {dialogue.item && (
                <div className="dialogue-item-reward">
                  ✨ අයිතමය ලැබුණි: <strong>{dialogue.item}</strong>
                </div>
              )}
              <button className="dialogue-advance-btn" onClick={() => setDialogue(null)}>
                ඉදිරියට යන්න (CONTINUE) [SPACE]
              </button>
            </div>
          </div>
          <div className="letterbox-bar bottom-bar" />
        </div>
      )}

      {/* ── Interactive Rune Dial Lock Puzzle Modal ── */}
      {runePuzzleOpen && (
        <div className="rune-puzzle-overlay">
          <div className="rune-puzzle-card">
            <div className="puzzle-header">
              <h2>⛩️ පුරාණ සිංහරාජ ගල් ලෙන් දොරටුවේ රහස් කේතය</h2>
              <button className="close-btn" onClick={() => setRunePuzzleOpen(false)}>✕</button>
            </div>
            <p className="puzzle-hint-text">
              දිනපොතේ සඳහන් වූ රහස් සංකේත 3 ගලපන්න:<br />
              <em>“හිරු නැගෙන හෝරාවේ... ගංගාවෙන් එතෙර වී... සිංහයාගේ ලෙනට...”</em>
            </p>

            <div className="rune-dials-row">
              <div className="dial-box">
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(1, -1)}
                >
                  ▲
                </button>
                <div className="dial-value">{DIAL_1_OPTIONS[dial1]}</div>
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(1, 1)}
                >
                  ▼
                </button>
              </div>

              <div className="dial-box">
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(2, -1)}
                >
                  ▲
                </button>
                <div className="dial-value">{DIAL_2_OPTIONS[dial2]}</div>
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(2, 1)}
                >
                  ▼
                </button>
              </div>

              <div className="dial-box">
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(3, -1)}
                >
                  ▲
                </button>
                <div className="dial-value">{DIAL_3_OPTIONS[dial3]}</div>
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(3, 1)}
                >
                  ▼
                </button>
              </div>
            </div>

            {puzzleError && <div className="puzzle-error-alert">{puzzleError}</div>}

            <button className="start-btn unlock-gate-btn" onClick={handleRuneSubmit}>
              🔓 දොර අගුළු හරින්න (UNLOCK GATE)
            </button>
          </div>
        </div>
      )}

      {/* ── ESC Tactical Pause Menu Modal ── */}
      {isPaused && (
        <div className="tactical-pause-overlay">
          <div className="tactical-pause-modal">
            <h1 className="pause-title">MISSION PAUSED</h1>
            <p className="pause-subtitle">SINHARAJA EXPEDITION // TACTICAL OVERVIEW</p>

            <div className="pause-menu-actions">
              <button className="pause-menu-btn resume-btn" onClick={togglePause}>
                ▶ RESUME EXPEDITION (ඉදිරියට)
              </button>
              <button className="pause-menu-btn" onClick={() => setShowEvidenceBoard(true)}>
                🔍 EVIDENCE CASE BOARD (සාක්ෂි පුවරුව)
              </button>
              <button className="pause-menu-btn" onClick={() => setShowJournal(true)}>
                📖 WILDLIFE FIELD GUIDE (වනජීවී සටහන්)
              </button>
              <button className="pause-menu-btn" onClick={() => setShowControlsGuide(true)}>
                ⌨️ CONTROLS GUIDE (පාලනයන්)
              </button>
              <button className="pause-menu-btn" onClick={() => launchChapter(1)}>
                🔄 RESTART MISSION (නැවත අරඹන්න)
              </button>
              <button className="pause-menu-btn quit-btn" onClick={() => setCurrentView("chapters")}>
                🚪 QUIT TO CHAPTER SELECT (පරිච්ඡේද තෝරන්න)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Guide Modal */}
      {showControlsGuide && (
        <div className="controls-guide-modal" onClick={() => setShowControlsGuide(false)}>
          <div className="controls-guide-card" onClick={(e) => e.stopPropagation()}>
            <div className="guide-header">
              <h2>⌨️ KEYBOARD & MOUSE CONTROLS</h2>
              <button className="close-btn" onClick={() => setShowControlsGuide(false)}>✕</button>
            </div>
            <div className="guide-grid">
              <div className="guide-row"><span className="kbd">W A S D / ඊතල</span><span>ඇවිදීම (Move Explorer)</span></div>
              <div className="guide-row"><span className="kbd">SHIFT</span><span>වේගයෙන් දිවීම (Sprint)</span></div>
              <div className="guide-row"><span className="kbd">1 / SPACE</span><span>කූඩැල්ලන්ට ලුණු දැමීම (Throw Salt)</span></div>
              <div className="guide-row"><span className="kbd">2 / H</span><span>ඖෂධ භාවිතය (Heal +30 HP)</span></div>
              <div className="guide-row"><span className="kbd">3 / F</span><span>විදුලි පන්දම (Flashlight On/Off)</span></div>
              <div className="guide-row"><span className="kbd">4 / E</span><span>පරීක්ෂාව / ඇරීම (Interact)</span></div>
              <div className="guide-row"><span className="kbd">ESC</span><span>Pause Menu</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Tactical Quick-Action Belt ── */}
      <div className="tactical-action-belt">
        <div className="belt-slot" onClick={() => handleVirtualAction("salt")}>
          <span className="belt-hotkey">[1]</span>
          <span className="belt-icon">🧂</span>
          <span className="belt-tag">ලුණු ({stats.saltCount})</span>
        </div>

        <div
          className={`belt-slot ${stats.herbCount > 0 ? "" : "slot-empty"}`}
          onClick={() => handleVirtualAction("herb")}
        >
          <span className="belt-hotkey">[2]</span>
          <span className="belt-icon">🌿</span>
          <span className="belt-tag">ඖෂධ ({stats.herbCount})</span>
        </div>

        <div
          className={`belt-slot ${stats.torchOn ? "belt-torch-on" : ""}`}
          onClick={() => handleVirtualAction("torch")}
        >
          <span className="belt-hotkey">[3]</span>
          <span className="belt-icon">🔦</span>
          <span className="belt-tag">{stats.torchOn ? "TORCH ON" : "TORCH OFF"}</span>
        </div>

        <div className="belt-slot" onClick={() => handleVirtualAction("interact")}>
          <span className="belt-hotkey">[4]</span>
          <span className="belt-icon">🔎</span>
          <span className="belt-tag">පරීක්ෂාව</span>
        </div>

        <div className="belt-slot" onClick={() => setShowEvidenceBoard(true)}>
          <span className="belt-hotkey">[5]</span>
          <span className="belt-icon">📋</span>
          <span className="belt-tag">සාක්ෂි ({collectedCount}/3)</span>
        </div>

        <div
          className="belt-slot"
          onClick={() => {
            if (engineRef.current) engineRef.current.playSfx("pda_open");
            setShowTacticalMap(true);
          }}
        >
          <span className="belt-hotkey">[M]</span>
          <span className="belt-icon">🗺️</span>
          <span className="belt-tag">සිතියම</span>
        </div>

        <div
          className="belt-slot"
          onClick={() => {
            if (engineRef.current) engineRef.current.playSfx("pda_open");
            setShowInventory(true);
          }}
        >
          <span className="belt-hotkey">[I]</span>
          <span className="belt-icon">🎒</span>
          <span className="belt-tag">බඩු මල්ල</span>
        </div>

        {stats.hasKey && (
          <div className="belt-slot quest-slot">
            <span className="belt-icon">🔑</span>
            <span className="belt-tag">පිත්තල යතුර</span>
          </div>
        )}

        {stats.hasSample && (
          <div className="belt-slot quest-slot highlight">
            <span className="belt-icon">🧪</span>
            <span className="belt-tag">සාම්පල</span>
          </div>
        )}
      </div>

      {/* Evidence Board Modal while Playing */}
      {showEvidenceBoard && (
        <div className="evidence-modal" onClick={() => setShowEvidenceBoard(false)}>
          <div className="evidence-board" onClick={(e) => e.stopPropagation()}>
            <div className="board-header">
              <h2>📌 සිංහරාජ රහස් සාක්ෂි පුවරුව (EVIDENCE CASE BOARD)</h2>
              <button className="close-btn" onClick={() => setShowEvidenceBoard(false)}>✕</button>
            </div>

            <div className="case-progress-wrap">
              <span>ප්‍රධාන ඉලක්කයේ ප්‍රගතිය:</span>
              <div className="case-progress-bar">
                <div
                  className="case-progress-fill"
                  style={{ width: `${(collectedCount / 3) * 100}%` }}
                />
              </div>
              <span>{Math.round((collectedCount / 3) * 100)}% සාක්ෂි හමුවී ඇත</span>
            </div>

            <div className="evidence-cards-cluster">
              <div className={`evidence-polaroid ${evidence.diary ? "collected" : "uncollected"}`}>
                <div className="pin-head red-pin" />
                <div className="polaroid-icon">📖</div>
                <h3>ලෙයින් පෙඟුණු දිනපොත</h3>
                <p>
                  {evidence.diary
                    ? "1987 නොවැම්බර් 14: ඔවුන් ගල් ලෙන තුළට ගිය බවත් ලෙන් දොරටුවේ රහස් සංකේත [සූර්යයා, ගංගාව, සිංහයා] බවත් තහවුරු කරයි."
                    : "තවමත් හමුවී නැත. අතහැර දැමූ මුරපොළ පරීක්ෂා කරන්න..."}
                </p>
                <span className="status-tag">{evidence.diary ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
              </div>

              <div className={`evidence-polaroid ${evidence.key ? "collected" : "uncollected"}`}>
                <div className="pin-head yellow-pin" />
                <div className="polaroid-icon">🔑</div>
                <h3>පුරාණ පිත්තල යතුර</h3>
                <p>
                  {evidence.key
                    ? "සිංහරාජයේ රහස් භූගත ලෙනේ අගුළු විවෘත කළ හැකි පැරණි පිත්තල යතුර."
                    : "තවමත් හමුවී නැත. ගංගා නිම්නයේ ඔරු තොට පරීක්ෂා කරන්න..."}
                </p>
                <span className="status-tag">{evidence.key ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
              </div>

              <div className={`evidence-polaroid ${evidence.sample ? "collected" : "uncollected"}`}>
                <div className="pin-head blue-pin" />
                <div className="polaroid-icon">🧪</div>
                <h3>පර්යේෂණ සාම්පලය</h3>
                <p>
                  {evidence.sample
                    ? "වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ ප්‍රතිදීප්ත දිලීර අඩංගු අභිරහස් බඳුන."
                    : "තවමත් හමුවී නැත. අගුළු දැමූ ගල් ලෙන තුළ ඇත..."}
                </p>
                <span className="status-tag">{evidence.sample ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Journal Modal */}
      {showJournal && (
        <div className="journal-modal" onClick={() => setShowJournal(false)}>
          <div className="journal-content" onClick={(e) => e.stopPropagation()}>
            <div className="journal-header">
              <h2>🌿 සිංහරාජ වනජීවී සටහන් (Field Guide)</h2>
              <button className="close-btn" onClick={() => setShowJournal(false)}>✕</button>
            </div>
            <div className="journal-list">
              {journal.map((item, i) => (
                <div key={i} className="journal-card">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Full Tactical Topographic Satellite Map PDA Modal [M] ── */}
      {showTacticalMap && (
        <div className="tactical-pda-modal-overlay" onClick={() => setShowTacticalMap(false)}>
          <div className="tactical-pda-device" onClick={(e) => e.stopPropagation()}>
            <div className="pda-frame-header">
              <div className="pda-branding">
                <span className="pda-mil-badge">MIL-SPEC PDA // MK-IV</span>
                <h3>🛰️ SINHARAJA TOPOGRAPHIC SATELLITE MAP</h3>
              </div>
              <div className="pda-live-telemetry">
                <span>LAT: 6.405° N</span>
                <span>LON: 80.453° E</span>
                <span>ELEV: 418m</span>
                <button
                  className="pda-close-btn"
                  onClick={() => {
                    if (engineRef.current) engineRef.current.playSfx("pda_close");
                    setShowTacticalMap(false);
                  }}
                >
                  ✕ CLOSE [M]
                </button>
              </div>
            </div>

            <div className="pda-screen-content">
              <div className="pda-map-viewport">
                <div className="satellite-topo-grid" />

                {/* River Stream */}
                <div className="topo-river-band" />

                {/* Zones Labels */}
                <div className="topo-zone-tag zone-kudawa" style={{ left: "10%", top: "16%" }}>
                  <span>🏕️ KUDAWA ENTRY (කඳවුර)</span>
                </div>
                <div className="topo-zone-tag zone-outpost" style={{ left: "18%", top: "34%" }}>
                  <span>🛖 RANGER OUTPOST (මුරපොළ)</span>
                </div>
                <div className="topo-zone-tag zone-river" style={{ left: "36%", top: "38%" }}>
                  <span>🛶 RIVER CROSSING (ඔරු තොට)</span>
                </div>
                <div className="topo-zone-tag zone-swamp hazard" style={{ left: "44%", top: "60%" }}>
                  <span>⚠️ LEECH SWAMP (කූඩැලි වගුර)</span>
                </div>
                <div className="topo-zone-tag zone-cave" style={{ left: "55%", top: "48%" }}>
                  <span>⛩️ RUNIC CAVE (පුරාණ ලෙන)</span>
                </div>
                <div className="topo-zone-tag zone-helipad extract" style={{ left: "82%", top: "75%" }}>
                  <span>🚁 EXTRACTION HELIPAD (හෙලිපෑඩ්)</span>
                </div>

                {/* Safe Campfire Pins */}
                <div className="map-pin campfire-pin" style={{ left: "15%", top: "37%" }} title="මුරපොළේ ගිනිමැලය">🔥</div>
                <div className="map-pin campfire-pin" style={{ left: "51%", top: "58%" }} title="ලෙන් දොරටුවේ ගිනිමැලය">🔥</div>

                {/* Player Real-Time Marker with Beacon Rings */}
                <div
                  className="pda-player-beacon"
                  style={{
                    left: `${(stats.playerX / 3200) * 100}%`,
                    top: `${(stats.playerY / 2400) * 100}%`,
                  }}
                >
                  <div className="beacon-ping" />
                  <div className="beacon-core" />
                  <span className="beacon-label">YOU (EXPLORER)</span>
                </div>

                {/* Active Objective Pin */}
                <div
                  className="pda-objective-pin"
                  style={{
                    left: `${(activeObj.x / 3200) * 100}%`,
                    top: `${(activeObj.y / 2400) * 100}%`,
                  }}
                >
                  <span className="obj-pin-icon">{activeObj.icon}</span>
                  <div className="obj-pin-sonar" />
                  <span className="obj-pin-text">{activeObj.title} [{distToActiveObj}m]</span>
                </div>
              </div>

              {/* Tactical Map Side Dossier */}
              <div className="pda-side-dossier">
                <div className="dossier-card">
                  <h4>🎯 ACTIVE MISSION DIRECTIVE</h4>
                  <div className="dossier-obj-header">
                    <span className="dossier-icon">{activeObj.icon}</span>
                    <div>
                      <strong>{activeObj.title}</strong>
                      <p>{activeObj.desc}</p>
                    </div>
                  </div>
                  <div className="dossier-dist-meter">
                    <span>ඉලක්කයට දුර:</span>
                    <span className="dist-highlight">{distToActiveObj} METERS</span>
                  </div>
                </div>

                <div className="dossier-card">
                  <h4>🗺️ MAP LEGEND & ADVISORY</h4>
                  <ul className="map-legend-list">
                    <li><span className="legend-dot dot-player" /> <strong>ඔබගේ ස්ථානය:</strong> තත්‍ය කාලීන GPS සංඥාව</li>
                    <li><span className="legend-dot dot-obj" /> <strong>වත්මන් ඉලක්කය:</strong> ප්‍රමුඛ හෝඩුවාව</li>
                    <li><span className="legend-dot dot-fire" /> <strong>ගිනිමැල කලාප:</strong> Health / Sanity සුවපත් කරයි</li>
                    <li><span className="legend-dot dot-danger" /> <strong>අන්තරායකර කලාප:</strong> කූඩැල්ලන් සහ ගැඹුරු දියපාරවල්</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Survival Backpack / Inventory Modal [I] ── */}
      {showInventory && (
        <div className="survival-inventory-overlay" onClick={() => setShowInventory(false)}>
          <div className="survival-inventory-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inventory-header">
              <div className="inv-title-box">
                <span className="inv-badge">EXPEDITION FIELD GEAR // CHAPTER 01</span>
                <h2>🎒 පැවැත්මේ බඩු මල්ල (SURVIVAL BACKPACK)</h2>
              </div>
              <button
                className="close-btn"
                onClick={() => {
                  if (engineRef.current) engineRef.current.playSfx("pda_close");
                  setShowInventory(false);
                }}
              >
                ✕ CLOSE [I]
              </button>
            </div>

            <div className="inventory-grid-wrap">
              {/* Item 1: Salt */}
              <div className="inv-item-card">
                <div className="inv-item-icon">🧂</div>
                <div className="inv-item-info">
                  <h3>පිරිසිදු ලුණු පැකට් (Salt Pouches)</h3>
                  <span className="inv-item-qty">තොගය: {stats.saltCount} ක්</span>
                  <p>කූඩැල්ලන් ශරීරයට එල්ලී ලේ උරා බොද්දී ඔවුන් විනාශ කිරීමට භාවිතා කරයි.</p>
                </div>
                <button
                  className="inv-action-btn"
                  disabled={stats.saltCount <= 0}
                  onClick={() => {
                    if (engineRef.current) engineRef.current.throwSalt();
                  }}
                >
                  විසි කරන්න [1]
                </button>
              </div>

              {/* Item 2: Herb */}
              <div className="inv-item-card">
                <div className="inv-item-icon">🌿</div>
                <div className="inv-item-info">
                  <h3>සුවදායක වැසි වනාන්තර ඖෂධ (Medicinal Herbs)</h3>
                  <span className="inv-item-qty">තොගය: {stats.herbCount} ක්</span>
                  <p>තුවාල සුවපත් කර +30 Health ලබාදෙන දුර්ලභ සිංහරාජ වනජීවී පැළෑටියකි.</p>
                </div>
                <button
                  className="inv-action-btn heal-btn"
                  disabled={stats.herbCount <= 0}
                  onClick={() => {
                    if (engineRef.current) engineRef.current.useHerb();
                  }}
                >
                  සුවපත් වන්න (+30 HP) [2]
                </button>
              </div>

              {/* Item 3: Torch */}
              <div className="inv-item-card">
                <div className="inv-item-icon">🔦</div>
                <div className="inv-item-info">
                  <h3>ක්‍ෂේත්‍ර විදුලි පන්දම (Heavy Halogen Torch)</h3>
                  <span className="inv-item-qty">
                    බැටරි: {stats.battery}% | තත්ත්වය: {stats.torchOn ? "ක්‍රියාත්මකයි (ON)" : "අක්‍රියයි (OFF)"}
                  </span>
                  <p>ඝන අන්ධකාරය දුරු කර Sanity ආරක්ෂා කරගැනීමට අවශ්‍ය වේ.</p>
                </div>
                <button
                  className="inv-action-btn"
                  onClick={() => {
                    if (engineRef.current) {
                      engineRef.current.torchOn = !engineRef.current.torchOn;
                      engineRef.current.playSfx("step");
                    }
                  }}
                >
                  {stats.torchOn ? "නිවන්න (OFF)" : "දල්වන්න (ON)"} [3]
                </button>
              </div>

              {/* Item 4: Diary */}
              <div className={`inv-item-card ${evidence.diary ? "item-discovered" : "item-missing"}`}>
                <div className="inv-item-icon">📖</div>
                <div className="inv-item-info">
                  <h3>ලෙයින් පෙඟුණු දිනපොත (Bloody Ranger Diary)</h3>
                  <span className="inv-item-qty">{evidence.diary ? "✓ හමුවිය (EVIDENCE 01)" : "තවමත් හමුවී නැත"}</span>
                  <p>
                    {evidence.diary
                      ? "1987 ගවේෂණ කණ්ඩායමේ රහස් සටහන් සහ ලෙන් දොරටුවේ රහස් කේතය අඩංගුය."
                      : "මුරපොළේ මේසය පරීක්ෂා කර සොයාගන්න."}
                  </p>
                </div>
                {evidence.diary && (
                  <button
                    className="inv-action-btn inspect-btn"
                    onClick={() => setInspectDiaryOpen(true)}
                  >
                    කියවන්න (INSPECT)
                  </button>
                )}
              </div>

              {/* Item 5: Brass Key */}
              <div className={`inv-item-card ${evidence.key ? "item-discovered" : "item-missing"}`}>
                <div className="inv-item-icon">🔑</div>
                <div className="inv-item-info">
                  <h3>පුරාණ පිත්තල යතුර (Ancient Brass Key)</h3>
                  <span className="inv-item-qty">{evidence.key ? "✓ ළඟ ඇත (EVIDENCE 02)" : "තවමත් හමුවී නැත"}</span>
                  <p>
                    {evidence.key
                      ? "සිංහරාජයේ රහස් භූගත ලෙන විවෘත කිරීමට අවශ්‍ය පුරාණ කැටයම් සහිත යතුරයි."
                      : "ගංගා ඉවුරේ පැරණි ඔරුව අසල ඇත."}
                  </p>
                </div>
              </div>

              {/* Item 6: Research Sample */}
              <div className={`inv-item-card ${evidence.sample ? "item-discovered highlight" : "item-missing"}`}>
                <div className="inv-item-icon">🧪</div>
                <div className="inv-item-info">
                  <h3>පර්යේෂණ සාම්පලය (Bioluminescent Sample)</h3>
                  <span className="inv-item-qty">{evidence.sample ? "✓ ළඟ ඇත (EVIDENCE 03)" : "තවමත් හමුවී නැත"}</span>
                  <p>
                    {evidence.sample
                      ? "වසර 30ක් අතුරුදහන් වූ කණ්ඩායම සොයාගත් නිල් ආලෝකය විහිදුවන දිලීර සාම්පලය."
                      : "ගල් ලෙන තුළ ආරක්ෂිතව ඇත."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Handwritten Diary Parchment Modal ── */}
      {inspectDiaryOpen && (
        <div className="diary-inspect-overlay" onClick={() => setInspectDiaryOpen(false)}>
          <div className="diary-parchment-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-pin-header">
              <span className="sheet-date">1987 නොවැම්බර් මස 14 වන දින - කුඩව මුරපොළ</span>
              <button className="close-btn" onClick={() => setInspectDiaryOpen(false)}>✕</button>
            </div>
            <div className="handwritten-entry">
              <h3>මහාචාර්ය ඩග්ලස්ගේ අත්අකුරු සටහන:</h3>
              <p>
                “...අපගේ පර්යේෂණ කණ්ඩායමේ තිදෙනාම දැන් සූදානම්. රාත්‍රියේදී කැලයේ අමුතු ශබ්ද ඇසෙයි.
                කූඩැල්ලන්ගෙන් බේරීමට ගිනිමැල දැල්වීම අත්‍යවශ්‍ය වේ.
              </p>
              <p>
                ගංගාවෙන් එතෙර වී කඳු පාමුල ඇති පුරාණ ලෙනට පිවිසීමට නම්, ගල් දොරටුවේ ඇති සංකේත තුන
                පිළිවෙලින් තැබිය යුතුය:
              </p>
              <div className="rune-secret-highlight">
                <strong>1. ☀️ සූර්යයා (The Sun)</strong><br />
                <strong>2. 🌊 ගංගාව (The River)</strong><br />
                <strong>3. 🦁 සිංහයා (The Lion)</strong>
              </div>
              <p>
                යතුර ගංගා ඉවුරේ පැරණි ඔරු තොටේ සඟවා තැබුවෙමි. දෙවියනේ අපට පිහිට වන්න...”
              </p>
            </div>
            <button className="diary-close-action" onClick={() => setInspectDiaryOpen(false)}>
              සටහන වසන්න (CLOSE DIARY)
            </button>
          </div>
        </div>
      )}

      {/* Touch D-Pad for Mobile */}
      <div className="touch-controls">
        <div className="dpad-box">
          <button
            className="dpad-btn up"
            onMouseDown={() => handleVirtualDir("w", true)}
            onMouseUp={() => handleVirtualDir("w", false)}
            onTouchStart={() => handleVirtualDir("w", true)}
            onTouchEnd={() => handleVirtualDir("w", false)}
          >
            ▲
          </button>
          <div className="dpad-row">
            <button
              className="dpad-btn left"
              onMouseDown={() => handleVirtualDir("a", true)}
              onMouseUp={() => handleVirtualDir("a", false)}
              onTouchStart={() => handleVirtualDir("a", true)}
              onTouchEnd={() => handleVirtualDir("a", false)}
            >
              ◀
            </button>
            <button
              className="dpad-btn right"
              onMouseDown={() => handleVirtualDir("d", true)}
              onMouseUp={() => handleVirtualDir("d", false)}
              onTouchStart={() => handleVirtualDir("d", true)}
              onTouchEnd={() => handleVirtualDir("d", false)}
            >
              ▶
            </button>
          </div>
          <button
            className="dpad-btn down"
            onMouseDown={() => handleVirtualDir("s", true)}
            onMouseUp={() => handleVirtualDir("s", false)}
            onTouchStart={() => handleVirtualDir("s", true)}
            onTouchEnd={() => handleVirtualDir("s", false)}
          >
            ▼
          </button>
        </div>

        <div className="action-buttons-touch">
          <button
            className="touch-action-btn map-touch"
            onClick={() => {
              if (engineRef.current) engineRef.current.playSfx("pda_open");
              setShowTacticalMap(true);
            }}
          >
            🗺️ MAP
          </button>
          <button
            className="touch-action-btn bag-touch"
            onClick={() => {
              if (engineRef.current) engineRef.current.playSfx("pda_open");
              setShowInventory(true);
            }}
          >
            🎒 BAG
          </button>
          <button
            className="touch-action-btn salt-touch"
            onClick={() => handleVirtualAction("salt")}
          >
            🧂 SALT
          </button>
          <button
            className="touch-action-btn herb-touch"
            onClick={() => handleVirtualAction("herb")}
          >
            🌿 HEAL
          </button>
          <button
            className="touch-action-btn interact-touch"
            onClick={() => handleVirtualAction("interact")}
          >
            🔎 [E]
          </button>
        </div>
      </div>
    </div>
  );
}