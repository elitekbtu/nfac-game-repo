import React, { useState, useRef, useEffect } from "react";
import { getPrebuiltBuilding, regenerateBuilding } from "@/game/maze";
import { PlayerState } from "@/game/types";
import { RaycastingView } from "@/components/RaycastingView";
import { TopDownView } from "@/components/TopDownView";
import { Minimap } from "@/components/Minimap";
import { HUD } from "@/components/HUD";
import { io, Socket } from "socket.io-client";

const FLOORS = 10;
const WIDTH = 30;
const HEIGHT = 30;
const INITIAL_NEEDS = { thirst: 100, toilet: 100 };

const initialPlayer: PlayerState = { x: 1.5, y: 1.5, angle: 0 };

// Добавляем тип пропсов
interface GamePageProps {
  user?: { name: string };
  onNameTaken?: () => void;
}

export default function GamePage({ user, onNameTaken }: GamePageProps) {
  const [building, setBuilding] = useState(() => getPrebuiltBuilding(FLOORS, WIDTH, HEIGHT));
  const [floor, setFloor] = useState(FLOORS);
  const [player, setPlayer] = useState<PlayerState>(initialPlayer);
  const [needs, setNeeds] = useState(INITIAL_NEEDS);
  const [view, setView] = useState<'3d' | '2d'>("3d");
  const [fade, setFade] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<Record<string, { x: number; y: number; angle: number; name: string }>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;
    const socket = io({ path: "/api/socket" });
    socketRef.current = socket;
    // Присоединяемся к комнате
    socket.emit("join", { name: user.name, x: initialPlayer.x, y: initialPlayer.y, angle: initialPlayer.angle });
    // Получаем обновления игроков
    socket.on("players", (players) => {
      // Исключаем себя
      const filtered = { ...players };
      delete filtered[user.name];
      setOtherPlayers(filtered);
    });
    socket.on("join_error", (err) => {
      if (onNameTaken) onNameTaken();
    });
    return () => { socket.disconnect(); };
  }, [user, onNameTaken]);

  // Отправляем позицию при изменении
  useEffect(() => {
    if (!user || !socketRef.current) return;
    socketRef.current.emit("move", { x: player.x, y: player.y, angle: player.angle });
  }, [player, user]);

  // Needs management
  React.useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setNeeds(n => {
        const thirst = Math.max(0, n.thirst - 0.12);
        const toilet = Math.max(0, n.toilet - 0.08);
        if (thirst === 0 || toilet === 0) setGameOver(true);
        return { thirst, toilet };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Floor transition fade
  const handleFloorChange = (newFloor: number) => {
    setFade(true);
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    fadeTimeout.current = setTimeout(() => {
      setFloor(newFloor);
      setPlayer({ ...initialPlayer });
      setFade(false);
    }, 800);
  };

  // Player state change handler
  const handlePlayerStateChange = (newState: PlayerState) => {
    setPlayer(newState);
    const cell = building[floor - 1][Math.floor(newState.y)][Math.floor(newState.x)];
    if (cell.type === "stairs" && floor > 1) {
      handleFloorChange(floor - 1);
    } else if (cell.type === "cooler") {
      setNeeds(n => ({ ...n, thirst: 100 }));
    } else if (cell.type === "toilet") {
      setNeeds(n => ({ ...n, toilet: 100 }));
    }
  };

  // Restart game
  const handleRestart = () => {
    setBuilding(regenerateBuilding(FLOORS, WIDTH, HEIGHT));
    setFloor(FLOORS);
    setPlayer({ ...initialPlayer });
    setNeeds(INITIAL_NEEDS);
    setGameOver(false);
    setFade(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 animate-gradient-move">
      {/* Декоративный паттерн */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(0,212,255,0.15)_0,transparent_60%),radial-gradient(circle_at_80%_80%,rgba(0,212,255,0.10)_0,transparent_70%)]" />
      <HUD floor={floor} totalFloors={FLOORS} thirst={needs.thirst} toilet={needs.toilet} gameOver={gameOver} onRestart={handleRestart} />
      <div className="absolute top-8 right-8 z-20">
        <Minimap maze={building[floor - 1]} player={player} otherPlayers={otherPlayers} />
      </div>
      <div className={`flex justify-center items-center h-screen transition-all duration-700 ${fade ? 'blur-lg brightness-50' : ''}`}>
        <div className="relative w-full max-w-[1100px] min-w-[320px] aspect-[16/9] flex items-center justify-center rounded-2xl shadow-2xl bg-gray-950/80 border border-blue-900/40 backdrop-blur-md overflow-hidden">
          {view === '3d' ? (
            <RaycastingView maze={building[floor - 1]} initialPlayer={player} onPlayerStateChange={handlePlayerStateChange} fade={fade} />
          ) : (
            <TopDownView maze={building[floor - 1]} player={player} />
          )}
        </div>
      </div>
      <button
        onClick={() => setView(view === '3d' ? '2d' : '3d')}
        className="absolute bottom-8 left-8 z-20 text-lg px-7 py-3 rounded-2xl border-none bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-bold shadow-xl hover:from-cyan-600 hover:to-blue-800 transition focus:outline-none focus:ring-2 focus:ring-cyan-400 opacity-95 backdrop-blur-md"
      >
        <span className="drop-shadow">Переключить на {view === '3d' ? '2D' : '3D'} вид</span>
      </button>
      <div className="absolute bottom-4 right-4 text-cyan-200/80 text-sm z-10 pointer-events-none text-right select-none">
        <div className="mb-1">FOV: <span className="font-mono">+ / -</span></div>
        <div>Коридор: <span className="font-mono">[ / ]</span></div>
      </div>
    </div>
  );
} 