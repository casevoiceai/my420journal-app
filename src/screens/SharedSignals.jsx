import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AggregateSignalCard from '../components/AggregateSignalCard'
import MinimumPoolNotice from '../components/MinimumPoolNotice'
import { fetchAggregateResults } from '../lib/sharedAggregateApi'
import { getSharedPrivacyState } from '../lib/sharedPrivacy'

const S = {
  bg: '#0A1A0A',
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
  error: '#E05C5C',
}

const fontInter = "'Inter', sans-serif"
const fontPlayfair = "'Playfair Display', serif"

function StateCard({ eyebrow, message, detail, tone = 'neutral' }) {
  const color = tone === 'error' ? S.error : S.gold
  return (
    <div style={{
      backgroundColor: S.surface,
      border: `1px solid ${S.border}`,
      borderRadius: '12px',
      padding: '22px',
    }}>
      <p style={{
        fontFamily: fontInter,
        fontSize: '12px',
        fontWeight: '700',
        color,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin: '0 0 10px 0',
      }}>
        {eyebrow}
      </p>
      <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, lineHeight: 1.6, margin: 0 }}>
        {message}
      </p>
      {detail && (
        <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, lineHeight: 1.5, margin: '10px 0 0 0' }}>
          {detail}
        </p>
      )}
    </div>
  )
}

function ProductSearch({ value, onChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} style={{
      backgroundColor: S.surface,
      border: `1px solid ${S.border}`,
      borderRadius: '12px',
      padding: '16px',
    }}>
      <label style={{ display: 'block', fontFamily: fontInter, fontSize: '12px', fontWeight: '700', color: S.gold, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Product key
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: Blue Dream"
        style={{
          width: '100%',
          height: '46px',
          boxSizing: 'border-box',
          backgroundColor: S.bg,
          border: `1px solid ${S.border}`,
          borderRadius: '8px',
          color: S.textPrimary,
          fontFamily: fontInter,
          fontSize: '15px',
          padding: '0 12px',
          outline: 'none',
          marginBottom: '12px',
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          minHeight: '46px',
          backgroundColor: S.gold,
          color: S.bg,
          border: 'none',
          borderRadius: '8px',
          fontFamily: fontInter,
          fontSize: '14px',
          fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Checking...' : 'Check shared signals'}
      </button>
    </form>
  )
}

export default function SharedSignals() {
  const [searchParams, setSearchParams] = useSearchParams()
  const productKey = searchParams.get('product_key') || ''
  const regionBucket = searchParams.get('region_bucket') || ''
  const [productInput, setProductInput] = useState(productKey)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [privacyState, setPrivacyState] = useState(() => getSharedPrivacyState())

  useEffect(() => {
    setProductInput(productKey)
  }, [productKey])

  useEffect(() => {
    let active = true
    async function load() {
      setPrivacyState(getSharedPrivacyState())

      if (!productKey) {
        setResponse({
          ok: false,
          connected: true,
          status: 'missing_product_key',
          http_status: 400,
          message: 'Enter a product key to check shared aggregate signals.',
          data: [],
          aggregate: null,
        })
        setLoading(false)
        return
      }

      setLoading(true)
      const result = await fetchAggregateResults({
        productKey,
        regionBucket: regionBucket || null,
      })
      if (!active) return
      setResponse(result)
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [productKey, regionBucket])

  function handleSubmit(event) {
    event.preventDefault()
    const cleanProductKey = productInput.trim()
    if (!cleanProductKey) {
      setSearchParams({})
      return
    }
    const nextParams = { product_key: cleanProductKey }
    if (regionBucket) nextParams.region_bucket = regionBucket
    setSearchParams(nextParams)
  }

  const aggregate = response?.aggregate || null
  const optedIn = privacyState.shared_opt_in_enabled === true
  const missingProductKey = response?.status === 'missing_product_key'
  const requestFailed = response && !response.ok && !missingProductKey
  const canShowAggregate = response?.ok && aggregate

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: S.bg, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '56px 20px 96px', boxSizing: 'border-box' }}>
        <h1 style={{
          fontFamily: fontPlayfair,
          fontSize: '30px',
          fontWeight: '700',
          color: S.textPrimary,
          margin: '0 0 8px 0',
          lineHeight: 1.2,
        }}>
          Shared Signals
        </h1>
        <p style={{
          fontFamily: fontInter,
          fontSize: '15px',
          color: S.textSecondary,
          margin: '0 0 24px 0',
          lineHeight: 1.6,
        }}>
          Aggregate, opt-in signals from other users who chose to contribute. Individual entries are never shown.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            borderLeft: `4px solid ${optedIn ? S.gold : S.border}`,
            borderRadius: '12px',
            padding: '18px',
          }}>
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textPrimary, margin: '0 0 6px 0', fontWeight: '700' }}>
              {optedIn ? 'Shared Journey View is on' : 'Shared Journey View is off'}
            </p>
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0, lineHeight: 1.5 }}>
              You can manage opt-in from Settings. This feature is off by default.
            </p>
          </div>

          <ProductSearch
            value={productInput}
            onChange={setProductInput}
            onSubmit={handleSubmit}
            loading={loading}
          />

          <MinimumPoolNotice />

          {loading && (
            <StateCard
              eyebrow="Loading"
              message="Checking live shared signals..."
              detail="The app is calling the Cloudflare Worker for this product key."
            />
          )}

          {!loading && missingProductKey && (
            <StateCard
              eyebrow="Product required"
              message={response.message}
              detail="Shared aggregate results are requested by product key. No fake or hardcoded data is shown here."
            />
          )}

          {!loading && requestFailed && (
            <StateCard
              eyebrow="Request failed"
              message={response.message || 'Shared signals could not be loaded.'}
              detail={response.http_status ? `Backend status: ${response.http_status}` : response.error}
              tone="error"
            />
          )}

          {!loading && canShowAggregate && (
            <AggregateSignalCard aggregate={aggregate} />
          )}

          <div style={{
            backgroundColor: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: '12px',
            padding: '18px',
          }}>
            <p style={{ fontFamily: fontInter, fontSize: '12px', fontWeight: '700', color: S.gold, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              Privacy reminder
            </p>
            <p style={{ fontFamily: fontInter, fontSize: '14px', color: S.textSecondary, lineHeight: 1.6, margin: 0 }}>
              Only aggregate counts and percentages can appear here. One person's specific journal entry is never visible to another person.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
