import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [sceneId, setSceneId] = useState(1);
  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [health, setHealth] = useState(100);
  const [sanity, setSanity] = useState(100);
  const [inventory, setInventory] = useState([]);
  const [typedText, setTypedText] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);

  // --- අලුත්: Game Over State එක ---
  const [gameOver, setGameOver] = useState(null); // 'dead' , 'insane' , 'won' , null

  const bgmRef = useRef(new Audio("/sounds/bgm.mp3"));
  const clickSoundRef = useRef(new Audio("/sounds/click.mp3"));

  useEffect(() => {
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      setLoading(true);
      axios.get(`http://127.0.0.1:8000/api/scene/${sceneId}/`)
        .then(response => {
          setSceneData(response.data);
          
          if (response.data.given_item && !inventory.includes(response.data.given_item)) {
            setInventory(prev => [...prev, response.data.given_item]);
          }
          
          if (response.data.is_timed) {
            setTimeLeft(response.data.time_limit);
          } else {
            setTimeLeft(null);
          }
          setLoading(false);
        })
        .catch(error => console.error("Error:", error));
    }
  }, [sceneId, gameStarted, gameOver]);

  // --- වෙනස් කළා: Typewriter Effect Fix ---
  useEffect(() => {
    if (sceneData && sceneData.description) {
      setTypedText(""); 
      
      // හදිසි අවස්ථාවක් නම් (Timer එකක් තියෙනවා නම්), අකුරු එකපාර පෙන්වන්න!
      if (sceneData.is_timed) {
        setTypedText(sceneData.description);
        return;
      }

      // නැත්නම් හිමීට ටයිප් වෙන්න හරින්න
      let i = 0;
      const textToType = sceneData.description;
      const typingInterval = setInterval(() => {
        if (i < textToType.length) {
          setTypedText((prev) => prev + textToType.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 40);
      return () => clearInterval(typingInterval);
    }
  }, [sceneData]);

  useEffect(() => {
    if (timeLeft === null || gameOver) return; 

    if (timeLeft === 0) {
      // වෙලාව ඉවර වුනොත් Alert එක අයින් කරලා කෙලින්ම දඬුවම දෙනවා
      handleChoice(sceneData.timeout_next_id, sceneData.timeout_health_effect, 0, null);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, sceneData, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    bgmRef.current.play().catch(e => console.log(e));
    playClick();
  };

  const playClick = () => {
    clickSoundRef.current.currentTime = 0;
    clickSoundRef.current.play().catch(e => console.log(e));
  }

  // ගේම් එක ආයෙත් මුල ඉඳන් පටන් ගන්න බටන් එක
  const restartGame = () => {
    setHealth(100);
    setSanity(100);
    setInventory([]);
    setSceneId(1);
    setGameOver(null);
    setTimeLeft(null);
  };

  const handleChoice = (nextId, healthEffect, sanityEffect, requiredItem) => {
    if (requiredItem && !inventory.includes(requiredItem)) {
      // Alert එක වෙනුවට පොඩි ශබ්දයක් හරි අමුතු විදියකට හරි පෙන්නන්න පුළුවන්, දැනට alert එක තියමු
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

    // --- වෙනස් කළා: Game Over Alerts අයින් කරලා ලස්සන Screen එකට යවනවා ---
    if (newHealth <= 0) {
      setGameOver('dead');
      return;
    }
    
    if (newSanity <= 0) {
      setGameOver('insane');
      return;
    }

    if (nextId !== 0) {
      setSceneId(nextId);
    } else {
      setGameOver('won'); // 0 දුන්නොත් ගේම් එක දිනුම්
    }
  };

  // 1. මුල් තිරය
  if (!gameStarted) {
    return (
      <div className="start-screen">
        <h1 className="game-title">SINHARAJA<br/>MYSTERY</h1>
        <button className="start-btn" onClick={startGame}>ENTER THE JUNGLE</button>
      </div>
    );
  }

  // 2. අලුත්: Game Over Screens
  if (gameOver === 'dead') {
    return (
      <div className="game-over-screen dead-screen">
        <h1>YOU DIED</h1>
        <p>කැලේ මැද ඔයාගේ ජීවිතය අවසන් විය...</p>
        <button className="start-btn" onClick={restartGame}>TRY AGAIN</button>
      </div>
    );
  }

  if (gameOver === 'insane') {
    return (
      <div className="game-over-screen insane-screen">
        <h1>MIND LOST</h1>
        <p>සිහිකල්පනාව අහිමි වී ඔයා කැලේ අතරමං වුණා...</p>
        <button className="start-btn" onClick={restartGame}>TRY AGAIN</button>
      </div>
    );
  }

  if (gameOver === 'won') {
    return (
      <div className="game-over-screen won-screen">
        <h1>SURVIVED!</h1>
        <p>ඔයා සිංහරාජයේ අභිරහස ජය ගත්තා!</p>
        <button className="start-btn" onClick={restartGame}>PLAY AGAIN</button>
      </div>
    );
  }

  if (!sceneData) return <div>Loading...</div>;

  const defaultImage = "https://images.unsplash.com/photo-1440342359726-5918314352d8?q=80&w=1920";

  return (
    <div className="game-container">
      <div className="bg-image" style={{ backgroundImage: `url(${sceneData.image_url || defaultImage})` }}></div>

      {timeLeft !== null && (
        <div className="timer-container">
          <div className="timer-bar" style={{ width: `${(timeLeft / sceneData.time_limit) * 100}%` }}></div>
          <span className="timer-text">{timeLeft}s</span>
        </div>
      )}

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

      <div className="bottom-ui">
        <div className="dialogue-box">
          <h2 className="scene-title">{sceneData.title}</h2>
          <p className="typewriter-text">{typedText}</p>
        </div>

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