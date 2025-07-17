import { Server as IOServer, Socket as IOSocket } from "socket.io";
import type { NextApiRequest } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";

// Тип для данных игрока
interface PlayerData {
  x: number;
  y: number;
  angle: number;
  name: string;
}

// Расширяем типы для Next.js
interface SocketWithIO extends NetSocket {
  server: HTTPServer & { io?: IOServer };
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    res.socket.server.io = io;

    // Состояние игроков
    const players: Record<string, PlayerData> = {};

    io.on("connection", (socket: IOSocket) => {
      let name: string | undefined;
      socket.on("join", (data: PlayerData) => {
        if (players[data.name]) {
          socket.emit("join_error", { message: "Имя уже занято" });
          return;
        }
        name = data.name;
        players[name] = { x: data.x, y: data.y, angle: data.angle, name };
        io.emit("players", players);
      });
      socket.on("move", (data: { x: number; y: number; angle: number }) => {
        if (name && players[name]) {
          players[name] = { ...players[name], ...data };
          io.emit("players", players);
        }
      });
      socket.on("disconnect", () => {
        if (name && players[name]) {
          delete players[name];
          io.emit("players", players);
        }
      });
    });
  }
  res.end();
} 