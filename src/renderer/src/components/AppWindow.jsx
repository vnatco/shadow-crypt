import { useState } from 'react'
import { IconShield } from './Icons'

function TitleBtn({ onClick, children, redClose = false }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 46,
        height: 32,
        background: hover ? (redClose ? '#c42b1c' : 'oklch(100% 0 0 / 0.06)') : 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hover ? (redClose ? '#fff' : 'var(--text)') : 'var(--muted)',
        transition: 'background 0.15s, color 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

export default function AppWindow({ title, children }) {
  return (
    <div style={{
      width: 400,
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--bg2)',
      border: '1px solid var(--border-hi)',
      boxShadow: '0 24px 60px oklch(0% 0 0 / 0.65), 0 0 0 0.5px oklch(100% 0 0 / 0.06)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Windows-style title bar */}
      <div style={{
        height: 32,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        WebkitAppRegion: 'drag',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}>
        {/* App icon + title (left) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 12,
          flex: 1,
          minWidth: 0,
        }}>
          <IconShield size={14} color="var(--cyan)" />
          <span style={{
            fontSize: 11,
            color: 'var(--muted)',
            fontFamily: 'DM Sans',
            fontWeight: 400,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </span>
        </div>

        {/* Win32 window controls (right) */}
        <div style={{ display: 'flex', flexShrink: 0, WebkitAppRegion: 'no-drag' }}>
          {/* Minimize */}
          <TitleBtn onClick={() => window.electronAPI.minimizeWindow()}>
            <svg width="10" height="1" viewBox="0 0 10 1">
              <line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" strokeWidth="1" />
            </svg>
          </TitleBtn>

          {/* Maximize (no-op visually) */}
          <TitleBtn onClick={() => {}}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1" />
            </svg>
          </TitleBtn>

          {/* Close */}
          <TitleBtn onClick={() => window.electronAPI.closeWindow()} redClose>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </TitleBtn>
        </div>
      </div>

      <div style={{ WebkitAppRegion: 'no-drag' }}>
        {children}
      </div>
    </div>
  )
}
