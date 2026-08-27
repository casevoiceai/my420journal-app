import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LegacyProfileChooser from '../components/LegacyProfileChooser'
import {
  activateLegacyLocalProfile,
  ensureAnonymousLocalProfile,
} from '../lib/localProfile'

const S = {
  bg: '#0A1A0A',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  error: '#E05C5C',
}

export default function Signup() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [choices, setChoices] = useState([])

  useEffect(() => {
    try {
      const result = ensureAnonymousLocalProfile()
      if (result.status === 'legacy_profile_choice_required') {
        setChoices(result.choices || [])
        return
      }
      if (!result.profile?.id) {
        setError('Could not create a private local journal on this device.')
        return
      }
      navigate('/onboarding', { replace: true })
    } catch {
      setError('Could not create a private local journal on this device.')
    }
  }, [navigate])

  function handleChoose(profileId) {
    try {
      const result = activateLegacyLocalProfile(profileId)
      if (!result.profile?.id) {
        setError('Could not open that local journal.')
        return
      }
      navigate('/onboarding', { replace: true })
    } catch {
      setError('Could not open that local journal.')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: S.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      boxSizing: 'border-box',
      textAlign: choices.length ? 'left' : 'center',
    }}>
      {choices.length > 0 ? (
        <LegacyProfileChooser choices={choices} onChoose={handleChoose} />
      ) : (
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '32px',
            fontWeight: '600',
            color: S.textPrimary,
            margin: '0 0 14px 0',
            lineHeight: 1.2,
          }}>
            Preparing your private journal.
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            color: S.textSecondary,
            lineHeight: 1.6,
            margin: 0,
          }}>
            No email or password is required. Your local journal profile stays on this device.
          </p>
        </div>
      )}

      {error && (
        <p style={{
          position: 'fixed',
          left: '24px',
          right: '24px',
          bottom: '28px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          color: S.error,
          lineHeight: 1.5,
          textAlign: 'center',
          margin: 0,
        }}>
          {error}
        </p>
      )}
    </div>
  )
}
