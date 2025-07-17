import { mazeMaps } from "./maze-maps";

export type CellType = "empty" | "wall" | "stairs" | "toilet" | "cooler";

export interface MazeCell {
  type: CellType;
  x: number;
  y: number;
}

// Преобразование числовой карты в MazeCell[][]
function mapToMazeCells(map: number[][]): MazeCell[][] {
  return map.map((row, y) =>
    row.map((cell, x) => {
      let type: CellType = "wall";
      if (cell === 1) type = "empty";
      if (cell === 2) type = "cooler";
      if (cell === 3) type = "toilet";
      if (cell === 4) type = "stairs";
      return { type, x, y };
    })
  );
}

// Получить здание из карт
export function getBuildingFromMaps(): MazeCell[][][] {
  return mazeMaps.map(mapToMazeCells);
}

// Алгоритм генерации лабиринта с тупиками (DFS)
function generateMaze(width: number, height: number): MazeCell[][] {
  // Инициализация всех стен
  const maze: MazeCell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: MazeCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ type: "wall", x, y });
    }
    maze.push(row);
  }

  // Вспомогательные функции
  function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function carve(x: number, y: number) {
    maze[y][x].type = "empty";
    const dirs = shuffle([
      [0, -2], // вверх
      [0, 2],  // вниз
      [-2, 0], // влево
      [2, 0],  // вправо
    ]);
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx > 0 && nx < width &&
        ny > 0 && ny < height &&
        maze[ny][nx].type === "wall"
      ) {
        maze[y + dy / 2][x + dx / 2].type = "empty";
        carve(nx, ny);
      }
    }
  }

  // Начинаем с нечётных координат (1,1)
  carve(1, 1);

  // Гарантируем вход
  maze[1][1].type = "empty";

  // Собираем все пустые клетки, кроме (1,1)
  const emptyCells = [] as {x: number, y: number}[];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (maze[y][x].type === "empty" && !(x === 1 && y === 1)) {
        emptyCells.push({x, y});
      }
    }
  }
  shuffle(emptyCells);

  // Случайно размещаем лестницу, кулер и туалет
  if (emptyCells.length >= 3) {
    const stairsCell = emptyCells.pop();
    if (stairsCell) maze[stairsCell.y][stairsCell.x].type = "stairs";
    const coolerCell = emptyCells.pop();
    if (coolerCell) maze[coolerCell.y][coolerCell.x].type = "cooler";
    const toiletCell = emptyCells.pop();
    if (toiletCell) maze[toiletCell.y][toiletCell.x].type = "toilet";
  }

  return maze;
}

export function generateFloor(width: number, height: number): MazeCell[][] {
  return generateMaze(width, height);
}

export function generateBuilding(floors: number, width: number, height: number): MazeCell[][][] {
  const building: MazeCell[][][] = [];
  for (let i = 0; i < floors; i++) {
    building.push(generateFloor(width, height));
  }
  return building;
}

// Сохраняем набор карт для здания (один раз при запуске)
let prebuiltBuilding: MazeCell[][][] | null = null;

export function getPrebuiltBuilding(floors: number, width: number, height: number): MazeCell[][][] {
  if (!prebuiltBuilding) {
    prebuiltBuilding = generateBuilding(floors, width, height);
  }
  return prebuiltBuilding;
}

export function regenerateBuilding(floors: number, width: number, height: number): MazeCell[][][] {
  prebuiltBuilding = generateBuilding(floors, width, height);
  return prebuiltBuilding;
} 