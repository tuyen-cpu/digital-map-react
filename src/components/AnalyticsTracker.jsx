import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppState } from '../context/AppStateContext'

function sectionForPath(pathname) {
  if (pathname === '/trang-chu') return 'Trang chủ'
  if (pathname === '/' || pathname === '/ban-do-du-lich') return 'Bản đồ du lịch'
  if (pathname === '/kham-pha-dia-diem') return 'Khám phá địa điểm'
  if (pathname === '/place.html') return 'Chi tiết địa điểm'
  if (pathname === '/dang-nhap') return 'Đăng nhập'
  if (pathname === '/dang-ky') return 'Đăng ký'
  if (pathname === '/tai-khoan') return 'Tài khoản'
  if (pathname === '/admin') return 'Quản trị'
  if (pathname === '/admin/bao-cao') return 'Báo cáo quản trị'
  return 'Trang khác'
}

export default function AnalyticsTracker() {
  const location = useLocation()
  const { trackEvent } = useAppState()

  useEffect(() => {
    const key = `${location.pathname}${location.search}`
    const now = Date.now()
    const previous = sessionStorage.getItem('binh-dinh:last-page-track')
    if (previous) {
      try {
        const parsed = JSON.parse(previous)
        if (parsed.key === key && now - parsed.time < 1200) return
      } catch {}
    }
    sessionStorage.setItem('binh-dinh:last-page-track', JSON.stringify({ key, time: now }))
    trackEvent('page_view', {
      section: sectionForPath(location.pathname),
      path: key,
      title: document.title || ''
    })
  }, [location.pathname, location.search, trackEvent])

  return null
}
