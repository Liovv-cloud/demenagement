const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── MongoDB ───────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
let col = null;

async function connectDB() {
  if (!MONGO_URI) {
    console.warn('⚠️  Pas de MONGO_URI — les données seront perdues au redémarrage');
    return;
  }
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    col = client.db('demenagement').collection('state');
    console.log('✅ MongoDB connecté');
  } catch (e) {
    console.error('❌ MongoDB erreur:', e.message);
  }
}

// Fallback en mémoire (si pas de Mongo)
let memState = { items: null, checked: {}, lastModified: null };

async function loadState() {
  if (col) {
    const doc = await col.findOne({ _id: 'main' });
    if (doc) { delete doc._id; return doc; }
    return { items: null, checked: {}, lastModified: null };
  }
  return memState;
}

async function saveState(state) {
  if (col) {
    await col.replaceOne({ _id: 'main' }, { _id: 'main', ...state }, { upsert: true });
  } else {
    memState = state;
  }
}

// ── API ───────────────────────────────────────────────────────
app.get('/api/state', async (req, res) => {
  try {
    res.json(await loadState());
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/state', async (req, res) => {
  try {
    const current = await loadState();
    const state = { ...current, ...req.body, lastModified: new Date().toISOString() };
    await saveState(state);
    const msg = JSON.stringify({ type: 'update', state });
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── WebSocket ─────────────────────────────────────────────────
wss.on('connection', async (ws) => {
  try {
    ws.send(JSON.stringify({ type: 'hello', state: await loadState() }));
  } catch (e) {}
  ws.on('error', () => {});
});

// ── Démarrage ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));
});
