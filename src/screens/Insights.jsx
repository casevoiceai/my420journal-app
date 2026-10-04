import { useEffect, useMemo, useState } from 'react'
import { localStore } from '../lib/localStore'
import { isDevMode } from '../lib/dev'
import { analyzeInsights } from '../lib/insights'

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
}

const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

const MOCK_ENTRIES = [
  {
    id: 'mock-1', entry_type: 'cannabis', product_name: 'Blue Dream', category: 'Flower', strain_type: 'Hybrid',
    body_tags: ['Relaxed', 'Pain Relief'], mind_tags: ['Creative'], mood_tags: ['Calm'], mood_face: 'good',
    rating: 5, sleep_quality: 4, update_completed: true, side_effects: [], created_at: new Date().toISOString(),
  },
  {
    id: 'mock-2', entry_type: 'cannabis', product_name: 'Blue Dream', category: 'Flower', strain_type: 'Hybrid',
    body_tags: ['Relaxed'], mind_tags: ['Focused'], mood_tags: ['Calm'], mood_face: 'good',
    rating: 4, sleep_quality: 5, update_completed: true, side_effects: ['Dry mouth'],
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3', entry_type: 'cannabis', product_name: 'Strawberry Cream', category: 'Flower', strain_type: 'Hybrid',
    body_tags: [], mind_tags: [], mood_tags: ['Disappointed'], mood_face: 'off', rating: 1,
    update_completed: true, side_effects: [], created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const MOOD_LABELS = {
  good: 'Good',
  meh: 'Meh',
  off: 'Off',
  eww: 'Rough',
}

function formatAverage(value) {
  return Number.isFinite(value) ? value.toFixed(1) : null
}

function PatternCard({ title, value, subtext }) {
  return (
    <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '18px' }}>
      <p style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '700', color: S.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
        {title}
      </p>
      <p style={{ fontFamily: fontPlayfair, fontSize: '24px', fontWeight: '700', color: S.textPrimary, margin: 0, lineHeight: 1.2 }}>
        {value}
      </p>
      {subtext && (
        <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: '8px 0 0 0', lineHeight: 1.5 }}>
          {subtext}
        </p>
      )}
    </div>
  )
}

function EvidenceList({ title, counts, labelMap = null, emptyText = 'Not enough data yet.' }) {
  return (
    <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '18px' }}>
      <p style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '700', color: S.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
        {title}
      </p>
      {counts.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {counts.slice(0, 5).map(([label, count]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary }}>{labelMap?.[label] || label}</span>
              <span style={{ fontFamily: fontInter, fontSize: '15px', color: S.textSecondary }}>{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: 0 }}>{emptyText}</p>
      )}
    </div>
  )
}

function SectionHeading({ children, subtext }) {
  return (
    <div style={{ marginTop: '10px' }}>
      <h2 style={{ fontFamily: fontPlayfair, fontSize: '22px', color: S.textPrimary, margin: '0 0 4px 0' }}>{children}</h2>
      {subtext && <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0, lineHeight: 1.5 }}>{subtext}</p>}
    </div>
  )
}

