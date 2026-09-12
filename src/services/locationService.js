/**
 * Location service — thay thế localStorage locations trong AppStateContext
 */
import api from './api'

export async function apiGetLocations({ category, q } = {}) {
  const params = {}
  if (category && category !== 'all') params.category = category
  if (q) params.q = q
  const res = await api.get('/locations/', { params })
  return res.data.results   // array of locations
}

export async function apiGetLocation(id) {
  const res = await api.get(`/locations/${id}/`)
  return res.data
}

export async function apiCreateLocation(data) {
  const res = await api.post('/locations/', data)
  return res.data
}

export async function apiUpdateLocation(id, data) {
  const res = await api.put(`/locations/${id}/`, data)
  return res.data
}

export async function apiDeleteLocation(id) {
  await api.delete(`/locations/${id}/`)
}

export async function apiImportLocations(locations) {
  const res = await api.post('/locations/import/', locations)
  return res.data
}

export async function apiResetLocations() {
  const res = await api.post('/locations/reset/')
  return res.data
}
