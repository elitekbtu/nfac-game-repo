import React, { useState, useEffect } from 'react';

interface FightAnimationProps {
  onComplete: () => void;
}

export const FightAnimation: React.FC<FightAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'intro' | 'fight' | 'outro'>('intro');
  const [showFight, setShowFight] = useState(false);
  const [bloodSplatter, setBloodSplatter] = useState(false);

  // Функция для пропуска анимации
  const skipAnimation = () => {
    onComplete();
  };

  useEffect(() => {
    // Обработчик клавиш для пропуска анимации
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        skipAnimation();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Анимация в стиле DOOM
    const timer1 = setTimeout(() => {
      setPhase('fight');
      setShowFight(true);
      setBloodSplatter(true);
    }, 400); // Ускоренный переход

    const timer2 = setTimeout(() => {
      setShowFight(false);
      setBloodSplatter(false);
      setPhase('outro');
    }, 800);

    const timer3 = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Blood splatter effect */}
      {bloodSplatter && (
        <div 
          className="absolute inset-0 z-40"
          style={{
            backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjA1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4yIiBmaWxsPSJyZ2JhKDIwMCwwLDAsMC43KSIvPgo8L3N2Zz4=')",
            mixBlendMode: 'hard-light',
            pointerEvents: 'none'
          }}
        />
      )}

      {phase === 'intro' && (
        <div className="text-center z-50">
          <div className="text-6xl font-extrabold text-red-600 tracking-widest uppercase font-mono animate-pulse" 
               style={{ textShadow: '0 0 8px rgba(255,0,0,0.8)' }}>
            Warning
          </div>
          <div className="mt-4 text-2xl text-yellow-400 font-mono">
            Demonic presence detected
          </div>
        </div>
      )}
      
      {phase === 'fight' && showFight && (
        <div className="text-center z-50">
          <div className="text-8xl font-extrabold text-red-500 tracking-widest uppercase font-mono animate-pulse" 
               style={{ textShadow: '0 0 12px rgba(255,0,0,0.9)' }}>
            Rip & Tear!
          </div>
          <div className="mt-2 text-xl text-gray-300 font-mono">
            Until it is done
          </div>
        </div>
      )}
      
      {phase === 'outro' && (
        <div className="text-center z-50">
          <div className="text-5xl font-extrabold text-green-400 tracking-widest uppercase font-mono" 
               style={{ textShadow: '0 0 8px rgba(0,255,0,0.6)' }}>
            Go!
          </div>
        </div>
      )}

      {/* Scanlines overlay for CRT effect */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)',
             backgroundSize: '100% 2px',
             opacity: 0.3
           }} />

      {/* Skip button */}
      <div className="absolute bottom-4 right-4 z-50">
        <button
          onClick={skipAnimation}
          className="px-4 py-2 bg-gray-900/80 hover:bg-gray-800 text-gray-300 font-bold border-2 border-gray-700 uppercase tracking-wider text-sm transition-all duration-150"
        >
          SKIP [SPACE]
        </button>
      </div>
    </div>
  );
};