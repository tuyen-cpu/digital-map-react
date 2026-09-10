const DB_NAME = 'binh-dinh-tourism-media'
const DB_VERSION = 1
const STORE_NAME = 'media'
const REF_PREFIX = 'media://'

function ensureIndexedDb() {
  if (typeof indexedDB === 'undefined') throw new Error('Trình duyệt không hỗ trợ lưu media cục bộ bằng IndexedDB.')
}

function openDb() {
  ensureIndexedDb()
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Không mở được kho media.'))
  })
}

export function isMediaRef(value) {
  return typeof value === 'string' && value.startsWith(REF_PREFIX)
}

export function mediaRefToId(ref) {
  return isMediaRef(ref) ? ref.slice(REF_PREFIX.length) : null
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export async function saveMediaFile(file, { kind = 'image', maxBytes } = {}) {
  if (!(file instanceof File)) throw new Error('File media không hợp lệ.')
  if (maxBytes && file.size > maxBytes) {
    const mb = Math.max(1, Math.round(maxBytes / 1024 / 1024))
    throw new Error(`File “${file.name}” vượt quá giới hạn ${mb} MB.`)
  }
  const id = makeId()
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({
      id,
      blob: file,
      name: file.name,
      type: file.type,
      size: file.size,
      kind,
      createdAt: new Date().toISOString()
    })
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error || new Error('Không lưu được file media.'))
    tx.onabort = () => reject(tx.error || new Error('Lưu file media bị hủy.'))
  })
  db.close()
  return `${REF_PREFIX}${id}`
}

export async function getMediaRecord(ref) {
  const id = mediaRefToId(ref)
  if (!id) return null
  const db = await openDb()
  const record = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error || new Error('Không đọc được media.'))
  })
  db.close()
  return record
}

export async function deleteMediaRef(ref) {
  const id = mediaRefToId(ref)
  if (!id) return
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error || new Error('Không xóa được media.'))
  })
  db.close()
}
