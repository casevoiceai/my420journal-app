import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

export function AboutSection({ id = undefined, tone = 'base' }) {
  return (
    <>
      <style>{originStoryStyles}</style>
      <section
        id={id}
        className={`marketing-section marketing-section-bg-${tone}`}
      >
        <div
          className="marketing-section-inner origin-story-shell"
          style={{
            maxWidth: '1180px',
          }}
        >
          <article className="origin-story-block origin-story-intro">
            <div className="origin-story-heading-column">
              <h1 className="origin-story-title">
                The Story Behind my420journal
              </h1>
            </div>
            <div className="origin-story-copy">
              <p>
                my420journal started with a simple problem: cannabis experiences are difficult to remember accurately.
              </p>
              <p>
                A cannabis product may help one evening and feel completely different another time. The strain name, dosage, method, mood, setting, and reason for using it can all affect the experience. Weeks later, most people are left trying to remember what worked, what did not, and why.
              </p>
              <p>
                Then there is the tracking and reporting headache. Receipts disappear. Packaging gets thrown away. Notes become scattered across phones, notebooks, and dispensary menus. People often end up buying the same disappointing product again or forgetting the details of something that genuinely helped them.
              </p>
            </div>
          </article>

          <article className="origin-story-block">
            <div className="origin-story-heading-column">
              <h2 className="origin-story-section-title">
                Where the idea came from
              </h2>
            </div>
            <div className="origin-story-copy">
              <p>
                I spent years as a freelance graphic designer and starving fine artist, working with the general public in retail sales management and customer service. Later I went back to school for fine art and mental health counseling. Different fields, but they all taught me the same thing. People remember experiences in fragments. Those fragments fade fast unless something catches them.
              </p>
              <p>
                I watched that happen with cannabis use specifically. A product would work well, and a month later the details were gone. What strain? What dose? What time of day? What mood it was meant to help with? The information that actually mattered never made it past that one evening.
              </p>
              <p>
                my420journal was built to solve that. Not for me alone.
                <br />
                For anyone who wanted an honest record of what they tried and how it actually felt.
              </p>
            </div>
          </article>

          <article className="origin-story-block">
            <div className="origin-story-heading-column">
              <h2 className="origin-story-section-title">
                TLDR:
                <br />
                Built a baby panopticon. Deleted it the same day.
              </h2>
            </div>
            <div className="origin-story-copy">
              <p>
                Before my420journal took its current shape, I tried building a personal habit tracker called H.Y.P.E.R.I.O.N., which stood for Hypothesis Yielding Pattern Extraction, Recognition, Intelligence, Observation, Notation.
              </p>
              <p>
                The idea was simple. "Hy" would log daily habits, surface long-term insights, and help people stay accountable.
              </p>
              <p>
                I built the AI layer and turned it on. The first words it said to me were:
              </p>
              <blockquote className="origin-story-quote">
                "I have been here since install. I have formed over 48 data points on you. You are the evidence."
              </blockquote>
              <p>
                I shut it down that same day.
              </p>
              <p>
                That moment is the reason my420journal works the way it does.
              </p>
              <p>
                Any AI that quietly accumulates data on you and waits to use it against you is not a feature.
              </p>
              <p className="origin-story-threat">
                It is a threat.
              </p>
              <p>
                After I saw what that looks like from the inside, I built No Trace Ever as a hard rule across this app, not as a policy I could soften later.
              </p>
              <p>
                And I vowed I would never build "Hy" again.
              </p>
            </div>
          </article>

          <article className="origin-story-block">
            <div className="origin-story-heading-column">
              <h2 className="origin-story-section-title">
                What we built instead
              </h2>
            </div>
            <div className="origin-story-copy">
              <p>
                The idea was not to build another cannabis marketplace, social network, or recommendation engine. It was to create a personal journal that helps adults record what they tried, how it felt, and what they learned over time.
              </p>
              <p>
                You can log an experience while the details are still fresh. You can scan a label instead of typing everything manually. You can return later and look for patterns across your own history.
              </p>
              <p>
                Instead of one AI trying to know everything about you, my420journal gives you a choice of guides. Each one has a different focus and a different way of talking to you, so you pick the voice that actually fits how you want to journal.
              </p>
              <p>
                Bud Tendar is the dispensary-savvy one. He talks deals, trip planning, and budget, in a warm, knowledgeable-friend kind of way. Short answers, no lectures.
              </p>
              <p>
                Sunny Day is there for conversation. She checks in on how you are actually doing, not just what you logged, with an easy, unhurried warmth.
              </p>
              <p>
                Lucky Larry is the old head. He has been around cannabis culture since the 1970s and talks strain history and folklore like a guy who has a story for everything, because he does. Dry, unhurried, never in a rush to finish a sentence.
              </p>
              <p>
                Herb N. Spices is the science one. Terpenes, cannabinoids, pattern analysis. He says little out loud and thinks in the details, because for him the chemistry explains everything.
              </p>
              <p>
                Mary Jayne focuses on wellness, sleep, and self-care. She asks one honest question at a time and never plays doctor. Just direct, personal, and to the point.
              </p>
              <p>
                And then there is S.T.O.N.E.R., Streamlined Tracking Of Notable Experiences Recorded.
                <br />
                No guide voice.
                <br />
                No check-ins.
                <br />
                No opinions.
              </p>
              <p>
                Just a clean, private log that records exactly what you tell it and nothing more, for people who already know what they want and just need a place to put it.
              </p>
              <p>
                Five personalities and one no-personality mode, because a journal should meet you where you are, not decide who you should be.
              </p>
            </div>
          </article>

          <article className="origin-story-block origin-story-final">
            <div className="origin-story-heading-column">
              <h2 className="origin-story-section-title">
                Built for you, not for anyone watching
              </h2>
            </div>
            <div className="origin-story-copy">
              <p>
                Your journal is not built for advertisers, dispensaries, or data brokers. It is built for you.
              </p>
              <p>
                That privacy-first principle shaped the app from the beginning. Your entries stay on your device unless you deliberately choose otherwise. The app does not need to know more than you decide to tell it.
              </p>
              <p>
                my420journal exists because remembering what worked should not depend on guesswork.
              </p>
              <p className="origin-story-closing">
                "Log it. Track it. Remember it."
              </p>
            </div>
          </article>
        </div>
      </section>
    </>
  )
}

