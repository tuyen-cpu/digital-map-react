import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const locations = JSON.parse(await readFile(path.join(root, 'src', 'data', 'locations.json'), 'utf8'))
const boundary = JSON.parse(await readFile(path.join(root, 'src', 'data', 'binhDinhBoundary.json'), 'utf8'))
const verifiedMedia = JSON.parse(await readFile(path.join(root, 'src', 'data', 'verifiedMedia.json'), 'utf8'))

const errors = []
if (!Array.isArray(locations) || locations.length < 165) errors.push(`locations.json phải giữ tối thiểu 165 bản ghi gốc, hiện có ${locations?.length}`)
const ids = new Set()
const mediaOwners = new Map()
let audited = 0
let verifiedImages = 0

function collectMediaUrl(url, item, label) {
  if (!url || typeof url !== 'string') return
  const normalized = url.trim()
  if (!normalized) return
  const owner = mediaOwners.get(normalized)
  if (owner && owner.id !== item.id) {
    errors.push(`Ảnh bị dùng chéo giữa địa điểm: ${owner.id} và ${item.id} (${label})`)
  } else if (!owner) {
    mediaOwners.set(normalized, { id: item.id, label })
  }
}

for (const item of locations) {
  if (!item.id || !item.name || !item.category) errors.push(`Bản ghi ${item.id || item.stt || '?'} thiếu id/name/category`)
  if (ids.has(item.id)) errors.push(`Trùng id ${item.id}`)
  ids.add(item.id)

  const hasLat = Number.isFinite(item.lat)
  const hasLng = Number.isFinite(item.lng)
  if (hasLat !== hasLng) errors.push(`${item.id} chỉ có một thành phần tọa độ`)
  if (hasLat && (item.lat < -90 || item.lat > 90 || item.lng < -180 || item.lng > 180)) errors.push(`${item.id} có tọa độ ngoài phạm vi`)

  for (const forbidden of ['googleMapsUrl', 'sourceOrigin', 'reviewedAt']) {
    if (Object.prototype.hasOwnProperty.call(item, forbidden)) errors.push(`${item.id} vẫn còn trường không dùng ${forbidden}`)
  }

  if (item.imageCheckedAt) audited += 1
  if (item.imageVerification === 'verified_public') {
    if (!item.image) errors.push(`${item.id} đánh dấu verified_public nhưng không có image`)
    else verifiedImages += 1
  }
  if (!item.image && item.imageVerification === 'verified_public') errors.push(`${item.id} trạng thái ảnh không nhất quán`)

  collectMediaUrl(item.image, item, 'image')
  for (const media of Array.isArray(item.gallery) ? item.gallery : []) {
    collectMediaUrl(typeof media === 'string' ? media : media?.url || media?.src, item, 'gallery')
  }
  for (const media of Array.isArray(item.panoramas) ? item.panoramas : []) {
    collectMediaUrl(typeof media === 'string' ? media : media?.url || media?.src, item, 'panorama')
  }
}

for (const [id, media] of Object.entries(verifiedMedia)) {
  const location = locations.find((item) => item.id === id)
  if (!location) errors.push(`verifiedMedia có id không tồn tại: ${id}`)
  if (!media?.image) errors.push(`verifiedMedia ${id} thiếu image`)
  if (location && location.image !== media.image) errors.push(`verifiedMedia ${id} không khớp locations.json`)
}

const mappable = locations.filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng)).length
const administration = locations.filter((x) => x.category === 'administration').length
if (mappable < 57) errors.push(`Số bản ghi có GPS thấp hơn dữ liệu gốc: ${mappable}`)
if (!locations.some((x) => x.id === 'baba-tea')) errors.push('Thiếu địa điểm baba-tea để tương thích đường dẫn website cũ')
if (administration < 10) errors.push(`Danh mục cơ quan hành chính quá ít: ${administration}`)
if (boundary?.type !== 'FeatureCollection' || !boundary?.features?.[0]?.geometry) errors.push('Ranh giới không phải GeoJSON FeatureCollection hợp lệ')
if (audited !== locations.length) errors.push(`Chưa rà ảnh đủ toàn bộ địa điểm: ${audited}/${locations.length}`)

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`✓ Dữ liệu hợp lệ: ${locations.length} địa điểm, ${mappable} điểm có GPS cố định.`)
console.log(`✓ Cơ quan hành chính: ${administration} địa điểm.`)
console.log(`✓ Media audit: ${audited}/${locations.length} đã rà; ${verifiedImages} địa điểm có ảnh public xác minh; ${locations.length - verifiedImages} để trống theo chính sách không gán ảnh sai.`)
console.log('✓ Không có URL ảnh/media bị dùng chéo giữa hai địa điểm.')
console.log('✓ Không còn trường ngày rà soát / liên kết bản đồ ngoài trong dữ liệu công khai.')
console.log(`✓ Ranh giới: ${boundary.sourceStatus || 'GeoJSON hợp lệ'}.`)
