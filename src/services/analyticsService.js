/**
 * Analytics service
 */
import api from './api'

export async function apiTrackEvent(event) {
  try {
    await api.post('/analytics/events/', event)
  } catch (_) {
    // Analytics tracking should never break the app
  }
}

export async function apiGetAnalyticsEvents({ type } = {}) {
  const params = {}
  if (type) params.type = type
  const res = await api.get('/analytics/events/', { params })
  return res.data.results
}

export async function apiClearAnalytics() {
  const res = await api.delete('/analytics/events/')
  return res.data
}
