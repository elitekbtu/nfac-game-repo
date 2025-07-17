import React, { useRef, useEffect } from "react";
import { MazeCell } from "../models/maze";

interface Props {
  maze: MazeCell[][];
  player: { x: number; y: number };
  fov?: number; // поле зрения в градусах
  onStateChange?: (state: { angle: number; player: { x: number; y: number } }) => void;
  corridorWidth?: number; // ширина коридора в клетках
}

// Проверка стены с учётом ширины коридора
function isWall(cell: MazeCell, maze: MazeCell[][], x: number, y: number, corridorWidth: number) {
  if (!cell) return true;
  // Если в радиусе corridorWidth есть пустая клетка — не стена
  for (let dy = -Math.floor(corridorWidth / 2); dy <= Math.floor(corridorWidth / 2); dy++) {
    for (let dx = -Math.floor(corridorWidth / 2); dx <= Math.floor(corridorWidth / 2); dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (maze[ny] && maze[ny][nx] && maze[ny][nx].type === "empty") return false;
    }
  }
  return cell.type === "wall";
}

function loadTexture(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export const RaycastingView: React.FC<Props> = ({ maze, player, fov = 90, onStateChange, corridorWidth = 2 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = React.useState(Math.PI / 2);
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: player.x, y: player.y });
  const [textures, setTextures] = React.useState<{ wall?: HTMLImageElement; floor?: HTMLImageElement; ceiling?: HTMLImageElement }>({});

  // Загрузка текстур
  useEffect(() => {
    Promise.all([
      loadTexture("/textures/wall.svg").catch(() => loadTexture("/textures/wall.png").catch(() => undefined)),
      loadTexture("/textures/floor.svg").catch(() => loadTexture("/textures/floor.png").catch(() => undefined)),
      loadTexture("/textures/ceiling.svg").catch(() => loadTexture("/textures/ceiling.png").catch(() => undefined)),
    ]).then(([wall, floor, ceiling]) => setTextures({ wall, floor, ceiling }));
  }, []);

  // Сообщаем наружу о состоянии
  useEffect(() => {
    if (onStateChange) onStateChange({ angle, player: pos });
  }, [angle, pos, onStateChange]);

  // Плавное движение и повороты
  useEffect(() => {
    let running = true;
    let last = performance.now();
    // Флаги для управления
    let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
    let turn = 0;
    const speed = 2.5; // клеток в секунду
    const rotSpeed = 2.5; // радиан в секунду
    function loop(now: number) {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      // Движение
      let dx = 0, dy = 0;
      if (moveForward) { dx += Math.cos(angle) * speed; dy += Math.sin(angle) * speed; }
      if (moveBackward) { dx -= Math.cos(angle) * speed; dy -= Math.sin(angle) * speed; }
      if (moveLeft) { dx += Math.cos(angle - Math.PI/2) * speed; dy += Math.sin(angle - Math.PI/2) * speed; }
      if (moveRight) { dx += Math.cos(angle + Math.PI/2) * speed; dy += Math.sin(angle + Math.PI/2) * speed; }
      let nx = pos.x + dx * dt;
      let ny = pos.y + dy * dt;
      if (
        maze[Math.floor(ny)] &&
        maze[Math.floor(ny)][Math.floor(nx)] &&
        !isWall(maze[Math.floor(ny)][Math.floor(nx)], maze, Math.floor(nx), Math.floor(ny), corridorWidth)
      ) {
        setPos({ x: nx, y: ny });
      }
      // Поворот
      setAngle(a => a + turn * rotSpeed * dt);
      if (running) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    // Управление
    function keydown(e: KeyboardEvent) {
      if (e.key === "w") moveForward = true;
      if (e.key === "s") moveBackward = true;
      if (e.key === "a") moveLeft = true;
      if (e.key === "d") moveRight = true;
      if (e.key === "ArrowLeft") turn = -1;
      if (e.key === "ArrowRight") turn = 1;
    }
    function keyup(e: KeyboardEvent) {
      if (e.key === "w") moveForward = false;
      if (e.key === "s") moveBackward = false;
      if (e.key === "a") moveLeft = false;
      if (e.key === "d") moveRight = false;
      if (e.key === "ArrowLeft" && turn === -1) turn = 0;
      if (e.key === "ArrowRight" && turn === 1) turn = 0;
    }
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    return () => {
      running = false;
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    };
  }, [maze, pos, angle, corridorWidth]);

  // Raycasting с текстурами
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const width = 800;
    const height = 600;
    const numRays = width * 2; // больше лучей для плавности
    const maxDepth = Math.max(maze.length, maze[0].length);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    // Потолок
    if (textures.ceiling) {
      ctx.drawImage(textures.ceiling, 0, 0, width, height / 2);
    } else {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, width, height / 2);
    }
    // Пол
    if (textures.floor) {
      ctx.drawImage(textures.floor, 0, height / 2, width, height / 2);
    } else {
      ctx.fillStyle = "#444";
      ctx.fillRect(0, height / 2, width, height / 2);
    }
    // Raycasting
    for (let i = 0; i < numRays; i++) {
      const rayAngle = angle - (fov * Math.PI / 180) / 2 + (i / numRays) * (fov * Math.PI / 180);
      let dist = 0;
      let hit = false;
      let hitType: string = "wall";
      let rx = pos.x;
      let ry = pos.y;
      let texX = 0;
      while (!hit && dist < maxDepth) {
        rx += Math.cos(rayAngle) * 0.02;
        ry += Math.sin(rayAngle) * 0.02;
        dist += 0.02;
        const mx = Math.floor(rx);
        const my = Math.floor(ry);
        if (maze[my] && maze[my][mx]) {
          if (maze[my][mx].type !== "empty" && isWall(maze[my][mx], maze, mx, my, corridorWidth)) {
            hit = true;
            hitType = maze[my][mx].type;
            texX = rx - Math.floor(rx);
            if (Math.abs(rx - mx) < Math.abs(ry - my)) texX = ry - Math.floor(ry);
          }
        } else {
          hit = true;
        }
      }
      // Высота стены
      const wallHeight = Math.min(height, (height / (dist + 0.0001)) * 1.5);
      // Текстура или цвет
      if (textures.wall) {
        const tx = Math.floor(texX * textures.wall.width);
        ctx.drawImage(
          textures.wall,
          tx, 0, 1, textures.wall.height,
          Math.floor(i * (width / numRays)), height / 2 - wallHeight / 2, Math.ceil(width / numRays), wallHeight
        );
      } else {
        let color = "#888";
        if (hitType === "wall") color = "#888";
        if (hitType === "stairs") color = "#ffe066";
        if (hitType === "cooler") color = "#00e6e6";
        if (hitType === "toilet") color = "#6699ff";
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(i * (width / numRays)), height / 2 - wallHeight / 2, Math.ceil(width / numRays), wallHeight);
      }
      // Тени/яркость по расстоянию
      ctx.globalAlpha = Math.max(0.3, 1 - dist / maxDepth);
      ctx.globalAlpha = 1;
    }
  }, [maze, pos, angle, fov, textures, corridorWidth]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: "2px solid #222", background: "#222", maxWidth: "100%", borderRadius: 16, boxShadow: "0 8px 32px #0008" }} />
      <div style={{ color: "#aaa", marginTop: 8, fontSize: 18 }}>
        Управление: WASD — движение, стрелки — поворот камеры
      </div>
    </div>
  );
}; 