const WebSocketServer = require("ws").WebSocketServer;

const wss = new WebSocketServer({ port: 8888, host: "0.0.0.0" });
const rooms = {};

console.log("✅ Sinyal sunucusu çalışıyor: ws://0.0.0.0:8888");

wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
        let data;
        try { data = JSON.parse(raw); }
        catch (e) { return; }

        if (!data.room) return;

        if (data.cmd === "join") {
            if (!rooms[data.room]) rooms[data.room] = [];
            const peers = rooms[data.room];

            if (peers.length >= 2) {
                ws.send(JSON.stringify({ type: "full" }));
                return;
            }

            peers.push(ws);
            ws.room = data.room;

            ws.send(JSON.stringify({ type: "joined", peers: peers.length }));

            peers.forEach((p) => {
                if (p !== ws && p.readyState === 1)
                    p.send(JSON.stringify({ type: "peer-joined", peers: peers.length }));
            });

            return;
        }

        const peers = rooms[data.room];
        if (!peers) return;

        peers.forEach((p) => {
            if (p !== ws && p.readyState === 1)
                p.send(raw.toString());
        });
    });

    ws.on("close", () => {
        const room = ws.room;
        if (!room || !rooms[room]) return;

        rooms[room] = rooms[room].filter((p) => p !== ws);
        const peers = rooms[room];

        peers.forEach((p) => {
            if (p.readyState === 1)
                p.send(JSON.stringify({ type: "peer-left", peers: peers.length }));
        });
    });
});
