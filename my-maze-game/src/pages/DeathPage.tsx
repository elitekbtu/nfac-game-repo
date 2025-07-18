import React from "react";

interface DeathPageProps {
  onRestart: () => void;
  onBackToMenu: () => void;
  playerName?: string;
  character?: string;
  timeSurvived?: number;
  floorReached?: number;
  totalFloors?: number;
}

const CHARACTER_DATA = {
  alikhan: { name: "ALIKHAN", color: "text-red-400" },
  shoqan: { name: "SHOQAN", color: "text-blue-400" },
  alibek: { name: "ALIBEK", color: "text-green-400" },
  bahauddin: { name: "BAHAUDDIN", color: "text-purple-400" },
  aimurat: { name: "AIMURAT", color: "text-orange-400" },
  gaziz: { name: "GAZIZ", color: "text-cyan-400" },
  bahreddin: { name: "BAHREDDIN", color: "text-pink-400" },
  zhasulan: { name: "ZHASULAN", color: "text-yellow-400" }
};

export default function DeathPage({ 
  onRestart, 
  onBackToMenu, 
  playerName, 
  character, 
  timeSurvived, 
  floorReached,
  totalFloors 
}: DeathPageProps) {
  const characterInfo = character ? CHARACTER_DATA[character as keyof typeof CHARACTER_DATA] : null;

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
    <div className="min-h-screen bg-black font-mono relative overflow-hidden">
      {/* Эффект сканирования CRT */}
      <div className="fixed inset-0 pointer-events-none z-10" style={{
        backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0.1) 1px, transparent 1px)',
        backgroundSize: '100% 2px',
        opacity: 0.15
      }}></div>

      {/* Blood splatter effect */}
      <div 
        className="fixed inset-0 z-20 opacity-70"
        style={{
          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjA1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4zIiBmaWxsPSJyZ2JhKDIwMCwwLDAsMC45KSIvPgo8L3N2Zz4=')",
          mixBlendMode: 'hard-light',
          pointerEvents: 'none'
        }}
      />

      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Main death screen */}
        <div className="text-center max-w-4xl">
          {/* Death title */}
          <h1 className="text-8xl font-extrabold text-red-600 mb-8 tracking-wider uppercase animate-pulse" 
              style={{ textShadow: '0 0 20px rgba(255,0,0,0.8)' }}>
            GAME OVER
          </h1>
          
          <h2 className="text-3xl text-gray-300 mb-12 uppercase tracking-wider">
            You have died in the maze
          </h2>

          {/* Player info */}
          {characterInfo && (
            <div className="bg-black/70 border-2 border-gray-800 p-6 mb-8 inline-block">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="relative w-16 h-16">
                  <img 
                    src={`/mentors/${character}.png`} 
                    alt={characterInfo.name}
                    className="w-full h-full object-cover border-2 border-gray-700"
                  />
                  <div className="absolute inset-0 border-2 border-red-400/50 pointer-events-none"></div>
                </div>
                <div className="text-left">
                  <div className={`text-2xl font-bold ${characterInfo.color} tracking-wider mb-1`}>
                    {characterInfo.name}
                  </div>
                  <div className="text-lg text-gray-400 uppercase tracking-wider">
                    {playerName}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {timeSurvived && (
              <div className="bg-black/70 border-2 border-gray-800 p-4">
                <div className="text-blue-400 text-lg uppercase tracking-wider mb-2">Time Survived</div>
                <div className="text-2xl font-bold text-blue-300">{formatTime(timeSurvived)}</div>
              </div>
            )}
            
            {floorReached && totalFloors && (
              <div className="bg-black/70 border-2 border-gray-800 p-4">
                <div className="text-yellow-400 text-lg uppercase tracking-wider mb-2">Floor Reached</div>
                <div className="text-2xl font-bold text-yellow-300">{floorReached}/{totalFloors}</div>
              </div>
            )}
            
            <div className="bg-black/70 border-2 border-gray-800 p-4">
              <div className="text-red-400 text-lg uppercase tracking-wider mb-2">Status</div>
              <div className="text-2xl font-bold text-red-300">DECEASED</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button
              onClick={onRestart}
              className="px-8 py-4 bg-gradient-to-r from-red-900 to-red-700 text-white font-bold text-xl border-b-4 border-red-950 hover:from-red-800 hover:to-red-600 transition-all uppercase tracking-wider transform hover:scale-105"
            >
              Rip & Tear Again
            </button>
            
            <button
              onClick={onBackToMenu}
              className="px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-gray-300 font-bold text-xl border-b-4 border-gray-950 hover:from-gray-800 hover:to-gray-600 transition-all uppercase tracking-wider transform hover:scale-105"
            >
              Main Menu
            </button>
          </div>

          {/* Death message */}
          <div className="mt-12 text-gray-400 text-lg italic">
            "Death is not the end, it's just the beginning of a new adventure..."
          </div>
        </div>
      </div>
    </div>
  );
} 