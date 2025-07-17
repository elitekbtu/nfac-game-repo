import React, { useRef, useEffect } from "react";
import { MazeCell, PlayerState } from "@/game/types";

interface MinimapProps {
  maze: MazeCell[][];
  player: PlayerState;
  radius?: number; // in cells
  fov?: number; // in radians
}

export const Minimap: React.FC<MinimapProps> = ({ maze, player, radius = 6, fov = Math.PI / 2 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    const center = size / 2;
    const scale = center / (radius + 0.5);
    // Draw circular mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center, 0, 2 * Math.PI);
    ctx.clip();
    // Draw maze
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const mx = Math.floor(player.x) + dx;
        const my = Math.floor(player.y) + dy;
        if (mx < 0 || my < 0 || my >= maze.length || mx >= maze[0].length) continue;
        const cell = maze[my][mx];
        const px = center + dx * scale;
        const py = center + dy * scale;
        if (cell.type === "wall") {
          ctx.fillStyle = "#444";
          ctx.fillRect(px - scale / 2, py - scale / 2, scale, scale);
        } else if (cell.type === "stairs") {
          ctx.fillStyle = "gold";
          ctx.beginPath(); ctx.arc(px, py, scale * 0.3, 0, 2 * Math.PI); ctx.fill();
        } else if (cell.type === "cooler") {
          ctx.fillStyle = "aqua";
          ctx.beginPath(); ctx.arc(px, py, scale * 0.25, 0, 2 * Math.PI); ctx.fill();
        } else if (cell.type === "toilet") {
          ctx.fillStyle = "#ffd700";
          ctx.beginPath(); ctx.arc(px, py, scale * 0.25, 0, 2 * Math.PI); ctx.fill();
        }
      }
    }
    // Draw FOV cone
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, center, player.angle - fov / 2, player.angle + fov / 2);
    ctx.closePath();
    ctx.fillStyle = "#00bfff";
    ctx.fill();
    ctx.globalAlpha = 1.0;
    // Draw player
    ctx.beginPath();
    ctx.arc(center, center, scale * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    // Draw player direction
    ctx.strokeStyle = "#00bfff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + Math.cos(player.angle) * scale * 1.2, center + Math.sin(player.angle) * scale * 1.2);
    ctx.stroke();
    ctx.restore();
  }, [maze, player, radius, fov]);
  return <canvas ref={canvasRef} width={160} height={160} style={{ borderRadius: '50%', background: '#222', boxShadow: '0 0 8px #000', position: 'absolute', top: 16, right: 16, zIndex: 10 }} />;
}; 