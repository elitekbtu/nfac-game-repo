import { useEffect, useState } from "react";
import { generateFloor } from "../models/maze";
import { GameCanvas } from "../components/GameCanvas";

export default function GamePage() {
  const [maze] = useState(() => generateFloor(10, 10));
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [thirst, setThirst] = useState(100);
  const [toilet, setToilet] = useState(100);

  // Уменьшение потребностей со временем
  useEffect(() => {
    const interval = setInterval(() => {
      setThirst((t) => Math.max(0, t - 1));
      setToilet((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Управление движением
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let { x, y } = player;
      if (e.key === "ArrowUp" || e.key === "w") y--;
      if (e.key === "ArrowDown" || e.key === "s") y++;
      if (e.key === "ArrowLeft" || e.key === "a") x--;
      if (e.key === "ArrowRight" || e.key === "d") x++;
      if (
        maze[y] &&
        maze[y][x] &&
        maze[y][x].type !== "wall"
      ) {
        setPlayer({ x, y });
        // Если на кулере — пополняем жажду
        if (maze[y][x].type === "cooler") setThirst(100);
        // Если на туалете — пополняем туалет
        if (maze[y][x].type === "toilet") setToilet(100);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player, maze]);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <h2>Потребности</h2>
      <div>Жажда: {thirst}</div>
      <div>Туалет: {toilet}</div>
      <GameCanvas maze={maze} player={player} />
      <div style={{ marginTop: 20, color: "#888" }}>
        Управление: стрелки или WASD
      </div>
    </div>
  );
} 