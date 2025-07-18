import React, { useState, useRef, useEffect } from "react";
import { generateMaze, getRandomEmptyCell } from "@/game/maze";
import { PlayerState } from "@/game/types";
import { RaycastingView } from "@/components/RaycastingView";
import { TopDownView } from "@/components/TopDownView";
import { Minimap } from "@/components/Minimap";
import { HUD } from "@/components/HUD";
import { FightAnimation } from "@/components/FightAnimation";
import { Leaderboard } from "@/components/Leaderboard";
import { db } from "../../firebase";
import { ref, set, onValue, remove, increment, push, onDisconnect } from "firebase/database";
import { useRef as useReactRef } from "react";
import { useAudio } from "@/hooks/useAudio";

const FLOORS = 10;
const WIDTH = 50;
const HEIGHT = 50;
const INITIAL_NEEDS = { thirst: 100, toilet: 100, health: 100 };

const initialPlayer: PlayerState = { x: 1.5, y: 1.5, angle: 0 };

interface GamePageProps {
  user?: { name: string; character: string };
  onNameTaken?: () => void;
}

export default function GamePage({ user, onNameTaken }: GamePageProps) {
  // Инициализация звуков
  const { startBackgroundMusic, stopBackgroundMusic, playTransitionSound, playCoolerSound, playToiletSound, playVictorySound, playMedkitSound, playLaunchSound, isBackgroundPlaying } = useAudio();
  
  const [building, setBuilding] = useState(() => {
    return Array.from({ length: FLOORS }, (_, i) => generateMaze(WIDTH, HEIGHT, i === FLOORS - 1));
  });
  const [floor, setFloor] = useState(1);
  const [player, setPlayer] = useState<PlayerState>(initialPlayer);
  const [needs, setNeeds] = useState(INITIAL_NEEDS);
  const [view, setView] = useState<'3d' | '2d'>("3d");
  const [fade, setFade] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<{name: string, text: string, time: number}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useReactRef<HTMLDivElement>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [bloodOverlay, setBloodOverlay] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeText, setFadeText] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showVictory, setShowVictory] = useState(false);
  const [showFightAnimation, setShowFightAnimation] = useState(true);
  const [damagedTraps, setDamagedTraps] = useState<Set<string>>(new Set());
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Запуск фоновой музыки при старте игры
  useEffect(() => {
    if (!gameOver && !isBackgroundPlaying && !showFightAnimation) {
      startBackgroundMusic();
    }
  }, [gameOver, isBackgroundPlaying, startBackgroundMusic, showFightAnimation]);

  // Воспроизводим звук запуска при первом запуске игры
  useEffect(() => {
    if (showFightAnimation) {
      playLaunchSound();
    }
  }, [showFightAnimation, playLaunchSound]);

  // Firebase effects
  useEffect(() => {
    if (!user) return;
    // --- Онлайн-статус ---
    const onlineRef = ref(db, `online/${user.name}`);
    set(onlineRef, true);
    onDisconnect(onlineRef).remove();
    // Слушаем онлайн-игроков
    const allOnlineRef = ref(db, 'online');
    const handleOnline = (snap: any) => {
      const val = snap.val() || {};
      setOnlineCount(Object.keys(val).length);
    };
    onValue(allOnlineRef, handleOnline);
    // --- Чат ---
    const chatRef = ref(db, 'chat');
    const handleChat = (snap: any) => {
      const val = snap.val() || {};
      // Преобразуем в массив и сортируем по времени
      const arr = Object.values(val).sort((a: any, b: any) => a.time - b.time) as { name: string; text: string; time: number }[];
      setChatMessages(arr);
    };
    onValue(chatRef, handleChat);
    return () => {
      remove(onlineRef);
    };
  }, [user]);

  useEffect(() => {
    if (gameOver) {
      // Очищаем чат после завершения игры
      const chatRef = ref(db, 'chat');
      remove(chatRef);
      setChatMessages([]);
      
      // Останавливаем фоновую музыку при завершении игры
      stopBackgroundMusic();
    }
  }, [gameOver, stopBackgroundMusic]);

  // Needs management with blood overlay
  React.useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setNeeds(n => {
        const thirst = Math.max(0, n.thirst - 0.04);
        const toilet = Math.max(0, n.toilet - 0.025);
        
        // Show blood overlay when needs are critical
        if (thirst < 20 || toilet < 20) {
          setBloodOverlay(0.5 + (0.5 * (1 - Math.min(thirst, toilet)/20)));
        } else {
          setBloodOverlay(0);
        }
        
        if (thirst === 0 || toilet === 0 || n.health <= 0) setGameOver(true);
        return { thirst, toilet, health: n.health };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver]);

  // --- Проверка близости к кулеру, туалету, лестнице и аптечкам ---
  const [canDrink, setCanDrink] = useState(false);
  const [canToilet, setCanToilet] = useState(false);
  const [canStairs, setCanStairs] = useState(false);
  const [canMedkit, setCanMedkit] = useState(false);
  
  useEffect(() => {
    const maze = building[floor - 1];
    let nearCooler = false;
    let nearToilet = false;
    let nearStairs = false;
    let nearMedkit = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = Math.floor(player.x + dx);
        const y = Math.floor(player.y + dy);
        if (maze[y]?.[x]?.type === 'cooler') {
          const dist = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2);
          if (dist < 1.2) nearCooler = true;
        }
        if (maze[y]?.[x]?.type === 'toilet') {
          const dist = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2);
          if (dist < 1.2) nearToilet = true;
        }
        if (maze[y]?.[x]?.type === 'stairs') {
          const dist = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2);
          if (dist < 1.2) nearStairs = true;
        }
        if (maze[y]?.[x]?.type === 'medkit') {
          const dist = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2);
          if (dist < 1.2) nearMedkit = true;
        }
      }
    }
    setCanDrink(nearCooler);
    setCanToilet(nearToilet);
    setCanStairs(nearStairs);
    setCanMedkit(nearMedkit);
  }, [player, building, floor]);

  // --- Система урона от ловушек ---
  useEffect(() => {
    if (gameOver) return;
    
    const maze = building[floor - 1];
    const playerX = Math.floor(player.x);
    const playerY = Math.floor(player.y);
    const cell = maze[playerY]?.[playerX];
    
    if (cell) {
      let damage = 0;
      let damageType = '';
      
      switch (cell.type) {
        case 'pit':
          damage = 20;
          damageType = 'яма';
          break;
        case 'spikes':
          damage = 15;
          damageType = 'шипы';
          break;
        case 'movingWall':
          damage = 25;
          damageType = 'движущаяся стена';
          break;
      }
      
      if (damage > 0) {
        // Проверяем, не получали ли мы уже урон от этой ловушки
        const trapKey = `${floor}-${playerX}-${playerY}-${cell.type}`;
        if (!damagedTraps.has(trapKey)) {
          setNeeds(n => ({ ...n, health: Math.max(0, n.health - damage) }));
          console.log(`Получен урон ${damage} от ${damageType}!`);
          
          // Увеличиваем кровавый экран
          setBloodOverlay(0.8);
          setTimeout(() => setBloodOverlay(0), 1000);
          
          // Добавляем ловушку в список уже нанесших урон
          setDamagedTraps(prev => new Set([...prev, trapKey]));
        }
      }
    }
  }, [player, building, floor, gameOver, damagedTraps]);

  function handleDrink() {
    setNeeds(n => ({ ...n, thirst: Math.min(100, n.thirst + 60) }));
    playCoolerSound();
  }

  function handleToilet() {
    setNeeds(n => ({ ...n, toilet: Math.min(100, n.toilet + 60) }));
    playToiletSound();
  }

  function handleMedkit() {
    setNeeds(n => ({ ...n, health: Math.min(100, n.health + 50) }));
    
    // Воспроизводим звук аптечки
    playMedkitSound();
    
    // Находим и удаляем аптечку из лабиринта
    const maze = building[floor - 1];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = Math.floor(player.x + dx);
        const y = Math.floor(player.y + dy);
        if (maze[y]?.[x]?.type === 'medkit') {
          const dist = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2);
          if (dist < 1.2) {
            // Изменяем тип клетки с 'medkit' на 'empty'
            maze[y][x].type = 'empty';
            // Обновляем состояние building, чтобы вызвать перерендер
            setBuilding([...building]);
            return; // Выходим после удаления первой найденной аптечки
          }
        }
      }
    }
  }

  function handleNextFloor() {
    if (isTransitioning || gameOver) return;
    
    setIsTransitioning(true);
    setFade(true);
    setFadeText(`FLOOR ${floor + 1}`);
    
    // Воспроизводим звук перехода
    playTransitionSound();
    
    // Очищаем таймеры
    if (fadeTimeout.current) {
      clearTimeout(fadeTimeout.current);
    }
    
    fadeTimeout.current = setTimeout(() => {
      setFloor(prev => prev + 1);
      setPlayer(initialPlayer);
      setFade(false);
      setFadeText(null);
      setIsTransitioning(false);
      
      // Очищаем список повреждений при переходе на новый этаж
      setDamagedTraps(new Set());
    }, 1000);
  }

  function handleRestart() {
    setBuilding(Array.from({ length: FLOORS }, (_, i) => generateMaze(WIDTH, HEIGHT, i === FLOORS - 1)));
    setFloor(1);
    setPlayer(initialPlayer);
    setNeeds(INITIAL_NEEDS);
    setGameOver(false);
    setShowVictory(false);
    setShowFightAnimation(true);
    setDamagedTraps(new Set());
    setBloodOverlay(0);
    setFade(false);
    setFadeText(null);
    setIsTransitioning(false);
    setStartTime(Date.now());
    
    // Воспроизводим звук запуска при рестарте
    playLaunchSound();
  }

  function handlePlayerStateChange(newState: PlayerState) {
    setPlayer(newState);
  }

  function sendMessage() {
    if (!user || !chatInput.trim()) return;
    
    const chatRef = ref(db, 'chat');
    push(chatRef, {
      name: user.name,
      text: chatInput.trim(),
      time: Date.now()
    });
    
    setChatInput('');
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-black font-mono overflow-hidden">
      {/* Эффект сканирования CRT */}
      <div className="fixed inset-0 pointer-events-none z-50" style={{
        backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0.1) 1px, transparent 1px)',
        backgroundSize: '100% 2px',
        opacity: 0.15
      }}></div>

      {/* Fight Animation */}
      {showFightAnimation && (
        <FightAnimation onComplete={() => setShowFightAnimation(false)} />
      )}
      
      {/* Blood overlay */}
      {bloodOverlay > 0 && (
        <div 
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            background: `rgba(255, 0, 0, ${bloodOverlay})`,
            mixBlendMode: 'hard-light'
          }}
        />
      )}

      {/* Fade overlay */}
      {fade && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 pointer-events-none">
          {fadeText && (
            <div className="text-yellow-400 text-4xl font-bold uppercase tracking-widest animate-pulse" 
                 style={{ textShadow: '0 0 10px rgba(255,255,0,0.7)' }}>
              {fadeText}
            </div>
          )}
        </div>
      )}

      {/* Victory screen */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="relative p-8 border-4 border-green-600 bg-black/90 text-center max-w-2xl">
            <div className="absolute inset-0 z-0 opacity-20" style={{
              backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjA1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4zIiBmaWxsPSJyZ2JhKDAsMjAwLDAsMC43KSIvPgo8L3N2Zz4=')",
              mixBlendMode: 'hard-light'
            }}></div>
            
            <h2 className="text-green-400 text-6xl font-bold mb-6 tracking-wider uppercase relative z-10" 
                style={{ textShadow: '0 0 15px rgba(0,255,0,0.8)' }}>
              VICTORY!
            </h2>
            <div className="text-yellow-300 text-2xl mb-4 font-bold uppercase tracking-wider relative z-10">
              MASTERED {FLOORS} FLOORS
            </div>
            <div className="text-blue-300 text-xl mb-8 uppercase tracking-wider relative z-10">
              TIME: {formatTime(Date.now() - startTime)}
            </div>
            <div className="flex justify-center gap-4 relative z-10">
              <button
                onClick={() => {
                  setShowVictory(false);
                  setGameOver(true);
                }}
                className="px-6 py-3 bg-red-900 hover:bg-red-800 text-red-300 font-bold text-lg border-b-4 border-red-950 hover:border-red-900 transition uppercase tracking-wider"
              >
                RESTART
              </button>
              <button
                onClick={() => {
                  setShowVictory(false);
                  setShowLeaderboard(true);
                }}
                className="px-6 py-3 bg-yellow-900 hover:bg-yellow-800 text-yellow-300 font-bold text-lg border-b-4 border-yellow-950 hover:border-yellow-900 transition uppercase tracking-wider"
              >
                LEADERBOARD
              </button>
              <button
                onClick={() => {
                  setShowVictory(false);
                  handleRestart();
                }}
                className="px-6 py-3 bg-green-900 hover:bg-green-800 text-green-300 font-bold text-lg border-b-4 border-green-950 hover:border-green-900 transition uppercase tracking-wider"
              >
                NEW GAME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUD */}
      <HUD
        floor={floor}
        totalFloors={FLOORS}
        thirst={needs.thirst}
        toilet={needs.toilet}
        health={needs.health}
        gameOver={gameOver}
        onRestart={handleRestart}
        onShowLeaderboard={() => setShowLeaderboard(true)}
        isAudioPlaying={isBackgroundPlaying}
        character={user?.character}
        playerName={user?.name}
        view={view}
        onViewChange={() => setView(view === '3d' ? '2d' : '3d')}
        onAudioToggle={() => isBackgroundPlaying ? stopBackgroundMusic() : startBackgroundMusic()}
      />

      {/* Minimap */}
      <div className="absolute top-4 right-4 z-20 bg-black/80 p-2 border-2 border-gray-800">
        <Minimap maze={building[floor - 1]} player={player} otherPlayers={{}} />
        <div className="text-center text-yellow-400 mt-1 text-xs uppercase tracking-wider">map</div>
      </div>

      {/* Player count */}
      <div className="absolute top-4 left-4 z-20 bg-black/80 p-2 border-2 border-gray-800 text-green-400">
        <div className="text-xs uppercase tracking-wider">players: {onlineCount}/{totalCount}</div>
      </div>

      {/* Main game view */}
      <div className={`flex justify-center items-center min-h-screen transition-all duration-500 ${fade ? 'opacity-20' : 'opacity-100'}`}>
        <div className="relative w-[800px] h-[600px] border-4 border-gray-800 bg-black overflow-hidden">
          <div className="w-full h-full">
            {view === '3d' ? (
              <RaycastingView maze={building[floor - 1]} initialPlayer={player} onPlayerStateChange={handlePlayerStateChange} fade={fade} />
            ) : (
              <TopDownView maze={building[floor - 1]} player={player} />
            )}
            
            {/* Action buttons */}
            {canDrink && !gameOver && (
              <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                <div className="mb-1 px-3 py-1 bg-blue-900/90 text-blue-200 rounded text-lg font-bold uppercase tracking-wider border border-blue-800">drink water</div>
                <button
                  onClick={handleDrink}
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-bold rounded border-b-2 border-blue-900 uppercase tracking-wider"
                >
                  [E] drink
                </button>
              </div>
            )}

            {canToilet && !gameOver && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                <div className="mb-1 px-3 py-1 bg-yellow-900/90 text-yellow-200 rounded text-lg font-bold uppercase tracking-wider border border-yellow-800">use toilet</div>
                <button
                  onClick={handleToilet}
                  className="px-4 py-2 bg-yellow-800 hover:bg-yellow-700 text-white text-sm font-bold rounded border-b-2 border-yellow-900 uppercase tracking-wider"
                >
                  [T] use
                </button>
              </div>
            )}

            {canMedkit && !gameOver && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                <div className="mb-1 px-3 py-1 bg-green-900/90 text-green-200 rounded text-lg font-bold uppercase tracking-wider border border-green-800">use medkit</div>
                <button
                  onClick={handleMedkit}
                  className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white text-sm font-bold rounded border-b-2 border-green-900 uppercase tracking-wider"
                >
                  [H] heal
                </button>
              </div>
            )}

            {canStairs && !gameOver && (
              <div className="absolute bottom-48 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                <div className="mb-1 px-3 py-1 bg-gray-900/90 text-yellow-200 rounded text-lg font-bold uppercase tracking-wider border border-gray-800">next floor</div>
                <button
                  onClick={handleNextFloor}
                  className="px-4 py-2 bg-yellow-800 hover:bg-yellow-700 text-white text-sm font-bold rounded border-b-2 border-yellow-900 uppercase tracking-wider"
                >
                  [F] ascend
                </button>
              </div>
            )}

            {/* Exit button */}
            {floor === FLOORS && !gameOver && (() => {
              const maze = building[floor - 1];
              let nearExit = false;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const x = Math.floor(player.x + dx);
                  const y = Math.floor(player.y + dy);
                  if (maze[y]?.[x]?.type === 'exit') {
                    const dist = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2);
                    if (dist < 1.2) nearExit = true;
                  }
                }
              }
              return nearExit ? (
                <div className="absolute bottom-60 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                  <div className="mb-1 px-3 py-1 bg-green-900/90 text-green-200 rounded text-lg font-bold uppercase tracking-wider border border-green-800">exit maze</div>
                  <button
                    onClick={() => {
                      setShowVictory(true);
                      playVictorySound();
                      // Автоматически открываем таблицу лидеров через 3 секунды
                      setTimeout(() => {
                        setShowLeaderboard(true);
                      }, 3000);
                    }}
                    className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white text-sm font-bold rounded border-b-2 border-green-900 uppercase tracking-wider"
                  >
                    [X] escape
                  </button>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </div>



      {/* Chat toggle button */}
      <button
        className={`fixed bottom-20 left-4 z-40 flex items-center justify-center w-10 h-10 bg-gray-900 hover:bg-gray-800 text-red-500 border-2 border-gray-800 ${chatVisible ? 'bg-gray-800' : ''}`}
        onClick={() => setChatVisible(v => !v)}
        title={chatVisible ? 'hide chat' : 'show chat'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.052v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      </button>

      {/* Chat panel */}
      {chatVisible && (
        <div className="absolute bottom-32 left-4 z-30 w-96 bg-black/90 border-2 border-gray-800">
          <div className="h-64 overflow-y-auto p-2 text-gray-300 text-sm font-mono">
            {chatMessages.length === 0 ? (
              <div className="text-gray-500 text-center py-4 uppercase tracking-wider">no messages</div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="mb-1">
                  <span className="text-yellow-400 font-bold">{msg.name}: </span>
                  <span className="text-gray-200">{msg.text}</span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <form 
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
            className="flex border-t-2 border-gray-800"
          >
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-900 text-gray-200 outline-none border-none placeholder-gray-500 uppercase tracking-wider"
              placeholder="type message..."
              maxLength={200}
              autoComplete="off"
            />
            <button 
              type="submit" 
              className="px-3 py-1 bg-gray-800 text-red-500 font-bold hover:bg-gray-700 disabled:opacity-50 uppercase tracking-wider"
              disabled={!chatInput.trim()}
            >
              send
            </button>
          </form>
        </div>
      )}

      {/* Controls help */}
      <div className="absolute bottom-4 left-20 z-10 text-gray-500 text-xs font-mono uppercase tracking-wider">
        <div className="mb-1">fov: <span className="text-gray-300">+/-</span></div>
        <div>walls: <span className="text-gray-300">[/]</span></div>
      </div>

      {/* Leaderboard */}
      <Leaderboard
        isVisible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentPlayerTime={showVictory ? Date.now() - startTime : undefined}
        currentPlayerName={user?.name}
        currentPlayerCharacter={user?.character}
      />
    </div>
  );
}