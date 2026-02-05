export function formatLocalDate(
  dateString: string | null | undefined,
  locale = 'pt-BR'
): string {
  if (!dateString) return 'N/A'

  const hasTime = dateString.includes('T')
  const datePart = dateString.slice(0, 10)

  if (hasTime) {
    const timePart = dateString.split('T')[1] || ''
    const isMidnight = /^00:00:00/.test(timePart)
    if (isMidnight) {
      const [year, month, day] = datePart.split('-').map(Number)
      if (year && month && day) {
        return new Date(year, month - 1, day).toLocaleDateString(locale)
      }
    }
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    if (year && month && day) {
      return new Date(year, month - 1, day).toLocaleDateString(locale)
    }
  }

  return new Date(dateString).toLocaleDateString(locale)
}
