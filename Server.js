// Servidor Mini Omegle (Node.js + WebSocket)
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let waiting = null;        // usuario esperando
const clients = new Map(); // ws -> {id, pair}

// Archivos estáticos
app.use(express.static(path.join(__dirname)));

wss.on('connection', (ws) => {
  const id = Math.random().toString(36).slice(2, 8);
  clients.set(ws, { id, pair: null });

  ws.send(JSON.stringify({ type: 'status', text: 'Conectado (sin pareja)' }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      handleMessage(ws, data);
    } catch (e) {
      console.log('msg invalido');
    }
  });

  ws.on('close', () => {
    const me = clients.get(ws);
    if (!me) return;

    // avisar a la pareja si existe
    if (me.pair && me.pair.readyState === ws.OPEN) {
      me.pair.send(JSON.stringify({ type: 'unpaired' }));
      clients.get(me.pair).pair = null;
    }

    // si estaba esperando, limpiar
    if (waiting === ws) waiting = null;

    clients.delete(ws);
  });
});

function handleMessage(ws, data) {
  const me = clients.get(ws);
  if (!me) return;

  switch (data.type) {
    case 'find':
      pairUser(ws);
      break;

    case 'message':
      if (me.pair) {
        me.pair.send(JSON.stringify({ type: 'message', text: data.text }));
      }
      break;

    case 'next':
      disconnectPair(ws);
      pairUser(ws);
      break;

    case 'disconnect':
      disconnectPair(ws);
      break;
  }
}

function pairUser(ws) {
  const me = clients.get(ws);

  // si ya tiene pareja, ignorar
  if (me.pair) return;

  // si no hay nadie esperando → esperar
  if (!waiting || waiting === ws) {
    waiting = ws;
    ws.send(JSON.stringify({ type: 'system', text: 'Esperando pareja...' }));
    return;
  }

  // emparejar con el que estaba esperando
  const other = waiting;
  const odata = clients.get(other);

  me.pair = other;
  odata.pair = ws;
  waiting = null;

  ws.send(JSON.stringify({ type: 'paired', peerId: odata.id }));
  other.send(JSON.stringify({ type: 'paired', peerId: me.id }));
}

function disconnectPair(ws) {
  const me = clients.get(ws);
  if (!me || !me.pair) return;

  const other = me.pair;
  me.pair = null;

  if (clients.has(other)) {
    clients.get(other).pair = null;
    other.send(JSON.stringify({ type: 'unpaired' }));
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on " + PORT));
