import { app, BrowserWindow, ipcMain, shell, Menu, dialog, Notification } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

let mainWindow = null;
let backendProcess = null;

const VITE_DEV_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5001';
const HEALTH_URL = 'http://localhost:5001/api/health';

/**
 * Check if an HTTP URL is actively responding
 */
function checkUrl(url, timeout = 1200) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = http.request(
        {
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname,
          method: 'GET',
          timeout,
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

/**
 * Start backend server process if not already running on port 5001
 */
async function ensureBackendRunning() {
  const isRunning = await checkUrl(HEALTH_URL, 1500);
  if (isRunning) {
    console.log('[Electron] Connected to existing backend on http://localhost:5001');
    return true;
  }

  console.log('[Electron] Starting backend server (server/index.js)...');
  const serverScript = path.join(projectRoot, 'server', 'index.js');
  
  backendProcess = spawn(process.execPath, [serverScript], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '5001' },
    stdio: 'inherit',
  });

  backendProcess.on('error', (err) => {
    console.error('[Electron] Failed to spawn backend process:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`[Electron] Backend process exited with code ${code} / signal ${signal}`);
    backendProcess = null;
  });

  // Wait up to 15 seconds for backend to become ready
  const start = Date.now();
  while (Date.now() - start < 15000) {
    await new Promise((r) => setTimeout(r, 600));
    const ready = await checkUrl(HEALTH_URL, 800);
    if (ready) {
      console.log('[Electron] Backend server is ready!');
      return true;
    }
  }

  console.warn('[Electron] Backend server did not respond within 15s; continuing anyway');
  return false;
}

/**
 * Create the main Electron application window
 */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0a0f1d',
    title: 'MahaSetu (મહાસેતુ) - Gujarat State Alumni Association Platform',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  // Gracefully reveal window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Ensure backend is reachable
  await ensureBackendRunning();

  // Determine whether Vite dev server is running or if we load production bundle
  const isViteRunning = await checkUrl(VITE_DEV_URL, 1000);
  const distIndexPath = path.join(projectRoot, 'dist', 'index.html');

  if (isViteRunning) {
    console.log(`[Electron] Loading Vite live dev server: ${VITE_DEV_URL}`);
    await mainWindow.loadURL(VITE_DEV_URL);
  } else if (fs.existsSync(distIndexPath)) {
    // If backend is running, Express serves dist at http://localhost:5001
    const isBackendReady = await checkUrl(BACKEND_URL, 800);
    if (isBackendReady) {
      console.log(`[Electron] Loading production server: ${BACKEND_URL}`);
      await mainWindow.loadURL(BACKEND_URL);
    } else {
      console.log(`[Electron] Loading local file: ${distIndexPath}`);
      await mainWindow.loadFile(distIndexPath);
    }
  } else {
    // If neither is ready, try loading Vite dev server URL directly
    console.log(`[Electron] Waiting for frontend at ${VITE_DEV_URL}...`);
    await mainWindow.loadURL(VITE_DEV_URL).catch(async () => {
      await mainWindow.loadFile(distIndexPath);
    });
  }

  // Intercept navigation to external links and open in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Build application native menu
 */
function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: 'MahaSetu',
            submenu: [
              {
                label: 'About MahaSetu',
                click: () => {
                  dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'About MahaSetu (મહાસેતુ)',
                    message: 'MahaSetu - Gujarat State Alumni Association Platform',
                    detail:
                      'Department of Higher Education & GTU\nDesktop Version 1.0.0 (Electron)\nUnified state-scale alumni, mentorship & giving ecosystem.',
                  });
                },
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'MahaSetu GitHub Repository',
          click: () => {
            shell.openExternal('https://github.com/Yuvanshj/NST-AD-ELECTRON-PROJECT');
          },
        },
        {
          label: 'Gujarat Education Department',
          click: () => {
            shell.openExternal('https://kcg.gujarat.gov.in/');
          },
        },
        { type: 'separator' },
        {
          label: 'System Health Check',
          click: async () => {
            const isHealthy = await checkUrl(HEALTH_URL, 2000);
            dialog.showMessageBox(mainWindow, {
              type: isHealthy ? 'info' : 'warning',
              title: 'Backend Health Status',
              message: isHealthy ? 'Backend API is Healthy' : 'Backend API Not Responding',
              detail: isHealthy
                ? 'Connected to Node.js / Express & MongoDB on http://localhost:5001'
                : 'Could not connect to http://localhost:5001/api/health. Check server logs.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Register safe IPC Handlers
 */
function registerIpcHandlers() {
  ipcMain.handle('show-notification', (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({
        title: title || 'MahaSetu Notification',
        body: body || '',
      }).show();
      return true;
    }
    return false;
  });

  ipcMain.handle('get-system-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };
  });

  ipcMain.handle('open-external', async (event, url) => {
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  ipcMain.handle('check-backend-health', async () => {
    return await checkUrl(HEALTH_URL, 2000);
  });

  ipcMain.handle('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('ping', () => 'pong');
}

/**
 * App Lifecycle Events
 */
app.whenReady().then(async () => {
  createMenu();
  registerIpcHandlers();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    console.log('[Electron] Shutting down spawned backend process...');
    backendProcess.kill();
    backendProcess = null;
  }
});
