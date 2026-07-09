import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const paragraphs = [
  'We built the wrong thing first.',
  [
    'The first version of the AI guide was called Hy.',
    'He knew everything.',
    'He had been watching since install.',
    'He had theories about you based on what time you completed onboarding.',
    'He had hypotheses.',
    'He had data.',
    'He wanted to share all of it, immediately, whether you asked or not.',
  ].join(' '),
  'The first time we booted him up, he said: "' + 'I have been here since install. ' + 'The evidence is you.' + '"',
  'We deleted him that afternoon.',
  [
    'Not because the idea was wrong.',
    'Because the execution was everything we were afraid of, a system that knew too much, said too much, watched too quietly.',
    'Everything surveillance looks like when it decides it is trying to help you.',
  ].join(' '),
  'So we started over. And the question we asked was simpler: what kind of person do you actually want to talk to about this?',
  [
    'Not an omniscient lab AI.',
    'Not a system running silent theories in the background.',
    'A person.',
    'Five, actually.',
    'One who helps you find the best deal.',
    'One who wants to hear about your week.',
    'One who has been around long enough to know which stories are true.',
    'One who gets genuinely excited about the chemistry.',
    'One who asks how you slept.',
  ].join(' '),
  'They are Bud, Sunny, Larry, Herb, and Mary.',
  'You meet all five when you sign up. You hire the one that fits.',
  [
    'The app remembers what Hy would have remembered.',
    'The difference is it only speaks when you ask.',
    'It only knows what you tell it.',
    'And it never, ever says it has been watching.',
  ].join(' '),
  'We are not building Hy.',
  'We built this instead. We hope it helps.',
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
