import React from "react";
import { MazeCell } from "../models/maze";

interface Props {
  maze: MazeCell[][];
  player: { x: number; y: number };
}

export const GameCanvas: React.FC<Props> = ({ maze, player }) => (
  <div style={{ position: "relative", width: 400, height: 400 }}>
    {maze.map((row, y) =>
      row.map((cell, x) => (
        <div
          key={`${x}-${y}`}
          style={{
            position: "absolute",
            left: x * 40,
            top: y * 40,
            width: 40,
            height: 40,
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
            fontSize: 24,
          }}
        >
          {player.x === x && player.y === y ? "👤" : ""}
        </div>
      ))
    )}
  </div>
); 