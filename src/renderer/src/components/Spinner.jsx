export default function Spinner({ color = 'var(--bg)' }) {
  const trackColor = color === 'var(--bg)'
    ? 'oklch(9% 0.015 250 / 0.3)'
    : 'rgba(255,255,255,0.3)'
  return (
    <div style={{
      width: 14,
      height: 14,
      border: `2px solid ${trackColor}`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}
