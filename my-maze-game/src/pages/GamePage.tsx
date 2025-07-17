import React, { useState, useRef } from "react";
import { getPrebuiltBuilding, regenerateBuilding } from "../game/maze";
import { PlayerState } from "../game/types";
import { RaycastingView } from "../components/RaycastingView";
import { TopDownView } from "../components/TopDownView";
import { Minimap } from "../components/Minimap";
import { HUD } from "../components/HUD";

const FLOORS = 10;
const WIDTH = 30;
const HEIGHT = 30;
const INITIAL_NEEDS = { thirst: 100, toilet: 100 };

const initialPlayer: PlayerState = { x: 1.5, y: 1.5, angle: 0 };

export default function GamePage() {
  const [building, setBuilding] = useState(() => getPrebuiltBuilding(FLOORS, WIDTH, HEIGHT));
  const [floor, setFloor] = useState(FLOORS);
  const [player, setPlayer] = useState<PlayerState>(initialPlayer);
  const [needs, setNeeds] = useState(INITIAL_NEEDS);
  const [view, setView] = useState<'3d' | '2d'>("3d");
  const [fade, setFade] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);

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
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#181818', overflow: 'hidden' }}>
      <HUD floor={floor} totalFloors={FLOORS} thirst={needs.thirst} toilet={needs.toilet} gameOver={gameOver} onRestart={handleRestart} />
      <Minimap maze={building[floor - 1]} player={player} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', transition: 'filter 0.8s', filter: fade ? 'blur(12px) brightness(0.5)' : 'none' }}>
        {view === '3d' ? (
          <RaycastingView maze={building[floor - 1]} initialPlayer={player} onPlayerStateChange={handlePlayerStateChange} fade={fade} />
        ) : (
          <TopDownView maze={building[floor - 1]} player={player} />
        )}
      </div>
      <button onClick={() => setView(view === '3d' ? '2d' : '3d')} style={{ position: 'absolute', bottom: 32, left: 32, zIndex: 20, fontSize: 20, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#222', color: '#fff', cursor: 'pointer', opacity: 0.85 }}>Switch to {view === '3d' ? '2D' : '3D'} View</button>
      <div style={{ position: 'absolute', bottom: 16, right: 16, color: '#aaa', fontSize: 14, zIndex: 10, pointerEvents: 'none', textAlign: 'right' }}>
        <div>FOV: +/-</div>
        <div>Corridor: [ / ]</div>
      </div>
    </div>
  );
} 