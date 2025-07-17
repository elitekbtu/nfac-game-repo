import React, { useState } from "react";
import app from "../../firebase";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
// Для вебсокетов потребуется socket.io-client (npm i socket.io-client)
// import { io, Socket } from "socket.io-client";

interface StartPageProps {
  onStart: (user: { name: string }) => void;
  error?: string | null;
}

export default function StartPage({ onStart, error: externalError }: StartPageProps) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-2xl shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-4 border border-gray-700">
        <h2 className="text-2xl font-bold text-center text-white mb-2 tracking-wide">Вход в игру</h2>
        <input
          type="text"
          placeholder="Ваше имя"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        {(error || externalError) && <div className="text-red-400 text-center text-sm font-medium">{error || externalError}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold text-lg shadow-md hover:from-blue-600 hover:to-cyan-500 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Загрузка..." : "Войти"}
        </button>
      </form>
    </div>
  );
} 