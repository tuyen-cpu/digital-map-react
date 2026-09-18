/**
 * Axios instance với JWT interceptor.
 * Base URL đọc từ VITE_API_URL (mặc định http://localhost:8000/api)
 */
import axios from 'axios'

const BASE_URL = import.meta.env.BE_API_URL || 'http://localhost:8000/api'
const TOKEN_KEY = 'binh-dinh:jwt-token'
const REFRESH_KEY = 'binh-dinh:jwt-refresh'

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — đính token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — auto refresh khi 401
let _refreshing = false
let _queue = []

function _processQueue(error, token = null) {
  _queue.forEach((item) => (error ? item.reject(error) : item.resolve(token)))
  _queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    // Bỏ qua 401 từ login/logout — đây là intentional (sai mật khẩu hoặc clear token)
    if (error.response?.status === 401 && (
      original.url?.includes('/auth/logout/') ||
      original.url?.includes('/auth/login/')
    )) {
      return Promise.reject(error)
    }
    if (error.response?.status === 401 && !original._retry) {
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            },
            reject,
          })
        })
      }
      original._retry = true
      _refreshing = true
      const refresh = localStorage.getItem(REFRESH_KEY)
      if (!refresh) {
        _refreshing = false
        _handleUnauthorized()
        return Promise.reject(error)
      }
      try {
        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        const newAccess = res.data.access
        localStorage.setItem(TOKEN_KEY, newAccess)
        _processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (err) {
        _processQueue(err, null)
        _handleUnauthorized()
        return Promise.reject(err)
      } finally {
        _refreshing = false
      }
    }
    return Promise.reject(error)
  },
)

function _clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// ---------------------------------------------------------------------------
// Unauthorized redirect callback
// Context (ApiStateContext) gọi setUnauthorizedHandler để đăng ký handler.
// Khi refresh thất bại / không có refresh token → gọi handler → redirect login.
// ---------------------------------------------------------------------------
let _unauthorizedHandler = null

export function setUnauthorizedHandler(fn) {
  _unauthorizedHandler = fn
}

function _handleUnauthorized() {
  _clearTokens()
  if (_unauthorizedHandler) {
    _unauthorizedHandler()
  } else {
    // Fallback nếu chưa có handler (e.g. trước khi React mount)
    const path = window.location.pathname
    const isProtected = ['/admin', '/quan-ly', '/tai-khoan'].some((p) => path.startsWith(p))
    if (isProtected) window.location.href = '/dang-nhap'
  }
}

// ---------------------------------------------------------------------------
// Token helpers (dùng trong AuthContext)
// ---------------------------------------------------------------------------
export function saveTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  _clearTokens()
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export default api
