# 📦 App Déménagement

App mobile de suivi de déménagement avec synchronisation en temps réel.

## Lancement local

```bash
npm install
node server.js
# Ouvrir http://localhost:3000
```

## Déploiement sur un serveur (VPS / Render / Railway)

### Option 1 — Railway (gratuit, le plus simple)
1. Crée un compte sur https://railway.app
2. New Project → Deploy from GitHub (upload ce dossier)
3. L'app est en ligne en 2 minutes avec une URL publique

### Option 2 — Render (gratuit)
1. Compte sur https://render.com
2. New Web Service → connecter le repo GitHub
3. Start command: `node server.js`
4. URL publique générée automatiquement

### Option 3 — VPS (Ubuntu)
```bash
# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Copier les fichiers, installer
npm install

# Lancer avec PM2 (persistant)
sudo npm install -g pm2
pm2 start server.js --name demenagement
pm2 startup
pm2 save
```

## Structure
```
demenagement/
├── server.js          # Backend Express + WebSocket
├── package.json
├── data/
│   └── state.json     # Données persistées (créé auto)
└── public/
    └── index.html     # App mobile complète
```

## Fonctionnalités
- Splash screen 3s avec logo
- Navigation par onglets (R.D.C. → 3e étage → Cave)
- Page stats avec graphiques
- Filtres rapides (Nivelles, Niv.?, Lio, Laisser, Vendre, Rox/Lenny)
- Ajout d'objets (bouton + ou directement dans la pièce)
- Suppression d'objets
- Synchronisation temps réel entre appareils (WebSocket)
- Sauvegarde automatique sur le serveur
