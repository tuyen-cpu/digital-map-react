/**
 * mediaService — upload/delete file lên Cloudflare R2 qua Django API.
 * Thay thế saveMediaFile từ mediaDb.js cho admin uploads.
 */
import api from './api'

/**
 * Upload một file ảnh lên R2.
 * @param {File} file
 * @param {{ folder?: string }} options  — folder trong bucket, mặc định 'locations'
 * @returns {Promise<string>} URL công khai của file đã upload
 */
export async function uploadMedia(file, { folder = 'locations' } = {}) {
  if (!(file instanceof File)) throw new Error('File không hợp lệ.')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const res = await api.post('/media/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.url   // URL R2 public
}

/**
 * Xóa file khỏi R2 theo URL hoặc key.
 * Fire-and-forget — không throw nếu file không tồn tại.
 * @param {string} urlOrKey
 */
export async function deleteMedia(urlOrKey) {
  if (!urlOrKey) return
  try {
    // Chỉ xóa file thật sự lưu trên R2 (URL bắt đầu bằng http)
    // Bỏ qua IndexedDB refs (media://) và URL ngoài
    const isR2Url = urlOrKey.startsWith('http') && !urlOrKey.startsWith('data:')
    if (!isR2Url) return
    await api.post('/media/delete/', { url: urlOrKey })
  } catch {
    // Ignore — không chặn flow nếu xóa fail
  }
}
