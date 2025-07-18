// src/game/maze.ts

import { MazeCell, CellType } from "./types";



function shuffle<T>(array: T[]): T[] {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];

  }

  return array;

}



// --- Функция для поиска случайной пустой клетки ---

export function getRandomEmptyCell(maze: MazeCell[][]) {

const empties = [];

for (let y = 1; y < maze.length - 1; y++) {

for (let x = 1; x < maze[0].length - 1; x++) {

if (maze[y][x].type === 'empty') empties.push({ x, y });

}

}

if (empties.length === 0) return { x: 1, y: 1 };

return empties[Math.floor(Math.random() * empties.length)];

}



function generateMaze(width: number, height: number, isLastFloor = false): MazeCell[][] {

// Инициализация лабиринта стенами

  const maze: MazeCell[][] = Array.from({ length: height }, (_, y) =>

    Array.from({ length: width }, (_, x) => ({ type: "wall" as CellType, x, y }))

);



// --- 1. Генерация комнат ---

const roomTemplates = [

// Стандартные комнаты

{ w: 3, h: 3, features: ['center'] },

{ w: 4, h: 4, features: ['center', 'corner'] },

{ w: 5, h: 3, features: ['row'] },

{ w: 3, h: 5, features: ['column'] },

// Специальные комнаты

{ w: 5, h: 5, features: ['center', 'cross'], special: true },

{ w: 6, h: 4, features: ['center', 'entrance'], special: true }

];



const placedRooms: {

x: number, y: number,

w: number, h: number,

features: string[],

special?: boolean,

secret?: boolean

}[] = [];



const roomCenters: {x: number, y: number}[] = [];

// Проверка возможности размещения комнаты

function canPlaceRoom(x: number, y: number, w: number, h: number): boolean {

// Проверяем границы

if (x <= 0 || y <= 0 || x + w >= width - 1 || y + h >= height - 1) {

return false;

}



// Проверяем буферную зону вокруг комнаты (1 клетка)

for (let ry = y - 1; ry <= y + h; ry++) {

for (let rx = x - 1; rx <= x + w; rx++) {

if (maze[ry][rx].type !== 'wall') {

return false;

}

}

}

return true;

}



// Размещение комнаты с особенностями

function placeRoom(x: number, y: number, w: number, h: number, features: string[], special = false, secret = false) {

// Основная область комнаты

for (let ry = y; ry < y + h; ry++) {

for (let rx = x; rx < x + w; rx++) {

maze[ry][rx].type = 'empty';

}

}



// Добавляем особенности комнаты

if (features.includes('center')) {

const cx = x + Math.floor(w / 2);

const cy = y + Math.floor(h / 2);

if (special) {

maze[cy][cx].type = secret ? 'cooler' : Math.random() > 0.5 ? 'toilet' : 'cooler';

}

}



if (features.includes('corner')) {

maze[y][x].type = 'wall'; // Левый верхний угол

maze[y + h - 1][x + w - 1].type = 'wall'; // Правый нижний угол

}



if (features.includes('row') && h > 2) {

const rowY = y + Math.floor(h / 2);

for (let rx = x; rx < x + w; rx += 2) {

maze[rowY][rx].type = 'wall';

}

}



if (features.includes('column') && w > 2) {

const colX = x + Math.floor(w / 2);

for (let ry = y; ry < y + h; ry += 2) {

maze[ry][colX].type = 'wall';

}

}



if (features.includes('cross')) {

const cx = x + Math.floor(w / 2);

const cy = y + Math.floor(h / 2);

for (let rx = x; rx < x + w; rx++) {

maze[cy][rx].type = rx === cx ? 'empty' : 'wall';

}

for (let ry = y; ry < y + h; ry++) {

maze[ry][cx].type = ry === cy ? 'empty' : 'wall';

}

}



placedRooms.push({ x, y, w, h, features, special, secret });

return true;

}



// Размещение комнат в лабиринте

function placeRoomsRandomly() {

const shuffledTemplates = shuffle([...roomTemplates]);

let roomsPlaced = 0;

const maxRooms = Math.floor((width * height) / 50) + 2; // 2-5 комнат в зависимости от размера



// Пытаемся разместить комнаты

for (const template of shuffledTemplates) {

if (roomsPlaced >= maxRooms) break;



for (let attempt = 0; attempt < 50; attempt++) {

const x = 1 + Math.floor(Math.random() * (width - template.w - 2));

const y = 1 + Math.floor(Math.random() * (height - template.h - 2));



if (canPlaceRoom(x, y, template.w, template.h)) {

if (placeRoom(x, y, template.w, template.h, template.features, template.special)) {

roomsPlaced++;

// Центр комнаты

const cx = x + Math.floor(template.w / 2);

const cy = y + Math.floor(template.h / 2);

roomCenters.push({x: cx, y: cy});

// Соединяем с предыдущей комнатой

if (roomCenters.length > 1) {

const prev = roomCenters[roomCenters.length - 2];

// Горизонтальный коридор

for (let ix = Math.min(prev.x, cx); ix <= Math.max(prev.x, cx); ix++) {

maze[prev.y][ix].type = 'empty';

}

// Вертикальный коридор

for (let iy = Math.min(prev.y, cy); iy <= Math.max(prev.y, cy); iy++) {

maze[iy][cx].type = 'empty';

}

}

break;

}

}

}

}



// Пытаемся разместить секретную комнату (20% шанс)

if (Math.random() < 0.2 && roomsPlaced > 0) {

const secretTemplate = shuffledTemplates.find(t => t.special) || shuffledTemplates[0];

for (let attempt = 0; attempt < 100; attempt++) {

const x = 1 + Math.floor(Math.random() * (width - secretTemplate.w - 2));

const y = 1 + Math.floor(Math.random() * (height - secretTemplate.h - 2));



if (canPlaceRoom(x, y, secretTemplate.w, secretTemplate.h)) {

if (placeRoom(x, y, secretTemplate.w, secretTemplate.h, secretTemplate.features, true, true)) {

// Соединяем секретную комнату с ближайшей обычной

if (roomCenters.length > 0) {

const nearest = roomCenters.reduce((min, c) => {

const d = Math.abs(c.x - (x + Math.floor(secretTemplate.w/2))) + Math.abs(c.y - (y + Math.floor(secretTemplate.h/2)));

return d < min.dist ? {c, dist: d} : min;

}, {c: roomCenters[0], dist: 9999}).c;

const scx = x + Math.floor(secretTemplate.w/2);

const scy = y + Math.floor(secretTemplate.h/2);

// Горизонтальный коридор

for (let ix = Math.min(nearest.x, scx); ix <= Math.max(nearest.x, scx); ix++) {

maze[nearest.y][ix].type = 'empty';

}

// Вертикальный коридор

for (let iy = Math.min(nearest.y, scy); iy <= Math.max(nearest.y, scy); iy++) {

maze[iy][scx].type = 'empty';

}

}

break;

}

}

}

}

}



placeRoomsRandomly();



// --- 2. Генерация коридоров ---

function carveCorridors() {

const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];

const visited = new Set<string>();

const queue: [number, number, number][] = [];



// Начинаем от каждой комнаты

for (const room of placedRooms) {

const startX = room.x + Math.floor(room.w / 2);

const startY = room.y + Math.floor(room.h / 2);

queue.push([startX, startY, 0]);

visited.add(`${startX},${startY}`);

}



// BFS с приоритетом длинных коридоров

while (queue.length > 0) {

const [x, y, dist] = queue.shift()!;



// Случайным образом решаем, делать ли длинный коридор

const makeLongCorridor = Math.random() < 0.3;

const corridorLength = makeLongCorridor ? 2 + Math.floor(Math.random() * 3) : 1;



for (const [dx, dy] of shuffle([...directions])) {

for (let step = 1; step <= corridorLength; step++) {

const nx = x + dx * step;

const ny = y + dy * step;



// Проверяем границы

if (nx <= 0 || ny <= 0 || nx >= width - 1 || ny >= height - 1) break;



// Если уже посещено, пропускаем

if (visited.has(`${nx},${ny}`)) continue;



// Проверяем, не пересекаем ли мы другую комнату

let crossingRoom = false;

for (const room of placedRooms) {

if (nx >= room.x - 1 && nx < room.x + room.w + 1 &&

ny >= room.y - 1 && ny < room.y + room.h + 1) {

crossingRoom = true;

break;

}

}

if (crossingRoom) break;



// Прорезаем коридор

maze[ny][nx].type = 'empty';

visited.add(`${nx},${ny}`);

queue.push([nx, ny, dist + 1]);



// 30% шанс создать ответвление

if (Math.random() < 0.3) {

const sideDir = directions[Math.floor(Math.random() * directions.length)];

const sx = nx + sideDir[0];

const sy = ny + sideDir[1];

if (sx > 0 && sy > 0 && sx < width - 1 && sy < height - 1 &&

maze[sy][sx].type === 'wall' && !visited.has(`${sx},${sy}`)) {

maze[sy][sx].type = 'empty';

visited.add(`${sx},${sy}`);

queue.push([sx, sy, dist + 2]);

}

}

}

}

}

}



