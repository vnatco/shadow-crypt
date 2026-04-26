import { useState, useEffect, useRef } from 'react'
import { IconEye, IconCheck, IconX } from './Icons'

export default function PasswordField({
  label,
  value,
  onChange,
  placeholder = 'Enter password…',
  match,
  showMatch = false,
  autoFocus = false,
}) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11,
        fontFamily: 'Space Mono',
        color: 'var(--muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {label}
      </label>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg)',
        border: `1px solid ${focused ? 'var(--cyan-dim)' : 'var(--border)'}`,
        borderRadius: 7,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: focused ? '0 0 0 3px var(--cyan-glow)' : 'none',
      }}>
        <input
          ref={inputRef}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontFamily: 'Space Mono',
            fontSize: 12,
            padding: '9px 12px',
            letterSpacing: '0.05em',
          }}
        />

        {showMatch && value && (
          <div style={{
            paddingRight: 6,
            color: match ? 'var(--green)' : 'var(--red)',
            display: 'flex',
            alignItems: 'center',
          }}>
            {match
              ? <IconCheck size={13} color="var(--green)" />
              : <IconX size={13} color="var(--red)" />
            }
          </div>
        )}

        <div
          onClick={() => setShow(s => !s)}
          style={{
            cursor: 'pointer',
            padding: '0 10px',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <IconEye size={14} color="var(--muted)" closed={show} />
        </div>
      </div>
    </div>
  )
}
