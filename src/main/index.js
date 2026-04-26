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
    fullscreenable: false,
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

  // Block file navigation triggered by drag-drop onto the window
  win.webContents.on('will-navigate', event => event.preventDefault())

  // Disable F5/F11/F12/Ctrl+R/Ctrl+Shift+I and other dev/system shortcuts
  win.webContents.on('before-input-event', (event, input) => {
    const k = input.key
    if (
      k === 'F5' || k === 'F11' || k === 'F12' ||
      (input.control && k.toLowerCase() === 'r') ||
      (input.control && input.shift && k.toLowerCase() === 'i') ||
      (input.control && input.shift && k.toLowerCase() === 'j')
    ) event.preventDefault()
  })

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

/* ── Crypto helpers ── */
function formatBytes(bytes) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`
  return `${bytes} B`
}

function checkFileReadable(filePath) {
  try { fs.accessSync(filePath, fs.constants.R_OK); return null }
  catch { return 'Cannot access file — check permissions' }
}

function checkDiskSpace(dirPath, neededBytes) {
  try {
    const s = fs.statfsSync(dirPath)
    const available = s.bavail * s.bsize
    if (available < neededBytes)
      return `Not enough disk space — need ${formatBytes(neededBytes)}, only ${formatBytes(available)} free`
    return null
  } catch { return null }
}

/* ── Crypto handlers ── */
let currentAbort = null

ipcMain.handle('crypto:encrypt', async (event, filePath, password) => {
  const accessErr = checkFileReadable(filePath)
  if (accessErr) return { success: false, error: accessErr }

  const fileSize = fs.statSync(filePath).size
  const spaceErr = checkDiskSpace(path.dirname(filePath), fileSize + 49)
  if (spaceErr) return { success: false, error: spaceErr }

  currentAbort = new AbortController()
  try {
    const result = await encryptFile(event, filePath, password, currentAbort.signal)
    return { success: true, ...result }
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, cancelled: true }
    return { success: false, error: err.message }
  } finally {
    currentAbort = null
  }
})

ipcMain.handle('crypto:decrypt', async (event, filePath, password) => {
  const accessErr = checkFileReadable(filePath)
  if (accessErr) return { success: false, error: accessErr }

  const fileSize = fs.statSync(filePath).size
  const spaceErr = checkDiskSpace(path.dirname(filePath), fileSize)
  if (spaceErr) return { success: false, error: spaceErr }

  currentAbort = new AbortController()
  try {
    const result = await decryptFile(event, filePath, password, currentAbort.signal)
    return { success: true, ...result }
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, cancelled: true }
    return { success: false, error: err.message }
  } finally {
    currentAbort = null
  }
})

ipcMain.on('crypto:cancel', () => currentAbort?.abort())

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
