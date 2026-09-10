import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const output = path.join(here, '..', 'src', 'data', 'binhDinhBoundary.json')
const candidates = [
  'https://cdn.jsdelivr.net/gh/thanglequoc/vietnamese-provinces-database@master/json/geojson/52_gia_lai/wards/21907_binh_dinh.geojson',
  'https://raw.githubusercontent.com/thanglequoc/vietnamese-provinces-database/refs/heads/master/json/geojson/52_gia_lai/wards/21907_binh_dinh.geojson'
]

function validate(data) {
  const feature = data?.features?.[0]
  const code = String(feature?.properties?.code ?? feature?.id ?? '')
  if (data?.type !== 'FeatureCollection' || !feature?.geometry) {
    throw new Error('Dữ liệu tải về không phải FeatureCollection hợp lệ.')
  }
  if (code !== '21907') {
    throw new Error(`Sai mã đơn vị hành chính: ${code || 'không xác định'}`)
  }
  if (!['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
    throw new Error(`Kiểu hình học không hợp lệ: ${feature.geometry.type}`)
  }
  return data
}

let lastError
for (const url of candidates) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'user-agent': 'binh-dinh-tourism-boundary-sync/1.0' }
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = validate(await response.json())
    data.sourceUrl = url
    data.sourceStatus = 'full-geojson'
    data.retrievedAt = new Date().toISOString()
    await writeFile(output, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    console.log(`✓ Đã đồng bộ GeoJSON ranh giới Phường Bình Định (mã 21907) từ ${url}`)
    process.exit(0)
  } catch (error) {
    lastError = error
  }
}

console.error(`Không thể tải GeoJSON ranh giới: ${lastError?.message ?? 'unknown error'}`)
process.exit(1)
