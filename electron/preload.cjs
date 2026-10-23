const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, isolated APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
  sendNotification: (options) => ipcRenderer.invoke('show-notification', options),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  checkBackendHealth: () => ipcRenderer.invoke('check-backend-health'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  ping: () => ipcRenderer.invoke('ping'),
});
