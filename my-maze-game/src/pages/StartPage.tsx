import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaderboard } from "@/components/Leaderboard";
import { useAudio } from "@/hooks/useAudio";

// Character data with DOOM-inspired stats
const CHARACTERS = [
  {
    id: "alikhan",
    name: "ALIKHAN",
    title: "THE ALGORITHM SLAYER",
    image: "/mentors/alikhan.png",
    description: "Master of data structures and complex algorithms. His optimized pathfinding makes him deadly in the maze.",
    stats: { 
      speed: 8, 
      intelligence: 9, 
      stamina: 7,
      weapons: ["Binary Search Blade", "Recursion Rifle"]
    },
    color: "bg-red-600"
  },
  {
    id: "shoqan",
    name: "SHOQAN", 
    title: "THE REACT DEMON",
    image: "/mentors/shoqan.png",
    description: "Web development warlord with unmatched component skills. His virtual DOM manipulation is lethal.",
    stats: { 
      speed: 7, 
      intelligence: 8, 
      stamina: 8,
      weapons: ["Hook Launcher", "JSX Blaster"]
    },
    color: "bg-blue-600"
  },
  {
    id: "alibek",
    name: "ALIBEK",
    title: "THE MOBILE REAPER", 
    image: "/mentors/alibek.png",
    description: "Cross-platform executioner. Flutter and React Native are his weapons of choice.",
    stats: { 
      speed: 9, 
      intelligence: 7, 
      stamina: 7,
      weapons: ["Flutter Cannon", "Native Blade"]
    },
    color: "bg-green-600"
  },
  {
    id: "bahauddin",
    name: "BAHAUDDIN",
    title: "THE DATABASE TERROR",
    image: "/mentors/bahauddin.png",
    description: "NoSQL and SQL bow to his will. His queries are faster than bullets.",
    stats: { 
      speed: 6, 
      intelligence: 9, 
      stamina: 8,
      weapons: ["SQL Shotgun", "Index Knife"]
    },
    color: "bg-purple-600"
  },
  {
    id: "aimurat",
    name: "AIMURAT",
    title: "THE DEVOPS DESTROYER",
    image: "/mentors/aimurat.png",
    description: "CI/CD pipelines are his blood. Kubernetes clusters tremble at his approach.",
    stats: { 
      speed: 8, 
      intelligence: 8, 
      stamina: 6,
      weapons: ["Docker Fist", "K8s Cluster Bomb"]
    },
    color: "bg-orange-600"
  },
  {
    id: "gaziz",
    name: "GAZIZ",
    title: "THE ML OVERLORD",
    image: "/mentors/gaziz.png",
    description: "Neural networks are his minions. His predictions are 99.9% accurate... at killing.",
    stats: { 
      speed: 7, 
      intelligence: 10, 
      stamina: 5,
      weapons: ["Tensor Blade", "PyTorch Pistol"]
    },
    color: "bg-cyan-600"
  },
  {
    id: "bahreddin",
    name: "BAHREDDIN",
    title: "THE ARCHITECT",
    image: "/mentors/bahreddin.png",
    description: "Design patterns are his battle tactics. His microservices are actually nano-death-machines.",
    stats: { 
      speed: 6, 
      intelligence: 10, 
      stamina: 7,
      weapons: ["SOLID Sword", "Pattern Pistol"]
    },
    color: "bg-pink-600"
  },
  {
    id: "zhasulan",
    name: "ZHASULAN",
    title: "THE CYBER NINJA",
    image: "/mentors/zhasulan.png",
    description: "Firewalls can't stop him. Encryption is his native language. Your data is already his.",
    stats: { 
      speed: 9, 
      intelligence: 8, 
      stamina: 6,
      weapons: ["Firewall Breaker", "Encryption Dagger"]
    },
    color: "bg-yellow-600"
  }
];

interface StartPageProps {
  onStart: (user: { name: string; character: string }) => void;
  error?: string | null;
}

