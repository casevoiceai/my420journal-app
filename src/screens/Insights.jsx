import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStore } from '../lib/localStore'
import { isDevMode } from '../lib/dev'

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
    id: 'mock-1',
    user_id: 'dev-user-001',
    product_name: 'Blue Dream',
    body_tags: ['Relaxed', 'Pain Relief'],
    mind_tags: ['Creative'],
    mood_tags: ['Calm'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    user_id: 'dev-user-001',
    product_name: 'Blue Dream',
    body_tags: ['Relaxed'],
    mind_tags: ['Focused'],
    mood_tags: ['Calm'],
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d
}

function countByValue(items) {
  const counts = new Map()
  items.filter(Boolean).forEach((item) => {
    counts.set(item, (counts.get(item) || 0) + 1)
  })
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function flattenTags(entries, key) {
  return entries.flatMap((entry) => Array.isArray(entry[key]) ? entry[key] : [])
}

function timeBucket(createdAt) {
  const hour = new Date(createdAt).getHours()
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 21) return 'Evening'
  return 'Night'
}

function topLabel(counts, emptyText = 'Not enough data yet') {
  if (!counts.length) return emptyText
  const [label, count] = counts[0]
  return `${label} (${count})`
}

function PatternCard({ title, value, subtext }) {
  return (
    <div style={{
      backgroundColor: S.surface,
      border: `1px solid ${S.border}`,
      borderRadius: '12px',
      padding: '18px',
    }}>
      <p style={{
        fontFamily: fontInter,
        fontSize: '12px',
        fontWeight: '700',
        color: S.gold,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin: '0 0 8px 0',
      }}>
        {title}
      </p>
      <p style={{
        fontFamily: fontPlayfair,
        fontSize: '24px',
        fontWeight: '700',
        color: S.textPrimary,
        margin: 0,
        lineHeight: 1.2,
      }}>
        {value}
      </p>
      {subtext && (
        <p style={{
          fontFamily: fontInter,
          fontSize: '13px',
          color: S.textSecondary,
          margin: '8px 0 0 0',
          lineHeight: 1.5,
        }}>
          {subtext}
        </p>
      )}
    </div>
  )
}

function TagList({ title, counts }) {
  return (
    <div style={{
      backgroundColor: S.surface,
      border: `1px solid ${S.border}`,
      borderRadius: '12px',
      padding: '18px',
    }}>
      <p style={{
        fontFamily: fontInter,
        fontSize: '12px',
        fontWeight: '700',
        color: S.gold,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin: '0 0 12px 0',
      }}>
        {title}
      </p>
      {counts.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {counts.slice(0, 5).map(([label, count]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary }}>{label}</span>
              <span style={{ fontFamily: fontInter, fontSize: '15px', color: S.textSecondary }}>{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: 0 }}>
          Not enough data yet.
        </p>
      )}
    </div>
  )
}

export default function Insights() {
  const navigate = useNavigate()
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

  const patterns = useMemo(() => {
    const cannabisEntries = entries.filter((entry) => !entry.entry_type || entry.entry_type === 'cannabis')
    const now = new Date()
    const thisWeekStart = startOfWeek(now)
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const thisWeek = cannabisEntries.filter((entry) => new Date(entry.created_at) >= thisWeekStart)
    const lastWeek = cannabisEntries.filter((entry) => {
      const created = new Date(entry.created_at)
      return created >= lastWeekStart && created < thisWeekStart
    })

    const productCounts = countByValue(cannabisEntries.map((entry) => entry.product_name || entry.strain_name))
    const bodyCounts = countByValue(flattenTags(cannabisEntries, 'body_tags'))
    const mindCounts = countByValue(flattenTags(cannabisEntries, 'mind_tags'))
    const moodCounts = countByValue(flattenTags(cannabisEntries, 'mood_tags'))
    const timeCounts = countByValue(cannabisEntries.map((entry) => timeBucket(entry.created_at)))

    return {
      total: cannabisEntries.length,
      thisWeek: thisWeek.length,
      lastWeek: lastWeek.length,
      topProduct: topLabel(productCounts),
      topTime: topLabel(timeCounts),
      bodyCounts,
      mindCounts,
      moodCounts,
    }
  }, [entries])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: fontInter, color: S.textSecondary, fontSize: '15px' }}>Loading patterns...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', padding: '56px 20px 96px', boxSizing: 'border-box' }}>
        <h1 style={{
          fontFamily: fontPlayfair,
          fontSize: '30px',
          fontWeight: '700',
          color: S.textPrimary,
          margin: '0 0 8px 0',
          lineHeight: 1.2,
        }}>
          Patterns
        </h1>
        <p style={{
          fontFamily: fontInter,
          fontSize: '15px',
          color: S.textSecondary,
          margin: '0 0 18px 0',
          lineHeight: 1.6,
        }}>
          A simple look at what you have logged on this device.
        </p>

        <button
          onClick={() => navigate('/shared-signals')}
          style={{
            width: '100%',
            minHeight: '52px',
            backgroundColor: S.surface,
            border: `1px solid ${S.gold}`,
            borderRadius: '10px',
            color: S.gold,
            fontFamily: fontInter,
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            marginBottom: '24px',
            padding: '12px 16px',
            textAlign: 'left',
          }}
        >
          Shared Signals
          <span style={{ display: 'block', color: S.textSecondary, fontSize: '12px', fontWeight: '400', marginTop: '4px', lineHeight: 1.4 }}>
            View opt-in aggregate product signals when the shared backend is connected.
          </span>
        </button>

        {patterns.total === 0 ? (
          <div style={{
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: fontPlayfair, fontSize: '22px', color: S.textPrimary, margin: '0 0 8px 0' }}>
              No patterns yet.
            </p>
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, margin: 0, lineHeight: 1.6 }}>
              Log a few sessions first.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <PatternCard title="Total sessions logged" value={patterns.total} />
            <PatternCard
              title="This week vs last week"
              value={`${patterns.thisWeek} / ${patterns.lastWeek}`}
              subtext="This week shown first, last week shown second."
            />
            <PatternCard title="Most used product or strain" value={patterns.topProduct} />
            <PatternCard title="Most common time of day" value={patterns.topTime} />
            <TagList title="Most common body effects" counts={patterns.bodyCounts} />
            <TagList title="Most common mind effects" counts={patterns.mindCounts} />
            <TagList title="Most common mood effects" counts={patterns.moodCounts} />
          </div>
        )}
      </div>
    </div>
  )
}
