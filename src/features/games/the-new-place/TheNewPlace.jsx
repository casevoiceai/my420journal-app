import { useEffect, useState } from 'react'
import { isDevMode } from '../../../lib/dev'
import {
  FICTIONAL_PRODUCTS,
  THE_NEW_PLACE_DAYS,
  advanceTheNewPlaceRun,
  createTheNewPlaceRun,
  getTheNewPlaceActions,
} from './theNewPlaceEngine.js'
import {
  readTheNewPlaceLocalContext,
  saveTheNewPlaceActiveRun,
  saveTheNewPlaceCompletion,
} from './theNewPlaceLocalDataAdapter.js'
import {
  readSelectedTheNewPlaceGuide,
  theNewPlaceGuideLine,
  theNewPlaceGuideMoment,
} from './theNewPlaceGuide.js'

const S = Object.freeze({
  bg: '#0A1A0A',
  panel: '#122412',
  panelStrong: '#1A2E1A',
  border: '#2D4A2D',
  text: '#E8F0E8',
  muted: '#9BB59B',
  gold: '#C9A84C',
})

const font = "'Inter', sans-serif"

function createWeekSeed() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `new-place-${crypto.randomUUID()}`
  }
  return `new-place-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function reportConsistency(run) {
  return Math.max(0, 100 - (run.reportInconsistencyCount * 22))
}

function metricLabel(key) {
  return {
    funds: 'Operating credit',
    inventory: 'Inventory health',
    satisfaction: 'Satisfaction',
    compliance: 'Fictional compliance',
  }[key] || key
}

function latestNarration(run) {
  return Array.isArray(run?.narration) ? run.narration.slice(-7) : []
}

function currentDay(run) {
  return THE_NEW_PLACE_DAYS[run.dayIndex] || THE_NEW_PLACE_DAYS.at(-1)
}

function GuideBubble({ guide, moment }) {
  if (!guide) return null
  return (
    <div style={{
      padding: '14px 16px', background: S.panelStrong, borderRadius: '4px 16px 16px 16px',
      borderLeft: `4px solid ${guide.accent}`, maxWidth: '92%',
    }}>
      <div style={{ color: guide.accent, fontFamily: font, fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
        {guide.name}
      </div>
      <div style={{ fontFamily: font, fontSize: '16px', lineHeight: 1.55 }}>
        {theNewPlaceGuideLine(guide.key, moment)}
      </div>
    </div>
  )
}

function StateCard({ label, value, accent }) {
  return (
    <div style={{
      minWidth: 0, background: S.panel, border: `1px solid ${S.border}`,
      borderRadius: '14px', padding: '13px 14px',
    }}>
      <div style={{ color: S.muted, fontFamily: font, fontSize: '12px', lineHeight: 1.3 }}>{label}</div>
      <div style={{ color: accent, fontFamily: font, fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{value}</div>
    </div>
  )
}

export default function TheNewPlace() {
  const [run, setRun] = useState(null)
  const [context, setContext] = useState(null)
  const [guide, setGuide] = useState(null)
  const [guideMoment, setGuideMoment] = useState('opening')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const nextContext = await readTheNewPlaceLocalContext()
        const selectedGuide = await readSelectedTheNewPlaceGuide({
          userId: nextContext.userId,
          devMode: isDevMode(),
        })
        let nextRun = nextContext.activeRun
        if (!nextRun) {
          nextRun = createTheNewPlaceRun({
            seed: createWeekSeed(),
            personalization: nextContext.personalization,
          })
          saveTheNewPlaceActiveRun({ run: nextRun, userId: nextContext.userId })
        }
        if (cancelled) return
        setContext(nextContext)
        setGuide(selectedGuide)
        setRun(nextRun)
        setGuideMoment(nextRun.history.length ? 'decision' : 'opening')
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || 'The week could not be opened.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleAction(actionId) {
    if (!run || working) return
    setWorking(true)
    setError('')
    try {
      const previous = run
      const next = advanceTheNewPlaceRun(previous, actionId)
      setRun(next)
      setGuideMoment(theNewPlaceGuideMoment(previous, next))
      if (next.status === 'completed') {
        saveTheNewPlaceCompletion({ run: next, userId: context?.userId })
      } else {
        saveTheNewPlaceActiveRun({ run: next, userId: context?.userId })
      }
    } catch (actionError) {
      setError(actionError?.message || 'That decision could not be completed.')
    } finally {
      setWorking(false)
    }
  }

  async function startNewWeek() {
    if (working) return
    setWorking(true)
    setError('')
    try {
      const nextContext = await readTheNewPlaceLocalContext()
      const nextRun = createTheNewPlaceRun({
        seed: createWeekSeed(),
        personalization: nextContext.personalization,
      })
      saveTheNewPlaceActiveRun({ run: nextRun, userId: nextContext.userId })
      setContext(nextContext)
      setRun(nextRun)
      setGuideMoment('opening')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (newWeekError) {
      setError(newWeekError?.message || 'A new week could not be started.')
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: S.bg, color: S.text, padding: '24px' }}>
        <div style={{ fontFamily: font, fontSize: '17px' }}>Opening the store...</div>
      </main>
    )
  }

  if (!run) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: S.bg, color: S.text, padding: '24px' }}>
        <div style={{ maxWidth: '560px', fontFamily: font }}>
          <h1>The New Place</h1>
          <p>{error || 'The week could not be opened.'}</p>
        </div>
      </main>
    )
  }

  const day = currentDay(run)
  const actions = getTheNewPlaceActions(run)
  const accent = guide?.accent || S.gold
  const complete = run.status === 'completed'
  const consistency = reportConsistency(run)

  return (
    <main style={{ minHeight: '100vh', background: S.bg, color: S.text, padding: '24px 16px 56px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '18px' }}>
          <div style={{ color: accent, fontFamily: font, fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Private Phase 1 Build
          </div>
          <h1 style={{ margin: 0, fontFamily: font, fontSize: 'clamp(30px, 7vw, 44px)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
            The New Place
          </h1>
          <p style={{ margin: '8px 0 0', color: S.muted, fontFamily: font, fontSize: '15px', lineHeight: 1.55 }}>
            {run.weekDefinition.storeName}. One fictional week. Decisions carry forward. The rules, products, transactions, and inspector are fictional.
          </p>
        </header>

        {!complete && (
          <section style={{ marginBottom: '18px', padding: '15px 16px', background: S.panelStrong, border: `1px solid ${S.border}`, borderRadius: '16px' }}>
            <div style={{ color: accent, fontFamily: font, fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {day.label}
            </div>
            <div style={{ fontFamily: font, fontWeight: 800, fontSize: '23px', marginTop: '3px' }}>{day.title}</div>
            <div style={{ color: S.muted, fontFamily: font, fontSize: '13px', marginTop: '6px' }}>
              {run.phase === 'decision' ? 'Make one management decision.' : 'The day happened. Choose how the factual report frames it.'}
            </div>
          </section>
        )}

        {error && (
          <div role="alert" style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: '#331919', border: '1px solid #704040', color: '#FFD9D9', fontFamily: font }}>
            {error}
          </div>
        )}

        <section aria-label="Business state" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '9px', marginBottom: '18px' }}>
          {Object.entries(run.metrics).map(([key, value]) => (
            <StateCard key={key} label={metricLabel(key)} value={value} accent={accent} />
          ))}
          <StateCard label="Report consistency" value={consistency} accent={accent} />
        </section>

        <section aria-label="Guide and week record" style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
          {latestNarration(run).map((text, index) => (
            <div key={`${run.history.length}-${index}-${text.slice(0, 20)}`} style={{ maxWidth: '92%', padding: '12px 14px', background: S.panel, border: `1px solid ${S.border}`, borderRadius: '14px', fontFamily: font, lineHeight: 1.5 }}>
              {text}
            </div>
          ))}
          <GuideBubble guide={guide} moment={guideMoment} />
        </section>

        {run.phase === 'report' && run.currentDayResult && (
          <section style={{ marginBottom: '18px', padding: '14px 16px', background: S.panel, border: `1px solid ${S.border}`, borderRadius: '16px' }}>
            <h2 style={{ margin: '0 0 8px', fontFamily: font, fontSize: '18px' }}>Today&apos;s fixed facts</h2>
            <div style={{ color: S.muted, fontFamily: font, lineHeight: 1.55, fontSize: '14px' }}>
              Requested fictional units: {run.currentDayResult.requested}. Fulfilled: {run.currentDayResult.fulfilled}. Restocked: {run.currentDayResult.restockedUnits}. These facts do not change when you choose a Digilog framing.
            </div>
          </section>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '15px', background: S.panel, border: `1px solid ${S.border}`, borderRadius: '16px' }}>
            <h2 style={{ margin: '0 0 10px', fontFamily: font, fontSize: '18px' }}>Fictional inventory</h2>
            <div style={{ display: 'grid', gap: '8px' }}>
              {FICTIONAL_PRODUCTS.map((product) => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderBottom: `1px solid ${S.border}`, paddingBottom: '7px' }}>
                  <span style={{ fontFamily: font, fontSize: '14px' }}>{product.name}</span>
                  <span style={{ color: accent, fontFamily: font, fontWeight: 800 }}>{run.inventory[product.id]}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '15px', background: S.panel, border: `1px solid ${S.border}`, borderRadius: '16px' }}>
            <h2 style={{ margin: '0 0 10px', fontFamily: font, fontSize: '18px' }}>Week record</h2>
            <div style={{ color: S.muted, fontFamily: font, fontSize: '14px', lineHeight: 1.6 }}>
              Reports filed: {run.reportHistory.length} of 7.<br />
              Report mismatches: {run.reportInconsistencyCount}.<br />
              Inspector: {run.inspector ? `${run.inspector.outcome} (${run.inspector.focusId})` : 'not yet'}.
            </div>
          </div>
        </section>

        {!complete && (
          <section aria-label="Available decisions">
            <h2 style={{ margin: '0 0 10px', color: S.muted, fontFamily: font, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {run.phase === 'report' ? 'Digilog Picker' : 'Choose one'}
            </h2>
            <div style={{ display: 'grid', gap: '9px' }}>
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={working}
                  onClick={() => handleAction(action.id)}
                  style={{ minHeight: '50px', padding: '12px 14px', textAlign: 'left', borderRadius: '12px', border: `1px solid ${run.phase === 'report' ? accent : S.border}`, background: S.panelStrong, color: S.text, fontFamily: font, fontSize: '15px', lineHeight: 1.4, cursor: working ? 'default' : 'pointer', opacity: working ? 0.55 : 1 }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {complete && run.finalSummary && (
          <section aria-live="polite" style={{ padding: '18px', background: S.panelStrong, border: `1px solid ${accent}80`, borderRadius: '16px' }}>
            <div style={{ color: accent, fontFamily: font, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sunday summary</div>
            <h2 style={{ margin: '6px 0 10px', fontFamily: font, fontSize: '25px' }}>
              {run.finalSummary.outcomeId === 'improved-week' ? 'The place improved.' : run.finalSummary.outcomeId === 'stable-week' ? 'The place held steady.' : 'The place survived a hard week.'}
            </h2>
            <p style={{ margin: '0 0 14px', color: S.muted, fontFamily: font, lineHeight: 1.55 }}>
              Final score: {run.finalSummary.average}. Inspector result: {run.finalSummary.inspectorOutcome}. The outcome came from the stored week state, not from narration.
            </p>
            <button type="button" disabled={working} onClick={startNewWeek} style={{ width: '100%', minHeight: '50px', borderRadius: '12px', border: `1px solid ${accent}`, background: `${accent}22`, color: S.text, fontFamily: font, fontSize: '16px', fontWeight: 800, cursor: working ? 'default' : 'pointer' }}>
              Start a new week
            </button>
          </section>
        )}

        <footer style={{ marginTop: '28px', paddingTop: '16px', borderTop: `1px solid ${S.border}`, color: S.muted, fontFamily: font, fontSize: '12px', lineHeight: 1.55 }}>
          The New Place is fictional entertainment. It does not represent real dispensary operations, regulations, prices, products, medical outcomes, purchasing advice, legal advice, or regulatory guidance.
        </footer>
      </div>
    </main>
  )
}
