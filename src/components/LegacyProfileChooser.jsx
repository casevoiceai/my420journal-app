const S = {
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
}

export default function LegacyProfileChooser({ choices = [], onChoose }) {
  return (
    <div style={{ width: '100%', maxWidth: '440px', textAlign: 'left' }}>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '30px',
        fontWeight: '600',
        color: S.textPrimary,
        margin: '0 0 12px 0',
        lineHeight: 1.2,
      }}>
        Choose your existing journal.
      </h1>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
        color: S.textSecondary,
        lineHeight: 1.6,
        margin: '0 0 24px 0',
      }}>
        This device has more than one older local profile. Choose the journal you want to keep using. Nothing is deleted.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id)}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: `1px solid ${S.border}`,
              backgroundColor: S.surface,
              color: S.textPrimary,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span style={{ display: 'block', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
              {choice.label}
            </span>
            {choice.created_at && (
              <span style={{ display: 'block', fontSize: '12px', color: S.textSecondary }}>
                Local profile created {new Date(choice.created_at).toLocaleDateString()}
              </span>
            )}
          </button>
        ))}
      </div>

      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '12px',
        color: S.gold,
        lineHeight: 1.5,
        margin: '18px 0 0 0',
      }}>
        After you choose, the old email/password fields are removed from that local profile while its journal ID and data stay the same.
      </p>
    </div>
  )
}
