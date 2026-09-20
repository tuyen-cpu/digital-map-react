import { Bell, CalendarClock, Camera, CheckCircle2, Clock3, KeyRound, LoaderCircle, MapPin, Navigation, Save, Search, Trash2, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import MediaImage from '../components/MediaImage'
import VisitedMap from '../components/VisitedMap'
import { useAppState } from '../context/AppStateContext'
import { uploadMedia } from '../services/mediaService'
import { formatVietnamPhone, isValidVietnamMobilePhone, VIETNAM_PHONE_HELP } from '../utils/phone'
import { locationMatches } from '../utils/text'

const AVATAR_MAX_BYTES = 5 * 1024 * 1024 // 5 MB

function dateTime(value) {
  if (!value) return '—'
  try { return new Date(value).toLocaleString('vi-VN') } catch { return value }
}

function localInputValue(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function ProfilePage() {
  const {
    session, updateProfile, locations, currentTravelHistory, recordTravel, removeTravelHistory,
    currentReminders, addReminder, deleteReminder, completeReminder
  } = useAppState()
  const [form, setForm] = useState({ displayName: '', phone: '', avatar: '' })
  const [notice, setNotice] = useState('')
  const [noticeError, setNoticeError] = useState(false)
  const [profileBusy, setProfileBusy] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [reminderForm, setReminderForm] = useState({ locationId: '', scheduledAt: localInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)), note: '' })
  const [reminderQuery, setReminderQuery] = useState('')
  const [reminderSearchOpen, setReminderSearchOpen] = useState(false)
  const reminderSearchRef = useRef(null)

  useEffect(() => {
    if (['user', 'manager'].includes(session?.role)) setForm({ displayName: session.displayName || '', phone: formatVietnamPhone(session.phone || ''), avatar: session.avatar || '' })
  }, [session?.avatar, session?.displayName, session?.phone, session?.role])

  useEffect(() => {
    const handleOutsidePointerDown = (event) => {
      if (!reminderSearchRef.current?.contains(event.target)) setReminderSearchOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [])

  const history = useMemo(() => [...currentTravelHistory].sort((a, b) => String(b.lastActivityAt || '').localeCompare(String(a.lastActivityAt || ''))), [currentTravelHistory])
  const locationById = useMemo(() => new Map(locations.map((item) => [item.id, item])), [locations])
  const reminderCandidates = useMemo(() => {
    const query = reminderQuery.trim()
    const source = query ? locations.filter((location) => locationMatches(location, query)) : locations
    return source.slice(0, 10)
  }, [locations, reminderQuery])
  const selectedReminderLocation = reminderForm.locationId ? locationById.get(reminderForm.locationId) : null

  if (!session) return <Navigate to="/dang-nhap" replace state={{ from: '/tai-khoan' }} />
  if (session.role === 'admin') return <Navigate to="/admin" replace />

  const submit = async (event) => {
    event.preventDefault()
    setNotice('')
    setNoticeError(false)
    if (!isValidVietnamMobilePhone(form.phone)) {
      setNoticeError(true)
      return setNotice(VIETNAM_PHONE_HELP)
    }
    setProfileBusy(true)
    try {
      await updateProfile(form)
      setNoticeError(false)
      setNotice('Đã cập nhật thông tin tài khoản.')
    } catch (e) {
      setNoticeError(true)
      setNotice(e.message || 'Không cập nhật được tài khoản.')
    } finally {
      setProfileBusy(false)
    }
  }

  const uploadAvatar = async (file) => {
    if (!file) return
    setAvatarBusy(true)
    setNotice('')
    setNoticeError(false)
    try {
      if (file.size > AVATAR_MAX_BYTES) {
        setNoticeError(true)
        setNotice('Ảnh đại diện không được vượt quá 5 MB.')
        return
      }
      const url = await uploadMedia(file, { folder: 'avatars' })
      setForm((current) => ({ ...current, avatar: url }))
      await updateProfile({ displayName: form.displayName, phone: form.phone, avatar: url })
      setNoticeError(false)
      setNotice('Đã cập nhật ảnh đại diện.')
    } catch (e) {
      setNoticeError(true)
      setNotice(e.message || 'Không tải được ảnh đại diện.')
    } finally {
      setAvatarBusy(false)
    }
  }

  const createReminder = async (event) => {
    event.preventDefault()
    setNotice('')
    setNoticeError(false)
    try {
      await addReminder(reminderForm)
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
      setNoticeError(false)
      setNotice('Đã tạo lịch nhắc. Nếu trình duyệt cho phép thông báo, website sẽ nhắc khi đang mở.')
      setReminderForm({ locationId: '', note: '', scheduledAt: localInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)) })
      setReminderQuery('')
      setReminderSearchOpen(false)
    } catch (e) {
      setNoticeError(true)
      setNotice(e.message || 'Không tạo được lịch nhắc.')
    }
  }

  const inputClass = 'mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-3 text-blue-950 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100'
  const SaveIcon = profileBusy ? LoaderCircle : Save

  return (
    <main className="min-h-[calc(100dvh-5rem)] bg-gradient-to-br from-white via-blue-50/70 to-sky-100/60 px-2.5 py-4 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Tài khoản</p><h1 className="mt-2 text-2xl font-black text-blue-950 sm:text-3xl">Không gian cá nhân</h1><p className="mt-2 text-sm text-blue-600/75">Quản lý hồ sơ, lịch sử hành trình, lịch nhắc và bản đồ những nơi bạn đã lưu/đã đến.</p></div>
          {session.role === 'manager' && <Link to="/quan-ly" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white">Mở khu vực quản lý</Link>}
        </div>

        {notice && <div className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-card ${noticeError ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-white text-blue-700'}`}>{notice}</div>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center gap-4">
              <div className="relative"><div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-blue-50 bg-blue-100 text-brand-700 shadow">{form.avatar ? <MediaImage src={form.avatar} alt="Ảnh đại diện" className="h-full w-full object-cover" /> : <UserRound size={36} />}</div><label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700" title="Thay ảnh đại diện"><Camera size={17} /><input type="file" accept="image/*" className="hidden" disabled={avatarBusy} onChange={(e) => uploadAvatar(e.target.files?.[0])} /></label></div>
              <div className="min-w-0"><p className="truncate text-xl font-black text-blue-950">{session.displayName}</p><p className="mt-1 text-sm text-blue-500">@{session.username}</p><p className="mt-1 text-xs font-bold text-brand-700">{session.role === 'manager' ? 'Tài khoản được phân quyền quản lý' : 'Người dùng'}</p></div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block"><span className="text-sm font-bold text-blue-950">Tên đăng nhập</span><input disabled value={session.username} className={`${inputClass} cursor-not-allowed bg-blue-50 text-blue-500`} /></label>
              <label className="block"><span className="text-sm font-bold text-blue-950">Tên hiển thị</span><input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className={inputClass} /></label>
              <label className="block"><span className="text-sm font-bold text-blue-950">Số điện thoại</span><input required inputMode="tel" maxLength={16} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+ .-]/g, '') })} className={inputClass} /><span className="mt-1.5 block text-[11px] text-blue-500">{VIETNAM_PHONE_HELP}</span></label>
              <button type="submit" disabled={profileBusy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-black text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"><SaveIcon size={17} className={profileBusy ? 'animate-spin' : ''} />{profileBusy ? 'Đang lưu...' : 'Lưu thông tin'}</button>
              <Link to="/doi-mat-khau" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-3 text-sm font-black text-brand-700 hover:bg-blue-50"><KeyRound size={17} />Đổi mật khẩu</Link>
            </form>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Lịch sử</p><h2 className="mt-1 text-2xl font-black text-blue-950">Các nơi đã xem / dẫn đường / đã đến</h2></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-brand-700">{history.length} địa điểm</span></div>
              <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto pr-1">{history.map((entry) => { const location = locationById.get(entry.locationId); if (!location) return null; return <article key={entry.id} className="rounded-2xl border border-blue-100 p-3 sm:p-4"><div className="flex gap-3"><MediaImage src={location.image} alt="" className="h-16 w-20 shrink-0 rounded-xl bg-blue-50 object-cover" /><div className="min-w-0 flex-1"><Link to={`/place.html?id=${encodeURIComponent(location.id)}`} className="line-clamp-1 text-sm font-black text-blue-950 hover:text-brand-700">{location.name}</Link><p className="mt-1 text-[11px] text-blue-500">Hoạt động gần nhất: {dateTime(entry.lastActivityAt)}</p><div className="mt-2 flex flex-wrap gap-1.5">{entry.viewCount > 0 && <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">Xem {entry.viewCount} lần</span>}{entry.routeCount > 0 && <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">Dẫn đường {entry.routeCount} lần</span>}{entry.visitedAt && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Đã đến</span>}</div></div></div><div className="mt-3 flex flex-wrap gap-2"><Link to={`/ban-do-du-lich?routeTo=${encodeURIComponent(location.id)}&nav=1`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-black text-white"><Navigation size={13} />Dẫn đường</Link>{!entry.visitedAt && <button type="button" onClick={() => recordTravel(location.id, "visited")} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"><CheckCircle2 size={13} />Đánh dấu đã đến</button>}<button type="button" onClick={() => removeTravelHistory(entry.id).catch(() => {})} className="ml-auto rounded-lg p-2 text-blue-300 hover:bg-blue-50 hover:text-blue-600" title="Xóa khỏi lịch sử"><Trash2 size={15} /></button></div></article>})}{!history.length && <div className="rounded-2xl border border-dashed border-blue-200 p-7 text-center text-sm text-blue-500">Chưa có lịch sử. Khi bạn xem chi tiết hoặc bắt đầu dẫn đường, địa điểm sẽ được lưu vào đây.</div>}</div>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-card sm:p-6">
              <div className="flex items-center gap-2"><Bell size={20} className="text-brand-600" /><div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Lịch nhắc</p><h2 className="mt-1 text-xl font-black text-blue-950">Hẹn thời gian đi địa điểm</h2></div></div>
              <form onSubmit={createReminder} className="mt-4 grid gap-3 md:grid-cols-2">
                <label ref={reminderSearchRef} className="relative block"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Tìm địa điểm cần đi</span><div className="relative mt-2"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" /><input value={reminderQuery} onFocus={() => setReminderSearchOpen(true)} onChange={(e) => { setReminderQuery(e.target.value); setReminderForm((current) => ({ ...current, locationId: '' })); setReminderSearchOpen(true) }} placeholder="Nhập tên địa điểm, địa chỉ..." autoComplete="off" className="w-full rounded-xl border border-blue-100 bg-white py-3 pl-10 pr-3 text-blue-950 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" /></div>{selectedReminderLocation && <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">Đã chọn: {selectedReminderLocation.name}</p>}{reminderSearchOpen && <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-xl border border-blue-100 bg-white p-1 shadow-2xl">{reminderCandidates.map((location) => <button key={location.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setReminderForm((current) => ({ ...current, locationId: location.id })); setReminderQuery(location.name); setReminderSearchOpen(false) }} className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-blue-50"><MapPin size={15} className="mt-0.5 shrink-0 text-brand-600" /><span className="min-w-0"><span className="block truncate text-sm font-black text-blue-950">{location.name}</span><span className="mt-0.5 block line-clamp-1 text-[11px] text-blue-500">{location.address || location.group || 'Phường Bình Định'}</span></span></button>)}{!reminderCandidates.length && <p className="px-3 py-3 text-xs text-blue-400">Không tìm thấy địa điểm phù hợp.</p>}</div>}</label>
                <label className="block"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Ngày giờ nhắc</span><input required type="datetime-local" value={reminderForm.scheduledAt} onChange={(e) => setReminderForm({ ...reminderForm, scheduledAt: e.target.value })} className={inputClass} /></label>
                <label className="block md:col-span-2"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Ghi chú</span><input value={reminderForm.note} onChange={(e) => setReminderForm({ ...reminderForm, note: e.target.value })} placeholder="Ví dụ: đi cùng gia đình, xuất phát lúc 7 giờ..." className={inputClass} /></label>
                <button disabled={!reminderForm.locationId} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50 md:col-span-2"><CalendarClock size={17} />Tạo lịch nhắc</button>
              </form>
              <div className="mt-4 space-y-2">{currentReminders.sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt))).map((reminder) => { const location = locationById.get(reminder.locationId); return <div key={reminder.id} className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-3 ${reminder.completedAt ? 'border-blue-50 bg-blue-50/40 opacity-65' : 'border-blue-100 bg-white'}`}><Clock3 size={16} className="text-brand-600" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-blue-950">{location?.name || reminder.locationId}</p><p className="mt-0.5 text-xs text-blue-500">{dateTime(reminder.scheduledAt)}{reminder.note ? ` · ${reminder.note}` : ''}</p></div>{!reminder.completedAt && <button type="button" onClick={() => completeReminder(reminder.id).catch(() => {})} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Đã hoàn thành"><CheckCircle2 size={16} /></button>}<button type="button" onClick={() => deleteReminder(reminder.id).catch(() => {})} className="rounded-lg p-2 text-blue-300 hover:bg-blue-50 hover:text-blue-600"><Trash2 size={16} /></button></div>})}{!currentReminders.length && <p className="rounded-xl bg-blue-50/50 p-4 text-center text-xs text-blue-500">Chưa có lịch nhắc.</p>}</div>
            </section>
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Bản đồ cá nhân</p><h2 className="mt-1 text-2xl font-black text-blue-950">Những nơi có trong lịch sử</h2><p className="mt-1 text-sm text-blue-600/70">Marker dấu ✓ là địa điểm bạn đã đánh dấu “đã đến”.</p></div><MapPin className="text-brand-600" /></div>
          <div className="mt-4"><VisitedMap locations={locations} history={history} /></div>
        </section>
      </div>
    </main>
  )
}

