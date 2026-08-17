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
  PHASE1_SHARED_CONTRIBUTIONS_ENABLED,
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
    if (PHASE1_SHARED_CONTRIBUTIONS_ENABLED) retryQueuedSharedContributions()
    else clearSharedContributionQueue()
  }, [])

  const enabled = state.shared_opt_in_enabled === true
  const sharedAvailable = PHASE1_SHARED_CONTRIBUTIONS_ENABLED === true

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
    if (!sharedAvailable || saving) return
    setSaving(true)
    setStatus('')
    setError('')

    try {
      if (!enabled) {
        const next = enableSharedOptIn(state)
        setState(next)
        await saveProfileFields(next)
        await syncOptInStatus(next)
        setStatus('Opt-in saved. New entries you save from now on can contribute product signals under the Shared Journey rules described in the Privacy Policy. Entries from before opt-in are not backfilled.')
      } else {
        const next = disableSharedOptIn(state)
        setState(next)
        clearSharedContributionQueue()
        await saveProfileFields(next)
        await requestOptOutDeletion(next)
        setStatus('Opt-out saved. Pending shared contribution retries were cleared. The deletion request was sent for temporary contributor-linked records.')
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
              {sharedAvailable
                ? 'Off by default. If you turn it on, new entries saved going forward can contribute product signals under the Shared Journey rules described in the Privacy Policy. Entries from before opt-in are not backfilled.'
                : 'Unavailable during Phase 1 external testing. Shared contributions remain off unless qualified legal review specifically approves them for this test.'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving || !sharedAvailable}
            aria-label="Toggle Shared Journey View"
            style={{
              width: '48px', height: '28px', borderRadius: '14px', border: 'none',
              backgroundColor: enabled ? S.gold : S.border,
              cursor: saving || !sharedAvailable ? 'not-allowed' : 'pointer',
              position: 'relative', transition: 'background-color 0.2s ease',
              flexShrink: 0, padding: 0, marginTop: '2px',
              opacity: sharedAvailable ? 1 : 0.55,
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

        {sharedAvailable ? (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, margin: 0, lineHeight: 1.5 }}>
              Shared Journey has a separate, limited data flow from the private local journal. See the Privacy Policy for the controlling description.
            </p>
          </div>
        ) : (
          <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, margin: '12px 0 0 0', lineHeight: 1.5 }}>
            The private journal continues to work normally while this feature is unavailable.
          </p>
        )}

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
