const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { encryptFile, decryptFile } = require('./crypto')

let win

function getFileArg() {
  for (const arg of process.argv.slice(1)) {
    if (!arg.startsWith('-') && arg !== '.') {
      try {
        if (fs.statSync(arg).isFile()) return arg
      } catch {}
    }
  }
  return null
}

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 520,
    minWidth: 400,
    maxWidth: 400,
    frame: false,
    resizable: false,
    show: false,
    backgroundColor: '#0d0f14',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/* ── File handlers ── */
ipcMain.handle('file:select', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    title: 'Select a file to encrypt or decrypt',
  })
  if (result.canceled) return null
  const filePath = result.filePaths[0]
  const stats = fs.statSync(filePath)
  return { path: filePath, name: path.basename(filePath), size: stats.size }
})

ipcMain.handle('file:getArg', () => {
  const filePath = getFileArg()
  if (!filePath) return null
  try {
    const stats = fs.statSync(filePath)
    return { path: filePath, name: path.basename(filePath), size: stats.size }
  } catch { return null }
})

/* ── Crypto handlers ── */
ipcMain.handle('crypto:encrypt', async (event, filePath, password) => {
  try {
    const result = await encryptFile(event, filePath, password)
    return { success: true, ...result }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('crypto:decrypt', async (event, filePath, password) => {
  try {
    const result = await decryptFile(event, filePath, password)
    return { success: true, ...result }
  } catch (err) {
    console.error('[decrypt error]', err.message)
    return { success: false, error: err.message }
  }
})

/* ── Window handlers ── */
ipcMain.handle('window:resize', (_, height) => {
  if (!win) return
  const h = Math.max(height, 100)
  win.setResizable(true)
  win.setSize(400, h)
  win.setResizable(false)
})

ipcMain.on('window:close', () => win?.close())
ipcMain.on('window:minimize', () => win?.minimize())

ipcMain.handle('file:showInFolder', (_, filePath) => {
  shell.showItemInFolder(filePath)
})
