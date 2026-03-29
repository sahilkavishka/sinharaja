import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [sceneId, setSceneId] = useState(1);
  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Stats & Inventory
  const [health, setHealth] = useState(100);
  const [sanity, setSanity] = useState(100);
  const [inventory, setInventory] = useState([]);

  // Typewriter Effect සඳහා
  const [typedText, setTypedText] = useState("");

  const bgmRef = useRef(new Audio("/sounds/bgm.mp3"));
  const clickSoundRef = useRef(new Audio("/sounds/click.mp3"));

  useEffect(() => {
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.5;
  }, []);

  // API Call
  useEffect(() => {
    if (gameStarted) {
      setLoading(true);
      axios.get(`http://127.0.0.1:8000/api/scene/${sceneId}/`)
        .then(response => {
          setSceneData(response.data);
          
          // Inventory එකට බඩු දාන කෑල්ල
          if (response.data.given_item && !inventory.includes(response.data.given_item)) {
            setInventory(prev => [...prev, response.data.given_item]);
          }
          setLoading(false);
        })
        .catch(error => console.error("Error:", error));
    }
  }, [sceneId, gameStarted]);

  // අකුරෙන් අකුර ටයිප් කරන කෑල්ල (Typewriter Effect)
  useEffect(() => {
    if (sceneData && sceneData.description) {
      setTypedText(""); // පරණ අකුරු මකනවා
      let i = 0;
      const textToType = sceneData.description;
      
      const typingInterval = setInterval(() => {
        if (i < textToType.length) {
          setTypedText((prev) => prev + textToType.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 40); // 40 කියන්නේ ටයිප් වෙන වේගය (අඩු කළොත් වේගවත්)

      return () => clearInterval(typingInterval);
    }
  }, [sceneData]);

  const startGame = () => {
    setGameStarted(true);
    bgmRef.current.play().catch(e => console.log(e));
    playClick();
  };

  const playClick = () => {
    clickSoundRef.current.currentTime = 0;
    clickSoundRef.current.play().catch(e => console.log(e));
  }

  const handleChoice = (nextId, healthEffect, sanityEffect, requiredItem) => {
    if (requiredItem && !inventory.includes(requiredItem)) {
      alert(`මේක කරන්න ඔයා ගාව "${requiredItem}" තියෙන්න ඕන!`);
      return; 
    }

    playClick();
    
    let newHealth = health + (healthEffect || 0);
    let newSanity = sanity + (sanityEffect || 0);

    if (newHealth > 100) newHealth = 100;
    if (newSanity > 100) newSanity = 100;

    setHealth(newHealth);
    setSanity(newSanity);

    if (newHealth <= 0) {
      alert("ඔයා මිය ගියා! Game Over ☠️");
      window.location.reload();
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
        <button className="start-btn" onClick={startGame}>ENTER THE JUNGLE</button>
      </div>
    );
  }

  if (!sceneData) return <div>Loading...</div>;

  const defaultImage = "https://images.unsplash.com/photo-1440342359726-5918314352d8?q=80&w=1920";

  return (
    <div className="game-container">
      
      {/* 1. Full Screen Background */}
      <div className="bg-image" style={{ backgroundImage: `url(${sceneData.image_url || defaultImage})` }}></div>

      {/* 2. HUD (Health & Sanity) */}
      <div className="top-hud">
        <div className="stat-box">
          <span className="stat-label">HEALTH</span>
          <div className="progress-bar"><div className="health-fill" style={{ width: `${health}%` }}></div></div>
        </div>
        
        <div className="stat-box">
          <span className="stat-label">SANITY</span>
          <div className="progress-bar"><div className="sanity-fill" style={{ width: `${sanity}%` }}></div></div>
        </div>
      </div>

      {/* 3. Bottom Area (Dialogue, Choices & Inventory) */}
      <div className="bottom-ui">
        
        {/* කතාව පෙන්නන කොටුව */}
        <div className="dialogue-box">
          <h2 className="scene-title">{sceneData.title}</h2>
          {/* මෙතන තමයි අර ටයිප් වෙන අකුරු ටික වැටෙන්නේ */}
          <p className="typewriter-text">{typedText}</p>
        </div>

        {/* Buttons සහ බඩු මල්ල */}
        <div className="controls-row">
          
          <div className="inventory-section">
            <span className="inv-title">🎒 බඩු මල්ල</span>
            <div className="inv-items">
              {inventory.length === 0 ? <span className="empty">හිස්...</span> : inventory.map((item, i) => <span key={i} className="inv-badge">{item}</span>)}
            </div>
          </div>

          <div className="choices-section">
            {sceneData.choice_1_text && (
              <button className="action-btn" onClick={() => handleChoice(sceneData.choice_1_next_id, sceneData.choice_1_health_effect, sceneData.choice_1_sanity_effect, sceneData.required_item_for_choice_1)}>
                {sceneData.choice_1_text}
              </button>
            )}
            {sceneData.choice_2_text && (
              <button className="action-btn" onClick={() => handleChoice(sceneData.choice_2_next_id, sceneData.choice_2_health_effect, sceneData.choice_2_sanity_effect, sceneData.required_item_for_choice_2)}>
                {sceneData.choice_2_text}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;