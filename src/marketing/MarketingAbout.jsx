import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const paragraphs = [
  'Most people who use cannabis have no reliable way to remember what worked for them. They rely on faded memory, a receipt they cannot find, or whoever happens to be behind the dispensary counter that day, a person with a completely different biology, tolerance, and neurochemistry than they have. Taking their advice is like asking a stranger what your favorite color should be.',
  'The result is repeated bad purchases, inconsistent experiences, and zero improvement over time. Every visit to the dispensary is a fresh guess. An expensive one.',
  'my420journal is the system that was missing. You log what you tried and how it went. Your guide tracks the patterns you are too busy living to notice, what you liked, what you kept coming back to, what you tried twice and will not try again. Over time you stop guessing. That is the whole product.',
  'The app is free. Your data is stored on your device and nowhere else. The people who built this cannot read your journal. Your dispensary cannot read it. Nobody can.',
  'There are five guides. Each one has a name and a personality and a specific layer of the app they unlock. You meet all of them when you sign up and you hire the one that fits how you want to work. By the time you have logged a few sessions, your guide knows more about your preferences than most dispensary employees ever will.',
  'This was built because we needed it. If you have ever walked out of a dispensary trying to remember what you bought last time and whether it was worth buying again, this was built for you.',
]

export function AboutSection({ id = undefined, tone = 'base' }) {
  const cardBackground = tone === 'surface' ? S.bg : S.surface

  return (
    <section
      id={id}
      className={`marketing-section marketing-section-bg-${tone}`}
    >
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: marketingPage.contentWidth,
        }}
      >
        <p style={eyebrowStyle}>About</p>
        <h1 style={{
          margin: '0 0 28px 0',
          color: S.textPrimary,
          fontFamily: marketingFonts.playfair,
          fontSize: 'clamp(40px, 7vw, 68px)',
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
        }}>
          Why this exists.
        </h1>

        <div style={{
          backgroundColor: cardBackground,
          border: `1px solid ${S.border}`,
          borderRadius: marketingPage.radius,
          padding: '28px',
          boxSizing: 'border-box',
        }}>
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              style={{
                margin: '0 0 20px 0',
                color: S.textSecondary,
                fontSize: '17px',
                lineHeight: 1.75,
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function MarketingAbout() {
  return (
    <MarketingLayout>
      <AboutSection id="about" tone="base" />
    </MarketingLayout>
  )
}

const eyebrowStyle = {
  margin: '0 0 14px 0',
  color: S.gold,
  fontFamily: marketingFonts.inter,
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}
