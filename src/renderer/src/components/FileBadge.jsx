import { IconX } from './Icons'

export default function FileBadge({ file, onClear }) {
  const name = file?.name || 'file'
  const isEnc = name.endsWith('.enc') || name.endsWith('.aes')
  const ext = name.split('.').pop().toUpperCase()
  const short = name.length > 26 ? name.slice(0, 12) + '…' + name.slice(-10) : name
  const sizeLabel = file?.size ? (file.size / 1024).toFixed(1) + ' KB' : '-'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 10px',
    }}>
      <div style={{
        width: 30,
        height: 34,
        borderRadius: 5,
        background: isEnc ? 'oklch(68% 0.2 290 / 0.12)' : 'oklch(75% 0.19 196 / 0.1)',
        border: `1px solid ${isEnc ? 'oklch(68% 0.2 290 / 0.3)' : 'oklch(75% 0.19 196 / 0.25)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 7,
          fontFamily: 'Space Mono',
          color: isEnc ? 'var(--purple)' : 'var(--cyan)',
          letterSpacing: '-0.02em',
          fontWeight: 700,
        }}>
          {ext.slice(0, 4)}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {short}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Space Mono' }}>
          {sizeLabel}
        </div>
      </div>

      {onClear && (
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            padding: 4,
            display: 'flex',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
        >
          <IconX size={11} />
        </button>
      )}
    </div>
  )
}
