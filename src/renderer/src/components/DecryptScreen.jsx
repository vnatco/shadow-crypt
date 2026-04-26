import { useState } from 'react'
import { IconUnlock, IconX } from './Icons'
import PasswordField from './PasswordField'
import FileOpHeader from './FileOpHeader'
import Spinner from './Spinner'

export default function DecryptScreen({ file, onClose, onSubmit, hasError, submitting }) {
  const [pw, setPw] = useState('')
  const canSubmit = pw.length >= 1 && !submitting

  const handleSubmit = () => { if (canSubmit) onSubmit(pw) }
  const handleKeyDown = e => { if (e.key === 'Enter' && canSubmit) handleSubmit() }

  return (
    <div
      style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
      onKeyDown={handleKeyDown}
    >
      {/* Unified file + action header */}
      <FileOpHeader file={file} mode="decrypt" onClose={onClose} />

      <PasswordField
        label="Decryption Password"
        value={pw}
        onChange={v => { setPw(v) }}
        placeholder="Enter password to decrypt…"
      />

      {/* Wrong password error */}
      {hasError && (
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
          Incorrect password - decryption failed
        </div>
      )}

      {/* Output note */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 11px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 7,
        fontSize: 11,
        color: 'var(--muted)',
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--purple)',
          boxShadow: '0 0 5px var(--purple)',
          flexShrink: 0,
        }} />
        <span style={{ fontFamily: 'Space Mono', letterSpacing: '0.03em' }}>
          Output saved alongside source file
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 12, fontWeight: 500,
          background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)',
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
              ? 'linear-gradient(135deg, oklch(68% 0.2 290), oklch(65% 0.22 270))'
              : 'var(--bg3)',
            border: `1px solid ${canSubmit ? 'var(--purple)' : 'var(--border)'}`,
            color: canSubmit ? '#fff' : 'var(--muted)',
            transition: 'all 0.2s',
            boxShadow: canSubmit ? '0 0 14px oklch(68% 0.2 290 / 0.3)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          {submitting
            ? <Spinner color="#fff" />
            : <><IconUnlock size={13} color={canSubmit ? '#fff' : 'var(--muted)'} /> Decrypt File</>
          }
        </button>
      </div>
    </div>
  )
}
