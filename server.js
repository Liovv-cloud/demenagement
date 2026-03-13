const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');

// Ensure data dir exists (needed on fresh deploy)
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch(e) {}
  return { items: null, checked: {}, lastModified: null };
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

app.get('/api/state', (req, res) => res.json(loadState()));

app.post('/api/state', (req, res) => {
  const state = { ...loadState(), ...req.body, lastModified: new Date().toISOString() };
  saveState(state);
  const msg = JSON.stringify({ type: 'update', state });
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
  res.json({ ok: true });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'hello', state: loadState() }));
  ws.on('error', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));