carveCorridors();



// --- 3. Оптимизация лабиринта ---

function optimizeMaze() {

// Удаляем изолированные клетки

for (let y = 1; y < height - 1; y++) {

for (let x = 1; x < width - 1; x++) {

if (maze[y][x].type === 'empty') {

let neighbors = 0;

for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {

if (maze[y + dy][x + dx].type === 'empty') neighbors++;

}

if (neighbors === 0) {

maze[y][x].type = 'wall';

}

}

}

}



// Добавляем стратегические стены для создания тупиков

  for (let y = 1; y < height - 1; y++) {

    for (let x = 1; x < width - 1; x++) {

if (maze[y][x].type === 'wall') {

// Проверяем, можно ли создать интересный тупик

const patterns = [

// Т-образные перекрестки

[[0,1], [1,0], [0,-1], [-1,0]],

// Угловые тупики

[[1,0], [0,1]], [[1,0], [0,-1]],

[[-1,0], [0,1]], [[-1,0], [0,-1]]

];



for (const pattern of patterns) {

let canCreate = true;

for (const [dx, dy] of pattern) {

if (maze[y + dy][x + dx].type !== 'empty') {

canCreate = false;

break;

}

}

if (canCreate && Math.random() < 0.4) {

maze[y][x].type = 'empty';

break;

}

}

}

}

}

}