export default function StartPage({ onStart, error: externalError }: StartPageProps) {
  const [screen, setScreen] = useState<"intro" | "register" | "character">("intro");
  const [name, setName] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);
  const [bloodSplatter, setBloodSplatter] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Инициализация звуков
  const { playLaunchSound } = useAudio();

  // Воспроизводим звук запуска при загрузке страницы
  useEffect(() => {
    playLaunchSound();
  }, [playLaunchSound]);

  // Sound effects
  const playSelectSound = () => {
    try {
      const audio = new Audio('/sounds/select.wav');
      audio.volume = 0.4;
      audio.play().catch(() => {
        // Silently ignore audio errors
      });
    } catch (error) {
      // Silently ignore audio errors
    }
  };

  const playConfirmSound = () => {
    try {
      const audio = new Audio('/sounds/confirm.wav');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Silently ignore audio errors
      });
    } catch (error) {
      // Silently ignore audio errors
    }
  };

  const playErrorSound = () => {
    try {
      const audio = new Audio('/sounds/error.wav');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently ignore audio errors
      });
    } catch (error) {
      // Silently ignore audio errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("ENTER YOUR NAME, MARINE");
      playErrorSound();
      setBloodSplatter(true);
      setTimeout(() => setBloodSplatter(false), 500);
      return;
    }
    playConfirmSound();
    setScreen("character");
  };

  const handleCharacterSelect = (characterId: string) => {
    console.log("Character selected:", characterId);
    if (selectedCharacter !== characterId) {
      playSelectSound();
      setSelectedCharacter(characterId);
    }
  };

  const handleStartGame = () => {
    if (!selectedCharacter) {
      setError("SELECT YOUR WARRIOR");
      playErrorSound();
      setBloodSplatter(true);
      setTimeout(() => setBloodSplatter(false), 500);
      return;
    }
    playConfirmSound();
    playLaunchSound();
    setLoading(true);
    onStart({ name: name.trim(), character: selectedCharacter });
  };

  // --- INTRO SCREEN ---
  if (screen === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black font-mono relative overflow-hidden">
        {/* CRT Scanlines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0.1) 1px, transparent 1px)',
          backgroundSize: '100% 2px',
          opacity: 0.15
        }}></div>
        
        {/* Blood splatter effect */}
        {bloodSplatter && (
          <div className="absolute inset-0 z-0" style={{
            backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjA1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4zIiBmaWxsPSJyZ2JhKDIwMCwwLDAsMC43KSIvPgo8L3N2Zz4=')",
            mixBlendMode: 'hard-light',
            pointerEvents: 'none'
          }}></div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-black/80 border-4 border-red-900 p-10 rounded-lg shadow-2xl max-w-2xl w-full text-center"
        >
          {/* Title with animated gradient */}
          <h1 className="text-6xl font-extrabold mb-8 tracking-widest">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 animate-gradient-x">
              MAZE OF DOOM
            </span>
          </h1>
          
          <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            YOU ARE THE LAST HOPE AGAINST THE DEMONIC MAZE. YOUR MISSION: SURVIVE 10 FLOORS OF HELL, MANAGE YOUR THIRST, AND FIND THE EXIT BEFORE IT'S TOO LATE.
          </p>
          
          <div className="flex flex-col gap-4 items-center">
            <div className="relative inline-block">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                              onClick={() => {
                console.log("Button clicked!");
                playConfirmSound();
                playLaunchSound();
                setScreen("register");
              }}
                className="px-10 py-4 bg-gradient-to-r from-red-800 to-red-600 text-white font-bold text-xl border-b-4 border-red-900 hover:border-red-700 transition-all shadow-lg relative z-10 cursor-pointer"
              >
                ENTER THE MAZE
              </motion.button>
              <div className="absolute -inset-1 bg-red-600/50 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"></div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSelectSound();
                setShowLeaderboard(true);
              }}
              className="px-8 py-3 bg-gradient-to-r from-yellow-800 to-yellow-600 text-yellow-300 font-bold text-lg border-b-4 border-yellow-900 hover:border-yellow-700 transition-all shadow-lg relative z-10 cursor-pointer"
            >
              LEADERBOARD
            </motion.button>
          </div>
          
          <div className="mt-8 text-gray-500 text-sm">
            WARNING: EXTREME PROGRAMMING SKILLS REQUIRED
          </div>
        </motion.div>
      </div>
    );
  }

  // --- REGISTER SCREEN ---
  if (screen === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black font-mono relative overflow-hidden">
        {/* CRT Scanlines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0.1) 1px, transparent 1px)',
          backgroundSize: '100% 2px',
          opacity: 0.15
        }}></div>
        
        {/* Blood splatter effect */}
        {bloodSplatter && (
          <div className="absolute inset-0 z-0" style={{
            backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjA1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4zIiBmaWxsPSJyZ2JhKDIwMCwwLDAsMC43KSIvPgo8L3N2Zz4=')",
            mixBlendMode: 'hard-light',
            pointerEvents: 'none'
          }}></div>
        )}

        <motion.form 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit} 
          className="relative bg-black/80 p-8 rounded-lg shadow-2xl min-w-[320px] w-full max-w-sm border-4 border-red-900"
        >
          <h2 className="text-3xl font-bold text-center text-yellow-400 mb-6 tracking-wider">
            IDENTIFICATION
          </h2>
          
          <div className="mb-6">
            <label className="block text-red-400 text-sm font-bold mb-2 tracking-wide">
              ENTER YOUR CALLSIGN
            </label>
            <input
              type="text"
              placeholder="MARINE"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded bg-gray-900 text-white border-2 border-gray-700 focus:outline-none focus:border-red-500 transition font-mono tracking-wider"
            />
          </div>
          
          {(error || externalError) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-center text-sm font-bold tracking-wider mb-4"
            >
              ⚠️ {error || externalError}
            </motion.div>
          )}
          
          <div className="flex flex-col space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              onClick={() => console.log("Submit button clicked!")}
              className="w-full py-3 rounded bg-gradient-to-r from-red-700 to-red-500 text-white font-bold text-lg shadow-md hover:from-red-800 hover:to-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed border-b-4 border-red-900 relative z-10 cursor-pointer"
            >
              {loading ? "LOADING..." : "CONFIRM"}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                console.log("Abort button clicked!");
                playSelectSound();
                setScreen("intro");
              }}
              className="w-full py-2 rounded bg-gray-800 text-gray-300 font-bold text-sm shadow hover:bg-gray-700 transition border-2 border-gray-700 relative z-10 cursor-pointer"
            >
              ABORT MISSION
            </motion.button>
          </div>
        </motion.form>
      </div>
    );
  }

  // --- CHARACTER SELECTION SCREEN ---
  return (
    <div className="min-h-screen bg-black font-mono p-4 relative overflow-hidden">
      {/* CRT Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0.1) 1px, transparent 1px)',
        backgroundSize: '100% 2px',
        opacity: 0.15
      }}></div>
      
      {/* Blood splatter effect */}
      {bloodSplatter && (
        <div className="absolute inset-0 z-0" style={{
          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjA1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGchoi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4zIiBmaWxsPSJyZ2JhKDIwMCwwLDAsMC43KSIvPgo8L3N2Zz4=')",
          mixBlendMode: 'hard-light',
          pointerEvents: 'none'
        }}></div>
      )}
      
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-blue-900/10 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.1),transparent_50%)]"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <div className="relative inline-block">
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 mb-4 tracking-widest drop-shadow-2xl animate-pulse">
              SELECT YOUR WARRIOR
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-full"></div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-black/50 p-4 rounded-lg border border-gray-700 inline-block mt-6"
          >
            <p className="text-gray-300 text-xl tracking-wider">
              PLAYER: <span className="text-yellow-400 font-bold text-2xl">{name.toUpperCase()}</span>
            </p>
          </motion.div>
        </motion.div>

        {/* Character grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {CHARACTERS.map((character) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleCharacterSelect(character.id)}
              onMouseEnter={() => setHoveredCharacter(character.id)}
              onMouseLeave={() => setHoveredCharacter(null)}
              className={`relative cursor-pointer transition-all duration-300 transform ${
                selectedCharacter === character.id 
                  ? 'ring-4 ring-yellow-400 shadow-2xl shadow-yellow-400/50 scale-105 z-10' 
                  : hoveredCharacter === character.id
                  ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/30 scale-105 z-10'
                  : 'ring-2 ring-gray-600 hover:ring-red-500'
              }`}
            >
              {/* Character card */}
              <div className={`relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 rounded-lg border-2 border-gray-700 h-full ${character.color}`}>
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-blue-900/20 opacity-50"></div>
                
                {/* Character image */}
                <div className="relative mb-6 h-64 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                    {/* Selection glow effect */}
                    {selectedCharacter === character.id && (
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-lg animate-pulse"></div>
                    )}
                    {/* Hover effect */}
                    {hoveredCharacter === character.id && selectedCharacter !== character.id && (
                      <div className="absolute inset-0 bg-red-500/10 rounded-lg"></div>
                    )}
                    {/* Image border */}
                    <div className="absolute inset-0 border-2 border-gray-600 rounded-lg"></div>
                  </div>
                </div>

                {/* Character name */}
                <div className="relative mb-4">
                  <h3 className="text-2xl font-extrabold text-center text-white tracking-wider mb-2 drop-shadow-lg">
                    {character.name}
                  </h3>
                  <div className="text-center text-yellow-400 text-sm font-bold mb-2 tracking-wider">
                    {character.title}
                  </div>
                  <div className="h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-full"></div>
                </div>

                {/* Description */}
                <div className="relative mb-6">
                  <p className="text-gray-300 text-sm text-center leading-relaxed font-medium">
                    {character.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="relative space-y-3">
                  {/* Speed */}
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-red-400 text-sm font-bold tracking-wide">⚡ SPEED</span>
                      <span className="text-red-300 font-mono text-sm">{character.stats.speed}/10</span>
                    </div>
                    <div className="flex space-x-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i < character.stats.speed 
                              ? 'bg-gradient-to-r from-red-500 to-red-400 shadow-sm shadow-red-500/50' 
                              : 'bg-gray-600'
                          }`}
                          style={{ width: '8%' }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Intelligence */}
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-blue-400 text-sm font-bold tracking-wide">🧠 INTELLIGENCE</span>
                      <span className="text-blue-300 font-mono text-sm">{character.stats.intelligence}/10</span>
                    </div>
                    <div className="flex space-x-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i < character.stats.intelligence 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-400 shadow-sm shadow-blue-500/50' 
                              : 'bg-gray-600'
                          }`}
                          style={{ width: '8%' }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stamina */}
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-400 text-sm font-bold tracking-wide">💪 STAMINA</span>
                      <span className="text-green-300 font-mono text-sm">{character.stats.stamina}/10</span>
                    </div>
                    <div className="flex space-x-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i < character.stats.stamina 
                              ? 'bg-gradient-to-r from-green-500 to-green-400 shadow-sm shadow-green-500/50' 
                              : 'bg-gray-600'
                          }`}
                          style={{ width: '8%' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Weapons */}
                <div className="mt-4">
                  <h4 className="text-gray-400 text-xs font-bold tracking-wider mb-2">WEAPONS:</h4>
                  <div className="flex flex-wrap gap-2">
                    {character.stats.weapons.map((weapon, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded border border-gray-700">
                        {weapon}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedCharacter === character.id && (
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/50 animate-pulse">
                    <span className="text-black font-bold text-xl">✓</span>
                  </div>
                )}

                {/* Hover glow effect */}
                {hoveredCharacter === character.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-blue-500/5 rounded-lg pointer-events-none"></div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Control buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              console.log("Back button clicked!");
              playSelectSound();
              setScreen("register");
            }}
            className="px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-bold text-lg border-2 border-gray-600 hover:border-gray-500 transition-all duration-150 shadow-lg hover:shadow-xl relative z-10 cursor-pointer"
          >
            ← BACK
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              console.log("Start game button clicked!");
              handleStartGame();
            }}
            disabled={!selectedCharacter || loading}
            className={`px-12 py-4 font-bold text-xl transition-all duration-150 relative z-10 cursor-pointer ${
              !selectedCharacter || loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 text-white shadow-lg hover:shadow-2xl hover:shadow-red-500/50'
            }`}
          >
            {loading ? "LOADING..." : "⚔️ RIP & TEAR ⚔️"}
          </motion.button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mt-6"
            >
              <div className="bg-red-900/50 border border-red-600 text-red-300 px-6 py-3 rounded-lg font-bold text-lg shadow-lg animate-pulse tracking-wider">
                ⚠️ {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Leaderboard */}
      <Leaderboard
        isVisible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
}