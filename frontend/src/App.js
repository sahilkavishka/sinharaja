import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [sceneId, setSceneId] = useState(1);
  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- අලුත්: Player ගේ Stats ---
  const [health, setHealth] = useState(100);
  const [sanity, setSanity] = useState(100);

  const bgmRef = useRef(new Audio("/sounds/bgm.mp3"));
  const clickSoundRef = useRef(new Audio("/sounds/click.mp3"));

  useEffect(() => {
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (gameStarted) {
      setLoading(true);
      axios.get(`http://127.0.0.1:8000/api/scene/${sceneId}/`)
        .then(response => {
          setSceneData(response.data);
          setLoading(false);
        })
        .catch(error => console.error("Error:", error));
    }
  }, [sceneId, gameStarted]);

  const startGame = () => {
    setGameStarted(true);
    bgmRef.current.play().catch(e => console.log(e));
    playClick();
  };

  const playClick = () => {
    clickSoundRef.current.currentTime = 0;
    clickSoundRef.current.play().catch(e => console.log(e));
  }

  // --- අලුත්: තීරණයක් ගත්තම Stats අඩු/වැඩි වෙන විදිය ---
  const handleChoice = (nextId, healthEffect, sanityEffect) => {
    playClick();
    
    // Health සහ Sanity ගණනය කිරීම
    let newHealth = health + (healthEffect || 0);
    let newSanity = sanity + (sanityEffect || 0);

    // 100ට වඩා යන්නෙත් නෑ, 0ට වඩා අඩුවෙන්නෙත් නෑ
    if (newHealth > 100) newHealth = 100;
    if (newSanity > 100) newSanity = 100;

    setHealth(newHealth);
    setSanity(newSanity);

    // මැරුණොත් වෙන දේ (Game Over)
    if (newHealth <= 0) {
      alert("ඔයා මිය ගියා! Game Over ☠️");
      window.location.reload(); // ගේම් එක මුල ඉඳන් පටන් ගන්නවා
      return;
    }
    
    if (newSanity <= 0) {
      alert("ඔයාට පිස්සු හැදුනා! Game Over 😵‍💫");
      window.location.reload();
      return;
    }

    if (nextId !== 0) {
      setSceneId(nextId);
    } else {
      alert("Demo එක ඉවරයි! හොඳයිද?");
    }
  };

  if (!gameStarted) {
    return (
      <div className="start-screen">
        <h1 className="game-title">SINHARAJA<br/>MYSTERY</h1>
        <p className="subtitle">The Lost Expedition</p>
        <button className="start-btn" onClick={startGame}>ENTER THE JUNGLE</button>
      </div>
    );
  }

  if (!sceneData) return <div>Loading...</div>;

  const defaultImage = "https://images.unsplash.com/photo-1440342359726-5918314352d8?q=80&w=1920";

  return (
    <div className="game-screen">
      
      {/* --- අලුත්: HUD (Heads-Up Display) --- */}
      <div className="hud-container">
        <div className="stat-box">
          <span className="stat-label">HEALTH ❤️</span>
          <div className="progress-bar">
            <div className="progress-fill health-fill" style={{ width: `${health}%` }}></div>
          </div>
        </div>
        
        <div className="stat-box">
          <span className="stat-label">SANITY 🧠</span>
          <div className="progress-bar">
            <div className="progress-fill sanity-fill" style={{ width: `${sanity}%` }}></div>
          </div>
        </div>
      </div>

      <div className="background-layer" style={{ backgroundImage: `url(${sceneData.image_url || defaultImage})` }}>
        <div className="overlay"></div>
      </div>

      <div className="dialogue-box">
        <div className="character-name">{sceneData.title}</div>
        <p className="dialogue-text">{sceneData.description}</p>
      </div>

      <div className="choices-container">
        {sceneData.choice_1_text && (
          <button className="choice-btn" onClick={() => handleChoice(sceneData.choice_1_next_id, sceneData.choice_1_health_effect, sceneData.choice_1_sanity_effect)}>
            {sceneData.choice_1_text}
          </button>
        )}
        
        {sceneData.choice_2_text && (
          <button className="choice-btn" onClick={() => handleChoice(sceneData.choice_2_next_id, sceneData.choice_2_health_effect, sceneData.choice_2_sanity_effect)}>
            {sceneData.choice_2_text}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;