optimizeMaze();



// --- 4. Размещение кулера, туалета и лестницы ---

// Обычные комнаты (не секретные)

const normalRooms = placedRooms.filter(r => !r.secret && !r.special);

if (normalRooms.length > 0) {

const c1 = normalRooms[0];

maze[c1.y + Math.floor(c1.h/2)][c1.x + Math.floor(c1.w/2)].type = 'cooler';

}

if (normalRooms.length > 1) {

const c2 = normalRooms[1];

maze[c2.y + Math.floor(c2.h/2)][c2.x + Math.floor(c2.w/2)].type = 'toilet';

}

// Лестница (выход)

let stairsPlaced = false;

if (normalRooms.length > 2) {

const c3 = normalRooms[2];

maze[c3.y + Math.floor(c3.h/2)][c3.x + Math.floor(c3.w/2)].type = 'stairs';

stairsPlaced = true;

}

if (!stairsPlaced) {

// В самой дальней точке от старта

const startX = 1, startY = 1;

let farthest = { x: startX, y: startY, dist: 0 };

const visited = new Set<string>();

const queue: [number, number, number][] = [[startX, startY, 0]];

visited.add(`${startX},${startY}`);

while (queue.length > 0) {

const [x, y, dist] = queue.shift()!;

if (dist > farthest.dist) farthest = { x, y, dist };

for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {

const nx = x + dx;

const ny = y + dy;

if (nx > 0 && ny > 0 && nx < width - 1 && ny < height - 1 && maze[ny][nx].type === 'empty' && !visited.has(`${nx},${ny}`)) {

visited.add(`${nx},${ny}`);

queue.push([nx, ny, dist + 1]);

}

}

}

maze[farthest.y][farthest.x].type = 'stairs';

}



// --- 5. Гарантируем периметр ---

