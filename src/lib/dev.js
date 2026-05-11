export function isDevMode() {
  return import.meta.env.VITE_DEV_MODE === 'true'
}

// Alias kept for any screens that still import shouldBypassAuth
export const shouldBypassAuth = isDevMode

export const DEV_PROFILE = {
  user_id: 'dev-user-001',
  guide_selected: 'sunny',
  guide_name: '',
  accent_color: '#FF7F5C',
  entry_count: 0,
  interaction_dial: 3,
}

export const DEV_USER = {
  id: 'dev-user-001',
  email: 'dev@my420journal.com',
}
