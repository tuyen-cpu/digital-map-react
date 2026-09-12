/**
 * Travel history & reminders service
 */
import api from './api'

// History
export async function apiGetTravelHistory() {
  const res = await api.get('/travel/history/')
  return res.data.results
}

export async function apiRecordTravel(locationId, action = 'view') {
  const res = await api.post('/travel/history/', { locationId, action })
  return res.data
}

export async function apiDeleteTravelHistory(id) {
  await api.delete(`/travel/history/${id}/`)
}

// Reminders
export async function apiGetReminders() {
  const res = await api.get('/travel/reminders/')
  return res.data.results
}

export async function apiCreateReminder({ locationId, scheduledAt, note }) {
  const res = await api.post('/travel/reminders/', { locationId, scheduledAt, note })
  return res.data
}

export async function apiDeleteReminder(id) {
  await api.delete(`/travel/reminders/${id}/`)
}

export async function apiCompleteReminder(id) {
  const res = await api.patch(`/travel/reminders/${id}/`, {
    completedAt: new Date().toISOString(),
  })
  return res.data
}

export async function apiMarkReminderNotified(id) {
  const res = await api.patch(`/travel/reminders/${id}/`, {
    notifiedAt: new Date().toISOString(),
  })
  return res.data
}