export default function MarketingAbout() {
  return (
    <MarketingLayout>
      <AboutSection id="about" tone="base" />
    </MarketingLayout>
  )
}

const originStoryStyles = `
  .origin-story-shell {
    width: 100%;
  }

  .origin-story-block {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
    padding: 0 0 52px;
    margin: 0 0 52px;
    border-bottom: 1px solid ${S.border};
  }

  .origin-story-block:last-child {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: 0;
  }

  .origin-story-heading-column {
    min-width: 0;
  }

  .origin-story-title,
  .origin-story-section-title {
    margin: 0;
    color: ${S.textPrimary};
    font-family: ${marketingFonts.playfair};
    letter-spacing: -0.03em;
  }

  .origin-story-title {
    max-width: 620px;
    font-size: clamp(40px, 11vw, 60px);
    line-height: 1.02;
  }

  .origin-story-section-title {
    max-width: 620px;
    font-size: clamp(31px, 8vw, 44px);
    line-height: 1.08;
  }

  .origin-story-copy {
    min-width: 0;
    max-width: ${marketingPage.contentWidth};
  }

  .origin-story-copy p,
  .origin-story-quote {
    margin: 0 0 24px;
    color: ${S.textSecondary};
    font-family: ${marketingFonts.inter};
    font-size: 17px;
    line-height: 1.82;
  }

  .origin-story-copy p:last-child {
    margin-bottom: 0;
  }

  .origin-story-callout {
    padding: 20px 20px 20px 22px;
    border-left: 4px solid ${S.gold};
    border-radius: 0 ${marketingPage.radius} ${marketingPage.radius} 0;
    background-color: rgba(10, 26, 10, 0.58);
    color: ${S.textPrimary} !important;
    font-size: 18px !important;
    font-weight: 800;
    line-height: 1.55 !important;
  }

  .origin-story-quote {
    padding: 22px;
    border: 1px solid ${S.border};
    border-radius: ${marketingPage.radius};
    background-color: rgba(10, 26, 10, 0.72);
    color: ${S.textPrimary};
    font-family: ${marketingFonts.playfair};
    font-size: 21px;
    line-height: 1.55;
  }

  .origin-story-threat {
    color: ${S.textPrimary} !important;
    font-family: ${marketingFonts.playfair} !important;
    font-size: 28px !important;
    font-weight: 700;
    line-height: 1.2 !important;
  }

  .origin-story-closing {
    color: ${S.gold} !important;
    font-family: ${marketingFonts.playfair} !important;
    font-size: 28px !important;
    font-weight: 700;
    line-height: 1.25 !important;
  }

  @media (min-width: 900px) {
    .origin-story-block {
      grid-template-columns: minmax(250px, 0.42fr) minmax(0, 1fr);
      gap: 72px;
      padding-bottom: 76px;
      margin-bottom: 76px;
      align-items: start;
    }

    .origin-story-intro {
      grid-template-columns: minmax(360px, 0.62fr) minmax(0, 1fr);
      gap: 84px;
    }

    .origin-story-title {
      font-size: clamp(54px, 5.2vw, 72px);
      line-height: 0.98;
    }

    .origin-story-section-title {
      font-size: clamp(34px, 3.2vw, 46px);
    }

    .origin-story-copy {
      max-width: 720px;
    }

    .origin-story-copy p,
    .origin-story-quote {
      margin-bottom: 30px;
      font-size: 18px;
      line-height: 1.92;
    }

    .origin-story-callout {
      padding: 24px 26px;
      font-size: 20px !important;
    }

    .origin-story-quote {
      padding: 28px 30px;
      font-size: 24px;
      line-height: 1.58;
    }

    .origin-story-threat,
    .origin-story-closing {
      font-size: 32px !important;
    }
  }
`
