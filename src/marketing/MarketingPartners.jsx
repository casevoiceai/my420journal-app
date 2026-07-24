import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

const howItWorks = [
  'The customer logs what they tried, the dose, the method, and how it affected their body, mind, and mood. Everything stays on their own device. No account is required, and there is no server storage of their personal entries.',
  'They can pick from five guide personalities, or a no-personality mode called S.T.O.N.E.R., depending on how they want to journal.',
  'If they choose to, they can opt in to share fully anonymized, aggregated signals into a shared pool. No individual is ever identified. Everything shared stays aggregate only.',
]

const dispensaryLayer = [
  'The free tier gives you a behavioral preview based on your own public menu. No user data is involved.',
  'Tier 1 gives you own-product intelligence: aggregate signals specific to the products you carry. It activates once 50 opted-in users are contributing data.',
  'Tier 2 gives you cross-product and competitor benchmarking, so you can see how your products compare to others in the category. It activates once 400 opted-in users are contributing data.',
  'Tier 3 gives you cultivator and brand network intelligence: aggregate insight across the full brand and cultivator network, for larger operations.',
]

const valueCase = [
  'You make better restocking decisions, because they are based on what customers actually report back, not just what sold once.',
  'Your product recommendations are grounded in real aggregate outcomes instead of guesswork or rep pitches.',
  "You understand your customer base's experience without adding a survey, a loyalty app, or any data collection burden on your staff.",
]

const whatWeAreNot = [
  "my420journal is not a loyalty program. It is not an ad platform. We do not sell or show any individual customer's data, ever. Everything stays aggregate and opt-in only.",
  'It does not replace your point-of-sale or inventory system. It adds insight on top of what you already do.',
]

export default function MarketingPartners() {
  return (
    <MarketingLayout>
      <section className="marketing-section marketing-section-bg-base">
        <style>{partnersPageStyles}</style>
        <div className="marketing-section-inner partners-page-shell">
          <header className="partners-page-hero">
            <p className="partners-page-subtitle">
              A guide for dispensary partners
            </p>
            <h1 className="partners-page-title">
              How my420journal Works With Your Dispensary
            </h1>
            <div className="partners-page-intro">
              <p>
                my420journal gives your customers a private way to track what actually works for them, and it gives you anonymized, aggregate insight into what's working across your customer base, without ever seeing one individual's data.
              </p>
              <p>
                You sell a product once. What happens after your customer walks out the door is usually a blank spot. Did it work for them? Would they buy it again? Right now the only way you find out is if they come back and tell you, or they don't come back and you never know why.
              </p>
            </div>
          </header>

          <PartnersSection title="HOW MY420JOURNAL WORKS" paragraphs={howItWorks} />
          <PartnersSection title="WHAT THE DISPENSARY LAYER ADDS" paragraphs={dispensaryLayer} cards />
          <PartnersSection title="THE VALUE CASE" paragraphs={valueCase} />
          <PartnersSection title="WHAT WE ARE NOT" paragraphs={whatWeAreNot} />

          <section className="partners-page-section partners-page-getting-started">
            <h2>GETTING STARTED</h2>
            <div>
              <p>
                Let's have a short conversation about giving my420journal a look. Consider an early, full-access pilot, so we can learn together what's most useful to see before any tier or pricing commitment.
              </p>
              <a className="partners-page-action" href="/#contact">
                Talk with us about a pilot
              </a>
            </div>
          </section>

          <section className="partners-page-section partners-page-contact">
            <h2>Get in touch.</h2>
            <div>
              <p>
                If you own or operate a dispensary and want to learn how my420journal could work with your menu, your customers, and your existing systems, tell us a little about your dispensary and what you would most like to understand. We will follow up to discuss partnership and pilot options.
              </p>
              <a className="partners-page-action" href="/#contact">
                Contact us about your dispensary
              </a>
            </div>
          </section>
        </div>
      </section>
    </MarketingLayout>
  )
}

