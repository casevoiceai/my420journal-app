import { useEffect, useState } from 'react'
import { isDevMode } from '../../../lib/dev'
import {
  advanceWhoTookMyLighterRun,
  createWhoTookMyLighterRun,
  getWhoTookMyLighterActions,
} from './whoTookMyLighterEngine.js'
import {
  readWhoTookMyLighterLocalContext,
  saveWhoTookMyLighterActiveRun,
  saveWhoTookMyLighterCompletion,
} from './whoTookMyLighterLocalDataAdapter.js'
import {
  readSelectedWhoTookMyLighterGuide,
  whoTookMyLighterGuideLine,
  whoTookMyLighterGuideMomentForRun,
} from './whoTookMyLighterGuide.js'

const S = Object.freeze({
  bg: '#0A1A0A',
  panel: '#122412',
  panelStrong: '#1A2E1A',
  border: '#2D4A2D',
  text: '#E8F0E8',
  muted: '#9BB59B',
  gold: '#C9A84C',
  danger: '#D9A3A3',
})

const font = "'Inter', sans-serif"

function createRunSeed() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `wtml-${crypto.randomUUID()}`
  }
  return `wtml-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function phaseLabel(phase) {
  const labels = {
    scene: 'Scene',
    evidence: 'Evidence',
    interrogation: 'Interrogations',
    reveal: 'Case Closed',
  }
  return labels[phase] || 'Case'
}

function actionSection(actionId) {
  if (actionId.startsWith('inspect:')) return 'Inspect evidence'
  if (actionId.startsWith('interview:') || actionId.startsWith('revisit:')) return 'Talk to suspects'
  if (actionId.startsWith('ask:')) return 'Ask questions'
  if (actionId.startsWith('present:')) return 'Present evidence'
  if (actionId.startsWith('accuse:')) return 'Make accusation'
  return 'Next step'
}

function groupActions(actions) {
  const groups = []
  for (const action of actions) {
    const label = actionSection(action.id)
    let group = groups.find((item) => item.label === label)
    if (!group) {
      group = { label, actions: [] }
      groups.push(group)
    }
    group.actions.push(action)
  }
  return groups
}

function latestNarration(run, limit = 7) {
  if (!Array.isArray(run?.narration)) return []
  return run.narration.slice(-limit)
}

function evidenceRows(run) {
  if (!run) return []
  return run.evidenceCollected
    .map((id) => run.caseDefinition.evidence.find((item) => item.id === id))
    .filter(Boolean)
}

function interviewedCount(run) {
  if (!run?.memory) return 0
  return Object.values(run.memory).filter((item) => item.interviewed).length
}

function suspectStatus(run, suspectId) {
  const memory = run?.memory?.[suspectId]
  if (!memory?.interviewed) return 'Not interviewed'
  if (memory.responseState === 'contradicted') return 'Story contradicted'
  if (memory.responseState === 'alibi-strengthened') return 'Alibi strengthened'
  if (memory.revisitCount > 0) return 'Revisited'
  return 'Interviewed'
}

function StatusChip({ children, accent }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', minHeight: '30px',
      padding: '5px 10px', borderRadius: '999px',
      border: `1px solid ${accent}70`, background: `${accent}16`,
      color: S.text, fontFamily: font, fontSize: '13px', lineHeight: 1.3,
    }}>
      {children}
    </span>
  )
}

function GuideBubble({ guide, moment }) {
  if (!guide) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{
        maxWidth: '92%', padding: '14px 16px',
        background: S.panelStrong, borderRadius: '4px 16px 16px 16px',
        borderLeft: `4px solid ${guide.accent}`,
      }}>
        <div style={{
          marginBottom: '6px', color: guide.accent, fontFamily: font,
          fontWeight: 700, fontSize: '13px',
        }}>
          {guide.name}
        </div>
        <div style={{ color: S.text, fontFamily: font, fontSize: '16px', lineHeight: 1.55 }}>
          {whoTookMyLighterGuideLine(guide.key, moment)}
        </div>
      </div>
    </div>
  )
}

function CaseBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{
        maxWidth: '92%', padding: '13px 15px',
        background: '#102010', border: `1px solid ${S.border}`,
        borderRadius: '14px', color: S.text, fontFamily: font,
        fontSize: '16px', lineHeight: 1.55,
      }}>
        {text}
      </div>
    </div>
  )
}

export default function WhoTookMyLighter() {
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
        const nextContext = await readWhoTookMyLighterLocalContext()
        const selectedGuide = await readSelectedWhoTookMyLighterGuide({
          userId: nextContext.userId,
          devMode: isDevMode(),
        })
        let nextRun = nextContext.activeRun
        if (!nextRun) {
          nextRun = createWhoTookMyLighterRun({
            seed: createRunSeed(),
            personalization: nextContext.personalization,
          })
          saveWhoTookMyLighterActiveRun({
            run: nextRun,
            userId: nextContext.userId,
          })
        }
        if (cancelled) return
        setContext(nextContext)
        setGuide(selectedGuide)
        setRun(nextRun)
        setGuideMoment(nextRun.history.length > 0 ? 'interview' : 'opening')
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || 'The case could not be opened.')
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
      const next = advanceWhoTookMyLighterRun(previous, actionId)
      const moment = whoTookMyLighterGuideMomentForRun(previous, next)
      setRun(next)
      setGuideMoment(moment)

      if (next.status === 'completed') {
        saveWhoTookMyLighterCompletion({
          completionSummary: next.completionSummary,
          userId: context?.userId,
        })
      } else {
        saveWhoTookMyLighterActiveRun({
          run: next,
          userId: context?.userId,
        })
      }
    } catch (actionError) {
      setError(actionError?.message || 'That action could not be completed.')
    } finally {
      setWorking(false)
    }
  }

  async function startNewCase() {
    if (working) return
    setWorking(true)
    setError('')
    try {
      const nextContext = await readWhoTookMyLighterLocalContext()
      const nextRun = createWhoTookMyLighterRun({
        seed: createRunSeed(),
        personalization: nextContext.personalization,
      })
      saveWhoTookMyLighterActiveRun({
        run: nextRun,
        userId: nextContext.userId,
      })
      setContext(nextContext)
      setRun(nextRun)
      setGuideMoment('opening')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (newCaseError) {
      setError(newCaseError?.message || 'A new case could not be started.')
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: S.bg, color: S.text, display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div style={{ fontFamily: font, fontSize: '17px' }}>Opening case file...</div>
      </main>
    )
  }

  if (!run) {
    return (
      <main style={{ minHeight: '100vh', background: S.bg, color: S.text, display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '560px', fontFamily: font, lineHeight: 1.6 }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 12px' }}>Who Took My Lighter?</h1>
          <p style={{ color: S.danger }}>{error || 'The case could not be opened.'}</p>
        </div>
      </main>
    )
  }

  const actions = getWhoTookMyLighterActions(run)
  const actionGroups = groupActions(actions)
  const collected = evidenceRows(run)
  const accent = guide?.accent || S.gold
  const suspectIds = run.caseDefinition.activeSuspectIds
  const caseClosed = run.status === 'completed'

  return (
    <main style={{
      minHeight: '100vh', background: S.bg, color: S.text,
      padding: '24px 16px 56px', boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <header style={{ marginBottom: '18px' }}>
          <div style={{
            color: accent, fontFamily: font, fontSize: '12px', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px',
          }}>
            Private Phase 1 Build
          </div>
          <h1 style={{
            margin: 0, fontFamily: font, fontSize: 'clamp(28px, 7vw, 42px)',
            lineHeight: 1.08, letterSpacing: '-0.03em',
          }}>
            Who Took My Lighter?
          </h1>
          <p style={{
            margin: '10px 0 0', color: S.muted, fontFamily: font,
            fontSize: '15px', lineHeight: 1.55,
          }}>
            A fictional deadpan mystery. The case facts are fixed when the run begins. Your guide narrates; the evidence decides.
          </p>
        </header>

        <section aria-label="Case status" style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px',
        }}>
          <StatusChip accent={accent}>{phaseLabel(run.phase)}</StatusChip>
          <StatusChip accent={accent}>{collected.length} evidence collected</StatusChip>
          <StatusChip accent={accent}>{interviewedCount(run)} of 4 interviewed</StatusChip>
          <StatusChip accent={accent}>{guide?.name || 'Guide'}</StatusChip>
        </section>

        {error && (
          <div role="alert" style={{
            marginBottom: '16px', padding: '12px 14px', borderRadius: '12px',
            background: '#331919', border: '1px solid #704040', color: '#FFD9D9',
            fontFamily: font, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <section aria-label="Case conversation" style={{
          display: 'grid', gap: '10px', marginBottom: '20px',
        }}>
          {latestNarration(run).map((text, index) => (
            <CaseBubble key={`${run.history.length}-${index}-${text.slice(0, 24)}`} text={text} />
          ))}
          <GuideBubble guide={guide} moment={guideMoment} />
        </section>

        <section style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px', marginBottom: '20px',
        }}>
          <div style={{
            background: S.panel, border: `1px solid ${S.border}`,
            borderRadius: '16px', padding: '16px',
          }}>
            <h2 style={{ margin: '0 0 12px', fontFamily: font, fontSize: '18px' }}>Evidence</h2>
            {collected.length === 0 ? (
              <p style={{ margin: 0, color: S.muted, fontFamily: font, lineHeight: 1.5 }}>
                Nothing collected yet.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {collected.map((item) => (
                  <div key={item.id} style={{
                    padding: '10px 12px', background: S.panelStrong,
                    borderRadius: '10px', border: `1px solid ${S.border}`,
                  }}>
                    <div style={{ fontFamily: font, fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                      {item.label}
                    </div>
                    <div style={{ color: S.muted, fontFamily: font, fontSize: '13px', lineHeight: 1.45 }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            background: S.panel, border: `1px solid ${S.border}`,
            borderRadius: '16px', padding: '16px',
          }}>
            <h2 style={{ margin: '0 0 12px', fontFamily: font, fontSize: '18px' }}>Suspects</h2>
            <div style={{ display: 'grid', gap: '9px' }}>
              {suspectIds.map((suspectId) => {
                const suspect = run.caseDefinition.suspects[suspectId]
                const status = suspectStatus(run, suspectId)
                return (
                  <div key={suspectId} style={{
                    display: 'flex', justifyContent: 'space-between', gap: '12px',
                    alignItems: 'baseline', paddingBottom: '8px',
                    borderBottom: `1px solid ${S.border}`,
                  }}>
                    <span style={{ fontFamily: font, fontSize: '14px', fontWeight: 700 }}>{suspect.name}</span>
                    <span style={{ color: status === 'Story contradicted' ? '#F1C2C2' : S.muted, fontFamily: font, fontSize: '12px', textAlign: 'right' }}>
                      {status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {!caseClosed && (
          <section aria-label="Available actions" style={{ display: 'grid', gap: '18px' }}>
            {actionGroups.map((group) => (
              <div key={group.label}>
                <h2 style={{
                  margin: '0 0 9px', color: group.label === 'Make accusation' ? '#F1C2C2' : S.muted,
                  fontFamily: font, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {group.label}
                </h2>
                <div style={{ display: 'grid', gap: '9px' }}>
                  {group.actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      disabled={working}
                      onClick={() => handleAction(action.id)}
                      style={{
                        minHeight: '48px', padding: '11px 14px', textAlign: 'left',
                        borderRadius: '12px', border: `1px solid ${action.id.startsWith('accuse:') ? '#8D5A5A' : S.border}`,
                        background: action.id.startsWith('accuse:') ? '#2A1717' : S.panelStrong,
                        color: S.text, fontFamily: font, fontSize: '15px', lineHeight: 1.35,
                        cursor: working ? 'default' : 'pointer', opacity: working ? 0.55 : 1,
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {caseClosed && (
          <section aria-live="polite" style={{
            marginTop: '18px', background: S.panelStrong,
            border: `1px solid ${accent}80`, borderRadius: '16px', padding: '18px',
          }}>
            <h2 style={{ margin: '0 0 8px', fontFamily: font, fontSize: '22px' }}>
              {run.accusation?.correct ? 'Case solved.' : 'Case closed.'}
            </h2>
            <p style={{ margin: '0 0 14px', color: S.muted, fontFamily: font, lineHeight: 1.55 }}>
              {run.accusation?.correct
                ? 'Your accusation matched the pre-generated solution.'
                : 'The accusation was wrong, but the reveal shows the decisive evidence and the run still counts as complete.'}
            </p>
            <button
              type="button"
              disabled={working}
              onClick={startNewCase}
              style={{
                minHeight: '48px', width: '100%', padding: '11px 14px',
                borderRadius: '12px', border: `1px solid ${accent}`,
                background: `${accent}22`, color: S.text, fontFamily: font,
                fontWeight: 700, fontSize: '16px', cursor: working ? 'default' : 'pointer',
              }}
            >
              Start a new case
            </button>
          </section>
        )}

        <footer style={{
          marginTop: '28px', paddingTop: '16px', borderTop: `1px solid ${S.border}`,
          color: S.muted, fontFamily: font, fontSize: '12px', lineHeight: 1.55,
        }}>
          Fictional entertainment inside my420journal. No real product, dispensary, medical, purchasing, legal, or regulatory guidance is provided by this game.
        </footer>
      </div>
    </main>
  )
}
