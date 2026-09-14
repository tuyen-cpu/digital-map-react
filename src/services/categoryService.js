import api from './api'

export async function apiGetCategories() {
  const res = await api.get('/categories/')
  return res.data.results  // [{key, label, shortLabel, emoji, description, marker, order, isActive}]
}

export async function apiCreateCategory(data) {
  const res = await api.post('/categories/', data)
  return res.data
}

export async function apiUpdateCategory(key, data) {
  const res = await api.put(`/categories/${key}/`, data)
  return res.data
}

export async function apiDeleteCategory(key) {
  await api.delete(`/categories/${key}/`)
}

export async function apiSeedCategories() {
  const res = await api.post('/categories/seed/')
  return res.data
}
