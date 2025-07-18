import React, { useEffect, useState } from "react";
import { ref, push, onValue, off } from "firebase/database";
import { db } from "../../firebase";

interface LeaderboardEntry {
  id: string;
  name: string;
  character: string;
  time: number;
  timestamp: number;
}

interface LeaderboardProps {
  isVisible: boolean;
  onClose: () => void;
  currentPlayerTime?: number;
  currentPlayerName?: string;
  currentPlayerCharacter?: string;
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

export const Leaderboard: React.FC<LeaderboardProps> = ({
  isVisible,
  onClose,
  currentPlayerTime,
  currentPlayerName,
  currentPlayerCharacter
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загружаем таблицу лидеров
  useEffect(() => {
    if (!isVisible) return;

    const leaderboardRef = ref(db, 'leaderboard');
    
    const handleLeaderboard = (snap: any) => {
      const data = snap.val();
      if (data) {
        const entries: LeaderboardEntry[] = Object.entries(data).map(([id, entry]: [string, any]) => ({
          id,
          name: entry.name,
          character: entry.character,
          time: entry.time,
          timestamp: entry.timestamp
        }));
        
        // Сортируем по времени (быстрее = лучше)
        entries.sort((a, b) => a.time - b.time);
        setLeaderboard(entries.slice(0, 10)); // Топ 10
      } else {
        setLeaderboard([]);
      }
    };

    onValue(leaderboardRef, handleLeaderboard);

    return () => {
      off(leaderboardRef, 'value', handleLeaderboard);
    };
  }, [isVisible]);

  // Сохраняем результат игрока
  const savePlayerResult = async () => {
    if (!currentPlayerTime || !currentPlayerName || !currentPlayerCharacter) return;
    
    setIsSubmitting(true);
    try {
      const leaderboardRef = ref(db, 'leaderboard');
      await push(leaderboardRef, {
        name: currentPlayerName,
        character: currentPlayerCharacter,
        time: currentPlayerTime,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Ошибка сохранения результата:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (ms: number): string => {
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
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative w-full max-w-4xl mx-4">
        {/* CRT эффект */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0.1) 1px, transparent 1px)',
          backgroundSize: '100% 2px',
          opacity: 0.15
        }}></div>
        
        <div className="relative z-10 bg-black/95 border-4 border-gray-800 p-6">
          {/* Заголовок */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-yellow-400 mb-2 tracking-wider uppercase" 
                style={{ textShadow: '0 0 10px rgba(255,255,0,0.7)' }}>
              LEADERBOARD
            </h2>
            <div className="text-gray-400 text-sm uppercase tracking-wider">
              Fastest Maze Runners
            </div>
          </div>

          {/* Текущий результат игрока */}
          {currentPlayerTime && currentPlayerName && currentPlayerCharacter && (
            <div className="mb-6 p-4 bg-gray-900/50 border-2 border-green-600">
              <div className="text-center">
                <div className="text-green-400 text-lg font-bold mb-2 uppercase tracking-wider">
                  Your Result
                </div>
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="relative w-12 h-12">
                    <img 
                      src={`/mentors/${currentPlayerCharacter}.png`} 
                      alt={CHARACTER_DATA[currentPlayerCharacter as keyof typeof CHARACTER_DATA]?.name}
                      className="w-full h-full object-cover border border-gray-700"
                    />
                    <div className="absolute inset-0 border border-yellow-400/50 pointer-events-none"></div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${CHARACTER_DATA[currentPlayerCharacter as keyof typeof CHARACTER_DATA]?.color} tracking-wider`}>
                      {CHARACTER_DATA[currentPlayerCharacter as keyof typeof CHARACTER_DATA]?.name}
                    </div>
                    <div className="text-gray-300 text-sm uppercase tracking-wider">
                      {currentPlayerName}
                    </div>
                  </div>
                  <div className="text-yellow-400 text-xl font-bold">
                    {formatTime(currentPlayerTime)}
                  </div>
                </div>
                <button
                  onClick={savePlayerResult}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-300 font-bold border-2 border-green-700 uppercase tracking-wider transition"
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE RESULT'}
                </button>
              </div>
            </div>
          )}

          {/* Таблица лидеров */}
          <div className="max-h-96 overflow-y-auto">
            {leaderboard.length === 0 ? (
              <div className="text-center text-gray-500 py-8 uppercase tracking-wider">
                No records yet
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const characterInfo = CHARACTER_DATA[entry.character as keyof typeof CHARACTER_DATA];
                  const isCurrentPlayer = entry.name === currentPlayerName && entry.character === currentPlayerCharacter;
                  
                  return (
                    <div 
                      key={entry.id}
                      className={`flex items-center justify-between p-3 border-2 ${
                        index === 0 ? 'border-yellow-500 bg-yellow-900/20' :
                        index === 1 ? 'border-gray-400 bg-gray-900/20' :
                        index === 2 ? 'border-orange-600 bg-orange-900/20' :
                        isCurrentPlayer ? 'border-green-500 bg-green-900/20' :
                        'border-gray-700 bg-gray-800/20'
                      }`}
                    >
                      {/* Позиция */}
                      <div className="w-12 text-center">
                        <span className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>

                      {/* Персонаж */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                          <img 
                            src={`/mentors/${entry.character}.png`} 
                            alt={characterInfo?.name}
                            className="w-full h-full object-cover border border-gray-700"
                          />
                          <div className="absolute inset-0 border border-yellow-400/50 pointer-events-none"></div>
                        </div>
                        <div>
                          <div className={`font-bold ${characterInfo?.color} tracking-wider`}>
                            {characterInfo?.name}
                          </div>
                          <div className="text-gray-300 text-sm uppercase tracking-wider">
                            {entry.name}
                          </div>
                        </div>
                      </div>

                      {/* Время */}
                      <div className="text-right">
                        <div className="text-yellow-400 text-lg font-bold">
                          {formatTime(entry.time)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Кнопка закрытия */}
          <div className="text-center mt-6">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold border-2 border-gray-700 uppercase tracking-wider transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 