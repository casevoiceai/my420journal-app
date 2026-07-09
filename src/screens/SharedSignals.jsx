import { useEffect, useState } from 'react'
import AggregateSignalCard from '../components/AggregateSignalCard'
import MinimumPoolNotice from '../components/MinimumPoolNotice'
import { fetchAggregateResults } from '../lib/sharedAggregateApi'
import { getSharedPrivacyState } from '../lib/sharedPrivacy'

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
}

const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

function PlaceholderCard({ message }) {
  return (
    <div style={{
      backgroundColor: S.surface,
      border: `1px solid ${S.border}`,
      borderRadius: '12px',
      padding: '22px',
    }}>
      <p style={{
        fontFamily: fontInter,
        fontSize: '12px',
        fontWeight: '700',
        color: S.gold,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin: '0 0 10px 0',
      }}>
        Not connected yet
      </p>
      <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, lineHeight: 1.6, margin: 0 }}>
        {message || 'Shared signals are not connected to the Cloudflare backend yet.'}
      </p>
      <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, lineHeight: 1.5, margin: '10px 0 0 0' }}>
        This screen is ready for the backend connection, but it will not show fake or hardcoded aggregate data.
      </p>
    </div>
  )
}

export default function SharedSignals() {
  const [loading, setLoading] = useState(true)
  const [response, setResponse] = useState(null)
  const [privacyState, setPrivacyState] = useState(() => getSharedPrivacyState())

  useEffect(() => {
    let active = true
    async function load() {
      setPrivacyState(getSharedPrivacyState())
      const result = await fetchAggregateResults()
      if (!active) return
      setResponse(result)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const aggregates = Array.isArray(response?.data) ? response.data : []
  const optedIn = privacyState.shared_opt_in_enabled === true
  const notConnected = response?.connected === false || response?.status === 'not_connected'

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '56px 20px 96px', boxSizing: 'border-box' }}>
        <h1 style={{
          fontFamily: fontPlayfair,
          fontSize: '30px',
          fontWeight: '700',
          color: S.textPrimary,
          margin: '0 0 8px 0',
          lineHeight: 1.2,
        }}>
          Shared Signals
        </h1>
        <p style={{
          fontFamily: fontInter,
          fontSize: '15px',
          color: S.textSecondary,
          margin: '0 0 24px 0',
          lineHeight: 1.6,
        }}>
          Aggregate, opt-in signals from other users who chose to contribute. Individual entries are never shown.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            borderLeft: `4px solid ${optedIn ? S.gold : S.border}`,
            borderRadius: '12px',
            padding: '18px',
          }}>
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textPrimary, margin: '0 0 6px 0', fontWeight: '700' }}>
              {optedIn ? 'Shared Journey View is on' : 'Shared Journey View is off'}
            </p>
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0, lineHeight: 1.5 }}>
              You can manage opt-in from Settings. This feature is off by default.
            </p>
          </div>

          <MinimumPoolNotice />

          {loading && (
            <PlaceholderCard message="Checking shared signal connection..." />
          )}

          {!loading && notConnected && (
            <PlaceholderCard message={response?.message} />
          )}

          {!loading && !notConnected && aggregates.length === 0 && (
            <PlaceholderCard message="No aggregate product signals are available yet." />
          )}

          {!loading && !notConnected && aggregates.map((aggregate) => (
            <AggregateSignalCard key={aggregate.product_key || aggregate.product_name} aggregate={aggregate} />
          ))}

          <div style={{
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: '12px',
            padding: '18px',
          }}>
            <p style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '700', color: S.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              Privacy reminder
            </p>
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, lineHeight: 1.6, margin: 0 }}>
              Only aggregate counts and percentages can appear here. One person's specific journal entry is never visible to another person.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
