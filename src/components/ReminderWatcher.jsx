import { useEffect } from 'react'
import { useAppState } from '../context/AppStateContext'

export default function ReminderWatcher() {
  const { session, currentReminders, locations, markReminderNotified } = useAppState()

  useEffect(() => {
    if (!session || !['user', 'manager'].includes(session.role)) return undefined
    const check = () => {
      const now = Date.now()
      currentReminders.forEach((reminder) => {
        if (reminder.completedAt || reminder.notifiedAt) return
        const due = new Date(reminder.scheduledAt).getTime()
        if (!Number.isFinite(due) || due > now) return
        const location = locations.find((item) => item.id === reminder.locationId)
        const title = `Lịch nhắc: ${location?.name || 'địa điểm'}`
        const body = reminder.note || 'Đã đến thời gian bạn đặt lịch.'
        if ('Notification' in window && Notification.permission === 'granted') {
          try { new Notification(title, { body, icon: '/logo-binh-dinh.png' }) } catch {}
        }
        markReminderNotified(reminder.id)
      })
    }
    check()
    const timer = window.setInterval(check, 30000)
    return () => window.clearInterval(timer)
  }, [currentReminders, locations, markReminderNotified, session])

  return null
}
