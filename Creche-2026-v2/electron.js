const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function startServer() {
  serverProcess = fork(path.join(__dirname, 'backend', 'server.cjs'), [], {
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  serverProcess.on('error', (err) => {
    console.error('Erreur serveur:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'CrecheManager',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Réessayer jusqu'à ce que le serveur réponde
  function tryLoad() {
    mainWindow.loadURL('http://localhost:3001').catch(() => {
      setTimeout(tryLoad, 1000);
    });
  }

  setTimeout(tryLoad, 1500);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});