const express = require("express");
const path = require("path");
const { WebSocketServer } = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

const server = app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});

// Servidor WebSocket
const wss = new WebSocketServer({ server });

let waiting = null;

wss.on("connection", (ws) => {
  console.log("Usuario conectado");

  if (waiting === null) {
    waiting = ws;
    ws.send(JSON.stringify({ type: "status", message: "Esperando a otro usuario..." }));
  } else {
    let partner = waiting;
    waiting = null;

    ws.partner = partner;
    partner.partner = ws;

    ws.send(JSON.stringify({ type: "status", message: "¡Conectado!" }));
    partner.send(JSON.stringify({ type: "status", message: "¡Conectado!" }));
  }

  ws.on("message", (msg) => {
    if (ws.partner && ws.partner.readyState === ws.partner.OPEN) {
      ws.partner.send(JSON.stringify({ type: "message", message: msg.toString() }));
    }
  });

  ws.on("close", () => {
    if (ws.partner) {
      ws.partner.send(JSON.stringify({ type: "status", message: "El otro usuario se desconectó." }));
      ws.partner.partner = null;
    }
    if (waiting === ws) waiting = null;
  });
});
