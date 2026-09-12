import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { ADMIN_ACCOUNT, DEFAULT_RESET_PASSWORD } from '../config/auth'
import baseLocations from '../data/locations.json'
import legacyInvalidMedia from '../data/legacyInvalidMedia.json'
import { DEFAULT_SITE_SETTINGS } from '../data/siteSettings'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { isValidVietnamMobilePhone, normalizeVietnamPhone } from '../utils/phone'
import { normalizeText } from '../utils/text'

const AppStateContext = createContext(null)

function makeId(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function getVisitorId() {
  const key = 'binh-dinh:visitor-id'
  try {
    let id = window.localStorage.getItem(key)
    if (!id) {
      id = makeId('visitor')
      window.localStorage.setItem(key, id)
    }
    return id
  } catch {
    return makeId('visitor')
  }
}

function getSessionId() {
  const key = 'binh-dinh:visit-session-id'
  try {
    let id = window.sessionStorage.getItem(key)
    if (!id) {
      id = makeId('session')
      window.sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    return makeId('session')
  }
}

function makeLocationId(name = 'dia-diem') {
  const slug = normalizeText(name)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'dia-diem'}-${Date.now().toString(36)}`
}

function normalizeMediaList(value) {
  if (!Array.isArray(value)) return []
  return value.map((item, index) => {
    if (typeof item === 'string') return { url: item, alt: '', name: `media-${index + 1}` }
    return {
      ...item,
      url: String(item?.url || '').trim(),
      alt: String(item?.alt || '').trim(),
      name: String(item?.name || `media-${index + 1}`).trim()
    }
  }).filter((item) => item.url)
}

function removeLegacyDefaultMedia(item = {}) {
  const invalid = legacyInvalidMedia[item?.id]
  if (!invalid) return item

  const invalidGallery = new Set((invalid.gallery || []).filter(Boolean))
  const imageWasGeneric = Boolean(invalid.image && item.image === invalid.image)
  const gallery = normalizeMediaList(item.gallery).filter((entry) => !invalidGallery.has(entry.url))
  const genericAlt = /ảnh\s+minh\s+họa/i.test(String(item.imageAlt || ''))

  return {
    ...item,
    image: imageWasGeneric ? null : item.image,
    imageAlt: imageWasGeneric ? null : (genericAlt && item.image ? item.name : item.imageAlt),
    gallery
  }
}

function normalizeLocationInput(input, current = {}) {
  const next = { ...current, ...input }
  delete next.oldArea
  delete next.plusCode
  for (const key of ['lat', 'lng']) {
    if (next[key] === '' || next[key] == null) next[key] = null
    else {
      const number = Number(next[key])
      next[key] = Number.isFinite(number) ? number : null
    }
  }
  next.name = String(next.name || '').trim()
  next.category = next.category || 'utility'
  next.group = String(next.group || '').trim()
  next.subgroup = String(next.subgroup || '').trim()
  next.address = String(next.address || '').trim()
  next.description = String(next.description || '').trim()
  next.notes = String(next.notes || '').trim()
  next.phone = String(next.phone || '').trim() || null
  next.zaloUrl = String(next.zaloUrl || '').trim() || null
  next.website = String(next.website || '').trim() || null
  next.email = String(next.email || '').trim() || null
  next.facebook = String(next.facebook || '').trim() || null
  next.hours = String(next.hours || '').trim() || null
  next.keywords = String(next.keywords || '').trim() || null
  next.heritageStatus = String(next.heritageStatus || '').trim() || null
  next.image = String(next.image || '').trim() || null
  next.imageAlt = String(next.imageAlt || '').trim() || null
  next.gallery = normalizeMediaList(next.gallery)
  next.panoramas = normalizeMediaList(next.panoramas)
  next.videos = normalizeMediaList(next.videos)
  return next
}

function locationImageUrls(location = {}) {
  const urls = []
  if (location.image) urls.push(String(location.image))
  for (const key of ['gallery', 'panoramas']) {
    for (const item of normalizeMediaList(location[key])) urls.push(item.url)
  }
  return [...new Set(urls.filter(Boolean))]
}

function assertNoCrossLocationImageReuse(candidate, allLocations = [], ignoreId = null) {
  const candidateUrls = new Set(locationImageUrls(candidate))
  if (!candidateUrls.size) return
  for (const other of allLocations) {
    if (!other || other.id === ignoreId) continue
    const reused = locationImageUrls(other).find((url) => candidateUrls.has(url))
    if (reused) {
      throw new Error(`Ảnh này đang được dùng cho địa điểm “${other.name}”. Hãy dùng ảnh đúng của từng địa điểm hoặc để trống nếu chưa có ảnh xác minh.`)
    }
  }
}

function normalizePermissions(value = {}) {
  return {
    categories: Array.isArray(value.categories) ? [...new Set(value.categories.filter(Boolean))] : [],
    groups: Array.isArray(value.groups) ? [...new Set(value.groups.filter(Boolean))] : [],
    subgroups: Array.isArray(value.subgroups) ? [...new Set(value.subgroups.filter(Boolean))] : []
  }
}

function normalizeUser(user = {}) {
  const role = user.role === 'manager' ? 'manager' : 'user'
  return {
    ...user,
    displayName: String(user.displayName || user.username || '').trim(),
    username: String(user.username || '').trim(),
    phone: normalizeVietnamPhone(user.phone || ''),
    role,
    avatar: String(user.avatar || '').trim() || null,
    permissions: normalizePermissions(user.permissions),
    mustChangePassword: Boolean(user.mustChangePassword),
    createdAt: user.createdAt || new Date().toISOString()
  }
}

function safeJsonStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

function initialUsers() {
  const legacy = safeJsonStorage('binh-dinh:users', [])
  return Array.isArray(legacy) ? legacy.map(normalizeUser) : []
}

function initialLocations() {
  const normalizedBase = baseLocations.map((item) => normalizeLocationInput(item))
  const storedV8 = safeJsonStorage('binh-dinh:locations-v8', null)
  const storedV7 = safeJsonStorage('binh-dinh:locations-v7', null)
  const storedV6 = safeJsonStorage('binh-dinh:locations-v6', null)
  const storedV5 = safeJsonStorage('binh-dinh:locations-v5', null)
  const storedV4 = safeJsonStorage('binh-dinh:locations-v4', [])
  const legacy = Array.isArray(storedV8) && storedV8.length
    ? storedV8
    : (Array.isArray(storedV7) && storedV7.length
      ? storedV7
      : (Array.isArray(storedV6) && storedV6.length
        ? storedV6
        : (Array.isArray(storedV5) && storedV5.length ? storedV5 : storedV4)))
  if (!Array.isArray(legacy) || !legacy.length) return normalizedBase

  const baseById = new Map(normalizedBase.map((item) => [item.id, item]))
  const merged = legacy.map((item) => {
    const cleaned = removeLegacyDefaultMedia(item)
    const base = baseById.get(cleaned.id)
    if (!base) return normalizeLocationInput(cleaned)

    // Giữ toàn bộ thay đổi do Admin/User đã lưu. Riêng media: nếu bản cũ đang
    // trống thì nạp ảnh đã được xác minh mới từ locations.json.
    const next = { ...base, ...cleaned }
    if (!cleaned.image && base.image) {
      next.image = base.image
      next.imageAlt = base.imageAlt || base.name
    }
    const cleanedGallery = normalizeMediaList(cleaned.gallery)
    const baseGallery = normalizeMediaList(base.gallery)
    if (!cleanedGallery.length && baseGallery.length) next.gallery = baseGallery
    if (!cleaned.imageSourceUrl && base.imageSourceUrl) next.imageSourceUrl = base.imageSourceUrl
    if (!cleaned.imageSourceName && base.imageSourceName) next.imageSourceName = base.imageSourceName
    return normalizeLocationInput(next)
  })
  const ids = new Set(merged.map((item) => item.id))
  normalizedBase.forEach((item) => { if (!ids.has(item.id)) merged.push(item) })
  return merged
}

function canSessionManageLocation(session, location) {
  if (session?.role === 'admin') return true
  if (session?.role !== 'manager' || !location) return false
  const permissions = normalizePermissions(session.permissions)
  return permissions.categories.includes(location.category)
    || (location.group && permissions.groups.includes(location.group))
    || (location.subgroup && permissions.subgroups.includes(location.subgroup))
}

function canSessionManageCategory(session, category) {
  if (session?.role === 'admin') return true
  if (session?.role !== 'manager') return false
  return normalizePermissions(session.permissions).categories.includes(category)
}

function makeSession(user) {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    phone: normalizeVietnamPhone(user.phone),
    role: user.role || 'user',
    avatar: user.avatar || null,
    permissions: normalizePermissions(user.permissions),
    mustChangePassword: Boolean(user.mustChangePassword)
  }
}

export function AppStateProvider({ children }) {
  const [favorites, setFavorites] = useLocalStorage('binh-dinh:favorites', [])
  const [users, setUsers] = useLocalStorage('binh-dinh:users-v2', initialUsers())
  const [session, setSession] = useLocalStorage('binh-dinh:session', null)
  const [locations, setLocations] = useLocalStorage('binh-dinh:locations-v9', initialLocations())
  const [siteSettings, setSiteSettings] = useLocalStorage('binh-dinh:site-settings-v2', DEFAULT_SITE_SETTINGS)
  const [reviews, setReviews] = useLocalStorage('binh-dinh:reviews-v2', safeJsonStorage('binh-dinh:reviews-v1', []))
  const [analyticsEvents, setAnalyticsEvents] = useLocalStorage('binh-dinh:analytics-v1', [])
  const [travelHistory, setTravelHistory] = useLocalStorage('binh-dinh:travel-history-v1', [])
  const [reminders, setReminders] = useLocalStorage('binh-dinh:travel-reminders-v1', [])
  const [reviewNotificationReads, setReviewNotificationReads] = useLocalStorage('binh-dinh:review-notification-reads-v1', {})

  useEffect(() => {
    setUsers((current) => current.map(normalizeUser))
  }, [setUsers])

  useEffect(() => {
    if (!session || session.role === 'admin') return
    const currentUser = users.find((user) => user.username === session.username)
    if (!currentUser) {
      setSession(null)
      return
    }
    const next = makeSession(currentUser)
    const before = JSON.stringify(session)
    const after = JSON.stringify(next)
    if (before !== after) setSession(next)
  }, [users, session, setSession])

  const trackEvent = useCallback((type, payload = {}) => {
    const now = Date.now()
    const signature = [type, payload.path || '', payload.locationId || '', payload.category || '', payload.account || session?.username || ''].join('|')
    try {
      const previous = JSON.parse(window.sessionStorage.getItem('binh-dinh:last-event') || 'null')
      if (previous?.signature === signature && now - previous.time < 900) return null
      window.sessionStorage.setItem('binh-dinh:last-event', JSON.stringify({ signature, time: now }))
    } catch {}
    const event = {
      id: makeId('event'),
      type,
      createdAt: new Date(now).toISOString(),
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      account: session?.username || '',
      role: session?.role || 'guest',
      ...payload
    }
    setAnalyticsEvents((current) => [...current.slice(-4999), event])
    return event
  }, [session, setAnalyticsEvents])

  const toggleFavorite = useCallback((id) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }, [setFavorites])

  const register = ({ displayName, username, password, phone }) => {
    const normalizedUsername = username.trim().toLowerCase()
    const normalizedPhone = normalizeVietnamPhone(phone)
    if (!displayName.trim()) throw new Error('Hãy nhập tên hiển thị.')
    if (!normalizedUsername) throw new Error('Hãy nhập tên đăng nhập.')
    if (!isValidVietnamMobilePhone(normalizedPhone)) throw new Error('Số điện thoại không đúng định dạng di động Việt Nam.')
    if (normalizedUsername === ADMIN_ACCOUNT.username.toLowerCase()) throw new Error('Tên đăng nhập này được dành cho quản trị viên.')
    if (users.some((user) => user.username.toLowerCase() === normalizedUsername)) throw new Error('Tên đăng nhập đã tồn tại trên trình duyệt này.')
    if (users.some((user) => normalizeVietnamPhone(user.phone) === normalizedPhone)) throw new Error('Số điện thoại này đã được dùng cho một tài khoản khác.')

    const user = normalizeUser({
      id: makeId('user'),
      displayName: displayName.trim(),
      username: username.trim(),
      phone: normalizedPhone,
      password,
      role: 'user',
      permissions: {},
      mustChangePassword: false,
      createdAt: new Date().toISOString()
    })
    setUsers((current) => [...current, user])
    const nextSession = makeSession(user)
    setSession(nextSession)
    trackEvent('register', { account: user.username })
    return nextSession
  }

  const login = ({ username, password }) => {
    const normalized = username.trim().toLowerCase()
    if (normalized === ADMIN_ACCOUNT.username.toLowerCase() && password === ADMIN_ACCOUNT.password) {
      const adminSession = { displayName: ADMIN_ACCOUNT.displayName, username: ADMIN_ACCOUNT.username, role: ADMIN_ACCOUNT.role, permissions: { categories: [], groups: [], subgroups: [] }, mustChangePassword: false }
      setSession(adminSession)
      trackEvent('login', { account: ADMIN_ACCOUNT.username, role: 'admin' })
      return adminSession
    }

    const found = users.find((user) => user.username.toLowerCase() === normalized && user.password === password)
    if (!found) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng. Nếu chưa có tài khoản, hãy đăng ký trước.')

    const nextSession = makeSession(found)
    setSession(nextSession)
    trackEvent('login', { account: found.username, role: nextSession.role })
    return nextSession
  }

  const logout = () => {
    trackEvent('logout')
    setSession(null)
  }

  const updateProfile = ({ displayName, phone, avatar }) => {
    if (!session || !['user', 'manager'].includes(session.role)) throw new Error('Hãy đăng nhập tài khoản người dùng.')
    const normalizedPhone = normalizeVietnamPhone(phone)
    if (!String(displayName || '').trim()) throw new Error('Tên hiển thị không được để trống.')
    if (!isValidVietnamMobilePhone(normalizedPhone)) throw new Error('Số điện thoại không đúng định dạng di động Việt Nam.')
    if (users.some((user) => user.username !== session.username && normalizeVietnamPhone(user.phone) === normalizedPhone)) throw new Error('Số điện thoại này đã được dùng cho tài khoản khác.')
    setUsers((current) => current.map((user) => user.username === session.username ? normalizeUser({ ...user, displayName: displayName.trim(), phone: normalizedPhone, avatar: avatar === undefined ? user.avatar : avatar }) : user))
    setSession((current) => ({ ...current, displayName: displayName.trim(), phone: normalizedPhone, avatar: avatar === undefined ? current.avatar : avatar }))
    trackEvent('profile_update')
  }

  const changePassword = ({ currentPassword, newPassword }) => {
    if (!session || session.role === 'admin') throw new Error('Không thể đổi mật khẩu cho phiên hiện tại.')
    if (String(newPassword || '').length < 8) throw new Error('Mật khẩu mới phải có ít nhất 8 ký tự.')
    const found = users.find((user) => user.username === session.username)
    if (!found || found.password !== currentPassword) throw new Error('Mật khẩu hiện tại không đúng.')
    setUsers((current) => current.map((user) => user.username === session.username ? { ...user, password: newPassword, mustChangePassword: false, passwordChangedAt: new Date().toISOString() } : user))
    setSession((current) => ({ ...current, mustChangePassword: false }))
    trackEvent('password_change')
  }

  const deleteUser = (username) => {
    if (session?.role !== 'admin') throw new Error('Chỉ quản trị viên được xóa tài khoản.')
    setUsers((current) => current.filter((user) => user.username !== username))
    setReviews((current) => current.filter((review) => review.username !== username).map((review) => ({ ...review, replies: (review.replies || []).filter((reply) => reply.username !== username) })))
    setTravelHistory((current) => current.filter((entry) => entry.username !== username))
    setReminders((current) => current.filter((entry) => entry.username !== username))
  }

  const updateUserAccount = (username, patch = {}) => {
    if (session?.role !== 'admin') throw new Error('Chỉ quản trị viên được sửa tài khoản.')
    const nextUsername = String(patch.username || username).trim()
    const normalizedNext = nextUsername.toLowerCase()
    const normalizedPhone = normalizeVietnamPhone(patch.phone || '')
    if (!nextUsername) throw new Error('Tên đăng nhập không được để trống.')
    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(nextUsername)) throw new Error('Tên đăng nhập chỉ dùng chữ, số, dấu chấm, gạch dưới hoặc gạch ngang; dài 3–40 ký tự.')
    if (normalizedNext === ADMIN_ACCOUNT.username.toLowerCase()) throw new Error('Tên đăng nhập này được dành cho quản trị viên.')
    if (users.some((user) => user.username !== username && user.username.toLowerCase() === normalizedNext)) throw new Error('Tên đăng nhập đã tồn tại.')
    if (!patch.displayName?.trim()) throw new Error('Tên hiển thị không được để trống.')
    if (!isValidVietnamMobilePhone(normalizedPhone)) throw new Error('Số điện thoại không đúng định dạng di động Việt Nam.')
    if (users.some((user) => user.username !== username && normalizeVietnamPhone(user.phone) === normalizedPhone)) throw new Error('Số điện thoại đã thuộc về tài khoản khác.')

    setUsers((current) => current.map((user) => user.username === username ? normalizeUser({
      ...user,
      username: nextUsername,
      displayName: patch.displayName.trim(),
      phone: normalizedPhone,
      role: patch.role === 'manager' ? 'manager' : 'user',
      permissions: normalizePermissions(patch.permissions || user.permissions)
    }) : user))

    if (nextUsername !== username) {
      setReviews((current) => current.map((review) => ({
        ...review,
        username: review.username === username ? nextUsername : review.username,
        replies: (review.replies || []).map((reply) => reply.username === username ? { ...reply, username: nextUsername } : reply)
      })))
      setTravelHistory((current) => current.map((entry) => entry.username === username ? { ...entry, username: nextUsername } : entry))
      setReminders((current) => current.map((entry) => entry.username === username ? { ...entry, username: nextUsername } : entry))
    }
    trackEvent('admin_user_update', { account: nextUsername, previousAccount: username })
    return nextUsername
  }

  const resetUserPassword = (username) => {
    if (session?.role !== 'admin') throw new Error('Chỉ quản trị viên được đặt lại mật khẩu.')
    setUsers((current) => current.map((user) => user.username === username ? { ...user, password: DEFAULT_RESET_PASSWORD, mustChangePassword: true, passwordResetAt: new Date().toISOString() } : user))
    trackEvent('admin_user_password_reset', { account: username })
    return DEFAULT_RESET_PASSWORD
  }

  const addLocation = (input) => {
    const location = normalizeLocationInput(input)
    if (!location.name) throw new Error('Tên địa điểm không được để trống.')
    if (session?.role === 'manager' && !canSessionManageCategory(session, location.category) && !canSessionManageLocation(session, location)) throw new Error('Bạn không có quyền thêm địa điểm vào nhóm này.')
    if (!['admin', 'manager'].includes(session?.role)) throw new Error('Tài khoản không có quyền quản lý địa điểm.')
    location.id = input.id?.trim() || makeLocationId(location.name)
    assertNoCrossLocationImageReuse(location, locations, location.id)
    setLocations((current) => [location, ...current.filter((item) => item.id !== location.id)])
    trackEvent('admin_location_create', { locationId: location.id, locationName: location.name })
    return location
  }

  const updateLocation = (id, input) => {
    const before = locations.find((item) => item.id === id)
    if (!before || !canSessionManageLocation(session, before)) throw new Error('Bạn không có quyền sửa địa điểm này.')
    const candidate = normalizeLocationInput(input, before)
    if (session?.role === 'manager' && !canSessionManageLocation(session, candidate) && !canSessionManageCategory(session, candidate.category)) throw new Error('Bạn không có quyền chuyển địa điểm sang nhóm này.')
    assertNoCrossLocationImageReuse(candidate, locations, id)
    let updated = null
    setLocations((current) => current.map((item) => {
      if (item.id !== id) return item
      updated = candidate
      return updated
    }))
    if (updated) trackEvent('admin_location_update', { locationId: id, locationName: updated.name })
    return updated
  }

  const deleteLocation = (id) => {
    const location = locations.find((item) => item.id === id)
    if (!location || !canSessionManageLocation(session, location)) throw new Error('Bạn không có quyền xóa địa điểm này.')
    setLocations((current) => current.filter((item) => item.id !== id))
    setFavorites((current) => current.filter((item) => item !== id))
    setReviews((current) => current.filter((review) => review.locationId !== id))
    setTravelHistory((current) => current.filter((entry) => entry.locationId !== id))
    setReminders((current) => current.filter((entry) => entry.locationId !== id))
    trackEvent('admin_location_delete', { locationId: id, locationName: location?.name || '' })
  }

  const resetLocations = () => {
    if (session?.role !== 'admin') throw new Error('Chỉ quản trị viên được khôi phục dữ liệu mặc định.')
    setLocations(baseLocations.map((item) => normalizeLocationInput(item)))
    setFavorites([])
  }

  const replaceLocations = (nextLocations) => {
    if (session?.role !== 'admin') throw new Error('Chỉ quản trị viên được thay thế toàn bộ dữ liệu.')
    if (!Array.isArray(nextLocations)) throw new Error('Dữ liệu nhập phải là một mảng địa điểm.')
    const cleaned = nextLocations.map((item, index) => {
      const next = normalizeLocationInput(item)
      if (!next.name) throw new Error(`Dòng ${index + 1} chưa có tên địa điểm.`)
      next.id = item.id || makeLocationId(next.name)
      return next
    })
    setLocations(cleaned)
  }

  const addReview = (locationId, { rating, comment }) => {
    if (!session || !['user', 'manager'].includes(session.role)) throw new Error('Bạn phải đăng nhập tài khoản người dùng để đánh giá.')
    if (!isValidVietnamMobilePhone(session.phone)) throw new Error('Tài khoản cần có số điện thoại hợp lệ trước khi đánh giá.')
    const score = Number(rating)
    if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error('Hãy chọn số sao từ 1 đến 5.')
    const text = String(comment || '').trim().slice(0, 800)
    const now = new Date().toISOString()
    let saved = null
    setReviews((current) => {
      const existing = current.find((review) => review.locationId === locationId && review.username === session.username)
      if (existing) {
        saved = { ...existing, rating: score, comment: text, displayName: session.displayName, updatedAt: now, replies: existing.replies || [] }
        return current.map((review) => review.id === existing.id ? saved : review)
      }
      saved = {
        id: makeId('review'),
        locationId,
        username: session.username,
        displayName: session.displayName,
        rating: score,
        comment: text,
        replies: [],
        createdAt: now,
        updatedAt: now
      }
      return [saved, ...current]
    })
    const location = locations.find((item) => item.id === locationId)
    trackEvent('review_submit', { locationId, locationName: location?.name || '', rating: score })
    return saved
  }

  const replyToReview = (reviewId, text) => {
    if (!session) throw new Error('Hãy đăng nhập để phản hồi đánh giá.')
    const comment = String(text || '').trim().slice(0, 600)
    if (!comment) throw new Error('Nội dung phản hồi không được để trống.')
    const reply = {
      id: makeId('reply'),
      username: session.username,
      displayName: session.displayName || session.username,
      role: session.role,
      avatar: session.avatar || null,
      comment,
      createdAt: new Date().toISOString()
    }
    setReviews((current) => current.map((review) => review.id === reviewId ? { ...review, replies: [...(review.replies || []), reply] } : review))
    trackEvent('review_reply', { reviewId })
    return reply
  }

  const deleteReview = (id) => {
    const review = reviews.find((item) => item.id === id)
    if (!review) return
    const location = locations.find((item) => item.id === review.locationId)
    const canModerate = session?.role === 'admin' || (session?.role === 'manager' && canSessionManageLocation(session, location))
    if (!canModerate) throw new Error('Bạn không có quyền xóa đánh giá của địa điểm này.')
    setReviews((current) => current.filter((item) => item.id !== id))
  }

  const deleteReviewReply = (reviewId, replyId) => {
    setReviews((current) => current.map((review) => {
      if (review.id !== reviewId) return review
      const reply = (review.replies || []).find((item) => item.id === replyId)
      if (!reply) return review
      const location = locations.find((item) => item.id === review.locationId)
      const canModerate = session?.role === 'admin' || (session?.role === 'manager' && canSessionManageLocation(session, location))
      if (!canModerate && reply.username !== session?.username) return review
      return { ...review, replies: (review.replies || []).filter((item) => item.id !== replyId) }
    }))
  }

  const recordTravel = (locationId, action = 'view') => {
    if (!session || !['user', 'manager'].includes(session.role) || !locationId) return null
    const now = new Date().toISOString()
    let saved = null
    setTravelHistory((current) => {
      const existing = current.find((entry) => entry.username === session.username && entry.locationId === locationId)
      if (existing) {
        saved = {
          ...existing,
          lastActivityAt: now,
          lastAction: action,
          viewCount: Number(existing.viewCount || 0) + (action === 'view' ? 1 : 0),
          routeCount: Number(existing.routeCount || 0) + (action === 'route' ? 1 : 0),
          visitedAt: action === 'visited' ? now : existing.visitedAt
        }
        return current.map((entry) => entry.id === existing.id ? saved : entry)
      }
      saved = {
        id: makeId('history'),
        username: session.username,
        locationId,
        firstSeenAt: now,
        lastActivityAt: now,
        lastAction: action,
        viewCount: action === 'view' ? 1 : 0,
        routeCount: action === 'route' ? 1 : 0,
        visitedAt: action === 'visited' ? now : null
      }
      return [saved, ...current]
    })
    return saved
  }

  const removeTravelHistory = (id) => setTravelHistory((current) => current.filter((entry) => !(entry.id === id && entry.username === session?.username)))

  const addReminder = ({ locationId, scheduledAt, note = '' }) => {
    if (!session || !['user', 'manager'].includes(session.role)) throw new Error('Hãy đăng nhập để tạo lịch nhắc.')
    const date = new Date(scheduledAt)
    if (!locationId) throw new Error('Hãy chọn địa điểm cần nhắc.')
    if (Number.isNaN(date.getTime())) throw new Error('Ngày giờ nhắc không hợp lệ.')
    const reminder = {
      id: makeId('reminder'),
      username: session.username,
      locationId,
      scheduledAt: date.toISOString(),
      note: String(note || '').trim().slice(0, 300),
      createdAt: new Date().toISOString(),
      completedAt: null,
      notifiedAt: null
    }
    setReminders((current) => [reminder, ...current])
    trackEvent('reminder_create', { locationId })
    return reminder
  }

  const deleteReminder = (id) => setReminders((current) => current.filter((entry) => !(entry.id === id && entry.username === session?.username)))
  const completeReminder = (id) => setReminders((current) => current.map((entry) => entry.id === id && entry.username === session?.username ? { ...entry, completedAt: new Date().toISOString() } : entry))
  const markReminderNotified = (id) => setReminders((current) => current.map((entry) => entry.id === id && entry.username === session?.username ? { ...entry, notifiedAt: new Date().toISOString() } : entry))

  const updateSiteSettings = (patch) => {
    if (session?.role !== 'admin') throw new Error('Chỉ quản trị viên được sửa cấu hình trang chủ.')
    setSiteSettings((current) => ({ ...current, ...patch }))
  }
  const resetSiteSettings = () => {
    if (session?.role !== 'admin') throw new Error('Chỉ quản trị viên được khôi phục cấu hình trang chủ.')
    setSiteSettings(DEFAULT_SITE_SETTINGS)
  }
  const clearAnalytics = () => {
    if (session?.role !== 'admin') throw new Error('Chỉ quản trị viên được xóa thống kê.')
    setAnalyticsEvents([])
  }

  const currentTravelHistory = useMemo(() => session?.username ? travelHistory.filter((entry) => entry.username === session.username) : [], [session?.username, travelHistory])
  const currentReminders = useMemo(() => session?.username ? reminders.filter((entry) => entry.username === session.username) : [], [reminders, session?.username])

  const reviewNotifications = useMemo(() => {
    if (!['admin', 'manager'].includes(session?.role)) return []
    return reviews
      .filter((review) => review.username !== session?.username)
      .map((review) => {
        const location = locations.find((item) => item.id === review.locationId)
        if (!location) return null
        if (session.role === 'manager' && !canSessionManageLocation(session, location)) return null
        const stamp = review.updatedAt || review.createdAt || ''
        return {
          id: `review:${review.id}:${stamp}`,
          reviewId: review.id,
          locationId: location.id,
          locationName: location.name,
          username: review.username,
          displayName: review.displayName || review.username,
          rating: review.rating,
          comment: review.comment || '',
          createdAt: stamp
        }
      })
      .filter(Boolean)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  }, [locations, reviews, session])

  const reviewReadKey = session?.username || (session?.role === 'admin' ? ADMIN_ACCOUNT.username : '')
  const readReviewNotificationIds = useMemo(() => new Set(Array.isArray(reviewNotificationReads?.[reviewReadKey]) ? reviewNotificationReads[reviewReadKey] : []), [reviewNotificationReads, reviewReadKey])
  const unreadReviewNotifications = useMemo(() => reviewNotifications.filter((item) => !readReviewNotificationIds.has(item.id)), [readReviewNotificationIds, reviewNotifications])

  const markReviewNotificationsRead = (ids = null) => {
    if (!reviewReadKey) return
    const nextIds = Array.isArray(ids) && ids.length ? ids : reviewNotifications.map((item) => item.id)
    if (!nextIds.length) return
    setReviewNotificationReads((current) => {
      const existing = Array.isArray(current?.[reviewReadKey]) ? current[reviewReadKey] : []
      return { ...current, [reviewReadKey]: [...new Set([...existing, ...nextIds])].slice(-1000) }
    })
  }

  const value = useMemo(() => ({
    favorites,
    isFavorite: (id) => favorites.includes(id),
    toggleFavorite,
    users,
    session,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    deleteUser,
    updateUserAccount,
    resetUserPassword,
    defaultResetPassword: DEFAULT_RESET_PASSWORD,
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    replaceLocations,
    resetLocations,
    canManageLocation: (location) => canSessionManageLocation(session, location),
    canManageCategory: (category) => canSessionManageCategory(session, category) || (session?.role === 'manager' && locations.some((item) => item.category === category && canSessionManageLocation(session, item))),
    reviews,
    addReview,
    replyToReview,
    deleteReview,
    deleteReviewReply,
    analyticsEvents,
    trackEvent,
    clearAnalytics,
    siteSettings,
    updateSiteSettings,
    resetSiteSettings,
    travelHistory,
    currentTravelHistory,
    recordTravel,
    removeTravelHistory,
    reminders,
    currentReminders,
    addReminder,
    deleteReminder,
    completeReminder,
    markReminderNotified,
    reviewNotifications,
    unreadReviewNotifications,
    unreadReviewCount: unreadReviewNotifications.length,
    markReviewNotificationsRead
  }), [favorites, users, session, locations, reviews, analyticsEvents, siteSettings, travelHistory, currentTravelHistory, reminders, currentReminders, reviewNotifications, unreadReviewNotifications, toggleFavorite, trackEvent])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

// ---------------------------------------------------------------------------
// useAppState — re-exported từ ApiStateContext để tất cả components import
// từ file này mà không cần sửa. AppStateProvider giữ lại để rollback.
// ---------------------------------------------------------------------------
export { useAppState } from './ApiStateContext'

/** @deprecated Dùng ApiStateProvider trong main.jsx thay thế */
export function _useAppStateLegacy() {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used inside AppStateProvider')
  return context
}
