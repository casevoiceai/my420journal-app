import { useEffect, useState } from 'react'
import { localStore } from '../lib/localStore'
import { isDevMode } from '../lib/dev'
import { requestOptOutDeletion, syncOptInStatus } from '../lib/sharedAggregateApi'
import {
  clearSharedContributionQueue,
  retryQueuedSharedContributions,
} from '../lib/sharedContributionQueue'
import {
  disableSharedOptIn,
  enableSharedOptIn,
  getSharedPrivacyState,
  getSharedProfileFields,
} from '../lib/sharedPrivacy'

const S = {
  surface: '#1A2E1A',
  border: '#2D4A2D',
  textPrimary: '#E8F0E8',
  textSecondary: '#8FAF8F',
  gold: '#C9A84C',
  error: '#E05C5C',
  success: '#7A9E6B',
}

const fontInter = "'Inter', sans-serif"

export default function SharedOptInPanel({ profile, onProfileChange }) {
  const [state, setState] = useState(() => getSharedPrivacyState(profile))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setState(getSharedPrivacyState(profile))
  }, [profile])

  useEffect(() => {
    retryQueuedSharedContributions()
  }, [])

  const enabled = state.shared_opt_in_enabled === true

  async function saveProfileFields(nextState) {
    const fields = getSharedProfileFields(nextState)
    if (!isDevMode()) {
      const { data: { user } } = await localStore.auth.getUser()
      if (user?.id) {
        await localStore.from('user_profiles').upsert(
          { user_id: user.id, ...fields },
          { onConflict: 'user_id' }
        )
      }
    }
    onProfileChange?.((current) => ({ ...(current || {}), ...fields }))
  }

  async function handleToggle() {
    if (saving) return
    setSaving(true)
    setStatus('')
    setError('')

    try {
      if (!enabled) {
        const next = enableSharedOptIn(state)
        setState(next)
        await saveProfileFields(next)
        await syncOptInStatus(next)
        setStatus('Opt-in saved. New entries you save from now on can contribute anonymous product signals. Entries from before opt-in are not backfilled.')
      } else {
        const next = disableSharedOptIn(state)
        setState(next)
        clearSharedContributionQueue()
        await saveProfileFields(next)
        await requestOptOutDeletion(next)
        setStatus('Opt-out saved. Pending shared contribution retries were cleared. Your anonymous contributions should be removed from the shared aggregate pool within 24 hours.')
      }
    } catch {
      setError('Could not update Shared Journey settings. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{
        backgroundColor: S.surface,
        border: `1px solid ${S.border}`,
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: fontInter, fontSize: '15px', color: S.textPrimary, margin: '0 0 4px 0', fontWeight: '600' }}>
              Shared Journey View
            </p>
            <p style={{ fontFamily: fontInter, fontSize: '13px', color: S.textSecondary, margin: 0, lineHeight: 1.5 }}>
              Off by default. If you turn it on, new entries saved going forward can contribute anonymous product signals to aggregate counts only. Entries from before opt-in are not backfilled.
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            aria-label="Toggle Shared Journey View"
            style={{
              width: '48px', height: '28px', borderRadius: '14px', border: 'none',
              backgroundColor: enabled ? S.gold : S.border,
              cursor: saving ? 'not-allowed' : 'pointer',
              position: 'relative', transition: 'background-color 0.2s ease',
              flexShrink: 0, padding: 0, marginTop: '2px',
            }}
          >
            <div style={{
              position: 'absolute', top: '3px',
              left: enabled ? '23px' : '3px',
              width: '22px', height: '22px', borderRadius: '11px',
              backgroundColor: '#fff', transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, margin: 0, lineHeight: 1.5 }}>
            Only aggregate counts and percentages can be shared. No private notes, raw entries, exact addresses, GPS coordinates, or one-person records are displayed.
          </p>
          <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, margin: 0, lineHeight: 1.5 }}>
            If you opt out later, pending retries are cleared and your anonymous contributions must be removed from the shared aggregate pool within 24 hours.
          </p>
        </div>

        {status && (
          <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.success, margin: '12px 0 0 0', lineHeight: 1.5 }}>
            {status}
          </p>
        )}
        {error && (
          <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.error, margin: '12px 0 0 0', lineHeight: 1.5 }}>
            {error}
          </p>
        )}
      </div>

      <a
        href="https://my420journal.app/privacy"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          margin: '-4px 0 20px 0',
          color: S.gold,
          fontFamily: fontInter,
          fontSize: '14px',
          fontWeight: '600',
          lineHeight: 1.5,
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
        }}
      >
        Privacy Policy
      </a>
    </>
  )
}
