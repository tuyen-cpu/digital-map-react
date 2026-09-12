/**
 * Auth service — thay thế các hàm login/register/logout/... trong AppStateContext
 */
import api, { saveTokens, clearTokens } from './api'

export async function apiLogin({ username, password }) {
  const res = await api.post('/auth/login/', { username, password })
  const { access, refresh, user } = res.data
  saveTokens(access, refresh)
  return user  // { id, username, displayName, phone, role, avatar, mustChangePassword, permissions }
}

export async function apiRegister({ displayName, username, phone, password }) {
  const res = await api.post('/auth/register/', { displayName, username, phone, password })
  const { access, refresh, user } = res.data
  saveTokens(access, refresh)
  return user
}

export async function apiLogout(refreshToken) {
  try {
    await api.post('/auth/logout/', { refresh: refreshToken })
  } catch (_) {
    // Ignore errors on logout
  } finally {
    clearTokens()
  }
}

export async function apiMe() {
  const res = await api.get('/auth/me/')
  return res.data
}

export async function apiUpdateProfile({ displayName, phone, avatar }) {
  const res = await api.put('/auth/profile/', { displayName, phone, avatar })
  return res.data
}

export async function apiChangePassword({ currentPassword, newPassword }) {
  const res = await api.post('/auth/change-password/', { currentPassword, newPassword })
  return res.data
}
