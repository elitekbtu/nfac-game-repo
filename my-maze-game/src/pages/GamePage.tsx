import React, { useState, useRef, useEffect } from "react";
import { generateMaze, getRandomEmptyCell } from "@/game/maze";
import { PlayerState } from "@/game/types";
import { RaycastingView } from "@/components/RaycastingView";
import { TopDownView } from "@/components/TopDownView";
import { Minimap } from "@/components/Minimap";
import { HUD } from "@/components/HUD";
import { db } from "../../firebase";
import { ref, set, onValue, remove, increment, push, onDisconnect } from "firebase/database";
import { useRef as useReactRef } from "react";

const FLOORS = 10;
const WIDTH = 30;
const HEIGHT = 30;
const INITIAL_NEEDS = { thirst: 100, toilet: 100 };

const initialPlayer: PlayerState = { x: 1.5, y: 1.5, angle: 0 };

interface GamePageProps {
  user?: { name: string };
  onNameTaken?: () => void;
}

export default function GamePage({ user, onNameTaken }: GamePageProps) {
  const [building, setBuilding] = useState(() => {
    // Создаём массив этажей, последний с выходом
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

  // Firebase effects remain the same...
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
    }
  }, [gameOver]);

  // Needs management with blood overlay
  React.useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setNeeds(n => {
        const thirst = Math.max(0, n.thirst - 0.04); // медленнее убывает
        const toilet = Math.max(0, n.toilet - 0.025); // медленнее убывает
        
        // Show blood overlay when needs are critical
        if (thirst < 20 || toilet < 20) {
          setBloodOverlay(0.5 + (0.5 * (1 - Math.min(thirst, toilet)/20)));
        } else {
          setBloodOverlay(0);
        }
        
        if (thirst === 0 || toilet === 0) setGameOver(true);
        return { thirst, toilet };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver]);

  // --- Проверка близости к кулеру, туалету и лестнице ---
  const [canDrink, setCanDrink] = useState(false);
  const [canToilet, setCanToilet] = useState(false);
  const [canStairs, setCanStairs] = useState(false);
  useEffect(() => {
    const maze = building[floor - 1];
    let nearCooler = false;
    let nearToilet = false;
    let nearStairs = false;
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
      }
    }
    setCanDrink(nearCooler);
    setCanToilet(nearToilet);
    setCanStairs(nearStairs);
  }, [player, building, floor]);

  function handleDrink() {
    setNeeds(n => ({ ...n, thirst: Math.min(100, n.thirst + 60) }));
  }
  function handleToilet() {
    setNeeds(n => ({ ...n, toilet: Math.min(100, n.toilet + 60) }));
  }
  function handleNextFloor() {
    if (floor < FLOORS && !isTransitioning) {
      setIsTransitioning(true);
      setFade(true);
      setFadeText('Пусть победит сильнейший!');
      setTimeout(() => {
        setFloor(floor + 1);
        // Случайная пустая клетка
        const maze = building[floor];
        const pos = getRandomEmptyCell(maze);
        setPlayer({ ...pos, angle: 0 });
        // Восстанавливаем статы на 50 единиц
        setNeeds(n => ({
          thirst: Math.min(100, n.thirst + 50),
          toilet: Math.min(100, n.toilet + 50)
        }));
        setFade(false);
        setFadeText(null);
        setIsTransitioning(false);
      }, 1200);
    }
  }

  // --- Добавляю недостающие функции ---
  function handleRestart() {
    setPlayer(initialPlayer);
    setNeeds(INITIAL_NEEDS);
    setGameOver(false);
    setShowVictory(false);
    setFade(false);
    setBloodOverlay(0);
    setFloor(1);
    setStartTime(Date.now());
    setBuilding(Array.from({ length: FLOORS }, (_, i) => generateMaze(WIDTH, HEIGHT, i === FLOORS - 1)));
  }

  function handlePlayerStateChange(newState: PlayerState) {
    setPlayer(newState);
  }

  function sendMessage() {
    if (!chatInput.trim() || !user) return;
    const chatRef = ref(db, 'chat');
    push(chatRef, {
      name: user.name,
      text: chatInput,
      time: Date.now(),
    });
    setChatInput("");
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м ${seconds % 60}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds % 60}с`;
    } else {
      return `${seconds}с`;
    }
  }

  // Other handlers remain the same...

  return (
    <div className="relative min-h-screen w-full bg-black font-mono">
      {/* Blood overlay when health is low */}
      {bloodOverlay > 0 && (
        <div 
          className="fixed inset-0 z-50 pointer-events-none"
          style={{
            background: `rgba(255, 0, 0, ${bloodOverlay})`,
            mixBlendMode: 'hard-light'
          }}
        />
      )}
      {/* Fade overlay с текстом */}
      {fade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-none">
          {fadeText && <div className="text-yellow-300 text-4xl font-bold drop-shadow-lg animate-pulse">{fadeText}</div>}
        </div>
      )}

      {/* Victory screen */}
      {showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="text-center p-8 border-4 border-green-600 bg-black/80 max-w-2xl animate-pulse">
            <h2 className="text-green-400 text-6xl font-bold mb-6 tracking-wider drop-shadow-lg">ПОБЕДА!</h2>
            <div className="text-yellow-300 text-2xl mb-4 font-bold">
              Вы прошли все {FLOORS} этажей лабиринта!
            </div>
            <div className="text-blue-300 text-xl mb-8 font-mono">
              Время прохождения: {formatTime(Date.now() - startTime)}
            </div>
            <div className="text-gray-300 text-lg mb-8">
              Поздравляем! Вы выжили в этом кошмарном лабиринте!
            </div>
            <button
              onClick={() => {
                setShowVictory(false);
                setGameOver(true);
              }}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-lg border-b-4 border-green-900 hover:border-green-700 transition mr-4"
            >
              НАЧАТЬ ЗАНОВО
            </button>
            <button
              onClick={() => {
                setShowVictory(false);
                handleRestart();
              }}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg border-b-4 border-blue-900 hover:border-blue-700 transition"
            >
              НОВАЯ ИГРА
            </button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gameOver && !showVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="text-center p-8 border-4 border-red-600 bg-black/80 max-w-2xl">
            <h2 className="text-red-600 text-5xl font-bold mb-6 tracking-wider">GAME OVER</h2>
            <p className="text-gray-300 text-xl mb-8">You couldn't survive the maze</p>
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-lg border-b-4 border-red-900 hover:border-red-700 transition"
            >
              RIP AND TEAR AGAIN
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-black/70 border-t-2 border-red-900">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            {/* Health/Thirst */}
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-900 flex items-center justify-center mr-2 border-2 border-gray-700">
                <span className="text-red-300 font-bold text-xl">{Math.floor(needs.thirst)}</span>
              </div>
              <span className="text-gray-300 uppercase text-sm">THIRST</span>
            </div>
            
            {/* Armor/Toilet */}
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-900 flex items-center justify-center mr-2 border-2 border-gray-700">
                <span className="text-blue-300 font-bold text-xl">{Math.floor(needs.toilet)}</span>
              </div>
              <span className="text-gray-300 uppercase text-sm">TOILET</span>
            </div>
          </div>
          
          {/* Floor indicator */}
          <div className="bg-gray-900 px-4 py-2 border-2 border-gray-700">
            <span className="text-yellow-400 font-bold">FLOOR: {floor}/{FLOORS}</span>
          </div>
          
          {/* Restart button */}
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-red-400 font-bold border-b-2 border-red-900"
          >
            RESTART
          </button>
        </div>
      </div>

      {/* Minimap */}
      <div className="absolute top-4 right-4 z-20 bg-black/80 p-2 border-2 border-gray-700">
        <Minimap maze={building[floor - 1]} player={player} otherPlayers={{}} />
        <div className="text-center text-yellow-400 mt-1 text-sm">MAP</div>
      </div>

      {/* Player count */}
      <div className="absolute top-4 left-4 z-20 bg-black/80 p-2 border-2 border-gray-700 text-green-400">
        <div className="text-sm">PLAYERS: {onlineCount}/{totalCount}</div>
        <div className="text-sm">CAN STAIRS: {canStairs ? 'YES' : 'NO'}</div>
      </div>

      {/* Main game view */}
      <div className={`flex justify-center items-center min-h-screen transition-all duration-500 ${fade ? 'opacity-20' : 'opacity-100'}`}>
        <div className="relative w-[800px] h-[600px] border-4 border-gray-800 bg-black overflow-hidden">
          <div className="w-full h-full">
          {view === '3d' ? (
              <div className="w-full h-full">
            <RaycastingView maze={building[floor - 1]} initialPlayer={player} onPlayerStateChange={handlePlayerStateChange} fade={fade} />
              </div>
          ) : (
              <div className="w-full h-full">
            <TopDownView maze={building[floor - 1]} player={player} />
              </div>
          )}
            {/* Кнопка попить воды */}
            {canDrink && !gameOver && (
              <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                <div className="mb-1 px-3 py-1 bg-blue-900 text-blue-200 rounded shadow text-lg font-bold">Попить воды</div>
                <button
                  onClick={handleDrink}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded shadow border-b-2 border-blue-900"
                >
                  Пить
                </button>
              </div>
            )}
            {/* Кнопка пойти в туалет */}
            {canToilet && !gameOver && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                <div className="mb-1 px-3 py-1 bg-yellow-900 text-yellow-200 rounded shadow text-lg font-bold">Пойти в туалет</div>
                <button
                  onClick={handleToilet}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded shadow border-b-2 border-yellow-900"
                >
                  Сходить
                </button>
              </div>
            )}
            {/* Кнопка на следующий этаж */}
            {canStairs && !gameOver && (
              <div className="absolute bottom-48 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                <div className="mb-1 px-3 py-1 bg-gray-900 text-yellow-300 rounded shadow text-lg font-bold">На следующий этаж</div>
                <button
                  onClick={() => {
                    console.log('Кнопка нажата!');
                    console.log('floor:', floor, 'FLOORS:', FLOORS);
                    console.log('isTransitioning:', isTransitioning);
                    console.log('gameOver:', gameOver);
                    handleNextFloor();
                  }}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-bold rounded shadow border-b-2 border-yellow-900"
                >
                  Вперёд
                </button>
              </div>
            )}
            {/* Кнопка выхода на последнем этаже */}
            {floor === FLOORS && !gameOver && (() => {
              // Проверяем близость к выходу
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
                  <div className="mb-1 px-3 py-1 bg-green-900 text-green-200 rounded shadow text-lg font-bold">Покинуть лабиринт</div>
                  <button
                    onClick={() => setShowVictory(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded shadow border-b-2 border-green-900"
                  >
                    Победа!
                  </button>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {/* View toggle button */}
      <button
        onClick={() => setView(view === '3d' ? '2d' : '3d')}
        className="absolute bottom-24 right-4 z-20 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold border-2 border-gray-700"
      >
        {view === '3d' ? 'MAP MODE' : '3D MODE'}
      </button>

      {/* Chat toggle button */}
      <button
        className={`fixed bottom-20 left-4 z-40 flex items-center justify-center w-10 h-10 rounded-none bg-gray-800 text-red-500 hover:bg-gray-700 border-2 border-gray-700 ${chatVisible ? 'bg-gray-700' : ''}`}
        onClick={() => setChatVisible(v => !v)}
        title={chatVisible ? 'HIDE CHAT' : 'SHOW CHAT'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.052v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      </button>

      {/* Chat panel */}
      {chatVisible && (
        <div className="absolute bottom-32 left-4 z-30 w-96 bg-black/90 border-2 border-gray-700">
          <div className="h-64 overflow-y-auto p-2 text-gray-300 text-sm font-mono">
            {chatMessages.length === 0 ? (
              <div className="text-gray-500 text-center py-4">NO MESSAGES</div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="mb-1">
                  <span className="text-yellow-400">{msg.name}: </span>
                  <span className="text-gray-200">{msg.text}</span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <form 
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
            className="flex border-t-2 border-gray-700"
          >
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-900 text-gray-200 outline-none border-none"
              placeholder="Type message..."
              maxLength={200}
              autoComplete="off"
            />
            <button 
              type="submit" 
              className="px-3 py-1 bg-gray-800 text-red-500 font-bold hover:bg-gray-700 disabled:opacity-50"
              disabled={!chatInput.trim()}
            >
              SEND
            </button>
          </form>
        </div>
      )}

      {/* Controls help */}
      <div className="absolute bottom-4 right-4 text-gray-500 text-xs z-10 font-mono">
        <div className="mb-1">FOV: <span className="text-gray-300">+ / -</span></div>
        <div>WALLS: <span className="text-gray-300">[ / ]</span></div>
      </div>
    </div>
  );
}