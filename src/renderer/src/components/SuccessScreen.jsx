import SuccessBanner from './SuccessBanner'
import { IconFolder } from './Icons'

export default function SuccessScreen({ mode, outputPath }) {
  const isEnc  = mode === 'encrypt'
  const accent = isEnc ? 'var(--cyan)' : 'var(--purple)'
  const label  = isEnc ? 'File encrypted successfully' : 'File decrypted successfully'

  const shortPath = outputPath && outputPath.length > 44
    ? '…' + outputPath.slice(-42)
    : outputPath

  const handleOpen = () => {
    if (outputPath) window.electronAPI.showInFolder(outputPath)
    window.electronAPI.closeWindow()
  }

  const handleDone = () => {
    window.electronAPI.closeWindow()
  }

  return (
    <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SuccessBanner label={label} color={accent} />

      {outputPath && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 12px',
        }}>
          <IconFolder size={14} color="var(--muted)" />
          <div style={{
            fontSize: 11,
            fontFamily: 'Space Mono',
            color: 'var(--muted)',
            wordBreak: 'break-all',
            lineHeight: 1.5,
            flex: 1,
          }}>
            {shortPath}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleOpen}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: isEnc
              ? 'linear-gradient(135deg, oklch(75% 0.19 196), oklch(72% 0.2 210))'
              : 'linear-gradient(135deg, oklch(68% 0.2 290), oklch(65% 0.22 270))',
            border: `1px solid ${accent}`,
            color: isEnc ? 'var(--bg)' : '#fff',
            boxShadow: isEnc ? '0 0 14px var(--cyan-glow)' : '0 0 14px oklch(68% 0.2 290 / 0.3)',
            transition: 'opacity 0.15s',
          }}
        >
          Locate
        </button>

        <button
          onClick={handleDone}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            transition: 'opacity 0.15s',
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
