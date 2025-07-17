import React from "react";
import { MazeCell } from "../models/maze";

interface Props {
  maze: MazeCell[][];
  player: { x: number; y: number };
  angle: number;
  radius?: number; // радиус видимости в клетках
}

export const MiniMap: React.FC<Props> = ({ maze, player, angle, radius = 5 }) => {
  const size = 120; // px
  const cellPx = size / (radius * 2 + 1);
  const center = size / 2;

  // Собираем видимые клетки
  const cells: { x: number; y: number; type: string }[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const x = Math.round(player.x + dx);
        const y = Math.round(player.y + dy);
        if (maze[y] && maze[y][x]) {
          cells.push({ x: dx, y: dy, type: maze[y][x].type });
        }
      }
    }
  }

  return (
    <svg width={size} height={size} style={{ borderRadius: "50%", background: "#222", boxShadow: "0 0 8px #000" }}>
      {/* Круглая маска */}
      <defs>
        <clipPath id="minimap-mask">
          <circle cx={center} cy={center} r={center} />
        </clipPath>
      </defs>
      <g clipPath="url(#minimap-mask)">
        {/* Клетки */}
        {cells.map(cell => (
          <rect
            key={cell.x + "," + cell.y}
            x={center + cell.x * cellPx - cellPx / 2}
            y={center + cell.y * cellPx - cellPx / 2}
            width={cellPx}
            height={cellPx}
            fill={
              cell.type === "wall"
                ? "#444"
                : cell.type === "stairs"
                ? "#ffe066"
                : cell.type === "toilet"
                ? "#6699ff"
                : cell.type === "cooler"
                ? "#00e6e6"
                : "#fff"
            }
            stroke="#222"
            strokeWidth={0.5}
          />
        ))}
        {/* Игрок */}
        <circle cx={center} cy={center} r={cellPx * 0.4} fill="#e74c3c" stroke="#fff" strokeWidth={1} />
        {/* Направление взгляда */}
        <line
          x1={center}
          y1={center}
          x2={center + Math.cos(angle) * cellPx * radius * 0.9}
          y2={center + Math.sin(angle) * cellPx * radius * 0.9}
          stroke="#fff"
          strokeWidth={2}
          markerEnd="url(#arrowhead)"
        />
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L6,3 L0,6 Z" fill="#fff" />
          </marker>
        </defs>
      </g>
    </svg>
  );
}; 