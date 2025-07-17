import { useEffect, useState } from "react";
import { getBuildingFromMaps } from "../models/maze";
import { GameCanvas } from "../components/GameCanvas";
import { RaycastingView } from "../components/RaycastingView";
import { MiniMap } from "../components/MiniMap";

export default function GamePage() {
  const [building] = useState(() => getBuildingFromMaps());
  const FLOORS = building.length;
  const WIDTH = building[0][0].length;
  const HEIGHT = building[0].length;
  const [floor, setFloor] = useState(FLOORS - 1); // начинаем с последнего этажа
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [thirst, setThirst] = useState(100);
  const [toilet, setToilet] = useState(100);
  const [win, setWin] = useState(false);
  const [view, setView] = useState<'top' | 'doom'>('doom');
  const [rayState, setRayState] = useState<{ angle: number; player: { x: number; y: number } }>({ angle: Math.PI / 2, player });
  const [fade, setFade] = useState(false);
  const maze = building[floor];

  // Плавная анимация смены этажа
  function goToFloor(newFloor: number) {
    setFade(true);
    setTimeout(() => {
      setFloor(newFloor);
      setPlayer({ x: 1, y: 1 });
      setFade(false);
    }, 400);
  }

  // Уменьшение потребностей со временем
  useEffect(() => {
    if (win) return;
    const interval = setInterval(() => {
      setThirst((t) => Math.max(0, t - 1));
      setToilet((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [win]);

  // Управление движением и переход между этажами
  useEffect(() => {
    if (win) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      let { x, y } = player;
      if (e.key === "ArrowUp" || e.key === "w") y--;
      if (e.key === "ArrowDown" || e.key === "s") y++;
      if (e.key === "ArrowLeft" || e.key === "a") x--;
      if (e.key === "ArrowRight" || e.key === "d") x++;
      if (
        maze[y] &&
        maze[y][x] &&
        maze[y][x].type !== "wall"
      ) {
        setPlayer({ x, y });
        // Если на кулере — пополняем жажду
        if (maze[y][x].type === "cooler") setThirst(100);
        // Если на туалете — пополняем туалет
        if (maze[y][x].type === "toilet") setToilet(100);
        // Если на лестнице — переход на этаж ниже (если не на 1 этаже)
        if (maze[y][x].type === "stairs") {
          if (floor > 0) {
            goToFloor(floor - 1);
          } else {
            setWin(true);
          }
        }
      }
    };
    if (view === 'top') {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [player, maze, floor, win, view]);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20, position: 'relative' }}>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setView(view === 'top' ? 'doom' : 'top')} style={{ fontSize: 16 }}>
          {view === 'top' ? 'Вид от первого лица (DOOM)' : 'Вид сверху'}
        </button>
      </div>
      {win ? (
        <div style={{
          fontSize: 32,
          color: "green",
          fontWeight: "bold",
          textAlign: "center",
          marginTop: 100,
        }}>
          🎉 Поздравляем!<br />Вы выбрались из здания!<br />
          <button style={{marginTop: 30, fontSize: 20}} onClick={() => {window.location.reload();}}>Сыграть ещё раз</button>
        </div>
      ) : (
        <>
          <h2>Потребности</h2>
          <div>Жажда: {thirst}</div>
          <div>Туалет: {toilet}</div>
          <div style={{ margin: "10px 0", fontWeight: "bold" }}>
            Этаж: {floor + 1} / {FLOORS}
          </div>
          {view === 'top' ? (
            <GameCanvas maze={maze} player={player} />
          ) : (
            <>
              <div style={{ position: 'relative', transition: 'opacity 0.4s', opacity: fade ? 0 : 1 }}>
                <RaycastingView maze={maze} player={player} onStateChange={setRayState} fov={90} corridorWidth={1} />
                {fade && <div style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',background:'#000',opacity:0.7,transition:'opacity 0.4s'}} />}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                <MiniMap maze={maze} player={rayState.player} angle={rayState.angle} />
              </div>
            </>
          )}
          <div style={{ marginTop: 20, color: "#888" }}>
            Управление: WASD — движение, стрелки — поворот камеры<br />
            Дойдите до лестницы, чтобы спуститься на этаж ниже!<br />
            На 1 этаже лестница — это выход из здания.
          </div>
        </>
      )}
    </div>
  );
} 