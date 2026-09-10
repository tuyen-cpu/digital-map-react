export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '—'
  return meters >= 1000 ? `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km` : `${Math.round(meters)} m`
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '—'
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} phút`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours} giờ${remainder ? ` ${remainder} phút` : ''}`
}

export function hasCoordinates(location) {
  return Number.isFinite(location?.lat) && Number.isFinite(location?.lng)
}

export function externalHref(value) {
  if (!value) return null
  const text = String(value).trim()
  const url = text.match(/https?:\/\/[^\s;,]+/i)?.[0]
  if (url) return url
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
  if (email) return `mailto:${email}`
  return null
}

export function phoneHref(value) {
  if (!value) return null
  const cleaned = String(value).replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : null
}

export function zaloHref(location) {
  if (location?.zaloUrl) return location.zaloUrl
  if (!location?.phone) return null
  let digits = String(location.phone).replace(/\D/g, '')
  if (digits.startsWith('84') && digits.length === 11) digits = `0${digits.slice(2)}`
  const isVietnamMobile = /^0(?:3|5|7|8|9)\d{8}$/.test(digits)
  return isVietnamMobile ? `https://zalo.me/${digits}` : null
}