function PartnersSection({ title, paragraphs, cards = false }) {
  return (
    <section className="partners-page-section">
      <h2>{title}</h2>
      <div className={cards ? 'partners-page-card-grid' : 'partners-page-copy'}>
        {paragraphs.map((paragraph) => (
          cards
            ? <article key={paragraph} className="partners-page-card"><p>{paragraph}</p></article>
            : <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}

const partnersPageStyles = `
  .partners-page-shell {
    width: 100%;
    max-width: ${marketingPage.maxWidth};
  }

  .partners-page-hero {
    max-width: 920px;
    margin: 0 auto;
    padding: 8px 0 64px;
    text-align: center;
  }

  .partners-page-subtitle {
    margin: 0 0 18px;
    color: ${S.gold};
    font-family: ${marketingFonts.inter};
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.14em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .partners-page-title {
    margin: 0;
    color: ${S.textPrimary};
    font-family: ${marketingFonts.playfair};
    font-size: clamp(42px, 7vw, 76px);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1;
  }

  .partners-page-intro {
    max-width: 800px;
    margin: 34px auto 0;
  }

  .partners-page-intro p {
    margin: 0 0 22px;
    color: ${S.textSecondary};
    font-family: ${marketingFonts.inter};
    font-size: clamp(17px, 2.2vw, 20px);
    line-height: 1.75;
  }

  .partners-page-intro p:last-child {
    margin-bottom: 0;
  }

  .partners-page-section {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding: 56px 0;
    border-top: 1px solid ${S.border};
  }

  .partners-page-section h2 {
    margin: 0;
    color: ${S.textPrimary};
    font-family: ${marketingFonts.playfair};
    font-size: clamp(30px, 5vw, 46px);
    letter-spacing: -0.025em;
    line-height: 1.08;
  }

  .partners-page-copy,
  .partners-page-card-grid {
    min-width: 0;
  }

  .partners-page-copy p,
  .partners-page-card p,
  .partners-page-getting-started p,
  .partners-page-contact p {
    margin: 0 0 24px;
    color: ${S.textSecondary};
    font-family: ${marketingFonts.inter};
    font-size: 17px;
    line-height: 1.82;
  }

  .partners-page-copy p:last-child,
  .partners-page-card p:last-child,
  .partners-page-getting-started p:last-of-type,
  .partners-page-contact p:last-of-type {
    margin-bottom: 0;
  }

  .partners-page-card-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .partners-page-card {
    padding: 22px;
    border: 1px solid ${S.border};
    border-radius: ${marketingPage.radius};
    background: ${S.surface};
    box-sizing: border-box;
  }

  .partners-page-getting-started {
    padding-bottom: 56px;
  }

  .partners-page-contact {
    padding-bottom: 16px;
  }

  .partners-page-action {
    display: inline-flex;
    width: fit-content;
    min-height: 50px;
    align-items: center;
    justify-content: center;
    margin-top: 28px;
    padding: 0 24px;
    border: 1px solid ${S.gold};
    border-radius: 9999px;
    background: ${S.gold};
    color: ${S.bg};
    font-family: ${marketingFonts.inter};
    font-size: 15px;
    font-weight: 800;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
  }

  .partners-page-action:hover {
    filter: brightness(1.08);
  }

  .partners-page-action:focus-visible {
    outline: 3px solid ${S.textPrimary};
    outline-offset: 4px;
  }

  @media (min-width: 860px) {
    .partners-page-section {
      grid-template-columns: minmax(260px, 0.42fr) minmax(0, 1fr);
      gap: 72px;
      padding: 72px 0;
      align-items: start;
    }

    .partners-page-card-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .partners-page-copy p,
    .partners-page-card p,
    .partners-page-getting-started p,
    .partners-page-contact p {
      font-size: 18px;
      line-height: 1.9;
    }

    .partners-page-getting-started {
      padding-bottom: 72px;
    }

    .partners-page-contact {
      padding-bottom: 28px;
    }
  }
`
