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

        const result = await syncOptInStatus(next)
        if (!result.ok) {
          const reverted = disableSharedOptIn(next)
          setState(reverted)
          await saveProfileFields(reverted)
          setError(result.message || 'Shared Journey View could not be enabled for this device.')
          return
        }

        setStatus('Opt-in saved. New entries you save from now on can contribute product signals. Each contribution stays in temporary staging for 3 days before it can be added to shared totals.')
      } else {
        const next = disableSharedOptIn(state)
        setState(next)
        clearSharedContributionQueue()
        await saveProfileFields(next)

        const result = await requestOptOutDeletion(next)
        if (!result.ok) {
          setError('Opt-out is saved on this device and pending retries were cleared, but the server could not confirm the deletion request. Try again when you are online.')
          return
        }

        setStatus('Opt-out saved. Future contributions from this device are blocked. Contributions still in the 3-day staging window were deleted. Older contributions were already folded into shared totals and cannot be individually identified or removed.')
      }
    } catch {
      setError('Could not update Shared Journey settings. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
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
            Off by default. If you turn it on, new entries saved going forward can contribute product signals to shared totals. Entries from before opt-in are not backfilled.
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
          Contributions stay in temporary staging for 3 days. During that time, they are linked to this device's anonymous contributor ID so duplicates can be blocked and pending contributions can be deleted.
        </p>
        <p style={{ fontFamily: fontInter, fontSize: '12px', color: S.textSecondary, margin: 0, lineHeight: 1.5 }}>
          After 3 days, a contribution is folded into shared totals and the link to this device is deleted. Opting out blocks future contributions and deletes anything still pending, but older totals cannot be individually traced or removed.
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
  )
}
