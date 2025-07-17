import React from "react";
import { MazeCell } from "../models/maze";

interface Props {
  maze: MazeCell[][];
  player: { x: number; y: number };
}

export const GameCanvas: React.FC<Props> = ({ maze, player }) => {
  const rows = maze.length;
  const cols = maze[0].length;
  const cellSize = Math.floor(400 / Math.max(rows, cols));
  return (
    <div style={{ position: "relative", width: cellSize * cols, height: cellSize * rows, background: "#222" }}>
      {maze.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              position: "absolute",
              left: x * cellSize,
              top: y * cellSize,
              width: cellSize,
              height: cellSize,
              background:
                cell.type === "wall"
                  ? "#333"
                  : cell.type === "stairs"
                  ? "yellow"
                  : cell.type === "toilet"
                  ? "blue"
                  : cell.type === "cooler"
                  ? "aqua"
                  : "white",
              border: "1px solid #999",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: cellSize * 0.6,
              transition: "background 0.2s",
            }}
          >
            {player.x === x && player.y === y ? "👤" : ""}
          </div>
        ))
      )}
    </div>
  );
}; 