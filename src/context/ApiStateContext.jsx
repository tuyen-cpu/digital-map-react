/**
 * ApiStateContext — cùng interface với AppStateContext nhưng dùng Django REST API
 * thay vì localStorage. Tất cả components giữ nguyên, chỉ swap Provider trong main.jsx.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getAccessToken, saveTokens, setUnauthorizedHandler } from '../services/api'
import { apiChangePassword, apiLogin, apiLogout, apiMe, apiRegister, apiUpdateProfile } from '../services/authService'
import { apiGetLocations, apiCreateLocation, apiUpdateLocation, apiDeleteLocation, apiImportLocations, apiResetLocations } from '../services/locationService'
import { apiGetReviews, apiGetAllReviews, apiSubmitReview, apiDeleteReview, apiReplyToReview, apiDeleteReviewReply } from '../services/reviewService'
import { apiGetFavorites, apiToggleFavorite } from '../services/favoriteService'
import { apiRecordTravel, apiGetTravelHistory, apiDeleteTravelHistory, apiGetReminders, apiCreateReminder, apiDeleteReminder, apiCompleteReminder, apiMarkReminderNotified } from '../services/travelService'
import { apiTrackEvent, apiGetAnalyticsEvents, apiClearAnalytics } from '../services/analyticsService'
import { apiGetSiteConfig, apiUpdateSiteConfig, apiResetSiteConfig } from '../services/siteConfigService'
import { apiGetUsers, apiUpdateUser, apiDeleteUser, apiResetUserPassword } from '../services/adminService'

const ApiStateContext = createContext(null)

// ---------------------------------------------------------------------------
// Visitor/session IDs (vẫn dùng localStorage — không cần server)
// ---------------------------------------------------------------------------
function makeId(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
function getVisitorId() {
  const key = 'binh-dinh:visitor-id'
  try {
    let id = localStorage.getItem(key)
    if (!id) { id = makeId('visitor'); localStorage.setItem(key, id) }
    return id
  } catch { return makeId('visitor') }
}
function getSessionId() {
  const key = 'binh-dinh:visit-session-id'
  try {
    let id = sessionStorage.getItem(key)
    if (!id) { id = makeId('session'); sessionStorage.setItem(key, id) }
    return id
  } catch { return makeId('session') }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ApiStateProvider({ children }) {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => {
    // Restore session từ token đã lưu lúc trước
    try {
      const raw = localStorage.getItem('binh-dinh:api-session')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [locations, setLocations] = useState([])
  const [locationsLoaded, setLocationsLoaded] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [reviews, setReviews] = useState([])       // cache theo locationId
  const [travelHistory, setTravelHistory] = useState([])
  const [reminders, setReminders] = useState([])
  const [analyticsEvents, setAnalyticsEvents] = useState([])
  const [siteSettings, setSiteSettings] = useState(null)
  const [users, setUsers] = useState([])
  const [reviewNotificationReads, setReviewNotificationReads] = useState(() => {
    try { return JSON.parse(localStorage.getItem('binh-dinh:review-notification-reads-v1') || '{}') } catch { return {} }
  })

  // ---------------------------------------------------------------------------
  // Persist session
  // ---------------------------------------------------------------------------
  useEffect(() => {
    try {
      if (session) localStorage.setItem('binh-dinh:api-session', JSON.stringify(session))
      else localStorage.removeItem('binh-dinh:api-session')
    } catch {}
  }, [session])

  // Đăng ký handler redirect khi token hết hạn và không thể refresh
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null)
      const path = window.location.pathname
      const isProtected = ['/admin', '/quan-ly', '/tai-khoan'].some((p) => path.startsWith(p))
      navigate(isProtected ? '/dang-nhap' : '/', { replace: true })
    })
  }, [navigate])

  // ---------------------------------------------------------------------------
  // Boot: verify token & load locations + site config
  // ---------------------------------------------------------------------------
  const _booted = useRef(false)
  useEffect(() => {
    if (_booted.current) return  // StrictMode double-invoke guard
    _booted.current = true

    // Load site config (public)
    apiGetSiteConfig()
      .then(setSiteSettings)
      .catch(() => {})

    // Load all locations once (public)
    apiGetLocations().then((data) => {
      setLocations(Array.isArray(data) ? data : [])
      setLocationsLoaded(true)
    }).catch(() => setLocationsLoaded(true))

    // Verify existing token
    if (getAccessToken()) {
      apiMe().then((user) => {
        setSession(user)
      }).catch(() => {
        clearTokens()
        setSession(null)
      })
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Load user-specific data when session changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!session || !['user', 'manager'].includes(session.role)) {
      setFavorites([])
      setTravelHistory([])
      setReminders([])
      return
    }
    apiGetFavorites().then(setFavorites).catch(() => {})
    apiGetTravelHistory().then(setTravelHistory).catch(() => {})
    apiGetReminders().then(setReminders).catch(() => {})
  }, [session?.username])

  // Load admin data
  useEffect(() => {
    if (session?.role !== 'admin') { setUsers([]); return }
    apiGetUsers().then(setUsers).catch(() => {})
    apiGetAnalyticsEvents().then(setAnalyticsEvents).catch(() => {})
  }, [session?.role])

  // Load reviews cho admin/manager
  useEffect(() => {
    if (!['admin', 'manager'].includes(session?.role)) { setReviews([]); return }
    apiGetAllReviews().then(setReviews).catch(() => {})
  }, [session?.role])

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------
  const trackEvent = useCallback((type, payload = {}) => {
    const now = Date.now()
    const signature = [type, payload.path || '', payload.locationId || '', payload.category || '', session?.username || ''].join('|')
    try {
      const previous = JSON.parse(sessionStorage.getItem('binh-dinh:last-event') || 'null')
      if (previous?.signature === signature && now - previous.time < 900) return null
      sessionStorage.setItem('binh-dinh:last-event', JSON.stringify({ signature, time: now }))
    } catch {}
    const event = {
      type,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      account: session?.username || '',
      role: session?.role || 'guest',
      ...payload,
    }
    // Fire and forget
    apiTrackEvent(event)
    // Keep local copy for admin analytics panel (loaded separately)
    const localEvent = { ...event, id: makeId('event'), createdAt: new Date(now).toISOString() }
    setAnalyticsEvents((prev) => [...prev.slice(-4999), localEvent])
    return localEvent
  }, [session])

  // ---------------------------------------------------------------------------
  // Favorites
  // ---------------------------------------------------------------------------
  const isFavorite = useCallback((id) => (favorites ?? []).includes(id), [favorites])

  const toggleFavorite = useCallback(async (id) => {
    try {
      const result = await apiToggleFavorite(id)
      if (result.favorited) setFavorites((prev) => [...prev, id])
      else setFavorites((prev) => prev.filter((f) => f !== id))
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Không thể cập nhật yêu thích.')
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  const login = async ({ username, password }) => {
    const user = await apiLogin({ username, password })
    setSession(user)
    trackEvent('login', { account: user.username, role: user.role })
    return user
  }

  const register = async ({ displayName, username, phone, password }) => {
    const user = await apiRegister({ displayName, username, phone, password })
    setSession(user)
    trackEvent('register', { account: user.username })
    return user
  }

  const logout = async () => {
    trackEvent('logout')
    const refreshToken = localStorage.getItem('binh-dinh:jwt-refresh')
    await apiLogout(refreshToken)
    setSession(null)
    setFavorites([])
    setTravelHistory([])
    setReminders([])
    setUsers([])
    setAnalyticsEvents([])
    navigate('/', { replace: true })
  }

  const updateProfile = async ({ displayName, phone, avatar }) => {
    const updated = await apiUpdateProfile({ displayName, phone, avatar })
    setSession((prev) => ({ ...prev, ...updated }))
    trackEvent('profile_update')
    return updated
  }

  const changePassword = async ({ currentPassword, newPassword }) => {
    await apiChangePassword({ currentPassword, newPassword })
    setSession((prev) => ({ ...prev, mustChangePassword: false }))
    trackEvent('password_change')
  }

  // ---------------------------------------------------------------------------
  // Locations
  // ---------------------------------------------------------------------------
  const addLocation = async (input) => {
    const location = await apiCreateLocation(input)
    setLocations((prev) => [location, ...prev])
    trackEvent('admin_location_create', { locationId: location.id, locationName: location.name })
    return location
  }

  const updateLocation = async (id, input) => {
    const updated = await apiUpdateLocation(id, input)
    setLocations((prev) => prev.map((l) => l.id === id ? updated : l))
    trackEvent('admin_location_update', { locationId: id, locationName: updated.name })
    return updated
  }

  const deleteLocation = async (id) => {
    await apiDeleteLocation(id)
    const location = locations.find((l) => l.id === id)
    setLocations((prev) => prev.filter((l) => l.id !== id))
    setFavorites((prev) => prev.filter((f) => f !== id))
    setReviews((prev) => prev.filter((r) => r.locationId !== id))
    trackEvent('admin_location_delete', { locationId: id, locationName: location?.name || '' })
  }

  const resetLocations = async () => {
    await apiResetLocations()
    const fresh = await apiGetLocations()
    setLocations(fresh)
    setFavorites([])
  }

  const replaceLocations = async (nextLocations) => {
    await apiImportLocations(nextLocations)
    const fresh = await apiGetLocations()
    setLocations(fresh)
  }

  const canManageLocation = useCallback((location) => {
    if (!session) return false
    if (session.role === 'admin') return true
    if (session.role !== 'manager') return false
    const { categories = [], groups = [], subgroups = [] } = session.permissions || {}
    return categories.includes(location?.category) ||
      (location?.group && groups.includes(location.group)) ||
      (location?.subgroup && subgroups.includes(location.subgroup))
  }, [session])

  const canManageCategory = useCallback((category) => {
    if (!session) return false
    if (session.role === 'admin') return true
    if (session.role !== 'manager') return false
    return (session.permissions?.categories || []).includes(category)
  }, [session])

  // ---------------------------------------------------------------------------
  // Reviews
  // ---------------------------------------------------------------------------
  const addReview = async (locationId, { rating, comment }) => {
    const review = await apiSubmitReview(locationId, { rating, comment })
    setReviews((prev) => {
      const filtered = prev.filter((r) => !(r.locationId === locationId && r.username === session?.username))
      return [review, ...filtered]
    })
    const location = locations.find((l) => l.id === locationId)
    trackEvent('review_submit', { locationId, locationName: location?.name || '', rating })
    return review
  }

  const replyToReview = async (reviewId, text) => {
    const reply = await apiReplyToReview(reviewId, text)
    setReviews((prev) => prev.map((r) =>
      r.id === reviewId ? { ...r, replies: [...(r.replies || []), reply] } : r
    ))
    trackEvent('review_reply', { reviewId })
    return reply
  }

  const deleteReview = async (id) => {
    await apiDeleteReview(id)
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const deleteReviewReply = async (reviewId, replyId) => {
    await apiDeleteReviewReply(reviewId, replyId)
    setReviews((prev) => prev.map((r) =>
      r.id === reviewId ? { ...r, replies: (r.replies || []).filter((reply) => reply.id !== replyId) } : r
    ))
  }

  // ---------------------------------------------------------------------------
  // Travel history
  // ---------------------------------------------------------------------------
  const recordTravel = useCallback(async (locationId, action = 'view') => {
    if (!session || !['user', 'manager'].includes(session.role) || !locationId) return null
    try {
      const entry = await apiRecordTravel(locationId, action)
      setTravelHistory((prev) => {
        const filtered = prev.filter((e) => e.locationId !== locationId)
        return [entry, ...filtered]
      })
      return entry
    } catch { return null }
  }, [session])

  const removeTravelHistory = async (id) => {
    await apiDeleteTravelHistory(id)
    setTravelHistory((prev) => prev.filter((e) => e.id !== id))
  }

  // ---------------------------------------------------------------------------
  // Reminders
  // ---------------------------------------------------------------------------
  const addReminder = async ({ locationId, scheduledAt, note = '' }) => {
    const reminder = await apiCreateReminder({ locationId, scheduledAt, note })
    setReminders((prev) => [reminder, ...prev])
    trackEvent('reminder_create', { locationId })
    return reminder
  }

  const deleteReminder = async (id) => {
    await apiDeleteReminder(id)
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  const completeReminder = async (id) => {
    const updated = await apiCompleteReminder(id)
    setReminders((prev) => prev.map((r) => r.id === id ? updated : r))
  }

  const markReminderNotified = async (id) => {
    const updated = await apiMarkReminderNotified(id)
    setReminders((prev) => prev.map((r) => r.id === id ? updated : r))
  }

  // ---------------------------------------------------------------------------
  // Admin — Users
  // ---------------------------------------------------------------------------
  const deleteUser = async (username) => {
    await apiDeleteUser(username)
    setUsers((prev) => prev.filter((u) => u.username !== username))
    setReviews((prev) => prev.filter((r) => r.username !== username))
    setTravelHistory((prev) => prev.filter((e) => e.username !== username))
    setReminders((prev) => prev.filter((e) => e.username !== username))
  }

  const updateUserAccount = async (username, patch = {}) => {
    const updated = await apiUpdateUser(username, patch)
    setUsers((prev) => prev.map((u) => u.username === username ? updated : u))
    trackEvent('admin_user_update', { account: updated.username })
    return updated.username
  }

  const resetUserPassword = async (username) => {
    const result = await apiResetUserPassword(username)
    setUsers((prev) => prev.map((u) => u.username === username ? { ...u, mustChangePassword: true } : u))
    trackEvent('admin_user_password_reset', { account: username })
    return result.newPassword
  }

  // ---------------------------------------------------------------------------
  // Site settings
  // ---------------------------------------------------------------------------
  const updateSiteSettings = async (patch) => {
    const updated = await apiUpdateSiteConfig(patch)
    setSiteSettings(updated)
    return updated
  }

  const resetSiteSettings = async () => {
    const updated = await apiResetSiteConfig()
    setSiteSettings(updated)
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------
  const clearAnalytics = async () => {
    await apiClearAnalytics()
    setAnalyticsEvents([])
  }

  // ---------------------------------------------------------------------------
  // Review notifications (admin/manager)
  // ---------------------------------------------------------------------------
  const reviewNotifications = useMemo(() => {
    if (!['admin', 'manager'].includes(session?.role)) return []
    return reviews
      .filter((r) => r.username !== session?.username)
      .map((r) => {
        const location = locations.find((l) => l.id === r.locationId)
        return {
          id: r.id,          // alias cho unreadIds.has(notification.id) trong Header
          reviewId: r.id,
          locationId: r.locationId,
          locationName: location?.name || r.locationId,
          username: r.username,
          displayName: r.displayName,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        }
      })
  }, [reviews, session, locations])

  const unreadReviewNotifications = useMemo(() => {
    return reviewNotifications.filter((n) => !reviewNotificationReads[n.reviewId])
  }, [reviewNotifications, reviewNotificationReads])

  // ids: array reviewId cần đánh dấu đã đọc — nếu không truyền thì mark tất cả
  const markReviewNotificationsRead = useCallback((ids) => {
    const next = { ...reviewNotificationReads }
    const targets = Array.isArray(ids) && ids.length > 0
      ? reviewNotifications.filter((n) => ids.includes(n.reviewId))
      : reviewNotifications
    targets.forEach((n) => { next[n.reviewId] = true })
    setReviewNotificationReads(next)
    try { localStorage.setItem('binh-dinh:review-notification-reads-v1', JSON.stringify(next)) } catch {}
  }, [reviewNotifications, reviewNotificationReads])

  // ---------------------------------------------------------------------------
  // Travel history / reminders scoped to current user
  // ---------------------------------------------------------------------------
  const currentTravelHistory = useMemo(() =>
    session?.username ? travelHistory : []
  , [session?.username, travelHistory])

  const currentReminders = useMemo(() =>
    session?.username ? reminders : []
  , [session?.username, reminders])

  // ---------------------------------------------------------------------------
  // Context value — SAME interface as AppStateContext
  // ---------------------------------------------------------------------------
  const value = useMemo(() => ({
    // State — always arrays, never undefined
    session,
    locations: locations ?? [],
    locationsLoaded,
    favorites: favorites ?? [],
    reviews: reviews ?? [],
    setReviews,
    travelHistory: travelHistory ?? [],
    currentTravelHistory: currentTravelHistory ?? [],
    reminders: reminders ?? [],
    currentReminders: currentReminders ?? [],
    analyticsEvents: analyticsEvents ?? [],
    siteSettings: siteSettings ?? { heroSlides: [], heroIntervalMs: 5200 },
    siteSettingsLoaded: siteSettings !== null,
    users: users ?? [],
    reviewNotifications: reviewNotifications ?? [],
    unreadReviewNotifications: unreadReviewNotifications ?? [],
    unreadReviewCount: (unreadReviewNotifications ?? []).length,

    // Auth
    login,
    register,
    logout,
    updateProfile,
    changePassword,

    // Locations
    addLocation,
    updateLocation,
    deleteLocation,
    resetLocations,
    replaceLocations,
    canManageLocation,
    canManageCategory,

    // Reviews
    addReview,
    replyToReview,
    deleteReview,
    deleteReviewReply,

    // Favorites
    isFavorite,
    toggleFavorite,

    // Travel
    recordTravel,
    removeTravelHistory,
    addReminder,
    deleteReminder,
    completeReminder,
    markReminderNotified,

    // Admin
    deleteUser,
    updateUserAccount,
    resetUserPassword,

    // Site settings
    updateSiteSettings,
    resetSiteSettings,

    // Analytics
    trackEvent,
    clearAnalytics,
    markReviewNotificationsRead,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    session, locations, locationsLoaded, favorites, reviews, travelHistory,
    currentTravelHistory, reminders, currentReminders, analyticsEvents,
    siteSettings, users, reviewNotifications, unreadReviewNotifications,
    toggleFavorite, isFavorite, canManageLocation, canManageCategory, recordTravel, trackEvent,
  ])

  return <ApiStateContext.Provider value={value}>{children}</ApiStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(ApiStateContext)
  if (!ctx) throw new Error('useAppState must be used within ApiStateProvider')
  return ctx
}
