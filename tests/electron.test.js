import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Electron Desktop Configuration & Integration Tests', () => {
  it('package.json defines correct main entry point and electron scripts', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    expect(pkg.main).toBe('electron/main.js');
    expect(pkg.scripts).toHaveProperty('electron');
    expect(pkg.scripts.electron).toContain('electron .');
    expect(pkg.scripts).toHaveProperty('electron:start');
    expect(pkg.scripts).toHaveProperty('electron:build');
    expect(pkg.devDependencies).toHaveProperty('electron');
    expect(pkg.devDependencies).toHaveProperty('wait-on');
  });

  it('electron/main.js exists and configures BrowserWindow with security best practices', () => {
    const mainPath = path.join(rootDir, 'electron', 'main.js');
    expect(fs.existsSync(mainPath)).toBe(true);
    const mainContent = fs.readFileSync(mainPath, 'utf8');

    expect(mainContent).toContain("import { app, BrowserWindow");
    expect(mainContent).toContain("contextIsolation: true");
    expect(mainContent).toContain("nodeIntegration: false");
    expect(mainContent).toContain("preload.cjs");
    expect(mainContent).toContain("ipcMain.handle('show-notification'");
    expect(mainContent).toContain("ipcMain.handle('get-system-info'");
  });

  it('electron/preload.cjs exists and exposes electronAPI via contextBridge', () => {
    const preloadPath = path.join(rootDir, 'electron', 'preload.cjs');
    expect(fs.existsSync(preloadPath)).toBe(true);
    const preloadContent = fs.readFileSync(preloadPath, 'utf8');

    expect(preloadContent).toContain("contextBridge.exposeInMainWorld('electronAPI'");
    expect(preloadContent).toContain("isElectron: true");
    expect(preloadContent).toContain("sendNotification");
    expect(preloadContent).toContain("getSystemInfo");
    expect(preloadContent).toContain("openExternal");
  });

  it('vite.config.js uses relative base path for electron asset loading', () => {
    const viteConfigPath = path.join(rootDir, 'vite.config.js');
    const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
    expect(viteContent).toMatch(/base:\s*['"]\.\/['"]/);
  });

  it('api.js gracefully handles electron file:// protocol fallback', () => {
    const apiPath = path.join(rootDir, 'src', 'services', 'api.js');
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    expect(apiContent).toContain('window.location.protocol ===');
    expect(apiContent).toContain('http://localhost:5001/api');
  });
});
