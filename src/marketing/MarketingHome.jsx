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
          <BrainMark />
          <p style={eyebrowStyle}>
            Private cannabis journaling
          </p>
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

function BrainMark() {
  return (
    <div style={{
      width: '58px',
      height: '58px',
      borderRadius: '18px',
      border: `1px solid ${S.border}`,
      backgroundColor: 'rgba(10,26,10,0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '18px',
      boxShadow: '0 14px 30px rgba(0,0,0,0.28)',
    }}>
      <svg
        width="46"
        height="46"
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill={S.success}
          d="M34 9c-9.9 0-18 7.6-18 17 0 4.8 2.1 9.1 5.5 12.2 1.2 1.1 1.8 2.6 1.8 4.2v6.2c0 3.5 2.9 6.4 6.4 6.4h8.9c3.1 0 5.7-2.2 6.3-5.2l.4-2.2h4.1c2.2 0 3.9-1.8 3.9-3.9v-5.8c0-1.2.4-2.4 1.1-3.4l2.6-3.7c.8-1.2.5-2.8-.7-3.6l-3.2-2.1C51.4 14.1 43.3 9 34 9Zm-7.2 13.7c.9-3.1 3.8-5.3 7.2-5.3 3.2 0 6 2 7 4.9 2.7.4 4.9 2.6 5.4 5.3 2 .8 3.4 2.7 3.4 5 0 2.9-2.3 5.3-5.2 5.4-.9 2.4-3.2 4.2-5.9 4.2-1.8 0-3.4-.8-4.6-2-1.3 1.4-3.1 2.2-5.2 2.2-3.9 0-7.1-3.1-7.1-7 0-.9.2-1.8.5-2.6-1.6-1.3-2.6-3.2-2.6-5.4 0-3.2 2.1-5.9 5.1-6.7Zm7.2-.3c-1.9 0-3.5 1.5-3.6 3.4l-.1 1.9-1.9.1c-2 .1-3.6 1.7-3.6 3.7 0 1.5.9 2.8 2.2 3.4l1.7.8-.8 1.7c-.2.5-.4 1-.4 1.6 0 2 1.6 3.6 3.6 3.6 1.4 0 2.6-.8 3.2-2l1.8-3.4 1.7 3.4c.5 1 1.5 1.6 2.7 1.6 1.6 0 3-1.3 3.1-2.9l.1-1.9 1.9-.1c1.5 0 2.7-1.3 2.7-2.8 0-1.3-.9-2.4-2.1-2.7l-1.5-.4-.1-1.5c-.2-1.9-1.8-3.4-3.8-3.4h-1.7l-.4-1.6c-.4-1.5-1.8-2.5-3.5-2.5Z"
        />
      </svg>
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
