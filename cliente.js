// Cliente: maneja UI + WebSocket
const chatEl = document.getElementById('chat');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const statusEl = document.getElementById('status');
const peerInfoEl = document.getElementById('peerInfo');

let ws;
let connected = false;
let paired = false;

function addSystem(text){
  const d = document.createElement('div');
  d.className = 'system';
  d.textContent = text;
  chatEl.appendChild(d);
  chatEl.scrollTop = chatEl.scrollHeight;
}
function addMsg(text, who){
  const d = document.createElement('div');
  d.className = 'msg ' + (who === 'me' ? 'me' : 'they');
  d.textContent = text;
  chatEl.appendChild(d);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function wsUrl(){
  const proto = (location.protocol === 'https:') ? 'wss:' : 'ws:';
  return proto + '//' + location.host + '/ws';
}

function connect(){
  if(ws) ws.close();
  ws = new WebSocket(wsUrl());
  statusEl.textContent = 'Conectando…';

  ws.addEventListener('open', ()=> {
    connected = true;
    statusEl.textContent = 'Conectado (inactivo)';
    addSystem('Conectado al servidor.');
  });

  ws.addEventListener('message', ev => {
    try{
      const data = JSON.parse(ev.data);
      handleMessage(data);
    }catch(e){
      console.error('invalid msg', ev.data);
    }
  });

  ws.addEventListener('close', ()=> {
    connected = false;
    paired = false;
    statusEl.textContent = 'Desconectado';
    peerInfoEl.textContent = 'Esperando...';
    addSystem('Desconectado del servidor.');
  });

  ws.addEventListener('error', ()=> {
    statusEl.textContent = 'Error de conexión';
  });
}

function sendType(type, payload = {}){
  if(!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({type, ...payload}));
}

function handleMessage(m){
  switch(m.type){
    case 'status':
      statusEl.textContent = m.text;
      break;
    case 'paired':
      paired = true;
      statusEl.textContent = 'Emparejado';
      peerInfoEl.textContent = 'Conectado a: ' + (m.peerId || 'Anónimo');
      chatEl.innerHTML = '';
      addSystem('¡Emparejado! Empezá a chatear.');
      break;
    case 'message':
      addMsg(m.text, 'they');
      break;
    case 'system':
      addSystem(m.text);
      break;
    case 'unpaired':
      paired = false;
      statusEl.textContent = 'Conectado (sin pareja)';
      peerInfoEl.textContent = 'Sin pareja. Pulsa Start';
      addSystem('Tu pareja se desconectó.');
      break;
    default:
      console.warn('unknown', m);
  }
}

// UI actions
sendBtn.addEventListener('click', ()=> {
  const val = inputEl.value.trim();
  if(!val) return;
  addMsg(val, 'me');
  inputEl.value = '';
  sendType('message', {text: val});
});

startBtn.addEventListener('click', ()=> {
  if(!connected) connect();
  sendType('find');
  addSystem('Buscando pareja...');
});

nextBtn.addEventListener('click', ()=> {
  sendType('next');
  addSystem('Buscando nueva pareja...');
});

disconnectBtn.addEventListener('click', ()=> {
  sendType('disconnect');
  paired = false;
  peerInfoEl.textContent = 'Esperando...';
  addSystem('Te has desconectado.');
});

connect();
