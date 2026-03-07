export function formatDateTime(isoString: string): string {
  const dt = new Date(isoString)
  if (Number.isNaN(dt.getTime())) return isoString
  return dt.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

