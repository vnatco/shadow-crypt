const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getPathForFile: (file) => webUtils.getPathForFile(file),
  selectFile: () => ipcRenderer.invoke('file:select'),
  getFileArg: () => ipcRenderer.invoke('file:getArg'),

  encrypt: (filePath, password) => ipcRenderer.invoke('crypto:encrypt', filePath, password),
  decrypt: (filePath, password) => ipcRenderer.invoke('crypto:decrypt', filePath, password),

  onProgress: (cb) => {
    ipcRenderer.removeAllListeners('crypto:progress')
    ipcRenderer.on('crypto:progress', (_, data) => cb(data))
  },
  removeProgress: () => ipcRenderer.removeAllListeners('crypto:progress'),

  resizeWindow: (height) => ipcRenderer.invoke('window:resize', height),
  closeWindow: () => ipcRenderer.send('window:close'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  showInFolder: (filePath) => ipcRenderer.invoke('file:showInFolder', filePath),
})
