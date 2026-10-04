export function resolveDispensaryName(selectedDispensary, manualText = '') {
  if (selectedDispensary) {
    const selectedName = typeof selectedDispensary === 'string'
      ? selectedDispensary
      : selectedDispensary?.name
    const trimmedSelected = String(selectedName || '').trim()
    if (trimmedSelected) return trimmedSelected
  }

  const trimmedManual = String(manualText || '').trim()
  return trimmedManual || null
}
