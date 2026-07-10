import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

export function SectionHeader({ eyebrow, title, body }) {
  return (
    <div style={{ maxWidth: '760px', marginBottom: '34px' }}>
      <p style={eyebrowStyle}>{eyebrow}</p>
      <h2 style={{
        margin: '0 0 14px 0',
        color: S.textPrimary,
        fontFamily: marketingFonts.playfair,
        fontSize: 'clamp(36px, 6vw, 58px)',
        lineHeight: 1.02,
        letterSpacing: '-0.03em',
      }}>
        {title}
      </h2>
      <p style={{
        margin: 0,
        color: S.textSecondary,
        fontSize: '17px',
        lineHeight: 1.7,
      }}>
        {body}
      </p>
    </div>
  )
}

export function PlaceholderBox({ label, minHeight }) {
  return (
    <div style={{
      minHeight,
      width: '100%',
      borderRadius: '14px',
      border: `1px solid ${S.border}`,
      background: 'linear-gradient(135deg, #102610 0%, #1A2E1A 52%, #2D4A2D 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '18px',
      boxSizing: 'border-box',
      color: S.textSecondary,
      fontSize: '12px',
      fontWeight: 800,
      letterSpacing: '0.08em',
      lineHeight: 1.4,
      textTransform: 'uppercase',
      textAlign: 'center',
    }}>
      {label}
    </div>
  )
}

export const eyebrowStyle = {
  margin: '0 0 14px 0',
  color: S.gold,
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

export const primaryButtonStyle = {
  display: 'inline-flex',
  minHeight: '54px',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 24px',
  borderRadius: '12px',
  backgroundColor: S.gold,
  color: S.bg,
  fontSize: '16px',
  fontWeight: 800,
  textDecoration: 'none',
  boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
}
