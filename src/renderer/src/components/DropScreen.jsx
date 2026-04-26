import { useState, useRef } from 'react'
import { IconShield, IconFile, IconUpload } from './Icons'

export default function DropScreen({ onFileSelected }) {
  const [dragging, setDragging] = useState(false)
  const [dragCount, setDragCount] = useState(0)
  const inputRef = useRef()

  const handleDragEnter = e => {
    e.preventDefault()
    setDragCount(c => c + 1)
    setDragging(true)
  }
  const handleDragLeave = e => {
    e.preventDefault()
    setDragCount(c => {
      const n = c - 1
      if (n <= 0) setDragging(false)
      return n
    })
  }
  const handleDragOver = e => e.preventDefault()
  const handleDrop = e => {
    e.preventDefault()
    setDragging(false)
    setDragCount(0)
    const f = e.dataTransfer.files[0]
    if (f) onFileSelected({ name: f.name, size: f.size, path: window.electronAPI.getPathForFile(f) })
  }
  const handleBrowse = async () => {
    const f = await window.electronAPI.selectFile()
    if (f) onFileSelected(f)
  }
  const handleInput = e => {
    const f = e.target.files[0]
    if (f) onFileSelected({ name: f.name, size: f.size, path: window.electronAPI.getPathForFile(f) })
  }

  return (
    <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'oklch(75% 0.19 196 / 0.12)',
          border: '1px solid oklch(75% 0.19 196 / 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconShield size={16} color="var(--cyan)" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Shadow Crypt</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Space Mono', letterSpacing: '0.04em' }}>
            AES-256 FILE ENCRYPTION
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowse}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--cyan)' : 'var(--border-hi)'}`,
          borderRadius: 12,
          padding: '32px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
          cursor: 'pointer',
          background: dragging ? 'oklch(75% 0.19 196 / 0.05)' : 'var(--bg2)',
          transition: 'all 0.2s ease',
          boxShadow: dragging ? '0 0 0 4px var(--cyan-glow), inset 0 0 30px oklch(75% 0.19 196 / 0.04)' : 'none',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Corner accents when dragging */}
        {dragging && [0, 1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: 14, height: 14,
            top:    i < 2  ? 8 : 'auto',
            bottom: i >= 2 ? 8 : 'auto',
            left:   i % 2 === 0 ? 8 : 'auto',
            right:  i % 2 === 1 ? 8 : 'auto',
            borderTop:    i < 2  ? '2px solid var(--cyan)' : 'none',
            borderBottom: i >= 2 ? '2px solid var(--cyan)' : 'none',
            borderLeft:   i % 2 === 0 ? '2px solid var(--cyan)' : 'none',
            borderRight:  i % 2 === 1 ? '2px solid var(--cyan)' : 'none',
            borderRadius: i === 0 ? '3px 0 0 0' : i === 1 ? '0 3px 0 0' : i === 2 ? '0 0 0 3px' : '0 0 3px 0',
          }} />
        ))}

        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: dragging ? 'oklch(75% 0.19 196 / 0.15)' : 'var(--bg3)',
          border: `1px solid ${dragging ? 'oklch(75% 0.19 196 / 0.4)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          {dragging
            ? <IconFile size={28} color="var(--cyan)" />
            : <IconUpload size={26} color="var(--muted)" />
          }
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 13, fontWeight: 500,
            color: dragging ? 'var(--cyan)' : 'var(--text)',
            marginBottom: 4,
            transition: 'color 0.2s',
          }}>
            {dragging ? 'Release to select file' : 'Drag & drop a file here'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            or <span style={{ color: 'var(--cyan)', cursor: 'pointer' }}>browse to select</span>
          </div>
        </div>

        <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleInput} />
      </div>
    </div>
  )
}
