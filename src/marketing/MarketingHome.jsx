import { Link } from 'react-router-dom'
import MarketingLayout from './MarketingLayout'
import { AboutSection } from './MarketingAbout'
import { FAQSection } from './MarketingFAQ'
import { ContactSection } from './MarketingContact'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const processSteps = [
  {
    step: 'Step 1',
    title: 'Log what happened.',
    body: 'Capture what you tried and how it felt before the memory gets blurry.',
    placeholder: 'Log what happened.',
  },
  {
    step: 'Step 2',
    title: 'App preview coming soon.',
    body: 'A proper screenshot or mockup will be prepared separately. For now, this stays as a clean placeholder.',
    placeholder: 'App preview coming soon',
  },
  {
    step: 'Step 3',
    title: "See what you've learned about yourself.",
    body: 'Come back to patterns instead of starting from scratch every time.',
    placeholder: "See what you've learned about yourself.",
  },
]

const featureCards = [
  'Scan any label',
  'Log by voice',
  'Nothing stored without your choice',
  'Leave instantly, anytime.',
]

export default function MarketingHome() {
  return (
    <MarketingLayout>
      <HeroSection />
      <ProcessSection />
      <FeatureGrid />
      <AboutSection id="about" tone="surface" />
      <ClosingSection />
      <FAQSection id="faq" tone="surface" />
      <ContactSection id="contact" tone="base" />
    </MarketingLayout>
  )
}

function HeroSection() {
  return (
    <section
      id="home"
      className="marketing-section marketing-section-bg-base"
      style={{
        position: 'relative',
        minHeight: 'calc(100dvh - 102px)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A1A0A 0%, #1A2E1A 55%, #2D4A2D 100%)',
        color: 'rgba(232,240,232,0.28)',
        fontSize: '13px',
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        textAlign: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}>
        Hero photo placeholder
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(10,26,10,0.64)',
      }} />

      <div
        className="marketing-section-inner"
        style={{
          position: 'relative',
          maxWidth: marketingPage.maxWidth,
          minHeight: 'calc(100dvh - 102px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <h1 style={{
            margin: '0 0 22px 0',
            color: S.textPrimary,
            fontFamily: marketingFonts.playfair,
            fontSize: 'clamp(44px, 8vw, 86px)',
            lineHeight: 0.98,
            letterSpacing: '-0.04em',
            fontWeight: 700,
          }}>
            The part of you that doesn't forget.
          </h1>
          <p style={{
            margin: '0 0 34px 0',
            color: S.textPrimary,
            fontSize: 'clamp(18px, 3vw, 24px)',
            lineHeight: 1.5,
            maxWidth: '780px',
            textShadow: '0 2px 18px rgba(0,0,0,0.34)',
          }}>
            We built the wrong thing first. It knew too much and said too much and watched too quietly. We deleted it. Then we built five people instead. You hire the one that fits.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}>
            <Link
              to="/app"
              style={primaryButtonStyle}
            >
              Start your research
            </Link>
            <a
              href="#process"
              style={{
                color: S.textPrimary,
                fontSize: '15px',
                fontWeight: 800,
                textDecoration: 'none',
                borderBottom: `1px solid ${S.gold}`,
                paddingBottom: '4px',
              }}
            >
              Learn how it works below
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProcessSection() {
  return (
    <section
      id="process"
      className="marketing-section marketing-section-bg-surface"
    >
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: marketingPage.maxWidth,
        }}
      >
        <SectionHeader
          eyebrow="The Process"
          title="Three steps, one private record."
          body="The structure stays simple. Log the moment, let the app keep track, and return to what your own history has already taught you."
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px',
          alignItems: 'stretch',
        }}>
          {processSteps.map((item) => (
            <article
              key={item.step}
              style={{
                backgroundColor: S.bg,
                border: `1px solid ${S.border}`,
                borderRadius: marketingPage.radius,
                padding: '18px',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
            >
              <PlaceholderBox label={item.placeholder} minHeight="280px" />
              <p style={{
                margin: '18px 0 8px 0',
                color: S.gold,
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                {item.step}
              </p>
              <h3 style={{
                margin: '0 0 10px 0',
                color: S.textPrimary,
                fontFamily: marketingFonts.playfair,
                fontSize: '26px',
                lineHeight: 1.18,
              }}>
                {item.title}
              </h3>
              <p style={{
                margin: 0,
                color: S.textSecondary,
                fontSize: '15px',
                lineHeight: 1.65,
              }}>
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureGrid() {
  return (
    <section className="marketing-section marketing-section-bg-base">
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: marketingPage.maxWidth,
        }}
      >
        <SectionHeader
          eyebrow="Built for real use"
          title="Small actions that make the next visit easier."
          body="Every feature exists to help you remember what worked without turning your private journal into someone else's data source."
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}>
          {featureCards.map((label) => (
            <article
              key={label}
              style={{
                backgroundColor: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: marketingPage.radius,
                padding: '16px',
                boxSizing: 'border-box',
              }}
            >
              <PlaceholderBox label={label} minHeight="190px" />
              <h3 style={{
                margin: '16px 0 0 0',
                color: S.textPrimary,
                fontFamily: marketingFonts.playfair,
                fontSize: '23px',
                lineHeight: 1.2,
              }}>
                {label}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClosingSection() {
  return (
    <section className="marketing-section marketing-section-bg-base">
      <div
        className="marketing-section-inner"
        style={{
          maxWidth: marketingPage.maxWidth,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '28px',
          alignItems: 'center',
        }}
      >
        <PlaceholderBox label="Private record placeholder" minHeight="320px" />
        <p style={{
          margin: 0,
          color: S.textPrimary,
          fontFamily: marketingFonts.playfair,
          fontSize: 'clamp(30px, 5vw, 52px)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}>
          What you get is simple. A private record of what actually worked, ready whenever you need to remember it.
        </p>
      </div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, body }) {
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

function PlaceholderBox({ label, minHeight }) {
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

const eyebrowStyle = {
  margin: '0 0 14px 0',
  color: S.gold,
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const primaryButtonStyle = {
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
