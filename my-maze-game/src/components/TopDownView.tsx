import React, { useRef, useEffect } from "react";
import { MazeCell, PlayerState } from "@/game/types";

interface TopDownViewProps {
  maze: MazeCell[][];
  player: PlayerState;
}

export const TopDownView: React.FC<TopDownViewProps> = ({ maze, player }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const cellSize = Math.min(width / maze[0].length, height / maze.length);
    const RADIUS = 10;
    // Draw maze только в радиусе вокруг игрока
    for (let y = Math.max(0, Math.floor(player.y) - RADIUS); y <= Math.min(maze.length - 1, Math.floor(player.y) + RADIUS); y++) {
      for (let x = Math.max(0, Math.floor(player.x) - RADIUS); x <= Math.min(maze[0].length - 1, Math.floor(player.x) + RADIUS); x++) {
        const cell = maze[y][x];
        if (cell.type === "wall") {
          ctx.fillStyle = "#444";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else if (cell.type === "stairs") {
          ctx.fillStyle = "gold";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else if (cell.type === "cooler") {
          ctx.fillStyle = "aqua";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else if (cell.type === "toilet") {
          ctx.fillStyle = "#ffd700";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else if (cell.type === "medkit") {
          ctx.fillStyle = "#00ff00";
          ctx.beginPath();
          ctx.arc((x + 0.5) * cellSize, (y + 0.5) * cellSize, cellSize * 0.3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
    // Draw player
    ctx.beginPath();
    ctx.arc((player.x + 0.5) * cellSize, (player.y + 0.5) * cellSize, cellSize * 0.35, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    // Draw player direction
    ctx.strokeStyle = "#00bfff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((player.x + 0.5) * cellSize, (player.y + 0.5) * cellSize);
    ctx.lineTo((player.x + 0.5 + Math.cos(player.angle) * 0.5) * cellSize, (player.y + 0.5 + Math.sin(player.angle) * 0.5) * cellSize);
    ctx.stroke();
  }, [maze, player]);
  return <canvas ref={canvasRef} width={480} height={480} style={{ background: '#222', borderRadius: 16, boxShadow: '0 0 8px #000', width: '100%', maxWidth: 600, height: 'auto' }} />;
}; 