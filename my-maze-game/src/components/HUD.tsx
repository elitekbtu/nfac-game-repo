import React from "react";

interface HUDProps {
  floor: number;
  totalFloors: number;
  thirst: number; 
  toilet: number;
  gameOver: boolean;
  onRestart: () => void;
}

export const HUD: React.FC<HUDProps> = ({ floor, totalFloors, thirst, toilet, gameOver, onRestart }) => {
  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[520px] max-w-full z-20 pointer-events-none text-white font-sans select-none">
      <div className="flex justify-between items-center mb-4">
        <div className="text-3xl font-extrabold tracking-wide drop-shadow">Этаж {floor} / {totalFloors}</div>
      </div>
      <div className="flex gap-8 mb-2">
        {/* Жажда */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-400 text-2xl">💧</span>
            <span className="text-lg font-semibold">Жажда</span>
            <span className="ml-2 text-blue-300 font-mono text-lg">{Math.round(thirst)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-xl overflow-hidden h-6 shadow-inner">
            <div className="transition-all duration-300 h-full bg-gradient-to-r from-blue-400 to-cyan-400" style={{ width: `${thirst}%` }} />
          </div>
        </div>
        {/* Туалет */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-300 text-2xl">🚽</span>
            <span className="text-lg font-semibold">Туалет</span>
            <span className="ml-2 text-yellow-200 font-mono text-lg">{Math.round(toilet)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-xl overflow-hidden h-6 shadow-inner">
            <div className="transition-all duration-300 h-full bg-gradient-to-r from-yellow-200 to-yellow-400" style={{ width: `${toilet}%` }} />
          </div>
        </div>
      </div>
      {gameOver && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 pointer-events-auto">
          <div className="text-5xl font-extrabold mb-8">Game Over</div>
          <button
            onClick={onRestart}
            className="text-2xl px-10 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold shadow-lg hover:from-blue-600 hover:to-cyan-500 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Начать заново
          </button>
        </div>
      )}
    </div>
  );
}; 