import React, { useRef, useEffect, useState } from "react";
import { MazeCell, PlayerState, Sprite } from "../game/types";

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
const SPRITE_SCALE = 0.75;
const COLLISION_MARGIN = 0.25;
const RENDER_WIDTH = 800;
const RENDER_HEIGHT = 600;

// Helper to load an image as a texture
function useImageTexture(src: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const image = new window.Image();
    image.src = src;
    image.onload = () => setImg(image);
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
  const floorTex = useImageTexture("/textures/floor.png");
  const ceilTex = useImageTexture("/textures/ceiling.png");
  const coolerTex = useImageTexture("/textures/cooler.png");
  const toiletTex = useImageTexture("/textures/toilet.png");
  const stairsTex = useImageTexture("/textures/stairs.png");

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
  }, [maze, fov, corridor, wallTex, floorTex, ceilTex, coolerTex, toiletTex, stairsTex]);

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
    if (maze[Math.floor(y)][Math.floor(newX + Math.sign(dx) * COLLISION_MARGIN)]?.type === "empty") x = newX;
    if (maze[Math.floor(newY + Math.sign(dy) * COLLISION_MARGIN)][Math.floor(x)]?.type === "empty") y = newY;
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
    if (floorTex) {
      ctx.drawImage(floorTex, 0, height / 2, width, height / 2);
    } else {
      ctx.fillStyle = "#595959";
      ctx.fillRect(0, height / 2, width, height / 2);
    }
    const sprites: (Sprite & { dist: number })[] = [];
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
          if (cellType !== 'wall') {
            sprites.push({ x: mapX + 0.5, y: mapY + 0.5, type: cellType, dist: 0 });
          }
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
    // --- Sprite Casting (billboarded 2D sprites) ---
    const uniqueSprites = Array.from(new Map(sprites.map(s => [`${s.x},${s.y}`, s])).values());
    uniqueSprites.forEach(sprite => {
      sprite.dist = Math.sqrt(Math.pow(playerX - sprite.x, 2) + Math.pow(playerY - sprite.y, 2));
    });
    uniqueSprites.sort((a, b) => b.dist - a.dist);
    for (const sprite of uniqueSprites) {
      const spriteX = sprite.x - playerX;
      const spriteY = sprite.y - playerY;
      const invDet = 1.0 / (Math.cos(playerAngle) * Math.sin(playerAngle) - Math.sin(playerAngle) * Math.cos(playerAngle));
      const transformX = invDet * (Math.sin(playerAngle) * spriteX - Math.cos(playerAngle) * spriteY);
      const transformY = invDet * (-Math.sin(playerAngle) * spriteX + Math.cos(playerAngle) * spriteY);
      if (transformY <= 0) continue;
      const spriteScreenX = Math.floor((width / 2) * (1 + transformX / transformY));
      const spriteHeight = Math.abs(Math.floor(height / transformY)) * SPRITE_SCALE;
      const drawStartY = -spriteHeight / 2 + height / 2;
      const spriteWidth = spriteHeight;
      const drawStartX = -spriteWidth / 2 + spriteScreenX;
      let tex: HTMLImageElement | null = null;
      if (sprite.type === "cooler") tex = coolerTex;
      else if (sprite.type === "toilet") tex = toiletTex;
      else if (sprite.type === "stairs") tex = stairsTex;
      if (!tex) continue;
      for (let stripe = Math.floor(drawStartX); stripe < drawStartX + spriteWidth; stripe++) {
        if (stripe >= 0 && stripe < width && transformY < zBuffer[stripe]) {
          const texX = Math.floor((stripe - drawStartX) * tex.width / spriteWidth);
          ctx.drawImage(tex, texX, 0, 1, tex.height, stripe, drawStartY, 1, spriteHeight);
        }
      }
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