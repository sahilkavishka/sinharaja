import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
} from "react";
import axios from "axios";
import "./App.css";

// ── Constants ──────────────────────────────────────────────────────────────
const API_BASE = "http://127.0.0.1:8000/api";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1440342359726-5918314352d8?q=80&w=1920";
const TYPEWRITER_SPEED_MS = 40;

const INITIAL_STATS = { health: 100, sanity: 100 };

// ── Game State Reducer ─────────────────────────────────────────────────────
const initialState = {
  ...INITIAL_STATS,
  inventory: [],
  sceneId: 1,
  gameStarted: false,
  gameOver: null, // null | 'dead' | 'insane' | 'won'
};

function gameReducer(state, action) {
  switch (action.type) {
    case "START":
      return { ...initialState, gameStarted: true };
    case "RESTART":
      return { ...initialState, gameStarted: true };
    case "APPLY_CHOICE": {
      const { nextId, healthEffect, sanityEffect, givenItem } = action.payload;
      let health = Math.min(100, state.health + (healthEffect || 0));
      let sanity = Math.min(100, state.sanity + (sanityEffect || 0));
      const inventory =
        givenItem && !state.inventory.includes(givenItem)
          ? [...state.inventory, givenItem]
          : state.inventory;

      if (health <= 0) return { ...state, health: 0, gameOver: "dead" };
      if (sanity <= 0) return { ...state, sanity: 0, gameOver: "insane" };
      if (nextId === 0) return { ...state, health, sanity, inventory, gameOver: "won" };

      return { ...state, health, sanity, inventory, sceneId: nextId };
    }
    case "ADD_ITEM": {
      if (state.inventory.includes(action.payload)) return state;
      return { ...state, inventory: [...state.inventory, action.payload] };
    }
    case "GAME_OVER":
      return { ...state, gameOver: action.payload };
    default:
      return state;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatBar({ label, value, fillClass }) {
  return (
    <div className="stat-box">
      <span className="stat-label">{label}</span>
      <div className="progress-bar">
        <div className={fillClass} style={{ width: `${value}%` }} />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function GameOverScreen({ type, onRestart }) {
  const screens = {
    dead: {
      title: "YOU DIED",
      message: "කැලේ මැද ඔයාගේ ජීවිතය අවසන් විය...",
      btnLabel: "TRY AGAIN",
      className: "dead-screen",
    },
    insane: {
      title: "MIND LOST",
      message: "සිහිකල්පනාව අහිමි වී ඔයා කැලේ අතරමං වුණා...",
      btnLabel: "TRY AGAIN",
      className: "insane-screen",
    },
    won: {
      title: "SURVIVED!",
      message: "ඔයා සිංහරාජයේ අභිරහස ජය ගත්තා!",
      btnLabel: "PLAY AGAIN",
      className: "won-screen",
    },
  };

  const { title, message, btnLabel, className } = screens[type] || screens.dead;

  return (
    <div className={`game-over-screen ${className}`}>
      <h1>{title}</h1>
      <p>{message}</p>
      <button className="start-btn" onClick={onRestart}>
        {btnLabel}
      </button>
    </div>
  );
}

// ── Sound Hook ─────────────────────────────────────────────────────────────
function useSounds() {
  const bgmRef = useRef(null);
  const clickRef = useRef(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    bgmRef.current = new Audio("/sounds/bgm.mp3");
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.5;

    clickRef.current = new Audio("/sounds/click.mp3");

    return () => {
      bgmRef.current?.pause();
    };
  }, []);

  const playBgm = useCallback(() => {
    bgmRef.current?.play().catch(() => {});
  }, []);

  const playClick = useCallback(() => {
    if (!clickRef.current) return;
    clickRef.current.currentTime = 0;
    clickRef.current.play().catch(() => {});
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (bgmRef.current) bgmRef.current.muted = next;
      if (clickRef.current) clickRef.current.muted = next;
      return next;
    });
  }, []);

  return { playBgm, playClick, toggleMute, muted };
}

// ── Typewriter Hook ────────────────────────────────────────────────────────
function useTypewriter(text, skip = false) {
  const [displayed, setDisplayed] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!text) return;

    // Clear any running interval immediately
    clearInterval(intervalRef.current);
    setDisplayed("");

    if (skip) {
      setDisplayed(text);
      return;
    }

    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayed((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(intervalRef.current);
      }
    }, TYPEWRITER_SPEED_MS);

    return () => clearInterval(intervalRef.current);
  }, [text, skip]);

  // Allow clicking to skip the animation
  const skipAnimation = useCallback(() => {
    clearInterval(intervalRef.current);
    setDisplayed(text);
  }, [text]);

  return { displayed, skipAnimation };
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { health, sanity, inventory, sceneId, gameStarted, gameOver } = state;

  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [missingItemMsg, setMissingItemMsg] = useState("");

  const { playBgm, playClick, toggleMute, muted } = useSounds();

  // ── Fetch scene ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    axios
      .get(`${API_BASE}/scene/${sceneId}/`, { signal: controller.signal })
      .then(({ data }) => {
        setSceneData(data);
        if (data.given_item) {
          dispatch({ type: "ADD_ITEM", payload: data.given_item });
        }
        setTimeLeft(data.is_timed ? data.time_limit : null);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError("장면을 불러오는 데 실패했습니다. 다시 시도해 주세요.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [sceneId, gameStarted, gameOver]);

  // ── Typewriter ─────────────────────────────────────────────────────────
  const { displayed: typedText, skipAnimation } = useTypewriter(
    sceneData?.description ?? "",
    !!sceneData?.is_timed
  );

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || gameOver) return;

    if (timeLeft === 0) {
      handleChoice(
        sceneData.timeout_next_id,
        sceneData.timeout_health_effect,
        0,
        null
      );
      return;
    }

    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameOver]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    dispatch({ type: "START" });
    playBgm();
    playClick();
  }, [playBgm, playClick]);

  const restartGame = useCallback(() => {
    dispatch({ type: "RESTART" });
    setSceneData(null);
    setTimeLeft(null);
    setError(null);
    playClick();
  }, [playClick]);

  const handleChoice = useCallback(
    (nextId, healthEffect, sanityEffect, requiredItem) => {
      if (requiredItem && !inventory.includes(requiredItem)) {
        setMissingItemMsg(`ඔයා ගාව "${requiredItem}" තියෙන්න ඕන!`);
        setTimeout(() => setMissingItemMsg(""), 2500);
        return;
      }

      playClick();
      setTimeLeft(null); // stop any running timer

      dispatch({
        type: "APPLY_CHOICE",
        payload: {
          nextId,
          healthEffect,
          sanityEffect,
          givenItem: sceneData?.given_item ?? null,
        },
      });
    },
    [inventory, playClick, sceneData]
  );

  // ── Render: start screen ───────────────────────────────────────────────
  if (!gameStarted) {
    return (
      <div className="start-screen">
        <h1 className="game-title">
          SINHARAJA
          <br />
          MYSTERY
        </h1>
        <button className="start-btn" onClick={startGame}>
          ENTER THE JUNGLE
        </button>
      </div>
    );
  }

  // ── Render: game over ──────────────────────────────────────────────────
  if (gameOver) {
    return <GameOverScreen type={gameOver} onRestart={restartGame} />;
  }

  // ── Render: loading / error ────────────────────────────────────────────
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (error) {
    return (
      <div className="loading-screen">
        <p>{error}</p>
        <button className="start-btn" onClick={restartGame}>
          Restart
        </button>
      </div>
    );
  }
  if (!sceneData) return null;

  const timePct = sceneData.time_limit
    ? (timeLeft / sceneData.time_limit) * 100
    : 0;

  // ── Render: main game ──────────────────────────────────────────────────
  return (
    <div className="game-container">
      {/* Background */}
      <div
        className="bg-image"
        style={{
          backgroundImage: `url(${sceneData.image_url || DEFAULT_IMAGE})`,
        }}
      />

      {/* Mute button */}
      <button
        className="mute-btn"
        onClick={toggleMute}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Timer */}
      {timeLeft !== null && (
        <div className="timer-container">
          <div className="timer-bar" style={{ width: `${timePct}%` }} />
          <span className="timer-text">{timeLeft}s</span>
        </div>
      )}

      {/* HUD */}
      <div className="top-hud">
        <StatBar label="HEALTH" value={health} fillClass="health-fill" />
        <StatBar label="SANITY" value={sanity} fillClass="sanity-fill" />
      </div>

      {/* Bottom UI */}
      <div className="bottom-ui">
        <div className="dialogue-box" onClick={skipAnimation} title="Click to skip">
          <h2 className="scene-title">{sceneData.title}</h2>
          <p className="typewriter-text">{typedText}</p>
        </div>

        {/* Missing item flash message */}
        {missingItemMsg && (
          <div className="missing-item-msg">⚠️ {missingItemMsg}</div>
        )}

        <div className="controls-row">
          {/* Inventory */}
          <div className="inventory-section">
            <span className="inv-title">🎒 බඩු මල්ල</span>
            <div className="inv-items">
              {inventory.length === 0 ? (
                <span className="empty">හිස්...</span>
              ) : (
                inventory.map((item, i) => (
                  <span key={i} className="inv-badge" title={item}>
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Choices */}
          <div className="choices-section">
            {sceneData.choice_1_text && (
              <button
                className="action-btn"
                onClick={() =>
                  handleChoice(
                    sceneData.choice_1_next_id,
                    sceneData.choice_1_health_effect,
                    sceneData.choice_1_sanity_effect,
                    sceneData.required_item_for_choice_1
                  )
                }
              >
                {sceneData.choice_1_text}
              </button>
            )}
            {sceneData.choice_2_text && (
              <button
                className="action-btn"
                onClick={() =>
                  handleChoice(
                    sceneData.choice_2_next_id,
                    sceneData.choice_2_health_effect,
                    sceneData.choice_2_sanity_effect,
                    sceneData.required_item_for_choice_2
                  )
                }
              >
                {sceneData.choice_2_text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}