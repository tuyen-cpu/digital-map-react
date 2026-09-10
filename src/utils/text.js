export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export function locationMatches(location, query) {
  const q = normalizeText(query)
  if (!q) return true
  const haystack = [
    location.name,
    location.address,
    location.group,
    location.subgroup,
    location.keywords,
    location.phone,
    location.description,
    location.notes
  ].filter(Boolean).join(' ')
  return normalizeText(haystack).includes(q)
}

export function initials(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
