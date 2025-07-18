import React, { useRef, useEffect } from "react";
import { MazeCell, PlayerState } from "@/game/types";

interface MinimapProps {
  maze: MazeCell[][];
  player: PlayerState;
  radius?: number; // in cells
  fov?: number; // in radians
  otherPlayers?: Record<string, { x: number; y: number; angle: number; name: string }>;
}

export const Minimap: React.FC<MinimapProps> = ({ maze, player, radius = 6, fov = Math.PI / 2, otherPlayers = {} }) => {
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
        } else if (cell.type === "medkit") {
          // Аптечки - зеленые, маленькие и прозрачные
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = "#00ff00";
          ctx.beginPath(); ctx.arc(px, py, scale * 0.15, 0, 2 * Math.PI); ctx.fill();
          ctx.globalAlpha = 1.0;
        } else if (cell.type === "pit" || cell.type === "spikes" || cell.type === "movingWall") {
          // Ловушки - красные, маленькие и прозрачные
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = "#ff0000";
          ctx.beginPath(); ctx.arc(px, py, scale * 0.15, 0, 2 * Math.PI); ctx.fill();
          ctx.globalAlpha = 1.0;
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
    // Draw other players
    Object.values(otherPlayers).forEach(p => {
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      if (Math.abs(dx) > radius || Math.abs(dy) > radius) return;
      const px = center + dx * scale;
      const py = center + dy * scale;
      ctx.beginPath();
      ctx.arc(px, py, scale * 0.28, 0, 2 * Math.PI);
      ctx.fillStyle = "#ff5555";
      ctx.fill();
      // Имя игрока
      ctx.fillStyle = "#fff";
      ctx.font = `${Math.round(scale * 0.7)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(p.name, px, py - scale * 0.4);
    });
    // Draw player
    ctx.beginPath();
    ctx.arc(center, center, scale * 0.35, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    // Draw player direction
    ctx.strokeStyle = "#00bfff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + Math.cos(player.angle) * scale * 0.7, center + Math.sin(player.angle) * scale * 0.7);
    ctx.stroke();
    ctx.restore();
  }, [maze, player, radius, fov, otherPlayers]);
  return <canvas ref={canvasRef} width={240} height={240} style={{ background: '#222', borderRadius: 16, boxShadow: '0 0 8px #000', width: '100%', maxWidth: 240, height: 'auto' }} />;
}; 