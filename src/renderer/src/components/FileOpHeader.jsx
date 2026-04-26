import { IconX } from './Icons'

export default function FileOpHeader({ file, mode, onClose }) {
  const isEnc  = mode === 'encrypt'
  const accent = isEnc ? 'var(--cyan)' : 'var(--purple)'
  const name   = file?.name || 'file'
  const ext    = name.split('.').pop().toUpperCase()
  const short  = name.length > 30 ? name.slice(0, 14) + '…' + name.slice(-12) : name

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      background: isEnc ? 'oklch(75% 0.19 196 / 0.07)' : 'oklch(68% 0.2 290 / 0.07)',
      border: `1px solid ${isEnc ? 'oklch(75% 0.19 196 / 0.22)' : 'oklch(68% 0.2 290 / 0.22)'}`,
      borderRadius: 8,
      padding: '9px 11px 9px 12px',
    }}>
      {/* Extension label */}
      <div style={{
        fontSize: 9,
        fontFamily: 'Space Mono',
        color: 'var(--muted)',
        fontWeight: 700,
        letterSpacing: '0.04em',
        flexShrink: 0,
        minWidth: 28,
        textAlign: 'center',
      }}>
        {ext.slice(0, 4)}
      </div>

      {/* Vertical divider */}
      <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

      {/* File info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 1,
        }}>
          {short}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Space Mono' }}>
            {file?.size ? (file.size / 1024).toFixed(1) + ' KB' : '-'}
          </span>
          <span style={{ color: 'var(--border)', fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, color: accent, fontFamily: 'Space Mono', opacity: 0.8 }}>
            {isEnc ? 'encrypt' : 'decrypt'}
          </span>
        </div>
      </div>

      {/* Back / close button */}
      {onClose && (
        <button
          onClick={onClose}
          title="Back"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)' }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 5,
            flexShrink: 0,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          <IconX size={10} />
        </button>
      )}
    </div>
  )
}
