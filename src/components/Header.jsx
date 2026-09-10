import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Bell, CircleUserRound, LogIn, LogOut, Map, Menu, ShieldCheck, Star, UserPlus, X } from 'lucide-react'
import { useAppState } from '../context/AppStateContext'
import MediaImage from './MediaImage'

const navItems = [
  { to: '/', label: 'Trang chủ' },
  { to: '/ban-do-du-lich', label: 'Bản đồ du lịch' },
  { to: '/kham-pha-dia-diem', label: 'Khám phá địa điểm' }
]

function navClass({ isActive }) {
  return `rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-700 hover:bg-brand-50 hover:text-brand-800'}`
}

function drawerNavClass({ isActive }) {
  return `flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-bold transition ${isActive ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-800 hover:bg-brand-50 hover:text-brand-800'}`
}

function NotificationCount({ count }) {
  if (!count) return null
  return <span className="ml-1 grid min-w-5 place-items-center rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-black leading-4 text-white">{count > 99 ? '99+' : count}</span>
}

function notificationHref(notification) {
  const reviewHash = `review-${notification.reviewId}`
  return `/place.html?id=${encodeURIComponent(notification.locationId)}&review=${encodeURIComponent(notification.reviewId)}#${reviewHash}`
}

function NotificationItem({ notification, unread, onOpen, compact = false }) {
  return (
    <Link
      to={notificationHref(notification)}
      onClick={() => onOpen(notification)}
      className={`block rounded-2xl border px-3 py-3 transition ${unread ? 'border-sky-200 bg-sky-50 hover:bg-sky-100/80' : 'border-slate-100 bg-white hover:bg-slate-50'} ${compact ? '' : 'shadow-sm'}`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${unread ? 'bg-brand-600 text-white' : 'bg-blue-50 text-brand-700'}`}><Star size={15} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-xs font-black text-blue-950">{notification.locationName}</p>
            {unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-blue-600">{notification.displayName || notification.username} · {notification.rating}/5 sao</p>
          {notification.comment && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{notification.comment}</p>}
          <p className="mt-1.5 text-[10px] font-bold text-brand-700">Mở đúng địa điểm để phản hồi →</p>
        </div>
      </div>
    </Link>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const {
    session,
    logout,
    reviewNotifications = [],
    unreadReviewNotifications = [],
    unreadReviewCount = 0,
    markReviewNotificationsRead
  } = useAppState()
  const location = useLocation()
  const mapMode = location.pathname === '/ban-do-du-lich'
  const canManage = ['admin', 'manager'].includes(session?.role)
  const managementPath = session?.role === 'admin' ? '/admin' : '/quan-ly'
  const managementLabel = session?.role === 'admin' ? 'Quản trị' : 'Khu vực quản lý'
  const reviewPath = `${managementPath}?tab=reviews`
  const unreadIds = useMemo(() => new Set(unreadReviewNotifications.map((item) => item.id)), [unreadReviewNotifications])

  useEffect(() => {
    setOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleLogout = () => {
    // Giữ nguyên URL/trang đang xem sau khi đăng xuất.
    logout()
    setOpen(false)
    setNotificationsOpen(false)
  }

  const openNotification = (notification) => {
    markReviewNotificationsRead?.([notification.id])
    setOpen(false)
    setNotificationsOpen(false)
  }

  const drawer = open && typeof document !== 'undefined'
    ? createPortal(
      <div className="fixed inset-0 z-[2000] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
        <button type="button" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" aria-label="Đóng menu" onClick={() => setOpen(false)} />
        <aside className="absolute inset-y-0 right-0 flex w-[min(90vw,390px)] max-w-full flex-col overflow-hidden bg-white shadow-2xl">
          <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200 px-4">
            <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
              <img src="/logo-binh-dinh.png" alt="Logo Bình Định" className="h-12 w-12 shrink-0 rounded-full object-cover shadow-card ring-2 ring-sky-300/80" />
              <div className="min-w-0"><p className="truncate text-lg font-black tracking-wide text-brand-800">BÌNH ĐỊNH</p><p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Bản đồ du lịch số</p></div>
            </Link>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-100" aria-label="Đóng menu"><X size={23} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">Điều hướng</p>
            <nav className="grid gap-2">
              {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={drawerNavClass} onClick={() => setOpen(false)}><span>{item.label}</span><span aria-hidden="true">›</span></NavLink>)}
            </nav>

            <div className="my-5 h-px bg-slate-200" />
            <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">Tài khoản</p>
            <div className="grid gap-2">
              {!session ? (
                <>
                  <NavLink to="/dang-nhap" className={drawerNavClass} onClick={() => setOpen(false)}><span className="inline-flex items-center gap-2"><LogIn size={18} /> Đăng nhập</span><span aria-hidden="true">›</span></NavLink>
                  <NavLink to="/dang-ky" className={drawerNavClass} onClick={() => setOpen(false)}><span className="inline-flex items-center gap-2"><UserPlus size={18} /> Đăng ký</span><span aria-hidden="true">›</span></NavLink>
                </>
              ) : (
                <>
                  {session.role !== 'admin' && <NavLink to="/tai-khoan" className={drawerNavClass} onClick={() => setOpen(false)}><span className="inline-flex min-w-0 items-center gap-2">{session.avatar ? <MediaImage src={session.avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" /> : <CircleUserRound size={19} />}<span className="truncate">{session.displayName || 'Tài khoản'}</span></span><span aria-hidden="true">›</span></NavLink>}

                  {canManage && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/35 p-2.5">
                      <div className="flex items-center justify-between gap-2 px-1 pb-2">
                        <span className="inline-flex items-center gap-2 text-sm font-black text-blue-950"><Bell size={17} /> Đánh giá mới <NotificationCount count={unreadReviewCount} /></span>
                        <Link to={reviewPath} onClick={() => setOpen(false)} className="text-[11px] font-black text-brand-700">Xem tất cả</Link>
                      </div>
                      <div className="grid gap-2">
                        {reviewNotifications.slice(0, 5).map((notification) => <NotificationItem key={notification.id} notification={notification} unread={unreadIds.has(notification.id)} onOpen={openNotification} compact />)}
                        {!reviewNotifications.length && <p className="rounded-xl bg-white px-3 py-4 text-center text-xs text-blue-400">Chưa có đánh giá cần xử lý.</p>}
                      </div>
                    </div>
                  )}

                  {canManage && <NavLink to={managementPath} className={drawerNavClass} onClick={() => setOpen(false)}><span className="inline-flex items-center gap-2"><ShieldCheck size={18} /> {managementLabel}</span><span aria-hidden="true">›</span></NavLink>}
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3.5 text-left text-[15px] font-bold text-slate-800 transition hover:bg-slate-100"><LogOut size={18} /> Đăng xuất</button>
                </>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-medium text-slate-500">Phường Bình Định · Bản đồ du lịch số</div>
        </aside>
      </div>,
      document.body
    )
    : null

  return (
    <>
      <header className="sticky top-0 z-[1000] border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className={`flex h-20 items-center gap-3 sm:gap-4 ${mapMode ? 'w-full px-2 sm:px-3 lg:px-4' : 'mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8'}`}>
          <Link to="/" className={`flex min-w-0 items-center ${mapMode ? 'gap-3.5' : 'gap-3'}`} onClick={() => setOpen(false)}>
            <img src="/logo-binh-dinh.png" alt="Logo Bình Định" className={`${mapMode ? 'h-[62px] w-[62px] sm:h-[74px] sm:w-[74px]' : 'h-14 w-14'} shrink-0 rounded-full object-cover shadow-card ring-2 ring-sky-300/80`} />
            <div className="min-w-0"><p className={`truncate font-black tracking-wide text-brand-800 ${mapMode ? 'text-lg sm:text-[23px]' : 'text-lg sm:text-xl'}`}>BÌNH ĐỊNH</p><p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">Bản đồ du lịch số</p></div>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navClass}>{item.label}</NavLink>)}
            <span className="mx-1 h-7 w-px bg-slate-200" />
            {session ? (
              <>
                {session.role !== 'admin' && <NavLink to="/tai-khoan" className={navClass}><span className="inline-flex items-center gap-1.5">{session.avatar ? <MediaImage src={session.avatar} alt="" className="h-5 w-5 rounded-full object-cover" /> : <CircleUserRound size={16} />}{session.displayName || 'Tài khoản'}</span></NavLink>}
                {canManage && (
                  <div className="relative">
                    <button type="button" onClick={() => setNotificationsOpen((value) => !value)} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-800" aria-expanded={notificationsOpen} aria-label="Mở thông báo đánh giá">
                      <Bell size={16} />Thông báo<NotificationCount count={unreadReviewCount} />
                    </button>
                    {notificationsOpen && (
                      <div className="absolute right-0 top-[calc(100%+10px)] z-[1200] w-[390px] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-blue-50 px-4 py-3">
                          <div><p className="text-sm font-black text-blue-950">Đánh giá cần xử lý</p><p className="mt-0.5 text-[10px] text-blue-500">Bấm một đánh giá để mở đúng địa điểm và phản hồi.</p></div>
                          <button type="button" onClick={() => setNotificationsOpen(false)} className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-50"><X size={16} /></button>
                        </div>
                        <div className="max-h-[430px] space-y-2 overflow-y-auto p-3">
                          {reviewNotifications.slice(0, 8).map((notification) => <NotificationItem key={notification.id} notification={notification} unread={unreadIds.has(notification.id)} onOpen={openNotification} />)}
                          {!reviewNotifications.length && <p className="rounded-xl bg-blue-50/50 px-4 py-8 text-center text-xs text-blue-400">Chưa có đánh giá cần xử lý.</p>}
                        </div>
                        <Link to={reviewPath} onClick={() => setNotificationsOpen(false)} className="block border-t border-blue-50 px-4 py-3 text-center text-xs font-black text-brand-700 hover:bg-blue-50">Mở trang quản lý đánh giá</Link>
                      </div>
                    )}
                  </div>
                )}
                <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"><LogOut size={16} /> Đăng xuất</button>
                {canManage && <NavLink to={managementPath} className={navClass}><span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} />{managementLabel}</span></NavLink>}
              </>
            ) : (
              <>
                <NavLink to="/dang-nhap" className={navClass}><span className="inline-flex items-center gap-1.5"><LogIn size={16} />Đăng nhập</span></NavLink>
                <NavLink to="/dang-ky" className={navClass}><span className="inline-flex items-center gap-1.5"><UserPlus size={16} />Đăng ký</span></NavLink>
              </>
            )}
          </nav>

          <Link to="/ban-do-du-lich" className="ml-auto hidden rounded-xl bg-brand-700 p-2.5 text-white shadow-sm hover:bg-brand-800 sm:inline-flex lg:hidden" aria-label="Mở bản đồ"><Map size={20} /></Link>
          <button type="button" onClick={() => setOpen((value) => !value)} className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 sm:ml-0 lg:hidden" aria-label="Mở menu" aria-expanded={open}><Menu size={23} /></button>
        </div>
      </header>
      {drawer}
    </>
  )
}
