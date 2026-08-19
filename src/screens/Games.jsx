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

const GAMES = [
  {
    title: 'Weed Goblins',
    description: 'A messenger-style tabletop adventure through the Goblin Highlands.',
    path: '/games/weed-goblins',
  },
  {
    title: 'Who Took My Lighter?',
    description: 'A fictional deadpan mystery built around clues, suspects, and an accusation.',
    path: '/games/who-took-my-lighter',
  },
  {
    title: 'The New Place',
    description: 'A fictional one-week dispensary management game where decisions carry forward.',
    path: '/games/the-new-place',
  },
]

export default function Games() {
  const navigate = useNavigate()

  return (
    <main style={{
      minHeight: '100dvh',
      backgroundColor: S.bg,
      color: S.textPrimary,
      padding: '20px 20px 88px',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/home')}
          style={{
            minHeight: '44px',
            padding: '0 12px',
            marginBottom: '18px',
            border: `1px solid ${S.border}`,
            borderRadius: '10px',
            backgroundColor: S.surface,
            color: S.textSecondary,
            fontFamily: fontInter,
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ‹ Back to Home
        </button>

        <div style={{ marginBottom: '22px' }}>
          <div style={{
            color: S.gold,
            fontFamily: fontInter,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            Private Phase 1 Build
          </div>
          <h1 style={{
            margin: 0,
            fontFamily: fontPlayfair,
            fontSize: 'clamp(32px, 8vw, 48px)',
            lineHeight: 1.08,
          }}>
            Play Games
          </h1>
          <p style={{
            margin: '10px 0 0',
            color: S.textSecondary,
            fontFamily: fontInter,
            fontSize: '15px',
            lineHeight: 1.55,
          }}>
            Choose a game to review. These are the current Phase 1 builds.
          </p>
        </div>

        <section aria-label="Phase 1 games" style={{ display: 'grid', gap: '12px' }}>
          {GAMES.map((game) => (
            <button
              key={game.path}
              type="button"
              onClick={() => navigate(game.path)}
              style={{
                width: '100%',
                minHeight: '112px',
                padding: '18px',
                textAlign: 'left',
                border: `1px solid ${S.gold}`,
                borderRadius: '14px',
                backgroundColor: S.surface,
                color: S.textPrimary,
                cursor: 'pointer',
              }}
            >
              <div style={{
                fontFamily: fontPlayfair,
                fontSize: '21px',
                fontWeight: 700,
                color: S.gold,
                marginBottom: '6px',
              }}>
                {game.title}
              </div>
              <div style={{
                fontFamily: fontInter,
                fontSize: '14px',
                lineHeight: 1.5,
                color: S.textSecondary,
              }}>
                {game.description}
              </div>
            </button>
          ))}
        </section>
      </div>
    </main>
  )
}
