import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // --- STATE (ගේම් එකේ මතකය) ---
  const [gameStarted, setGameStarted] = useState(false); // ගේම් එක පටන් ගත්තද?
  const [sceneId, setSceneId] = useState(1);
  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- AUDIO SETUP (සද්ද පාලනය) ---
  // 1. Background Music (Online Link එකක් දාලා තියෙන්නේ)
  const bgmRef = useRef(new Audio("/sounds/bgm.mp3"));
  // 2. Click Sound
  const clickSoundRef = useRef(new Audio("/sounds/click.mp3"));

  // BGM එක දිගටම යන්න (Loop) හදනවා
  useEffect(() => {
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.5; // සද්දෙ භාගයක් අඩු කරනවා
  }, []);

  // --- API CALLS ---
  useEffect(() => {
    if (gameStarted) {
      setLoading(true);
      axios.get(`http://127.0.0.1:8000/api/scene/${sceneId}/`)
        .then(response => {
          setSceneData(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error:", error);
          setLoading(false);
        });
    }
  }, [sceneId, gameStarted]);

  // --- FUNCTIONS ---
  
  // ගේම් එක පටන් ගන්න බටන් එක
  const startGame = () => {
    setGameStarted(true);
    bgmRef.current.play().catch(e => console.log("Audio play failed:", e)); // සින්දුව පටන් ගන්නවා
    playClick();
  };

  // Click සද්දේ දාන Function එක
  const playClick = () => {
    clickSoundRef.current.currentTime = 0; // මුල ඉඳන් සද්දේ එන්න
    clickSoundRef.current.play();
  }

  // තීරණයක් ගත්තම වෙන දේ
  const handleChoice = (nextId) => {
    playClick(); // සද්දේ දානවා
    if (nextId !== 0) {
      setSceneId(nextId);
    } else {
      alert("Demo එක ඉවරයි! හොඳයිද?");
    }
  };

  // --- RENDER (තිරයේ පෙනෙන දේ) ---

  // 1. Loading Screen
  if (loading) return <div className="loading-screen">Loading Horror...</div>;

  // 2. Start Screen (Main Menu) - මුලින්ම පේන්නේ මේක
  if (!gameStarted) {
    return (
      <div className="start-screen">
        <h1 className="game-title">SINHARAJA<br/>MYSTERY</h1>
        <p className="subtitle">The Lost Expedition</p>
        <button className="start-btn" onClick={startGame}>ENTER THE JUNGLE</button>
      </div>
    );
  }

  // 3. Game Screen (Error Handling)
  if (!sceneData) return <div style={{color:'red'}}>Error Loading Data. Check Django!</div>;

  // 4. Main Game UI
  const defaultImage = "https://images.unsplash.com/photo-1440342359726-5918314352d8?q=80&w=1920";

  return (
    <div className="game-screen">
      {/* Background Music Control (Optional: Mute button එකක් පස්සේ දාමු) */}
      
      <div 
        className="background-layer" 
        style={{ backgroundImage: `url(${sceneData.image_url || defaultImage})` }} 
      >
        <div className="overlay"></div>
      </div>

      <div className="dialogue-box">
        <div className="character-name">{sceneData.title}</div>
        <p className="dialogue-text">{sceneData.description}</p>
      </div>

      <div className="choices-container">
        {sceneData.choice_1_text && (
          <button className="choice-btn" onClick={() => handleChoice(sceneData.choice_1_next_id)}>
            {sceneData.choice_1_text}
          </button>
        )}
        
        {sceneData.choice_2_text && (
          <button className="choice-btn" onClick={() => handleChoice(sceneData.choice_2_next_id)}>
            {sceneData.choice_2_text}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;