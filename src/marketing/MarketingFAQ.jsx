import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const faqs = [
  {
    question: 'Is this actually free?',
    answer: 'Yes. No subscription, no freemium tier, no moment where the features you actually need cost extra. The app is free. It stays free. Revenue comes from dispensary partnerships, not from you.',
  },
  {
    question: 'Who can see my journal?',
    answer: 'Nobody. Your entries are stored on your device. The people who built this app cannot see them. Your dispensary cannot see them. We collect anonymous behavioral signals only, aggregated, never individual, to help dispensaries understand what their customers respond to in general. Your specific entries, your specific data, and your identity are never transmitted, sold, or shared.',
  },
  {
    question: 'Do I need to know anything about terpenes to use this?',
    answer: 'No. Log what you felt in your own words. Your guide does the pattern work. If you want to learn about terpenes, Herb N. Spices is the guide for that. If you just want to remember what you liked and find it at a good price, Bud Tendar handles that. You do not need to know the science to benefit from it.',
  },
  {
    question: 'Is this legal where I live?',
    answer: 'my420journal is a journaling application. It does not sell cannabis, connect you to dispensaries, or facilitate any purchase. Using a journaling app is legal everywhere. What you journal about is governed by the laws of wherever you are. That part is yours to navigate.',
  },
  {
    question: "What is the guide's name?",
    answer: 'You will find out when you sign up. There are five of them. You choose one. It is worth the thirty seconds it takes to meet them.',
  },
  {
    question: 'How is my data stored?',
    answer: 'On your device. Locally. The OCR scanning that reads your labels and receipts processes images on your device and discards them immediately after extraction. Nothing is sent to any server. This is not a policy we can change later, it is how the app is built.',
  },
  {
    question: 'Can I switch guides after I choose one?',
    answer: 'Yes. Your default guide is the one the app opens to, but all five are accessible any time with one tap. Your data is the same regardless of which guide you are talking to. Only the voice changes.',
  },
  {
    question: 'What are the games?',
    answer: 'There are three text-based games built into the app. They are narrated by your chosen guide and use your real logged data in ways that will make sense when you play them. They are the reason to open the app on days you are not logging anything.',
  },
]

export default function MarketingFAQ() {
  return (
    <MarketingLayout>
      <section style={{
        maxWidth: marketingPage.contentWidth,
        margin: '0 auto',
        padding: '64px 20px 78px',
        boxSizing: 'border-box',
      }}>
        <h1 style={{
          margin: '0 0 28px 0',
          color: S.textPrimary,
          fontFamily: marketingFonts.playfair,
          fontSize: 'clamp(40px, 7vw, 68px)',
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
        }}>
          FAQs
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((item) => (
            <article
              key={item.question}
              style={{
                backgroundColor: S.surface,
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
      </section>
    </MarketingLayout>
  )
}
