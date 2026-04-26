import FileOpHeader from './FileOpHeader'

const ENCRYPT_PHASES = ['Deriving key…', 'Generating IV…', 'Encrypting blocks…', 'Writing output…', 'Verifying integrity…']
const DECRYPT_PHASES = ['Reading file…', 'Deriving key…', 'Decrypting blocks…', 'Verifying tag…', 'Writing output…']

export default function LoadingScreen({ mode, file, progress, phase, onClose, onCancel }) {
  const isEnc    = mode === 'encrypt'
  const accent   = isEnc ? 'var(--cyan)'   : 'var(--purple)'
  const accentGlow = isEnc ? 'var(--cyan-glow)' : 'oklch(68% 0.2 290 / 0.25)'
  const done     = progress >= 100
  const pct      = Math.min(Math.floor(progress), 100)
  const r        = 32
  const circ     = 2 * Math.PI * r

  const displayPhase = phase || (isEnc ? ENCRYPT_PHASES[0] : DECRYPT_PHASES[0])

  return (
    <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Unified file + action header — close only appears when done */}
      <FileOpHeader file={file} mode={mode} onClose={done ? onClose : undefined} />

      {/* Progress ring (60×60, SVG viewBox 0 0 80 80) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
        <div style={{ position: 'relative', width: 60, height: 60 }}>
          <svg width="60" height="60" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r={r} fill="none"
              stroke={accent} strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 0.15s ease, stroke 0.4s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 1,
          }}>
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'Space Mono',
              color: done ? accent : 'var(--text)',
              lineHeight: 1,
            }}>
              {pct}%
            </span>
          </div>
        </div>

        {/* Phase label */}
        <div style={{
          fontSize: 11,
          fontFamily: 'Space Mono',
          color: done ? accent : 'var(--muted)',
          letterSpacing: '0.04em',
          textAlign: 'center',
          minHeight: 16,
          transition: 'color 0.3s',
        }}>
          {done
            ? (isEnc ? 'ENCRYPTION COMPLETE' : 'DECRYPTION COMPLETE')
            : displayPhase.toUpperCase()
          }
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            borderRadius: 4,
            width: `${pct}%`,
            background: done
              ? accent
              : `linear-gradient(90deg, ${accent}, ${isEnc ? 'oklch(72% 0.2 210)' : 'oklch(65% 0.22 270)'})`,
            boxShadow: `0 0 8px ${accentGlow}`,
            transition: 'width 0.15s ease',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {!done && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, oklch(100% 0 0 / 0.25) 50%, transparent 100%)',
                animation: 'shimmer 1.2s infinite',
              }} />
            )}
          </div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, color: 'var(--muted)', fontFamily: 'Space Mono',
        }}>
          <span>
            {file?.name
              ? (file.name.length > 22 ? file.name.slice(0, 18) + '…' : file.name)
              : 'Processing…'
            }
          </span>
          <span style={{ color: done ? accent : 'var(--muted)' }}>
            {done ? 'Done' : `${pct}%`}
          </span>
        </div>
      </div>

      {/* Cancel / Done button */}
      <button
        onClick={done ? onClose : onCancel}
        style={{
          padding: '9px 0',
          borderRadius: 7,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          background: done
            ? (isEnc
                ? 'linear-gradient(135deg, oklch(75% 0.19 196), oklch(72% 0.2 210))'
                : 'linear-gradient(135deg, oklch(68% 0.2 290), oklch(65% 0.22 270))')
            : 'var(--bg2)',
          border: `1px solid ${done ? accent : 'var(--border)'}`,
          color: done ? (isEnc ? 'var(--bg)' : '#fff') : 'var(--muted)',
          transition: 'all 0.3s',
          boxShadow: done ? `0 0 14px ${accentGlow}` : 'none',
        }}
      >
        {done ? 'Done' : 'Cancel'}
      </button>
    </div>
  )
}
