import React, { useState } from "react";
// import app from "../../firebase";
// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface StartPageProps {
  onStart: (user: { name: string }) => void;
  error?: string | null;
}

export default function StartPage({ onStart, error: externalError }: StartPageProps) {
  const [screen, setScreen] = useState<"intro" | "register">("intro");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    setLoading(true);
    onStart({ name: name.trim() });
    setLoading(false);
  };

  // --- ЭКРАН 1: ПРЕДИСЛОВИЕ ---
  if (screen === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900 font-mono">
        <div className="bg-black/80 border-4 border-red-900 p-10 rounded-2xl shadow-2xl max-w-2xl w-full text-center flex flex-col items-center">
          <h1 className="text-5xl font-extrabold text-red-600 mb-6 tracking-widest drop-shadow-lg">MAZE OF DOOM</h1>
          <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
            Добро пожаловать в <span className="text-yellow-400 font-bold">Maze of Doom</span> — игру, где выживание зависит от вашей смекалки, скорости и немного удачи. Вас ждёт мрачный лабиринт, жажда, страх и... туалетные испытания. Сможете ли вы выбраться?
          </p>
          <button
            onClick={() => setScreen("register")}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-lg border-b-4 border-red-900 hover:border-red-700 transition shadow-lg"
          >
            ГОТОВЫ НАЧАТЬ?
          </button>
        </div>
      </div>
    );
  }

  // --- ЭКРАН 2: РЕГИСТРАЦИЯ ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900 font-mono">
      <form onSubmit={handleSubmit} className="bg-black/80 p-8 rounded-2xl shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-4 border-4 border-red-900">
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-2 tracking-wide">Вход в лабиринт</h2>
        <input
          type="text"
          placeholder="Ваше имя"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
        />
        {(error || externalError) && <div className="text-red-400 text-center text-sm font-medium">{error || externalError}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-yellow-500 text-white font-bold text-lg shadow-md hover:from-red-700 hover:to-yellow-600 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2 border-b-4 border-red-900"
        >
          {loading ? "Загрузка..." : "Войти"}
        </button>
        <button
          type="button"
          onClick={() => setScreen("intro")}
          className="mt-2 text-gray-400 hover:text-yellow-400 text-xs underline"
        >
          ← Назад к предисловию
        </button>
      </form>
    </div>
  );
} 