export type CellType = "empty" | "wall" | "stairs" | "toilet" | "cooler";

export interface MazeCell {
  type: CellType;
  x: number;
  y: number;
}

export function generateFloor(width: number, height: number): MazeCell[][] {
  const maze: MazeCell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: MazeCell[] = [];
    for (let x = 0; x < width; x++) {
      let type: CellType = "wall";
      if ((x > 0 && x < width - 1) && (y > 0 && y < height - 1)) type = "empty";
      row.push({ type, x, y });
    }
    maze.push(row);
  }
  // Добавим лестницу, кулер и туалет
  maze[height - 2][width - 2].type = "stairs";
  maze[2][2].type = "cooler";
  maze[3][7].type = "toilet";
  return maze;
} 