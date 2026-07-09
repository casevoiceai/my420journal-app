const S = {
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
}

const fontInter = "'Inter', sans-serif"

export default function MinimumPoolNotice({ minimum = 10, regionMinimum = 25, compact = false }) {
  return (
    <div style={{
      backgroundColor: S.surface,
      border: `1px solid ${S.border}`,
      borderRadius: '12px',
      padding: compact ? '14px' : '18px',
    }}>
      <p style={{
        fontFamily: fontInter,
        fontSize: '12px',
        fontWeight: '700',
        color: S.gold,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin: '0 0 8px 0',
      }}>
        Privacy threshold
      </p>
      <p style={{
        fontFamily: fontInter,
        fontSize: compact ? '13px' : '14px',
        color: S.textPrimary,
        lineHeight: 1.6,
        margin: 0,
      }}>
        Shared signals stay hidden until at least {minimum} opted-in contributors have logged the same product.
        Product-plus-region signals need at least {regionMinimum} opted-in contributors. Product-plus-dispensary signals are not shown in v1.
      </p>
      <p style={{
        fontFamily: fontInter,
        fontSize: '13px',
        color: S.textSecondary,
        lineHeight: 1.5,
        margin: '8px 0 0 0',
      }}>
        This prevents one or two people from being exposed by implication.
      </p>
    </div>
  )
}