for (let y = 0; y < height; y++) {

maze[y][0].type = "wall";

maze[y][width - 1].type = "wall";

}

for (let x = 0; x < width; x++) {

maze[0][x].type = "wall";

maze[height - 1][x].type = "wall";

}



// Стартовая точка

  maze[1][1].type = "empty";



// После размещения всех комнат и соединения их между собой

// Гарантируем коридор от старта (1,1) до центра первой комнаты

if (roomCenters.length > 0) {

const first = roomCenters[0];

// Горизонтальный коридор

for (let ix = Math.min(1, first.x); ix <= Math.max(1, first.x); ix++) {

maze[1][ix].type = 'empty';

}

// Вертикальный коридор

for (let iy = Math.min(1, first.y); iy <= Math.max(1, first.y); iy++) {

maze[iy][first.x].type = 'empty';

}

}



// Если это последний этаж, ставим выход

if (isLastFloor) {

// В самой дальней точке

const startX = 1, startY = 1;

let farthest = { x: startX, y: startY, dist: 0 };

const visited = new Set<string>();

const queue: [number, number, number][] = [[startX, startY, 0]];

visited.add(`${startX},${startY}`);

while (queue.length > 0) {

const [x, y, dist] = queue.shift()!;

if (dist > farthest.dist) farthest = { x, y, dist };

for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {

const nx = x + dx;

const ny = y + dy;

if (nx > 0 && ny > 0 && nx < width - 1 && ny < height - 1 && maze[ny][nx].type === 'empty' && !visited.has(`${nx},${ny}`)) {

visited.add(`${nx},${ny}`);

queue.push([nx, ny, dist + 1]);

}

}

}

maze[farthest.y][farthest.x].type = 'exit';

}

// --- 6. Размещение ловушек и аптечек ---
const emptyCells: {x: number, y: number}[] = [];
for (let y = 1; y < height - 1; y++) {
for (let x = 1; x < width - 1; x++) {
if (maze[y][x].type === 'empty') {
emptyCells.push({ x, y });
}
}
}

// Перемешиваем пустые клетки
const shuffledCells = shuffle([...emptyCells]);

// Размещаем ловушки (10% от пустых клеток)
const trapCount = Math.floor(emptyCells.length * 0.1);
for (let i = 0; i < trapCount && i < shuffledCells.length; i++) {
const cell = shuffledCells[i];
// Избегаем размещения ловушек рядом со стартом
const distFromStart = Math.sqrt((cell.x - 1) ** 2 + (cell.y - 1) ** 2);
if (distFromStart > 3) {
// Случайно выбираем тип ловушки
const trapType = Math.random();
if (trapType < 0.4) {
maze[cell.y][cell.x].type = 'pit';
} else if (trapType < 0.7) {
maze[cell.y][cell.x].type = 'spikes';
} else {
maze[cell.y][cell.x].type = 'movingWall';
}
}
}

// Размещаем аптечки (5% от пустых клеток) с минимальным расстоянием 7 блоков
const medkitCount = Math.floor(emptyCells.length * 0.05);
const placedMedkits: {x: number, y: number}[] = [];

// Функция для проверки минимального расстояния до других аптечек
function isFarEnoughFromMedkits(x: number, y: number, minDistance: number = 7): boolean {
  for (const medkit of placedMedkits) {
    const distance = Math.sqrt((x - medkit.x) ** 2 + (y - medkit.y) ** 2);
    if (distance < minDistance) {
      return false;
    }
  }
  return true;
}

// Перебираем клетки для размещения аптечек
for (let i = trapCount; i < shuffledCells.length && placedMedkits.length < medkitCount; i++) {
  const cell = shuffledCells[i];
  const distFromStart = Math.sqrt((cell.x - 1) ** 2 + (cell.y - 1) ** 2);
  
  // Проверяем, что клетка достаточно далеко от старта и от других аптечек
  if (distFromStart > 2 && isFarEnoughFromMedkits(cell.x, cell.y, 7)) {
    maze[cell.y][cell.x].type = 'medkit';
    placedMedkits.push({x: cell.x, y: cell.y});
  }
}

return maze;

}



export { generateMaze };