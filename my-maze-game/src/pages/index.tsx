import React, { useState } from "react";
import StartPage from "./StartPage";
import GamePage from "./GamePage";

export default function Home() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return <StartPage onStart={setUser} error={error} />;
  }
  return <GamePage user={user} onNameTaken={() => { setError("Имя уже занято, выберите другое"); setUser(null); }} />;
} 