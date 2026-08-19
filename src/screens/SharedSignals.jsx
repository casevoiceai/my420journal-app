import { useNavigate } from 'react-router-dom'

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

export default function SharedSignals() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '72px 20px 96px', boxSizing: 'border-box' }}>
        <h1 style={{
          fontFamily: fontPlayfair,
          fontSize: '30px',
          fontWeight: '700',
          color: S.textPrimary,
          margin: '0 0 12px 0',
          lineHeight: 1.2,
        }}>
          Shared Journey View
        </h1>

        <div style={{
          backgroundColor: S.surface,
          border: `1px solid ${S.border}`,
          borderLeft: `4px solid ${S.gold}`,
          borderRadius: '12px',
          padding: '22px',
          marginBottom: '20px',
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
            Unavailable during Phase 1 testing
          </p>
          <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, lineHeight: 1.65, margin: '0 0 10px 0' }}>
            Shared contributions and shared aggregate lookups are disabled in this Phase 1 build.
          </p>
          <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, lineHeight: 1.55, margin: 0 }}>
            The private journal, Local Guide, and Phase 1 games continue to work without this feature. Shared Journey will remain unavailable unless qualified legal review specifically approves it for the test.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/home')}
          style={{
            width: '100%',
            minHeight: '50px',
            backgroundColor: S.gold,
            color: S.bg,
            border: 'none',
            borderRadius: '10px',
            fontFamily: fontInter,
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
