import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const boundaryPath = path.join(here, '..', 'src', 'data', 'binhDinhBoundary.json')

let needsSync = true
try {
  const current = JSON.parse(await readFile(boundaryPath, 'utf8'))
  const feature = current?.features?.[0]
  const code = String(feature?.properties?.code ?? feature?.id ?? '')
  needsSync = current?.sourceStatus !== 'full-geojson' || code !== '21907' || !feature?.geometry
} catch {
  needsSync = true
}

if (!needsSync) {
  console.log('✓ GeoJSON ranh giới đầy đủ đã có sẵn.')
  process.exit(0)
}

console.log('Đang đồng bộ ranh giới Phường Bình Định (mã 21907)...')
const child = spawn(process.execPath, [path.join(here, 'fetch-boundary.mjs')], { stdio: 'inherit' })
child.on('exit', (code) => {
  if (code !== 0) {
    console.warn('⚠ Không tải được ranh giới đầy đủ. Ứng dụng vẫn chạy với vùng bao dự phòng và sẽ thử tải GeoJSON đầy đủ ở trình duyệt.')
  }
  process.exit(0)
})
