const S = {
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
}

const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

function EffectRow({ label, percent, count }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center' }}>
      <span style={{ fontFamily: fontInter, fontSize: '14px', color: S.textPrimary }}>{label}</span>
      <span style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, whiteSpace: 'nowrap' }}>
        {Math.round(percent)}%{Number.isFinite(count) ? ` (${count})` : ''}
      </span>
    </div>
  )
}

export default function AggregateSignalCard({ aggregate }) {
  if (!aggregate) return null

  const suppressed = aggregate.suppressed || aggregate.minimum_pool_met === false
  const effects = Array.isArray(aggregate.effects) ? aggregate.effects : []
  const approximate = aggregate.distinct_contributor_count_is_approximate === true

  return (
    <div style={{
      backgroundColor: S.surface,
      border: `1px solid ${S.border}`,
      borderRadius: '12px',
      padding: '18px',
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
        Shared product signal
      </p>

      <h2 style={{
        fontFamily: fontPlayfair,
        fontSize: '24px',
        color: S.textPrimary,
        margin: '0 0 8px 0',
        lineHeight: 1.2,
      }}>
        {aggregate.product_name || aggregate.product_key || 'Unknown product'}
      </h2>

      {suppressed ? (
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, lineHeight: 1.6, margin: 0 }}>
          Not enough opted-in contributors yet to show a shared signal for this product.
        </p>
      ) : (
        <>
          {Number(aggregate.sample_size) > 0 && (
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: '0 0 14px 0' }}>
              Based on {approximate ? 'approximately ' : ''}{aggregate.sample_size} opted-in contributors.
            </p>
          )}
          {effects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {effects.map((effect) => (
                <EffectRow
                  key={effect.label}
                  label={effect.label}
                  percent={effect.percent}
                  count={effect.count}
                />
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, lineHeight: 1.6, margin: 0 }}>
              No aggregate effects are available for this product yet.
            </p>
          )}
        </>
      )}
    </div>
  )
}
