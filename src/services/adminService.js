/**
 * Admin service — user management
 */
import api from './api'

export async function apiGetUsers() {
  const res = await api.get('/admin/users/')
  return res.data.results
}

export async function apiUpdateUser(username, data) {
  const res = await api.put(`/admin/users/${username}/`, data)
  return res.data
}

export async function apiDeleteUser(username) {
  await api.delete(`/admin/users/${username}/`)
}

export async function apiResetUserPassword(username) {
  const res = await api.post(`/admin/users/${username}/reset-password/`)
  return res.data  // { success, newPassword }
}
