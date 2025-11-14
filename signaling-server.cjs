const WebSocket = require("ws");

// Render WebSocket sunucusu için 0.0.0.0 gerekli (lokal değil)
const PORT = process.env.PORT || 8888;

const wss = new WebSocket.Server({ port: PORT, host: "0.0.0.0" });

const rooms = {}; // { roomName: [ws, ws] }

console.log(`✅ Signaling server running on ws://0.0.0.0:${PORT}`);

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (e) {
      return;
    }

    if (msg.cmd === "join") {
      const roomName = msg.room;
      if (!rooms[roomName]) rooms[roomName] = [];

      const clients = rooms[roomName];

      if (clients.length >= 2) {
        ws.send(JSON.stringify({ type: "full" }));
        return;
      }

      ws.room = roomName;
      clients.push(ws);

      ws.send(JSON.stringify({ type: "joined", peers: clients.length }));
      clients.forEach((c) => {
        if (c !== ws) c.send(JSON.stringify({ type: "peer-joined", peers: clients.length }));
      });

      return;
    }

    // Relay all messages to room members
    const roomClients = rooms[msg.room];
    if (roomClients) {
      roomClients.forEach((c) => {
        if (c !== ws && c.readyState === WebSocket.OPEN) c.send(data.toString());
      });
    }
  });

  ws.on("close", () => {
    const roomName = ws.room;
    if (!roomName || !rooms[roomName]) return;

    rooms[roomName] = rooms[roomName].filter((c) => c !== ws);
    const clients = rooms[roomName];

    clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN)
        c.send(JSON.stringify({ type: "peer-left", peers: clients.length }));
    });
  });
});
