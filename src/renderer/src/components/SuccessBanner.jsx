import { IconCheck } from './Icons'

export default function SuccessBanner({ label, color }) {
  const borderColor = color === 'var(--cyan)'
    ? 'oklch(75% 0.19 196 / 0.3)'
    : 'oklch(68% 0.2 290 / 0.3)'
  const bgColor = color === 'var(--cyan)'
    ? 'oklch(75% 0.19 196 / 0.15)'
    : 'oklch(68% 0.2 290 / 0.15)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      background: 'var(--bg)',
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        flexShrink: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <IconCheck size={11} color={color} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color }}>{label}</span>
    </div>
  )
}
