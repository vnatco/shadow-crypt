import { useState } from 'react'
import { IconLock, IconX } from './Icons'
import PasswordField from './PasswordField'
import FileOpHeader from './FileOpHeader'
import Spinner from './Spinner'

function getStrength(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8)           s++
  if (pw.length >= 12)          s++
  if (/[A-Z]/.test(pw))        s++
  if (/[0-9]/.test(pw))        s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const strengthLabel = ['', 'Weak', 'Weak', 'Fair', 'Strong', 'Very strong']
const strengthColor = ['', 'var(--red)', 'var(--red)', 'var(--amber)', 'var(--green)', 'var(--cyan)']

export default function EncryptScreen({ file, onClose, onSubmit, submitting, errorMsg }) {
  const [pw, setPw]   = useState('')
  const [pw2, setPw2] = useState('')
  const strength  = getStrength(pw)
  const match     = pw.length > 0 && pw2.length > 0 && pw === pw2
  const canSubmit = pw.length >= 1 && match && !submitting

  const handleSubmit = () => { if (canSubmit) onSubmit(pw) }
  const handleKeyDown = e => { if (e.key === 'Enter' && canSubmit) handleSubmit() }

  return (
    <div
      style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
      onKeyDown={handleKeyDown}
    >
      {/* Unified file + action header */}
      <FileOpHeader file={file} mode="encrypt" onClose={onClose} />

      {/* Password fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PasswordField
          label="Password"
          value={pw}
          onChange={setPw}
          placeholder="Choose a strong password…"
          autoFocus
        />

        {/* Strength bar */}
        {pw && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i <= strength ? strengthColor[strength] : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
            <div style={{
              fontSize: 10,
              color: strengthColor[strength],
              fontFamily: 'Space Mono',
              textAlign: 'right',
            }}>
              {strengthLabel[strength]}
            </div>
          </div>
        )}

        <PasswordField
          label="Verify Password"
          value={pw2}
          onChange={setPw2}
          placeholder="Repeat password…"
          match={match}
          showMatch={pw2.length > 0}
        />
      </div>

{/* Error banner */}
      {errorMsg && (
        <div style={{
          background: 'oklch(65% 0.22 25 / 0.1)',
          border: '1px solid oklch(65% 0.22 25 / 0.4)',
          borderRadius: 7,
          padding: '8px 12px',
          fontSize: 11,
          color: 'var(--red)',
          fontFamily: 'Space Mono',
          display: 'flex', alignItems: 'center', gap: 7,
          animation: 'fadeIn 0.2s ease',
        }}>
          <IconX size={11} color="var(--red)" />
          {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 12, fontWeight: 500,
          background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)',
          transition: 'border-color 0.2s',
        }}>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            flex: 2, padding: '9px 0', borderRadius: 7,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontSize: 12, fontWeight: 600,
            background: canSubmit
              ? 'linear-gradient(135deg, oklch(75% 0.19 196), oklch(72% 0.2 210))'
              : 'var(--bg3)',
            border: `1px solid ${canSubmit ? 'var(--cyan)' : 'var(--border)'}`,
            color: canSubmit ? 'var(--bg)' : 'var(--muted)',
            transition: 'all 0.2s',
            boxShadow: canSubmit ? '0 0 14px var(--cyan-glow)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          {submitting
            ? <Spinner />
            : <><IconLock size={13} color={canSubmit ? 'var(--bg)' : 'var(--muted)'} /> Encrypt File</>
          }
        </button>
      </div>
    </div>
  )
}
