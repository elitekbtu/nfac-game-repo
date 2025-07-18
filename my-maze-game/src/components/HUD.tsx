import React from "react";

interface HUDProps {
  floor: number;
  totalFloors: number;
  thirst: number;
  toilet: number;
  health: number;
  gameOver: boolean;
  onRestart: () => void;
  onShowLeaderboard?: () => void;
  isAudioPlaying?: boolean;
  character?: string;
  playerName?: string;
  view?: '3d' | '2d';
  onViewChange?: () => void;
  onAudioToggle?: () => void;
  showDeathPage?: boolean;
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

export const HUD: React.FC<HUDProps> = ({
  floor,
  totalFloors,
  thirst,
  toilet,
  health,
  gameOver,
  onRestart,
  onShowLeaderboard,
  isAudioPlaying,
  character,
  playerName,
  view,
  onViewChange,
  onAudioToggle,
  showDeathPage
}) => {
  const characterInfo = character ? CHARACTER_DATA[character as keyof typeof CHARACTER_DATA] : null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-2 bg-black/80 border-t-2 border-red-900 font-mono">
      <div className="flex justify-between items-center">
        {/* Left section - Stats */}
        <div className="flex items-center gap-4">
          {/* Health */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-900/90 flex items-center justify-center mr-1 border border-gray-800">
              <span className="text-red-300 font-bold text-lg">{Math.floor(health)}</span>
            </div>
            <span className="text-gray-300 uppercase text-xs tracking-wider">HEALTH</span>
          </div>
          
          {/* Armor/Toilet */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-900/90 flex items-center justify-center mr-1 border border-gray-800">
              <span className="text-blue-300 font-bold text-lg">{Math.floor(toilet)}</span>
            </div>
            <span className="text-gray-300 uppercase text-xs tracking-wider">TOILET</span>
          </div>
          
          {/* Thirst */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-900/90 flex items-center justify-center mr-1 border border-gray-800">
              <span className="text-green-300 font-bold text-lg">{Math.floor(thirst)}</span>
            </div>
            <span className="text-gray-300 uppercase text-xs tracking-wider">THIRST</span>
          </div>

          {/* Character info */}
          {characterInfo && (
            <div className="flex items-center gap-2 ml-4">
              <div className="relative w-8 h-8">
                <img 
                  src={`/mentors/${character}.png`} 
                  alt={characterInfo.name}
                  className="w-full h-full object-cover border border-gray-700"
                />
                <div className="absolute inset-0 border border-yellow-400/50 pointer-events-none"></div>
              </div>
              <div>
                <div className={`text-xs font-bold ${characterInfo.color} tracking-wider`}>
                  {characterInfo.name}
                </div>
                <div className="text-xxs text-gray-400 uppercase tracking-widest">
                  {playerName}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Center section - Floor indicator */}
        <div className="bg-black/70 px-3 py-1 border border-gray-800">
          <span className="text-yellow-400 font-bold text-sm tracking-wider">FLOOR: {floor}/{totalFloors}</span>
        </div>
        
        {/* Right section - Controls */}
        <div className="flex items-center gap-2">
          {/* MAP MODE button */}
          {onViewChange && (
            <button
              onClick={onViewChange}
              className="px-3 py-1 bg-gray-900/80 hover:bg-gray-800 text-gray-300 font-bold text-sm border border-gray-700 tracking-wider uppercase"
            >
              {view === '3d' ? 'MAP MODE' : '3D MODE'}
            </button>
          )}

          {/* SOUND ON/OFF button */}
          {onAudioToggle && (
            <button
              onClick={onAudioToggle}
              className="px-3 py-1 bg-gray-900/80 hover:bg-gray-800 text-gray-300 font-bold text-sm border border-gray-700 tracking-wider uppercase"
            >
              {isAudioPlaying ? 'SOUND ON' : 'SOUND OFF'}
            </button>
          )}

          {/* Audio indicator */}
          <div className="bg-black/70 px-2 py-1 border border-gray-800">
            <span className={`text-xs font-bold ${isAudioPlaying ? 'text-green-400' : 'text-red-400'}`}>
              {isAudioPlaying ? 'AUDIO ON' : 'AUDIO OFF'}
            </span>
          </div>
          
          {/* LEADERBOARD button */}
          {onShowLeaderboard && (
            <button
              onClick={onShowLeaderboard}
              className="px-3 py-1 bg-yellow-900/80 hover:bg-yellow-800 text-yellow-300 font-bold text-sm border border-yellow-700 tracking-wider uppercase"
            >
              LEAD
            </button>
          )}
          
          {/* Restart button */}
          <button
            onClick={onRestart}
            className="px-3 py-1 bg-red-900/80 hover:bg-red-800 text-red-300 font-bold text-sm border-b border-red-700 tracking-wider uppercase"
          >
            RESTART
          </button>
        </div>
      </div>

      {/* Game Over Screen */}
      {gameOver && !showDeathPage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
          <div className="relative">
            {/* Blood splatter effect */}
            <div 
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjA1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4zIiBmaWxsPSJyZ2JhKDIwMCwwLDAsMC45KSIvPgo8L3N2Zz4=')",
                mixBlendMode: 'hard-light',
                pointerEvents: 'none'
              }}
            />
            
            <div className="relative z-10 text-center">
              <h2 className="text-6xl font-extrabold text-red-600 mb-6 tracking-wider uppercase" 
                  style={{ textShadow: '0 0 10px rgba(255,0,0,0.8)' }}>
                GAME OVER
              </h2>
              <p className="text-xl text-gray-300 mb-8 uppercase tracking-wider">
                You have died in the maze
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={onRestart}
                  className="px-6 py-3 bg-gradient-to-r from-red-900 to-red-700 text-white font-bold text-lg border-b-4 border-red-950 hover:from-red-800 hover:to-red-600 transition-all uppercase tracking-wider"
                >
                  Rip & Tear Again
                </button>
                {onShowLeaderboard && (
                  <button
                    onClick={onShowLeaderboard}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-900 to-yellow-700 text-yellow-300 font-bold text-lg border-b-4 border-yellow-950 hover:from-yellow-800 hover:to-yellow-600 transition-all uppercase tracking-wider"
                  >
                    LEADERBOARD
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};