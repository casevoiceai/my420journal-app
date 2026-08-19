import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const faqs = [
  {
    question: 'Is this actually free?',
    answer: 'Yes. No subscription, no freemium tier, no moment where the features you actually need cost extra. The app is free. It stays free. Revenue comes from dispensary partnerships, not from you.',
  },
  {
    question: 'Who can see my journal?',
    answer: 'Your private journal entries stay on your device. If you choose to turn on Shared Journey View, a limited contribution can be held briefly under a random contributor identifier before it is folded into aggregate counts. Dispensaries do not receive your individual journal entries. See the Privacy Policy for the full Shared Journey data flow and deletion rules.',
  },
  {
    question: 'Do I need to know anything about terpenes to use this?',
    answer: 'No. Log what you felt in your own words. Your guide can help you look back at patterns in your own entries. You do not need to know the science to benefit from keeping a useful record.',
  },
  {
    question: 'Is this legal where I live?',
    answer: 'Cannabis laws vary by jurisdiction. my420journal does not sell cannabis or facilitate cannabis purchases. You are responsible for knowing and following the laws that apply where you live and use the app.',
  },
  {
    question: "What is the guide's name?",
    answer: 'There are five guide personalities. You choose the voice that fits how you want to journal, and you can switch guides later.',
  },
  {
    question: 'How is my data stored?',
    answer: 'Your private journal entries are stored locally on your device. Optional features can have separate data flows, including Shared Journey View, so the Privacy Policy is the controlling description of what leaves your device and when.',
  },
  {
    question: 'Can I switch guides after I choose one?',
    answer: 'Yes. Your default guide is the one the app opens to, but all five are accessible any time with one tap. Your journal data is the same regardless of which guide you are using. Only the voice changes.',
  },
]

export function FAQSection({ id = undefined, tone = 'base' }) {
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
        <h1 style={{
          margin: '0 0 18px 0',
          color: S.textPrimary,
          fontFamily: marketingFonts.playfair,
          fontSize: 'clamp(40px, 7vw, 68px)',
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
        }}>
          FAQs
        </h1>
        <p style={{
          margin: '0 0 34px 0',
          color: S.textSecondary,
          fontSize: '17px',
          lineHeight: 1.7,
        }}>
          Clear answers about privacy, storage, legal boundaries, guides, and how the app works.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((item) => (
            <article
              key={item.question}
              style={{
                backgroundColor: cardBackground,
                border: `1px solid ${S.border}`,
                borderRadius: marketingPage.radius,
                padding: '22px',
                boxSizing: 'border-box',
              }}
            >
              <h2 style={{
                margin: '0 0 10px 0',
                color: S.textPrimary,
                fontFamily: marketingFonts.playfair,
                fontSize: '24px',
                lineHeight: 1.25,
              }}>
                Q: {item.question}
              </h2>
              <p style={{
                margin: 0,
                color: S.textSecondary,
                fontSize: '16px',
                lineHeight: 1.7,
              }}>
                A: {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function MarketingFAQ() {
  return (
    <MarketingLayout>
      <FAQSection id="faq" tone="base" />
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
