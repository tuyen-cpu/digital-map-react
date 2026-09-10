import localBoundary from '../data/binhDinhBoundary.json'

export const BOUNDARY_SOURCES = [
  'https://cdn.jsdelivr.net/gh/thanglequoc/vietnamese-provinces-database@master/json/geojson/52_gia_lai/wards/21907_binh_dinh.geojson',
  'https://raw.githubusercontent.com/thanglequoc/vietnamese-provinces-database/refs/heads/master/json/geojson/52_gia_lai/wards/21907_binh_dinh.geojson'
]

function isFullBoundary(data) {
  const feature = data?.features?.[0]
  const code = String(feature?.properties?.code ?? feature?.id ?? '')
  return data?.type === 'FeatureCollection' && code === '21907' && feature?.geometry && !feature?.properties?.fallback
}

export async function loadBoundary(signal) {
  if (isFullBoundary(localBoundary)) return { data: localBoundary, source: 'local', isFallback: false }

  for (const url of BOUNDARY_SOURCES) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 5000)
    const relayAbort = () => controller.abort()
    signal?.addEventListener('abort', relayAbort, { once: true })
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) continue
      const data = await response.json()
      if (isFullBoundary(data)) return { data, source: url, isFallback: false }
    } catch (error) {
      if (signal?.aborted) throw error
    } finally {
      window.clearTimeout(timeout)
      signal?.removeEventListener('abort', relayAbort)
    }
  }

  return { data: localBoundary, source: localBoundary.sourceUrl, isFallback: true }
}
