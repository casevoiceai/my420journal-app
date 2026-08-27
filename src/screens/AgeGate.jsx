import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import {
  COUNTRY_OPTIONS,
  US_REGION_OPTIONS,
  getCountryOption,
  isMarketEnabled,
} from '../lib/marketConfig'
import {
  clearResidenceState,
  getStoredMarketConfig,
  isAgeAssuranceCurrent,
  markAgeAssurance,
  saveResidenceSelection,
} from '../lib/residence'

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
  goldHover: '#D4B460',
  error: '#E05C5C',
}

const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

const buttonStyle = {
  width: '100%',
  minHeight: '54px',
  padding: '14px 18px',
  backgroundColor: S.surface,
  color: S.textPrimary,
  border: `1px solid ${S.border}`,
  borderRadius: '10px',
  fontFamily: fontInter,
  fontSize: '16px',
  textAlign: 'left',
  cursor: 'pointer',
}

const primaryButtonStyle = {
  width: '100%',
  minHeight: '56px',
  padding: '15px 20px',
  backgroundColor: S.gold,
  color: S.bg,
  border: 'none',
  borderRadius: '10px',
  fontFamily: fontInter,
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
}

function ScreenShell({ children }) {
  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: S.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>{children}</div>
    </div>
  )
}

function Heading({ children }) {
  return (
    <h1 style={{
      fontFamily: fontPlayfair,
      fontSize: 'clamp(32px, 8vw, 40px)',
      fontWeight: '600',
      color: S.textPrimary,
      margin: '0 0 14px 0',
      lineHeight: 1.15,
    }}>
      {children}
    </h1>
  )
}

function SupportingText({ children }) {
  return (
    <p style={{
      fontFamily: fontInter,
      fontSize: '15px',
      color: S.textSecondary,
      lineHeight: 1.65,
      margin: '0 0 28px 0',
    }}>
      {children}
    </p>
  )
}

