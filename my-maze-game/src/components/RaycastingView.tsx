import React, { useRef, useEffect, useState } from "react";
import { MazeCell, PlayerState } from "../game/types";

interface Props {
  maze: MazeCell[][];
  initialPlayer: PlayerState;
  onPlayerStateChange: (newState: PlayerState) => void;
  fade?: boolean;
}

const DEFAULT_FOV = Math.PI / 2; // 90 deg
const DEFAULT_CORRIDOR = 1.0;
const MOVE_SPEED = 2.5;
const TURN_SPEED = Math.PI;
const COLLISION_MARGIN = 0.25;
const RENDER_WIDTH = 800;
const RENDER_HEIGHT = 600;

// Helper to load an image as a texture
function useImageTexture(src: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    console.log(`Loading texture: ${src}`);
    const image = new window.Image();
    image.src = src;
    image.onload = () => {
      console.log(`Texture loaded successfully: ${src}`, image);
      setImg(image);
    };
    image.onerror = () => {
      console.error(`Failed to load texture: ${src}`);
    };
  }, [src]);
  return img;
}

export const RaycastingView: React.FC<Props> = ({ maze, initialPlayer, onPlayerStateChange, fade }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerStateRef = useRef<PlayerState>(initialPlayer);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(0);
  const [fov, setFov] = useState(DEFAULT_FOV);
  const [corridor, setCorridor] = useState(DEFAULT_CORRIDOR);

  // Load textures
  const wallTex = useImageTexture("/textures/wall.png");
  const ceilTex = useImageTexture("/textures/ceiling.png");
  const coolerTex = useImageTexture("/textures/cooler.png");
  const toiletTex = useImageTexture("/textures/toilet.png");
  const stairsTex = useImageTexture("/textures/exit.png");
  const doorTex = useImageTexture("/textures/door.png");

  // Debug: проверяем загрузку текстур
  useEffect(() => {
    console.log("Textures loaded:", {
      wall: !!wallTex,
      ceiling: !!ceilTex,
      cooler: !!coolerTex,
      toilet: !!toiletTex,
      stairs: !!stairsTex,
      door: !!doorTex
    });
    console.log("Texture details:", {
      wall: wallTex,
      ceiling: ceilTex,
      cooler: coolerTex,
      toilet: toiletTex,
      stairs: stairsTex,
      door: doorTex
    });
  }, [wallTex, ceilTex, coolerTex, toiletTex, stairsTex, doorTex]);

  useEffect(() => { playerStateRef.current = initialPlayer; }, [initialPlayer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === "+") setFov(f => Math.min(Math.PI, f + Math.PI / 36));
      if (e.key === "-") setFov(f => Math.max(Math.PI / 6, f - Math.PI / 36));
      if (e.key === "[") setCorridor(c => Math.max(0.5, c - 0.1));
      if (e.key === "]") setCorridor(c => Math.min(2.0, c + 0.1));
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    let animationFrameId: number;
    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      update(deltaTime);
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    gameLoop(0);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [maze, fov, corridor, wallTex, ceilTex, coolerTex, toiletTex, stairsTex, doorTex]);

  const update = (deltaTime: number) => {
    const { angle } = playerStateRef.current;
    let { x, y } = playerStateRef.current;
    const keys = keysPressed.current;
    // Повороты
    if (keys["arrowleft"]) playerStateRef.current.angle -= TURN_SPEED * deltaTime;
    if (keys["arrowright"]) playerStateRef.current.angle += TURN_SPEED * deltaTime;
    // Движение
    const moveStep = MOVE_SPEED * deltaTime;
    let dx = 0, dy = 0;
    if (keys["w"] || keys["arrowup"]) {
      dx += Math.cos(angle);
      dy += Math.sin(angle);
    }
    if (keys["s"] || keys["arrowdown"]) {
      dx -= Math.cos(angle);
      dy -= Math.sin(angle);
    }
    if (keys["a"]) { dx += Math.sin(angle); dy -= Math.cos(angle); }
    if (keys["d"]) { dx -= Math.sin(angle); dy += Math.cos(angle); }
    // Нормализация для диагонального движения
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / len) * moveStep;
      dy = (dy / len) * moveStep;
    }
    // Коллизии
    const newX = x + dx;
    const newY = y + dy;
    const cellAtNewX = maze[Math.floor(y)][Math.floor(newX + Math.sign(dx) * COLLISION_MARGIN)];
    const cellAtNewY = maze[Math.floor(newY + Math.sign(dy) * COLLISION_MARGIN)][Math.floor(x)];
    
    // Проверяем, что клетка пустая (не стена и не объект)
    if (cellAtNewX?.type === "empty") x = newX;
    if (cellAtNewY?.type === "empty") y = newY;
    playerStateRef.current = { ...playerStateRef.current, x, y };
    onPlayerStateChange({ ...playerStateRef.current });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    const width = canvas.width;
    const height = canvas.height;
    const { x: playerX, y: playerY, angle: playerAngle } = playerStateRef.current;
    // Draw ceiling and floor with textures or color
    if (ceilTex) {
      ctx.drawImage(ceilTex, 0, 0, width, height / 2);
    } else {
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(0, 0, width, height / 2);
    }
    // Floor - simple gray color
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, height / 2, width, height / 2);

    const zBuffer = new Array(width).fill(Infinity);
    for (let i = 0; i < width; i++) {
      const rayAngle = playerAngle - fov / 2 + (i / width) * fov;
      const cosRay = Math.cos(rayAngle);
      const sinRay = Math.sin(rayAngle);
      let mapX = Math.floor(playerX);
      let mapY = Math.floor(playerY);
      const deltaDistX = Math.abs(1 / cosRay);
      const deltaDistY = Math.abs(1 / sinRay);
      let sideDistX, sideDistY;
      const stepX = cosRay < 0 ? -1 : 1;
      const stepY = sinRay < 0 ? -1 : 1;
      if (cosRay < 0) sideDistX = (playerX - mapX) * deltaDistX;
      else sideDistX = (mapX + 1 - playerX) * deltaDistX;
      if (sinRay < 0) sideDistY = (playerY - mapY) * deltaDistY;
      else sideDistY = (mapY + 1 - playerY) * deltaDistY;
      let hit = false;
      let side = 0;
      let cellType: import("../game/types").CellType = "wall";
      while (!hit) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        const cell = maze[mapY]?.[mapX];
        if (cell && cell.type !== "empty") {
          hit = true;
          cellType = cell.type;
          // Все объекты обрабатываем как 3D стены с соответствующими текстурами
        }
      }
      const perpWallDist = side === 0
        ? (mapX - playerX + (1 - stepX) / 2) / cosRay
        : (mapY - playerY + (1 - stepY) / 2) / sinRay;
      zBuffer[i] = perpWallDist;
      const lineHeight = (height / perpWallDist) * corridor;
      const drawStart = -lineHeight / 2 + height / 2;
      const drawEnd = lineHeight / 2 + height / 2;
      // Wall texture
      let wallX = side === 0 ? playerY + perpWallDist * sinRay : playerX + perpWallDist * cosRay;
      wallX -= Math.floor(wallX);
      let tex = wallTex;
      
      // Выбираем текстуру в зависимости от типа клетки
      if (cellType === 'toilet') {
        tex = toiletTex;
      } else if (cellType === 'cooler') {
        tex = coolerTex;
      } else if (cellType === 'stairs') {
        tex = doorTex; // Используем дверь вместо выхода
      }
      
      if (!tex) {
        ctx.fillStyle = "#666";
        ctx.fillRect(i, drawStart, 1, lineHeight);
      } else {
        let texX = Math.floor(wallX * tex.width);
        if ((side === 0 && cosRay > 0) || (side === 1 && sinRay < 0)) {
          texX = tex.width - texX - 1;
        }
        ctx.drawImage(tex, texX, 0, 1, tex.height, i, drawStart, 1, lineHeight);
      }
      // Lighting/shading
      ctx.globalAlpha = Math.min(perpWallDist / 10, 1);
      ctx.fillStyle = "black";
      ctx.fillRect(i, drawStart, 1, lineHeight);
      ctx.globalAlpha = 1.0;
    }
    // Fade overlay
    if (fade) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1.0;
    }
  };

  return <canvas ref={canvasRef} width={RENDER_WIDTH} height={RENDER_HEIGHT} style={{ background: "#111", width: '100%', maxWidth: '900px', borderRadius: 16, boxShadow: '0 0 16px #000', transition: 'filter 0.8s' }} />;
}; 