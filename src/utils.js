export function getItemEvents(allEvents, itemId) {
  return allEvents
    .filter(e => e.itemId === itemId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export function getLastEvent(allEvents, itemId) {
  const events = getItemEvents(allEvents, itemId)
  return events[0] || null
}

export function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (weeks === 1) return '1 week ago'
  if (weeks < 5) return `${weeks} weeks ago`
  if (months === 1) return '1 month ago'
  return `${months} months ago`
}

export function formatDuration(ms) {
  const mins = Math.floor(ms / 60000)
  const hrs = Math.floor(ms / 3600000)
  const days = Math.floor(ms / 86400000)
  if (mins < 60) return `${mins}분`
  if (hrs < 24) {
    const remMin = mins % 60
    return remMin ? `${hrs}시간 ${remMin}분` : `${hrs}시간`
  }
  if (days === 1) return '1일'
  if (days < 7) return `${days}일`
  const weeks = Math.floor(days / 7)
  const rem = days % 7
  if (weeks < 5) return rem ? `${weeks}주 ${rem}일` : `${weeks}주`
  const months = Math.floor(days / 30)
  return months === 1 ? '1개월' : `${months}개월`
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function getAverageDuration(allEvents, itemId) {
  const events = getItemEvents(allEvents, itemId)
  if (events.length < 2) return null
  const sorted = [...events].reverse()
  let total = 0
  for (let i = 1; i < sorted.length; i++) {
    total += new Date(sorted[i].timestamp) - new Date(sorted[i - 1].timestamp)
  }
  return total / (sorted.length - 1)
}

export function toLocalDatetimeStr(date) {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
