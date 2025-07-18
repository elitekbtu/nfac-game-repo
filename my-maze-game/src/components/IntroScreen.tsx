import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showText, setShowText] = useState(false);

  const introText = [
    "Ночной звонок прервал тишину.",
    "Корпус Сатпаевского университета накрыло землетрясение,",
    "здание частично обрушилось до третьего этажа,",
    "и остались лишь три этажа коридоров и лестниц-лабиринтов.",
    "",
    "Вы один из немногих, кто остался жив внутри после первого толчка.",
    "От третьего, где начался полный хаос,",
    "до выхода на первом вас ждут голод и жажда…",
    "",
    "Успейте выбраться из этого места,",
    "пока здание окончательно не рухнуло..."
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showText) return;

    const timer = setTimeout(() => {
      if (currentStep < introText.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Показываем финальный экран на 3 секунды
        setTimeout(() => {
          onComplete();
        }, 3000);
      }
    }, 2000); // 2 секунды на каждую строку

    return () => clearTimeout(timer);
  }, [currentStep, showText, introText.length, onComplete]);

  return (
    <div className="min-h-screen bg-black font-mono relative overflow-hidden">
      {/* Эффект сканирования CRT */}
      <div className="fixed inset-0 pointer-events-none z-10" style={{
        backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0.1) 1px, transparent 1px)',
        backgroundSize: '100% 2px',
        opacity: 0.15
      }}></div>

      {/* Dust and debris effect */}
      <div className="fixed inset-0 z-20 opacity-30" style={{
        backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjAyIiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC40IiBmaWxsPSJyZ2JhKDEwMCwxMDAsMTAwLDAuOCkiLz4KPC9zdmc+')",
        mixBlendMode: 'overlay',
        pointerEvents: 'none'
      }} />

      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="max-w-4xl text-center">
          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="text-6xl md:text-8xl font-extrabold text-red-600 mb-16 tracking-wider uppercase"
            style={{ textShadow: '0 0 20px rgba(255,0,0,0.8)' }}
          >
            MAZE ESCAPE
          </motion.h1>

          {/* Subtitle */}
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 2 }}
            className="text-2xl md:text-3xl text-gray-400 mb-20 uppercase tracking-wider"
          >
            THE SATPAYEV INCIDENT
          </motion.h2>

          {/* Intro text */}
          <AnimatePresence>
            {showText && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="space-y-4 text-lg md:text-xl text-gray-300 leading-relaxed"
              >
                {introText.slice(0, currentStep + 1).map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`${line === '' ? 'h-8' : ''}`}
                  >
                    {line}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16"
          >
            <div className="w-64 h-1 bg-gray-800 mx-auto rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-red-600"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep + 1) / introText.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-gray-500 text-sm mt-2 uppercase tracking-wider">
              {currentStep + 1} / {introText.length}
            </div>
          </motion.div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 3 }}
            onClick={onComplete}
            className="mt-8 px-6 py-3 bg-gray-900/50 hover:bg-gray-800/70 text-gray-400 font-bold border border-gray-700 uppercase tracking-wider transition-all"
          >
            Skip Intro
          </motion.button>
        </div>
      </div>

      {/* Emergency lights effect */}
      <div className="fixed top-0 left-0 w-full h-2 bg-red-600 opacity-80 animate-pulse" />
      <div className="fixed bottom-0 left-0 w-full h-2 bg-red-600 opacity-80 animate-pulse" />
    </div>
  );
} 