export default function Insights() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEntries() {
      if (isDevMode()) {
        setEntries(MOCK_ENTRIES)
        setLoading(false)
        return
      }

      const { data: { user } } = await localStore.auth.getUser()
      if (!user) {
        setEntries([])
        setLoading(false)
        return
      }

      const { data } = await localStore
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setEntries(data || [])
      setLoading(false)
    }

    loadEntries()
  }, [])

  const patterns = useMemo(() => analyzeInsights(entries), [entries])
  const avgRating = formatAverage(patterns.averageRating)
  const avgSleep = formatAverage(patterns.averageSleepQuality)
  const repeat = patterns.mostRepeatedProduct
  const ratedRepeat = patterns.highestRatedRepeatProduct

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: fontInter, color: S.textSecondary, fontSize: '15px' }}>Reading your local journal...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', padding: '56px 20px 96px', boxSizing: 'border-box' }}>
        <h1 style={{ fontFamily: fontPlayfair, fontSize: '30px', fontWeight: '700', color: S.textPrimary, margin: '0 0 8px 0', lineHeight: 1.2 }}>
          Patterns
        </h1>
        <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textSecondary, margin: '0 0 8px 0', lineHeight: 1.6 }}>
          Evidence from what you have logged on this device.
        </p>
        <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, margin: '0 0 24px 0', lineHeight: 1.5 }}>
          These are observations from your journal, not predictions or product recommendations.
        </p>

        {patterns.total === 0 ? (
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <p style={{ fontFamily: fontPlayfair, fontSize: '22px', color: S.textPrimary, margin: '0 0 8px 0' }}>No patterns yet.</p>
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: 0, lineHeight: 1.6 }}>
              Keep logging sessions. Repeated observations become more useful than one-off entries.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SectionHeading subtext="How much personal evidence is available right now.">Your evidence</SectionHeading>
            <PatternCard title="Sessions logged" value={patterns.total} subtext={`${patterns.thisWeek} this week · ${patterns.lastWeek} last week`} />
            <PatternCard
              title="Post-use follow-ups"
              value={`${patterns.completedFollowups} / ${patterns.total}`}
              subtext="Follow-ups add outcome evidence such as ratings, sleep, mood, and side effects."
            />
            <PatternCard
              title="Average overall rating"
              value={avgRating ? `${avgRating} / 5` : 'Not enough rated sessions'}
              subtext={patterns.ratedSessions ? `Across ${patterns.ratedSessions} rated ${patterns.ratedSessions === 1 ? 'session' : 'sessions'}.` : 'Complete a post-use follow-up to add rating evidence.'}
            />
            <PatternCard
              title="Average sleep after"
              value={avgSleep ? `${avgSleep} / 5` : 'Not enough sleep follow-ups'}
              subtext={patterns.sleepRatedSessions ? `Across ${patterns.sleepRatedSessions} sleep ${patterns.sleepRatedSessions === 1 ? 'rating' : 'ratings'}.` : 'This appears only when sleep-after ratings exist.'}
            />

            <SectionHeading subtext="Repeat observations are shown separately from one-off experiences.">Repeat evidence</SectionHeading>
            <PatternCard
              title="Most repeated product"
              value={repeat ? `${repeat.label} (${repeat.sessions})` : 'No repeated product yet'}
              subtext={repeat ? `${repeat.sessions} sessions logged for the same product.` : 'Log the same product at least twice to build repeat evidence.'}
            />
            <PatternCard
              title="Highest average rating among repeats"
              value={ratedRepeat ? `${ratedRepeat.label} — ${ratedRepeat.averageRating.toFixed(1)} / 5` : 'Need 2+ rated sessions for one product'}
              subtext={ratedRepeat ? `${ratedRepeat.ratedSessions} rated sessions. This is a journal observation, not a recommendation.` : 'One strong rating is not treated as a repeat pattern.'}
            />
            <EvidenceList title="Most logged products" counts={patterns.productCounts} />

            <SectionHeading subtext="What shows up around your sessions, without claiming cause and effect.">Outcomes and context</SectionHeading>
            <EvidenceList title="Post-use mood" counts={patterns.moodOutcomeCounts} labelMap={MOOD_LABELS} />
            <EvidenceList title="Side effects logged" counts={patterns.sideEffectCounts} emptyText="No side effects have been logged." />
            <EvidenceList title="Most common body effects" counts={patterns.bodyCounts} />
            <EvidenceList title="Most common mind effects" counts={patterns.mindCounts} />
            <EvidenceList title="Most common mood tags" counts={patterns.moodTagCounts} />
            <EvidenceList title="Categories logged" counts={patterns.categoryCounts} />
            <EvidenceList title="Strain types logged" counts={patterns.strainTypeCounts} />
            <PatternCard
              title="Most common logging time"
              value={patterns.topLoggingTime ? `${patterns.topLoggingTime[0]} (${patterns.topLoggingTime[1]})` : 'Not enough data yet'}
              subtext="Based on when entries were saved, not an assumption about when cannabis was used."
            />
          </div>
        )}
      </div>
    </div>
  )
}
