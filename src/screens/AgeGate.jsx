import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { hasPin } from '../lib/pin'
import { isDevMode } from '../lib/dev'
import { AGE_GATE_TEST_CODE, isRuntimeTestConvenienceEnabled } from '../lib/testConvenience'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const YEARS = Array.from({ length: 82 }, (_, i) => 2005 - i)

function isAtLeast21(month, day, year) {
  const today = new Date()
  const birthDate = new Date(year, month - 1, day)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 21
}

const DEV_MODE = isDevMode()
const TEST_CONVENIENCE_ENABLED = isRuntimeTestConvenienceEnabled()

export default function AgeGate() {
  const navigate = useNavigate()
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')
  const [testCode, setTestCode] = useState('')
  const [error, setError] = useState('')

  async function continueToJournal() {
    const { data: { user } } = await localStore.auth.getUser()
    if (user) {
      navigate(hasPin() ? '/pin' : '/home', { replace: true })
      return
    }
    navigate('/signup', { replace: true })
  }

  async function handleContinue() {
    if (TEST_CONVENIENCE_ENABLED && testCode.trim() === AGE_GATE_TEST_CODE) {
      setError('')
      await continueToJournal()
      return
    }

    if (!month || !day || !year) {
      setError('Please select your full date of birth.')
      return
    }
    if (!isAtLeast21(parseInt(month), parseInt(day), parseInt(year))) {
      setError('You must be 21 or older to use this app.')
      return
    }
    setError('')
    await continueToJournal()
  }

  const selectStyle = {
    backgroundColor: '#1A2E1A',
    color: '#E8F0E8',
    border: '1px solid #2D4A2D',
    borderRadius: '8px',
    padding: '11px 14px',
    fontSize: '15px',
    fontFamily: "'Inter', sans-serif",
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238FAF8F' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
    boxSizing: 'border-box',
  }

  const inputStyle = {
    backgroundColor: '#1A2E1A',
    color: '#E8F0E8',
    border: '1px solid #2D4A2D',
    borderRadius: '8px',
    padding: '11px 14px',
    fontSize: '15px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontFamily: "'Inter', sans-serif",
    fontSize: '11px',
    fontWeight: '500',
    color: '#8FAF8F',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    textAlign: 'left',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A1A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '38px',
          fontWeight: '600',
          color: '#E8F0E8',
          margin: '0 0 20px 0',
          lineHeight: '1.2',
        }}>
          Before we begin.
        </h1>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          fontWeight: '400',
          color: '#8FAF8F',
          margin: '0 auto',
          maxWidth: '420px',
          lineHeight: '1.6',
          textAlign: 'center',
        }}>
          You must be 21 or older to use my420journal.
        </p>

        <div style={{
          width: '48px',
          height: '1px',
          backgroundColor: '#C9A84C',
          margin: '40px auto 48px auto',
          opacity: 0.5,
        }} />

        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 80px 104px',
          gap: '12px',
          marginBottom: TEST_CONVENIENCE_ENABLED ? '18px' : '32px',
        }}>
          <div>
            <label style={labelStyle}>Month</label>
            <select
              value={month}
              onChange={(e) => { setMonth(e.target.value); setError('') }}
              style={selectStyle}
            >
              <option value="" disabled>Month</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} style={{ backgroundColor: '#1A2E1A' }}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Day</label>
            <select
              value={day}
              onChange={(e) => { setDay(e.target.value); setError('') }}
              style={selectStyle}
            >
              <option value="" disabled>Day</option>
              {DAYS.map((d) => (
                <option key={d} value={d} style={{ backgroundColor: '#1A2E1A' }}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Year</label>
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setError('') }}
              style={selectStyle}
            >
              <option value="" disabled>Year</option>
              {YEARS.map((y) => (
                <option key={y} value={y} style={{ backgroundColor: '#1A2E1A' }}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {TEST_CONVENIENCE_ENABLED && (
          <div style={{ width: '100%', marginBottom: '32px' }}>
            <label style={labelStyle}>Code</label>
            <input
              value={testCode}
              onChange={(e) => { setTestCode(e.target.value); setError('') }}
              style={inputStyle}
              autoComplete="off"
            />
          </div>
        )}

        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            maxWidth: '440px',
            padding: '17px 24px',
            backgroundColor: '#C9A84C',
            color: '#0A1A0A',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            letterSpacing: '0.03em',
            transition: 'background-color 0.15s ease, transform 0.1s ease',
            display: 'block',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#D4B460'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#C9A84C'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Continue
        </button>

        {error && (
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: '#E05C5C',
            marginTop: '14px',
            lineHeight: '1.5',
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        {DEV_MODE && (
          <div style={{ width: '100%', marginTop: '16px' }}>
            <button
              onClick={() => navigate('/home')}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: '#1A2E1A',
                color: '#C9A84C',
                border: '1px solid #C9A84C',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                letterSpacing: '0.03em',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1F361F' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1A2E1A' }}
            >
              Dev: Skip to Home
            </button>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: '#8FAF8F',
              marginTop: '8px',
              textAlign: 'center',
              lineHeight: '1.5',
            }}>
              Dev mode -- navigates directly, no auth required
            </p>
          </div>
        )}

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          color: '#8FAF8F',
          marginTop: '48px',
          lineHeight: '1.6',
          textAlign: 'center',
        }}>
          For use only where legal. Know your local laws.
        </p>
      </div>
    </div>
  )
}
