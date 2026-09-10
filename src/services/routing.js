const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search'

function instructionFromStep(step) {
  const maneuver = step?.maneuver ?? {}
  const road = step?.name ? ` trên ${step.name}` : ''
  const modifier = {
    left: 'trái',
    right: 'phải',
    straight: 'thẳng',
    'slight left': 'chếch trái',
    'slight right': 'chếch phải',
    'sharp left': 'ngoặt trái',
    'sharp right': 'ngoặt phải',
    uturn: 'quay đầu'
  }[maneuver.modifier]

  switch (maneuver.type) {
    case 'depart': return `Bắt đầu${road}`
    case 'arrive': return 'Đã đến điểm đến'
    case 'turn': return `Rẽ ${modifier || ''}${road}`.replace(/\s+/g, ' ').trim()
    case 'continue': return `Tiếp tục${road}`
    case 'new name': return `Đi tiếp${road}`
    case 'merge': return `Nhập làn${road}`
    case 'roundabout':
    case 'rotary': return `Vào vòng xuyến${maneuver.exit ? `, ra ở lối ${maneuver.exit}` : ''}${road}`
    default: return `${modifier ? `Đi ${modifier}` : 'Tiếp tục'}${road}`
  }
}

export async function buildDrivingRoute(origin, destination, signal) {
  const url = `${OSRM_BASE}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=false`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Dịch vụ dẫn đường trả về HTTP ${response.status}.`)
  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('Không tìm thấy lộ trình phù hợp.')
  const route = data.routes[0]
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    steps: (route.legs?.[0]?.steps ?? []).map((step, index) => ({
      id: `${index}-${step.maneuver?.location?.join('-') ?? ''}`,
      text: instructionFromStep(step),
      distanceMeters: step.distance,
      durationSeconds: step.duration
    }))
  }
}

function buildGeocodeQuery(query, localBias) {
  const text = String(query || '').trim()
  if (!text) return ''
  if (!localBias) return text
  if (/gia lai|bình định|binh dinh|an nhơn|an nhon/i.test(text)) return text
  return `${text}, Phường Bình Định, Gia Lai, Việt Nam`
}

/**
 * Geocode an address using OpenStreetMap Nominatim.
 * localBias=false is intentionally suitable for journey origins anywhere in Việt Nam.
 * localBias=true helps resolve short destination names around Phường Bình Định.
 */
export async function geocodeAddress(query, signal, limit = 6, { localBias = false } = {}) {
  const q = buildGeocodeQuery(query, localBias)
  if (!q) return []
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: String(limit),
    countrycodes: 'vn',
    addressdetails: '1',
    dedupe: '1',
    q
  })
  const response = await fetch(`${NOMINATIM_BASE}?${params}`, {
    signal,
    headers: { 'Accept-Language': 'vi' }
  })
  if (!response.ok) throw new Error(`Không thể tìm địa chỉ (HTTP ${response.status}).`)
  const results = await response.json()
  return results.map((item) => ({
    lat: Number(item.lat),
    lng: Number(item.lon),
    label: item.display_name,
    type: item.type || item.addresstype || '',
    importance: Number(item.importance || 0)
  })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
}

export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ định vị GPS.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }),
      () => reject(new Error('Không lấy được vị trí hiện tại. Hãy cấp quyền định vị cho trình duyệt.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000, ...options }
    )
  })
}
