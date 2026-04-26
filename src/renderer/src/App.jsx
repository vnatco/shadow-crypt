import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import AppWindow from './components/AppWindow'
import DropScreen from './components/DropScreen'
import EncryptScreen from './components/EncryptScreen'
import DecryptScreen from './components/DecryptScreen'
import LoadingScreen from './components/LoadingScreen'
import SuccessScreen from './components/SuccessScreen'

// Animated wrapper - remounts on key change to trigger entrance animation
function Screen({ children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div style={{
      opacity:   visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 200ms ease, transform 200ms ease',
    }}>
      {children}
    </div>
  )
}

const TITLES = {
  drop:    'Shadow Crypt',
  encrypt: 'Shadow Crypt - Encrypt',
  decrypt: 'Shadow Crypt - Decrypt',
  loading: null,
  success: 'Shadow Crypt - Done',
}

export default function App() {
  const [screen,      setScreen]      = useState('drop')
  const [file,        setFile]        = useState(null)
  const [mode,        setMode]        = useState(null)   // 'encrypt' | 'decrypt'
  const [outputPath,  setOutputPath]  = useState(null)
  const [decryptError, setDecryptError] = useState(null)
  const [encryptError, setEncryptError] = useState(null)
  const [progress,    setProgress]    = useState(0)
  const [phase,       setPhase]       = useState('')
  const containerRef  = useRef()
  const cancelledRef  = useRef(false)

  // Listen to crypto progress events from main process
  useEffect(() => {
    window.electronAPI.onProgress(({ percent, phase: p }) => {
      setProgress(percent)
      setPhase(p)
    })
    return () => window.electronAPI.removeProgress()
  }, [])

  const syncHeight = useCallback(() => {
    if (!containerRef.current) return
    const h = containerRef.current.offsetHeight
    if (h > 20) window.electronAPI.resizeWindow(h)
  }, [])

  // useLayoutEffect fires synchronously after DOM mutation, before the browser
  // paints - this is the only reliable way to measure the new (possibly smaller)
  // content height before the old viewport size can interfere.
  useLayoutEffect(() => {
    syncHeight()
    // Belt-and-suspenders: also fire after any CSS transitions finish (200ms).
    const id = setTimeout(syncHeight, 250)
    return () => clearTimeout(id)
  }, [screen, syncHeight])

  // Catch dynamic in-screen height changes (error banners appearing, etc.).
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(syncHeight)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [syncHeight])

  // Handle file passed via Windows context menu (process.argv)
  useEffect(() => {
    window.electronAPI.getFileArg().then(f => {
      if (!f) return
      setFile(f)
      const isEncrypted = f.name.toLowerCase().endsWith('.enc') || f.name.toLowerCase().endsWith('.aes')
      setScreen(isEncrypted ? 'decrypt' : 'encrypt')
    })
  }, [])

  /* ── Actions ── */
  const handleFileSelected = useCallback(f => {
    setFile(f)
    setDecryptError(null)
    setEncryptError(null)
    const isEncrypted = f.name.toLowerCase().endsWith('.aes') || f.name.toLowerCase().endsWith('.enc')
    setScreen(isEncrypted ? 'decrypt' : 'encrypt')
  }, [])

  const handleClear = useCallback(() => {
    setFile(null)
    setDecryptError(null)
    setEncryptError(null)
    setScreen('drop')
  }, [])

  const handleCancel = useCallback(() => {
    cancelledRef.current = true
    window.electronAPI.cancel()
    setFile(null)
    setDecryptError(null)
    setEncryptError(null)
    setProgress(0)
    setPhase('')
    setScreen('drop')
  }, [])

  const handleEncryptSubmit = useCallback(async password => {
    cancelledRef.current = false
    setEncryptError(null)
    setProgress(0)
    setPhase('')
    setMode('encrypt')
    setScreen('loading')

    try {
      const result = await window.electronAPI.encrypt(file.path, password)
      if (cancelledRef.current) return
      if (result.success) {
        setOutputPath(result.outputPath)
        setScreen('success')
      } else if (!result.cancelled) {
        setEncryptError(result.error || 'Encryption failed — please try again')
        setScreen('encrypt')
      }
    } catch {
      if (cancelledRef.current) return
      setEncryptError('Encryption failed — please try again')
      setScreen('encrypt')
    }
  }, [file])

  const handleDecryptSubmit = useCallback(async password => {
    cancelledRef.current = false
    setDecryptError(null)
    setProgress(0)
    setPhase('')
    setMode('decrypt')
    setScreen('loading')

    try {
      const result = await window.electronAPI.decrypt(file.path, password)
      if (cancelledRef.current) return
      if (result.success) {
        setOutputPath(result.outputPath)
        setScreen('success')
      } else if (!result.cancelled) {
        setDecryptError(result.error || 'Decryption failed — please try again')
        setScreen('decrypt')
      }
    } catch {
      if (cancelledRef.current) return
      setDecryptError('Decryption failed — please try again')
      setScreen('decrypt')
    }
  }, [file])

  const handleDone = useCallback(() => {
    setFile(null)
    setOutputPath(null)
    setMode(null)
    setDecryptError(null)
    setEncryptError(null)
    setProgress(0)
    setPhase('')
    setScreen('drop')
  }, [])

  /* ── Render current screen ── */
  const title = screen === 'loading'
    ? (mode === 'encrypt' ? 'Shadow Crypt - Encrypting…' : 'Shadow Crypt - Decrypting…')
    : (TITLES[screen] ?? 'Shadow Crypt')

  const renderScreen = () => {
    switch (screen) {
      case 'drop':
        return <DropScreen onFileSelected={handleFileSelected} />
      case 'encrypt':
        return <EncryptScreen file={file} onClose={handleClear} onSubmit={handleEncryptSubmit} errorMsg={encryptError} />
      case 'decrypt':
        return <DecryptScreen file={file} onClose={handleClear} onSubmit={handleDecryptSubmit} errorMsg={decryptError} />
      case 'loading':
        return <LoadingScreen mode={mode} file={file} progress={progress} phase={phase} onClose={handleDone} onCancel={handleCancel} />
      case 'success':
        return <SuccessScreen mode={mode} outputPath={outputPath} onDone={handleDone} />
      default:
        return <DropScreen onFileSelected={handleFileSelected} />
    }
  }

  return (
    <div ref={containerRef}>
      <AppWindow title={title}>
        <Screen key={screen}>
          {renderScreen()}
        </Screen>
      </AppWindow>
    </div>
  )
}
