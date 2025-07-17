// src/game/maze.ts
import { MazeCell, CellType } from "./types";

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateMaze(width: number, height: number): MazeCell[][] {
  const maze: MazeCell[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({ type: "wall" as CellType, x, y }))
  );

  function carve(x: number, y: number) {
    maze[y][x].type = "empty";
    const dirs = shuffle([[0, -2], [0, 2], [-2, 0], [2, 0]]);
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < width && ny > 0 && ny < height && maze[ny][nx].type === "wall") {
        maze[y + dy / 2][x + dx / 2].type = "empty";
        carve(nx, ny);
      }
    }
  }

  // Start carving from a random odd-numbered cell
  const startX = Math.floor(Math.random() * ((width - 1) / 2)) * 2 + 1;
  const startY = Math.floor(Math.random() * ((height - 1) / 2)) * 2 + 1;
  carve(startX, startY);

  // Remove some walls to create loops
  const wallRemovalCount = Math.floor((width * height) / 15);
  for (let i = 0; i < wallRemovalCount; i++) {
    const x = Math.floor(Math.random() * (width - 2)) + 1;
    const y = Math.floor(Math.random() * (height - 2)) + 1;
    if (maze[y][x].type === "wall") {
      maze[y][x].type = "empty";
    }
  }

  // Collect all empty cells for item placement
  const emptyCells: { x: number; y: number }[] = [];
  let farthestCell = { x: 1, y: 1, dist: 0 };
  const playerStart = { x: 1.5, y: 1.5 };
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (maze[y][x].type === "empty") {
        const dist = Math.sqrt(Math.pow(x - playerStart.x, 2) + Math.pow(y - playerStart.y, 2));
        emptyCells.push({ x, y });
        if (dist > farthestCell.dist) {
          farthestCell = { x, y, dist };
        }
      }
    }
  }
  shuffle(emptyCells);

  // Place stairs at the farthest point from the player's start
  maze[farthestCell.y][farthestCell.x].type = "stairs";
  const itemCells = emptyCells.filter(c => c.x !== farthestCell.x || c.y !== farthestCell.y);
  const coolerCell = itemCells.pop();
  if (coolerCell) maze[coolerCell.y][coolerCell.x].type = "cooler";
  const toiletCell = itemCells.pop();
  if (toiletCell) maze[toiletCell.y][toiletCell.x].type = "toilet";
  maze[1][1].type = "empty";
  return maze;
}

let prebuiltBuilding: MazeCell[][][] | null = null;

export function getPrebuiltBuilding(floors: number, width: number, height: number): MazeCell[][][] {
  if (!prebuiltBuilding) {
    prebuiltBuilding = Array.from({ length: floors }, () => generateMaze(width, height));
  }
  return prebuiltBuilding;
}

export function regenerateBuilding(floors: number, width: number, height: number): MazeCell[][][] {
  prebuiltBuilding = Array.from({ length: floors }, () => generateMaze(width, height));
  return prebuiltBuilding;
}

// --- Static map support ---
const STATIC_CELL_MAP = {
  0: "wall",
  1: "empty",
  2: "cooler",
  3: "toilet",
  4: "stairs",
} as const;

export function fromStaticMap(map: number[][]): MazeCell[][] {
  return map.map((row, y) =>
    row.map((cell, x) => ({
      type: STATIC_CELL_MAP[cell as keyof typeof STATIC_CELL_MAP] || "wall",
      x,
      y,
    }))
  );
}

// Example static map (30x30, mostly walls, with a path and some items)
export const SAMPLE_STATIC_MAP: number[][] = Array.from({ length: 30 }, (_, y) =>
  Array.from({ length: 30 }, (_, x) =>
    (x === 1 && y > 0 && y < 29) ? 1 : (x === 28 && y > 0 && y < 29) ? 1 : (y === 1 && x > 0 && x < 29) ? 1 : (y === 28 && x > 0 && x < 29) ? 1 : 0
  )
);
SAMPLE_STATIC_MAP[2][2] = 2; // cooler
SAMPLE_STATIC_MAP[27][27] = 3; // toilet
SAMPLE_STATIC_MAP[28][28] = 4; // stairs 