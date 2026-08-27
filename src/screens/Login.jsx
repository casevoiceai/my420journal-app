import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensureAnonymousLocalProfile } from '../lib/localProfile'
import { hasPin } from '../lib/pin'

const S = {
  bg: '#0A1A0A',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  error: '#E05C5C',
}

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const result = ensureAnonymousLocalProfile()
      if (!result.profile?.id) {
        setError('Could not open the private local journal on this device.')
        return
      }
      navigate(hasPin() ? '/pin' : '/home', { replace: true })
    } catch {
      setError('Could not open the private local journal on this device.')
    }
  }, [navigate])

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: S.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      boxSizing: 'border-box',
      textAlign: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '32px',
          fontWeight: '600',
          color: S.textPrimary,
          margin: '0 0 14px 0',
          lineHeight: 1.2,
        }}>
          Opening your journal.
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          color: S.textSecondary,
          lineHeight: 1.6,
          margin: 0,
        }}>
          Your journal uses a private local profile on this device. No email sign-in is required.
        </p>
        {error && (
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: S.error,
            lineHeight: 1.5,
            marginTop: '18px',
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
