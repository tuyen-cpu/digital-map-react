/**
 * Site config service
 */
import api from './api'

export async function apiGetSiteConfig() {
  const res = await api.get('/site-config/')
  return res.data  // { heroSlides, heroIntervalMs }
}

export async function apiUpdateSiteConfig(data) {
  const res = await api.put('/site-config/', data)
  return res.data
}

export async function apiResetSiteConfig() {
  const res = await api.post('/site-config/reset/')
  return res.data
}
