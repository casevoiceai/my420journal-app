import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const faqs = [
  {
    question: 'Is My420Journal free?',
    answer: 'The private journal is currently planned as a free consumer product. My420Journal is still in limited private testing, so public availability and future optional services are not yet being promised here.',
  },
  {
    question: 'Who can see my private journal?',
    answer: 'The private journal is designed to stay on your device. Vogtcom, dispensaries, cannabis brands, and partners do not receive access to your raw private journal or private notes through the private journal system.',
  },
  {
    question: 'Is Shared Journey available?',
    answer: 'No. Shared Journey / Layer 2 is turned off while its privacy architecture is redesigned and reviewed. New shared contributions are blocked in the current build.',
  },
  {
    question: 'Do I need to understand terpenes to use this?',
    answer: 'No. My420Journal is meant to help you record product information and your own observations. Terpene information can be part of the record when you want it, but it is not required to keep a useful journal.',
  },
  {
    question: 'Does My420Journal tell me what cannabis to buy or use?',
    answer: 'No. My420Journal is a personal record, not a cannabis recommendation, medical treatment, or purchasing service. It helps you look back at information and observations you recorded yourself.',
  },
  {
    question: 'Is cannabis legal where I live?',
    answer: 'Cannabis laws and program rules vary by country, state, activity, and use case. My420Journal does not treat access to the journal as proof that cannabis activity is lawful. Users are responsible for following the rules that apply where they are.',
  },
  {
    question: 'How is my journal stored?',
    answer: 'The current private-testing build stores journal data in browser local storage on the device. Browser or device actions can clear that storage, and local-first storage does not make data immune from someone who has access to the device.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No name, email address, or password is required for the private journal. My420Journal creates an anonymous local profile ID on the device so your entries and settings stay linked together. That local profile is not a cloud account and does not sync across devices.',
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
        style={{ maxWidth: marketingPage.contentWidth }}
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
          Clear answers about privacy, storage, legality, and the current private-testing build.
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
