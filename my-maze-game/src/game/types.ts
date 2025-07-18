// src/game/types.ts

export type CellType = "empty" | "wall" | "stairs" | "toilet" | "cooler" | "exit" | "pit" | "spikes" | "movingWall" | "medkit";

export interface PlayerNeeds {
  thirst: number;
  toilet: number;
  health: number;  // Новый параметр здоровья
}

export interface MazeCell {
  type: CellType;
  x: number;
  y: number;
}

// Represents a sprite object in the game
export interface Sprite {
  x: number;
  y: number;
  type: CellType;
}

// Player state, now with float positions for smooth movement
export interface PlayerState {
  x: number;      // Player's X position (float)
  y: number;      // Player's Y position (float)
  angle: number;  // Player's viewing angle in radians
}

// For static maps: 0=wall, 1=empty, 2=cooler, 3=toilet, 4=stairs
export type StaticCellValue = 0 | 1 | 2 | 3 | 4; 