export default function AgeGate() {
  const navigate = useNavigate()
  const [step, setStep] = useState('loading')
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [config, setConfig] = useState(null)
  const [error, setError] = useState('')

  async function continueIntoJournal() {
    const { data: { session } } = await localStore.auth.getSession()
    navigate(session ? '/login' : '/signup', { replace: true })
  }

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const stored = getStoredMarketConfig()
      if (!stored.config) {
        if (!cancelled) setStep('country')
        return
      }

      if (!cancelled) {
        setCountry(stored.config.country || '')
        setRegion(stored.config.region || '')
        setConfig(stored.config)
      }

      if (!isMarketEnabled(stored.config)) {
        if (!cancelled) setStep('blocked')
        return
      }

      if (isAgeAssuranceCurrent(stored.config, stored.state)) {
        if (!cancelled) await continueIntoJournal()
        return
      }

      if (!cancelled) setStep('age')
    }

    restore()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function chooseCountry(countryCode) {
    setError('')
    setCountry(countryCode)
    setRegion('')
    const option = getCountryOption(countryCode)

    if (option?.requiresRegion) {
      setConfig(null)
      setStep('region')
      return
    }

    const saved = saveResidenceSelection(countryCode)
    setConfig(saved.config)
    setStep(isMarketEnabled(saved.config) ? 'age' : 'blocked')
  }

  function chooseRegion() {
    setError('')
    if (!region) {
      setError('Choose your state before continuing.')
      return
    }

    const saved = saveResidenceSelection('US', region)
    setConfig(saved.config)
    setStep(isMarketEnabled(saved.config) ? 'age' : 'blocked')
  }

  async function confirmAge() {
    setError('')
    const result = markAgeAssurance(config)
    if (!result.ok) {
      setError(result.error || 'Could not save your age confirmation.')
      return
    }
    await continueIntoJournal()
  }

  function startOver() {
    clearResidenceState()
    setCountry('')
    setRegion('')
    setConfig(null)
    setError('')
    setStep('country')
  }

  if (step === 'loading') {
    return (
      <ScreenShell>
        <p style={{ fontFamily: fontInter, color: S.textSecondary, textAlign: 'center' }}>
          Opening My420Journal…
        </p>
      </ScreenShell>
    )
  }

  if (step === 'country') {
    return (
      <ScreenShell>
        <Heading>Where do you live?</Heading>
        <SupportingText>
          This sets the My420Journal information for your home location. We do not need your street address or GPS location.
        </SupportingText>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {COUNTRY_OPTIONS.map((item) => (
            <button
              key={item.code}
              onClick={() => chooseCountry(item.code)}
              style={buttonStyle}
            >
              {item.label}
            </button>
          ))}
        </div>
      </ScreenShell>
    )
  }

  if (step === 'region') {
    return (
      <ScreenShell>
        <Heading>What state do you live in?</Heading>
        <SupportingText>
          Choose your home state. My420Journal does not use this selection as proof that any cannabis activity is legal.
        </SupportingText>

        <label htmlFor="home-state" style={{
          display: 'block',
          fontFamily: fontInter,
          fontSize: '12px',
          fontWeight: '700',
          color: S.textSecondary,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          State
        </label>

        <select
          id="home-state"
          value={region}
          onChange={(event) => { setRegion(event.target.value); setError('') }}
          style={{
            width: '100%',
            minHeight: '54px',
            backgroundColor: S.surface,
            color: S.textPrimary,
            border: `1px solid ${error ? S.error : S.border}`,
            borderRadius: '10px',
            padding: '0 14px',
            fontFamily: fontInter,
            fontSize: '16px',
            boxSizing: 'border-box',
          }}
        >
          <option value="">Choose a state</option>
          {US_REGION_OPTIONS.map((item) => (
            <option key={item.code} value={item.code}>{item.label}</option>
          ))}
        </select>

        {error && (
          <p role="alert" style={{ fontFamily: fontInter, color: S.error, fontSize: '13px', margin: '10px 0 0' }}>
            {error}
          </p>
        )}

        <button onClick={chooseRegion} style={{ ...primaryButtonStyle, marginTop: '24px' }}>
          Continue
        </button>
        <button onClick={startOver} style={{ ...buttonStyle, textAlign: 'center', marginTop: '10px', background: 'transparent' }}>
          Back
        </button>
      </ScreenShell>
    )
  }

  if (step === 'blocked') {
    return (
      <ScreenShell>
        <Heading>This location is not enabled yet.</Heading>
        <SupportingText>
          {config?.holdReason || 'This location is not configured for the current My420Journal private test.'}
        </SupportingText>

        <div style={{
          padding: '16px',
          border: `1px solid ${S.border}`,
          borderRadius: '10px',
          backgroundColor: S.surface,
          marginBottom: '24px',
        }}>
          <p style={{ fontFamily: fontInter, fontSize: '14px', lineHeight: 1.6, color: S.textSecondary, margin: 0 }}>
            We fail closed when a market has not been reviewed. Choosing a different location does not change where you actually live.
          </p>
        </div>

        <button onClick={startOver} style={primaryButtonStyle}>
          Choose my location again
        </button>
      </ScreenShell>
    )
  }

  return (
    <ScreenShell>
      <p style={{
        fontFamily: fontInter,
        color: S.gold,
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        margin: '0 0 14px',
      }}>
        {config?.label}
      </p>

      <Heading>{config?.ageHeadline || 'Confirm your age.'}</Heading>
      <SupportingText>{config?.ageBody}</SupportingText>

      <div style={{
        padding: '16px',
        border: `1px solid ${S.border}`,
        borderRadius: '10px',
        backgroundColor: S.surface,
        marginBottom: '24px',
      }}>
        <p style={{ fontFamily: fontInter, fontSize: '14px', lineHeight: 1.6, color: S.textSecondary, margin: 0 }}>
          My420Journal stores only the confirmation result and the applicable age threshold on this device. It does not ask for your exact date of birth here.
        </p>
      </div>

      <button onClick={confirmAge} style={primaryButtonStyle}>
        {config?.ageConfirmLabel || 'Confirm and continue'}
      </button>

      {error && (
        <p role="alert" style={{ fontFamily: fontInter, color: S.error, fontSize: '13px', margin: '12px 0 0', textAlign: 'center' }}>
          {error}
        </p>
      )}

      <button onClick={startOver} style={{ ...buttonStyle, textAlign: 'center', marginTop: '10px', background: 'transparent' }}>
        Change where I live
      </button>
    </ScreenShell>
  )
}
