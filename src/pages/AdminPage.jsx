import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Bell, Building2, Database, Download, Image, KeyRound, LayoutDashboard, Layers, MapPin, Navigation, Pencil, Plus, RotateCcw, Search, Settings, Star, Trash2, Upload, Users } from 'lucide-react'
import { Navigate, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import AdminLocationModal from '../components/AdminLocationModal'
import AdminReportsPanel from '../components/AdminReportsPanel'
import AdminReviewItem from '../components/AdminReviewItem'
import AdminUserModal from '../components/AdminUserModal'
import AdminCategoriesTab from '../components/AdminCategoriesTab'
import MediaImage from '../components/MediaImage'
import { useDebounce } from '../hooks/useDebounce'
import { useAppState } from '../context/AppStateContext'
import { useCategories } from '../hooks/useCategories'
import { uploadMedia } from '../services/mediaService'
import { CATEGORIES, getCategory } from '../utils/categories'
import { hasCoordinates } from '../utils/format'
import { formatVietnamPhone } from '../utils/phone'
import { locationMatches } from '../utils/text'
import { downloadExcelWorkbook } from '../utils/excelExport'

function dateTime(value) {
  if (!value) return ''
  try { return new Date(value).toLocaleString('vi-VN') } catch { return value }
}



export default function AdminPage({ mode = 'admin' }) {
  const {
    session, login, logout, users, deleteUser, updateUserAccount, resetUserPassword,
    locations, addLocation, updateLocation, deleteLocation, canManageLocation, canManageCategory,
    reviews, replyToReview, deleteReview, analyticsEvents, clearAnalytics, siteSettings, siteSettingsLoaded, updateSiteSettings, resetSiteSettings,
    unreadReviewNotifications, markReviewNotificationsRead
  } = useAppState()
  const { categories: liveCategories, getCategory: getLiveCat } = useCategories()
  const managerPortal = mode === 'manager'

  // Dùng live categories để label
  const categoryLabel = (key) => getLiveCat(key)?.label || key || ''
  const authenticated = managerPortal ? session?.role === 'manager' : session?.role === 'admin'
  const isAdmin = !managerPortal && session?.role === 'admin'
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [locPage, setLocPage] = useState(1)
  const LOC_PAGE_SIZE = 40
  const [editor, setEditor] = useState({ open: false, location: null })
  const [userEditor, setUserEditor] = useState({ open: false, user: null })
  const [notice, setNotice] = useState(null) // { msg, type: 'success'|'error'|'info' }
  const showNotice = (msg, type = 'info') => setNotice({ msg, type })
  const [slideBusy, setSlideBusy] = useState(-1)
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview')

  const manageableLocations = useMemo(() => isAdmin ? locations : locations.filter(canManageLocation), [isAdmin, locations, session?.permissions])
  const manageableLocationIds = useMemo(() => new Set(manageableLocations.map((item) => item.id)), [manageableLocations])
  const manageableReviews = useMemo(() => isAdmin ? reviews : reviews.filter((review) => manageableLocationIds.has(review.locationId)), [isAdmin, manageableLocationIds, reviews])
  const scopedAnalyticsEvents = useMemo(() => isAdmin ? analyticsEvents : analyticsEvents.filter((event) => event.locationId && manageableLocationIds.has(event.locationId)), [analyticsEvents, isAdmin, manageableLocationIds])
  const allowedCategories = useMemo(() => isAdmin ? liveCategories.map((item) => item.key) : liveCategories.filter((item) => canManageCategory(item.key)).map((item) => item.key), [isAdmin, session?.permissions])

  const stats = useMemo(() => ({
    total: manageableLocations.length,
    gps: manageableLocations.filter(hasCoordinates).length,
    administration: manageableLocations.filter((item) => item.category === 'administration').length,
    users: users.length,
    reviews: manageableReviews.length
  }), [manageableLocations, manageableReviews.length, users.length])

  const filtered = useMemo(() => { setLocPage(1); return manageableLocations.filter((item) => (category === 'all' || item.category === category) && locationMatches(item, query)) }, [category, manageableLocations, query])
  const pageViews = useMemo(() => scopedAnalyticsEvents.filter((event) => event.type === 'page_view' && event.role !== 'admin'), [scopedAnalyticsEvents])
  const locationViews = useMemo(() => scopedAnalyticsEvents.filter((event) => event.type === 'location_view' && event.role !== 'admin'), [scopedAnalyticsEvents])
  const routes = useMemo(() => scopedAnalyticsEvents.filter((event) => event.type === 'route_start' && event.role !== 'admin'), [scopedAnalyticsEvents])
  const uniqueSessions = useMemo(() => new Set(pageViews.map((event) => event.sessionId).filter(Boolean)).size, [pageViews])

  const sectionStats = useMemo(() => {
    const counts = new Map()
    pageViews.forEach((event) => counts.set(event.section || 'Khác', (counts.get(event.section || 'Khác') || 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [pageViews])

  const topLocations = useMemo(() => {
    const counts = new Map()
    locationViews.forEach((event) => {
      const key = event.locationId || event.locationName || 'unknown'
      const current = counts.get(key) || { name: event.locationName || key, count: 0 }
      current.count += 1
      counts.set(key, current)
    })
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10)
  }, [locationViews])

  const allowedTabKeys = isAdmin ? ['overview', 'locations', 'reviews', 'reports', 'slides', 'users', 'categories', 'footer'] : ['overview', 'locations', 'reviews', 'reports']

  useEffect(() => {
    const requested = searchParams.get('tab')
    const next = requested && allowedTabKeys.includes(requested) ? requested : 'overview'
    if (next !== tab) setTab(next)
    if (requested && !allowedTabKeys.includes(requested)) setSearchParams({}, { replace: true })
  }, [searchParams, isAdmin])

  useEffect(() => {
    if (tab === 'reviews' && unreadReviewNotifications?.length) markReviewNotificationsRead()
  }, [tab, unreadReviewNotifications?.length])

  const selectTab = (key) => {
    setTab(key)
    setNotice(null)
    if (key === 'overview') setSearchParams({}, { replace: true })
    else setSearchParams({ tab: key }, { replace: true })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const account = await login(form)
      const accepted = managerPortal ? account.role === 'manager' : account.role === 'admin'
      if (!accepted) {
        // Logout mà không navigate — chỉ clear token, giữ nguyên trang để hiển thị lỗi
        try {
          const refreshToken = localStorage.getItem('binh-dinh:jwt-refresh')
          const { apiLogout } = await import('../services/authService')
          await apiLogout(refreshToken)
        } catch {}
        setError(managerPortal ? 'Tài khoản này chưa được cấp quyền quản lý nhóm.' : 'Chỉ tài khoản quản trị viên được vào trang quản trị.')
        return
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Thông tin đăng nhập không đúng.')
    }
  }

  if (session && !authenticated) {
    if (session.role === 'admin') return <Navigate to="/admin" replace />
    if (session.role === 'manager') return <Navigate to="/quan-ly" replace />
    return <Navigate to="/tai-khoan" replace />
  }

  if (!authenticated) {
    return (
      <AuthShell admin eyebrow={managerPortal ? 'Khu vực quản lý' : 'Quản trị'} title={managerPortal ? 'Đăng nhập tài khoản được phân quyền' : 'Đăng nhập quản trị'} description={managerPortal ? 'Chỉ tài khoản đã được Admin cấp quyền quản lý nhóm mới truy cập được.' : 'Chỉ quản trị viên hệ thống được truy cập trang quản trị.'}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="text-sm font-bold text-blue-950">Tên đăng nhập</span><input required autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-3 text-blue-950 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" /></label>
          <label className="block"><span className="text-sm font-bold text-blue-950">Mật khẩu</span><input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-3 text-blue-950 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" /></label>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-sm hover:bg-brand-700">{managerPortal ? 'Đăng nhập khu vực quản lý' : 'Đăng nhập quản trị'}</button>
        </form>
      </AuthShell>
    )
  }

  const saveLocation = async (payload) => {
    try {
      if (editor.location) await updateLocation(editor.location.id, payload)
      else await addLocation(payload)
      setEditor({ open: false, location: null })
      showNotice(editor.location ? 'Đã cập nhật địa điểm.' : 'Đã thêm địa điểm mới.', 'success')
    } catch (e) {
      throw e
    }
  }

  const removeLocation = async (location) => {
    if (!window.confirm(`Xóa “${location.name}”?`)) return
    try {
      await deleteLocation(location.id)
      setEditor({ open: false, location: null })
      showNotice('Đã xóa địa điểm.', 'success')
    } catch (e) {
      showNotice(e?.response?.data?.detail || e.message || 'Không thể xóa địa điểm.', 'error')
    }
  }

  const exportCatalog = () => {
    const rows = filtered.map((item, index) => [
      index + 1, item.id, item.name, categoryLabel(item.category), item.group || '', item.subgroup || '', item.address || '',
      item.lat ?? '', item.lng ?? '', item.phone || '', item.zaloUrl || '', item.email || '', item.website || '', item.facebook || '', item.hours || '',
      item.keywords || '', item.heritageStatus || '', item.description || '', item.notes || '', item.gallery?.length || 0, item.panoramas?.length || 0, item.videos?.length || 0
    ])
    downloadExcelWorkbook('danh-muc-dia-diem-binh-dinh.xls', [
      { name: 'Tong quan', rows: [['DANH MỤC ĐỊA ĐIỂM PHƯỜNG BÌNH ĐỊNH'], ['Xuất lúc', dateTime(new Date().toISOString())], ['Bộ lọc danh mục', category === 'all' ? 'Tất cả' : categoryLabel(category)], ['Từ khóa', query || ''], ['Số địa điểm xuất', filtered.length]] },
      { name: 'Danh muc dia diem', rows: [['STT', 'ID', 'Tên địa điểm', 'Danh mục', 'Phân nhóm', 'Phân nhóm chi tiết', 'Địa chỉ', 'Vĩ độ', 'Kinh độ', 'Điện thoại', 'Zalo', 'Email', 'Website', 'Facebook', 'Giờ hoạt động', 'Từ khóa', 'Thông tin di tích', 'Giới thiệu', 'Thông tin thêm', 'Số ảnh', 'Số ảnh 360', 'Số video'], ...rows] }
    ])
    showNotice(`Đã xuất Excel ${filtered.length} địa điểm theo bộ lọc hiện tại.`, 'success')
  }

  // Local slide state — chỉnh sửa cục bộ, lưu khi bấm nút
  const [localSlides, setLocalSlides] = useState(null)
  const [slidesDirty, setSlidesDirty] = useState(false)
  const [slidesSaving, setSlidesSaving] = useState(false)

  // Local footer state — same pattern as slides
  const [localFooter, setLocalFooter] = useState(null)
  const [footerDirty, setFooterDirty] = useState(false)
  const [footerSaving, setFooterSaving] = useState(false)
  const MAX_SLIDES = 5

  // Khởi tạo localSlides khi siteSettings load xong lần đầu
  useEffect(() => {
    if (siteSettingsLoaded && localSlides === null) {
      setLocalSlides(siteSettings.heroSlides)
    }
  }, [siteSettingsLoaded])

  useEffect(() => {
    if (siteSettingsLoaded && localFooter === null) {
      setLocalFooter(siteSettings?.footer ?? {})
    }
  }, [siteSettingsLoaded])

  const slides = localSlides ?? siteSettings?.heroSlides ?? []

  const updateSlide = (index, patch) => {
    setLocalSlides(slides.map((slide, i) => i === index ? { ...slide, ...patch } : slide))
    setSlidesDirty(true)
  }
  const removeSlide = (index) => {
    setLocalSlides(slides.filter((_, i) => i !== index))
    setSlidesDirty(true)
  }
  const addSlide = () => {
    if (slides.length >= MAX_SLIDES) return
    setLocalSlides([...slides, { id: `slide-${Date.now().toString(36)}`, image: '', title: 'Ảnh mới', caption: '' }])
    setSlidesDirty(true)
  }
  const saveSlides = async () => {
    setSlidesSaving(true)
    try {
      const result = await updateSiteSettings({ heroSlides: slides })
      if (result?.heroSlides) setLocalSlides(result.heroSlides)
      setSlidesDirty(false)
      showNotice('Đã lưu slides.', 'success')
    } catch (e) {
      showNotice(e?.response?.data?.detail || e.message || 'Lỗi cập nhật slide.', 'error')
    } finally {
      setSlidesSaving(false)
    }
  }
  const uploadSlide = async (index, file) => {
    if (!file) return
    setSlideBusy(index)
    try {
      if (file.size > 8 * 1024 * 1024) {
        showNotice(`Ảnh "${file.name}" vượt quá giới hạn 8 MB. Vui lòng chọn file nhỏ hơn.`, 'error')
        return
      }
      const url = await uploadMedia(file, { folder: 'slides' })
      updateSlide(index, { image: url })
      showNotice('Đã cập nhật ảnh slide.', 'success')
    } catch (e) {
      showNotice(e.message || 'Không tải được ảnh slide.', 'error')
    } finally {
      setSlideBusy(-1)
    }
  }

  const updateFooterField = (key, value) => {
    setLocalFooter((prev) => ({ ...prev, [key]: value }))
    setFooterDirty(true)
  }

  const saveFooter = async () => {
    setFooterSaving(true)
    try {
      await updateSiteSettings({ footer: localFooter })
      setFooterDirty(false)
      showNotice('Đã lưu cài đặt footer.', 'success')
    } catch (e) {
      showNotice(e?.response?.data?.detail || e.message || 'Lỗi cập nhật footer.', 'error')
    } finally {
      setFooterSaving(false)
    }
  }

  const resetFooter = async () => {
    if (!window.confirm('Khôi phục footer về mặc định?')) return
    setFooterSaving(true)
    try {
      await resetSiteSettings()
      setLocalFooter(null)  // triggers re-init from new siteSettings
      setFooterDirty(false)
      showNotice('Đã khôi phục footer về mặc định.', 'success')
    } catch (e) {
      showNotice(e?.response?.data?.detail || e.message || 'Lỗi khôi phục.', 'error')
    } finally {
      setFooterSaving(false)
    }
  }

  const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { key: 'locations', label: 'Địa điểm', icon: MapPin },
    { key: 'reviews', label: `Đánh giá${unreadReviewNotifications?.length ? ` (${unreadReviewNotifications.length})` : ''}`, icon: Star },
    { key: 'reports', label: 'Báo cáo Excel', icon: BarChart3 },
    ...(isAdmin ? [
      { key: 'categories', label: 'Danh mục', icon: Layers },
      { key: 'slides', label: 'Trang chủ', icon: Image },
      { key: 'footer', label: 'Cài đặt Footer', icon: Settings },
      { key: 'users', label: 'Tài khoản & phân quyền', icon: Users }
    ] : [])
  ]

  return (
    <main className="min-h-[calc(100dvh-5rem)] bg-blue-50/45 px-3 py-6 sm:px-5 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">{isAdmin ? 'Quản trị' : 'Khu vực quản lý'}</p><h1 className="mt-2 text-2xl font-black text-blue-950 sm:text-3xl">{isAdmin ? 'Quản lý nội dung website' : 'Quản lý phạm vi được cấp'}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-blue-700/70">{isAdmin ? '' : 'Bạn chỉ có thể thêm/sửa/xóa các địa điểm thuộc danh mục hoặc nhóm đã được quản trị viên cấp quyền.'}</p></div>
          <button type="button" onClick={logout} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50">{isAdmin ? 'Đăng xuất quản trị' : 'Đăng xuất quản lý'}</button>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-blue-100 bg-white p-2 shadow-card">
          {tabs.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => selectTab(key)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-black transition ${tab === key ? 'bg-brand-600 text-white shadow-sm' : 'text-blue-700 hover:bg-blue-50'}`}><Icon size={16} />{label}</button>)}
        </div>

        {notice && <div className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>{notice.msg}</div>}
        {unreadReviewNotifications?.length > 0 && tab !== 'reviews' && <button type="button" onClick={() => selectTab('reviews')} className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm text-sky-900 shadow-card"><span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white"><Bell size={18} /><span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-sky-500 px-1 text-[10px] font-black leading-5 text-white">{unreadReviewNotifications.length}</span></span><span className="min-w-0 flex-1"><strong className="block">Có đánh giá mới cần theo dõi</strong><span className="mt-0.5 block line-clamp-1 text-xs text-sky-700">{unreadReviewNotifications[0]?.displayName} vừa đánh giá {unreadReviewNotifications[0]?.locationName}.</span></span><span className="text-xs font-black text-brand-700">Xem</span></button>}

        {tab === 'overview' && <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[[Database, stats.total, isAdmin ? 'Tổng địa điểm' : 'Địa điểm được quản lý'], [MapPin, stats.gps, 'Có tọa độ GPS'], [Building2, stats.administration, 'Cơ quan hành chính'], [Users, isAdmin ? stats.users : 1, isAdmin ? 'Tài khoản' : 'Tài khoản quản lý'], [Star, stats.reviews, 'Đánh giá']].map(([Icon, value, label]) => <div key={label} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-card"><Icon size={22} className="text-brand-600" /><p className="mt-3 text-3xl font-black text-blue-950">{value}</p><p className="mt-1 text-sm text-blue-700/65">{label}</p></div>)}
          </div>

          <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-4 text-sm leading-6 text-blue-900 shadow-card"><div className="flex items-start gap-3"><KeyRound className="mt-0.5 shrink-0 text-brand-600" size={19} /><p>{isAdmin ? 'Ảnh, ảnh 360° và video tải từ máy được lưu bằng IndexedDB trên trình duyệt. Báo cáo Excel đã được đưa thành một mục ngay trong trang quản trị.' : `Phạm vi hiện tại: ${[...(session.permissions?.categories || []), ...(session.permissions?.groups || []), ...(session.permissions?.subgroups || [])].join(' · ') || 'chưa được cấp nhóm cụ thể'}.`}</p></div></div>

          <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Thống kê</p><h2 className="mt-1 text-2xl font-black text-blue-950">{isAdmin ? 'Hoạt động website' : 'Hoạt động trong phạm vi quản lý'}</h2></div>{isAdmin && <button type="button" onClick={() => { if (window.confirm('Xóa toàn bộ dữ liệu thống kê cục bộ?')) { clearAnalytics().then(() => showNotice('Đã xóa thống kê.', 'success')).catch(() => {}) } }} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50">Xóa thống kê</button>}</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[pageViews.length, 'Lượt xem trang'], [uniqueSessions, 'Phiên truy cập'], [locationViews.length, 'Xem địa điểm'], [routes.length, 'Dẫn đường']].map(([value, label]) => <div key={label} className="rounded-2xl bg-blue-50/70 p-4"><p className="text-2xl font-black text-blue-950">{value}</p><p className="text-xs text-blue-600">{label}</p></div>)}</div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2"><div><h3 className="text-sm font-black text-blue-950">Mục được truy cập</h3><div className="mt-3 space-y-2">{sectionStats.slice(0, 8).map(([name, count]) => <div key={name} className="flex items-center justify-between rounded-xl bg-blue-50/60 px-3 py-2 text-sm"><span className="text-blue-800">{name}</span><strong className="text-brand-700">{count}</strong></div>)}{!sectionStats.length && <p className="text-sm text-blue-400">Chưa có dữ liệu.</p>}</div></div><div><h3 className="text-sm font-black text-blue-950">Địa điểm xem nhiều</h3><div className="mt-3 space-y-2">{topLocations.map((item) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-blue-50/60 px-3 py-2 text-sm"><span className="min-w-0 truncate text-blue-800">{item.name}</span><strong className="ml-3 text-brand-700">{item.count}</strong></div>)}{!topLocations.length && <p className="text-sm text-blue-400">Chưa có lượt xem địa điểm.</p>}</div></div></div>
          </section>
        </>}

        {tab === 'locations' && <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Địa điểm</p><h2 className="mt-1 text-2xl font-black text-blue-950">Danh sách & chỉnh sửa</h2></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setEditor({ open: true, location: null })} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700"><Plus size={17} />Thêm địa điểm</button><button type="button" onClick={exportCatalog} className="inline-flex items-center gap-2 rounded-xl border border-blue-100 px-3 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50"><Download size={16} />Xuất Excel danh mục</button></div></div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_280px]"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên, địa chỉ, số điện thoại..." className="w-full rounded-xl border border-blue-100 bg-blue-50/40 py-3 pl-10 pr-3 text-sm outline-none focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-50" /></label><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm font-semibold text-blue-900 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"><option value="all">Tất cả danh mục được phép</option>{liveCategories.filter((item) => isAdmin || manageableLocations.some((loc) => loc.category === item.key)).map((item) => <option key={item.key} value={item.key}>{item.emoji} {item.label}</option>)}</select></div>
          <p className="mt-3 text-xs text-blue-500">Hiển thị {filtered.length}/{manageableLocations.length} địa điểm trong phạm vi của tài khoản.</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100"><div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_140px_110px] gap-3 bg-blue-50 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-blue-500 md:grid"><span>Địa điểm</span><span>Địa chỉ</span><span>Danh mục</span><span className="text-right">Thao tác</span></div><div className="divide-y divide-blue-50">{filtered.slice((locPage - 1) * LOC_PAGE_SIZE, locPage * LOC_PAGE_SIZE).map((location) => { const cat = getLiveCat(location.category); return <div key={location.id} className="grid gap-3 px-4 py-3 hover:bg-blue-50/40 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_140px_110px] md:items-center"><div className="flex min-w-0 items-center gap-3"><MediaImage src={location.image} alt="" className="h-12 w-16 shrink-0 rounded-lg bg-blue-50 object-cover" loading="lazy" /><div className="min-w-0"><p className="truncate text-sm font-black text-blue-950">{location.name}</p><p className="mt-0.5 truncate text-xs text-blue-500">{location.subgroup || location.group}</p></div></div><p className="text-xs leading-5 text-blue-800/70 md:line-clamp-2">{location.address || 'Chưa có địa chỉ'}</p><span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">{cat.emoji} {cat.shortLabel}</span><div className="flex justify-end gap-1"><button type="button" onClick={() => setEditor({ open: true, location })} className="rounded-lg p-2 text-brand-700 hover:bg-blue-100" title="Sửa"><Pencil size={17} /></button><button type="button" onClick={() => removeLocation(location)} className="rounded-lg p-2 text-blue-500 hover:bg-blue-100 hover:text-blue-800" title="Xóa"><Trash2 size={17} /></button></div></div>})}{!filtered.length && <p className="p-10 text-center text-sm text-blue-400">Không có địa điểm phù hợp.</p>}</div></div>
          {filtered.length > LOC_PAGE_SIZE && (() => {
            const totalPages = Math.ceil(filtered.length / LOC_PAGE_SIZE)
            const start = (locPage - 1) * LOC_PAGE_SIZE + 1
            const end = Math.min(locPage * LOC_PAGE_SIZE, filtered.length)
            return (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-blue-500">{start}–{end} / {filtered.length} địa điểm · trang {locPage}/{totalPages}</p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setLocPage(1)} disabled={locPage === 1} className="rounded-lg border border-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-30">«</button>
                  <button type="button" onClick={() => setLocPage((p) => Math.max(1, p - 1))} disabled={locPage === 1} className="rounded-lg border border-blue-100 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-30">‹ Trước</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - locPage) <= 2).reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push(<span key={`ellipsis-${p}`} className="px-1 text-blue-300">…</span>)
                    acc.push(<button key={p} type="button" onClick={() => setLocPage(p)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${locPage === p ? 'bg-brand-600 text-white' : 'border border-blue-100 text-blue-600 hover:bg-blue-50'}`}>{p}</button>)
                    return acc
                  }, [])}
                  <button type="button" onClick={() => setLocPage((p) => Math.min(totalPages, p + 1))} disabled={locPage === totalPages} className="rounded-lg border border-blue-100 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-30">Sau ›</button>
                  <button type="button" onClick={() => setLocPage(totalPages)} disabled={locPage === totalPages} className="rounded-lg border border-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-30">»</button>
                </div>
              </div>
            )
          })()}
        </section>}

        {isAdmin && tab === 'categories' && <AdminCategoriesTab locations={manageableLocations} setNotice={showNotice} />}

        {isAdmin && tab === 'slides' && <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Trang chủ</p>
              <h2 className="mt-1 text-2xl font-black text-blue-950">Slide ảnh chính</h2>
              <p className="mt-1 text-sm text-blue-600/70">Tối đa {MAX_SLIDES} slides. Chỉnh sửa xong bấm <strong>Lưu</strong> để cập nhật.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={addSlide} disabled={slides.length >= MAX_SLIDES} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">
                <Plus size={17} />Thêm slide {slides.length >= MAX_SLIDES ? `(đủ ${MAX_SLIDES})` : `(${slides.length}/${MAX_SLIDES})`}
              </button>
              {slidesDirty && (
                <button type="button" onClick={saveSlides} disabled={slidesSaving} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-black text-white hover:bg-green-700 disabled:opacity-60">
                  {slidesSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              )}
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">{slides.map((slide, index) => <div key={slide.id || index} className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/35"><div className="relative aspect-[16/7] bg-blue-100">{slide.image ? <MediaImage src={slide.image} alt={slide.title || ''} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-blue-300"><Image size={30} /></div>}<button type="button" onClick={() => removeSlide(index)} className="absolute right-2 top-2 rounded-lg bg-white/90 p-2 text-blue-700 shadow hover:bg-white" title="Xóa slide"><Trash2 size={16} /></button></div><div className="space-y-3 p-4"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-brand-700 hover:bg-blue-50"><Upload size={15} />{slideBusy === index ? 'Đang lưu...' : 'Chọn ảnh từ máy'}<input type="file" accept="image/*" className="hidden" disabled={slideBusy >= 0} onChange={(e) => uploadSlide(index, e.target.files?.[0])} /></label><label className="block"><span className="text-[10px] font-black uppercase tracking-wide text-blue-500">URL / tham chiếu ảnh</span><input value={slide.image || ''} onChange={(e) => updateSlide(index, { image: e.target.value })} className="mt-1.5 w-full rounded-lg border border-blue-100 px-3 py-2 text-xs outline-none focus:border-brand-300" /></label><label className="block"><span className="text-[10px] font-black uppercase tracking-wide text-blue-500">Tiêu đề</span><input value={slide.title || ''} onChange={(e) => updateSlide(index, { title: e.target.value })} className="mt-1.5 w-full rounded-lg border border-blue-100 px-3 py-2 text-sm outline-none focus:border-brand-300" /></label><label className="block"><span className="text-[10px] font-black uppercase tracking-wide text-blue-500">Mô tả</span><input value={slide.caption || ''} onChange={(e) => updateSlide(index, { caption: e.target.value })} className="mt-1.5 w-full rounded-lg border border-blue-100 px-3 py-2 text-sm outline-none focus:border-brand-300" /></label></div></div>)}</div>
        </section>}

        {isAdmin && tab === 'footer' && (
          <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Cài đặt</p>
                <h2 className="mt-1 text-2xl font-black text-blue-950">Nội dung Footer</h2>
                <p className="mt-1 text-sm text-blue-600/70">Chỉnh sửa thông tin hiển thị ở phần cuối của mọi trang.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetFooter}
                  disabled={footerSaving}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-black text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  <RotateCcw size={15} />Khôi phục mặc định
                </button>
                {footerDirty && (
                  <button
                    type="button"
                    onClick={saveFooter}
                    disabled={footerSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-black text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {footerSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                )}
              </div>
            </div>

            {localFooter !== null && (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wide text-blue-500">Tên tổ chức</span>
                  <input
                    value={localFooter.orgName ?? ''}
                    onChange={(e) => updateFooterField('orgName', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wide text-blue-500">Điện thoại</span>
                  <input
                    value={localFooter.phone ?? ''}
                    onChange={(e) => updateFooterField('phone', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-wide text-blue-500">Mô tả ngắn</span>
                  <textarea
                    value={localFooter.description ?? ''}
                    onChange={(e) => updateFooterField('description', e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-xl border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-wide text-blue-500">Địa chỉ</span>
                  <input
                    value={localFooter.address ?? ''}
                    onChange={(e) => updateFooterField('address', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wide text-blue-500">Email</span>
                  <input
                    type="email"
                    value={localFooter.email ?? ''}
                    onChange={(e) => updateFooterField('email', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wide text-blue-500">Giờ làm việc</span>
                  <input
                    value={localFooter.workingHours ?? ''}
                    onChange={(e) => updateFooterField('workingHours', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-wide text-blue-500">Dòng copyright</span>
                  <input
                    value={localFooter.copyright ?? ''}
                    onChange={(e) => updateFooterField('copyright', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-wide text-blue-500">URL logo tùy chỉnh</span>
                  <div className="mt-1.5 flex items-center gap-3">
                    <input
                      value={localFooter.logoUrl ?? ''}
                      onChange={(e) => updateFooterField('logoUrl', e.target.value)}
                      placeholder="https://... (để trống dùng logo mặc định)"
                      className="flex-1 rounded-xl border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                    />
                    {localFooter.logoUrl && (
                      <img
                        src={localFooter.logoUrl}
                        alt="Logo preview"
                        className="h-12 w-12 rounded-full border border-blue-100 object-cover"
                      />
                    )}
                  </div>
                </label>
              </div>
            )}
          </section>
        )}

        {isAdmin && tab === 'users' && <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-card sm:p-6">          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Tài khoản</p><h2 className="mt-1 text-2xl font-black text-blue-950">Người dùng & phân quyền</h2><p className="mt-1 text-sm text-blue-600/70">Xem tài khoản đã đăng ký, sửa thông tin, cấp quyền theo danh mục/nhóm và reset mật khẩu bắt buộc đổi lại.</p></div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100"><div className="divide-y divide-blue-50">{users.map((user) => <div key={user.username} className="flex flex-wrap items-center gap-3 px-4 py-3"><MediaImage src={user.avatar} alt="" className="h-11 w-11 rounded-full bg-blue-50 object-cover" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-black text-blue-950">{user.displayName || user.username}</p>{user.role === 'manager' && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-black text-brand-700">QUẢN LÝ NHÓM</span>}{user.mustChangePassword && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">PHẢI ĐỔI MẬT KHẨU</span>}</div><p className="mt-0.5 text-xs text-blue-500">@{user.username} · {formatVietnamPhone(user.phone) || 'Chưa có SĐT'}</p>{user.role === 'manager' && <p className="mt-1 line-clamp-1 text-[11px] text-blue-400">Quyền: {[...(user.permissions?.categories || []).map(categoryLabel), ...(user.permissions?.groups || []), ...(user.permissions?.subgroups || [])].join(' · ') || 'Chưa chọn phạm vi'}</p>}</div><div className="ml-auto flex gap-1"><button type="button" onClick={() => setUserEditor({ open: true, user })} className="rounded-lg p-2 text-brand-700 hover:bg-blue-50" title="Sửa & phân quyền"><Pencil size={17} /></button><button type="button" onClick={() => { if (window.confirm(`Xóa tài khoản @${user.username}? Đánh giá, lịch sử và lịch nhắc của tài khoản cũng sẽ bị xóa.`)) { deleteUser(user.username).then(() => showNotice('Đã xóa tài khoản.', 'success')).catch(e => showNotice(e?.response?.data?.detail || e.message, 'error')) } }} className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 hover:text-brand-700" title="Xóa"><Trash2 size={17} /></button></div></div>)}{!users.length && <p className="p-6 text-center text-sm text-blue-400">Chưa có tài khoản người dùng.</p>}</div></div>
        </section>}

        {tab === 'reviews' && <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-card sm:p-6">
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Đánh giá</p><h2 className="mt-1 text-2xl font-black text-blue-950">Quản lý đánh giá</h2><p className="mt-1 text-sm text-blue-600/70">Admin và tài khoản quản lý nhóm có thể phản hồi/xử lý đánh giá thuộc đúng phạm vi được cấp.</p></div>
          <div className="mt-4 max-h-[720px] divide-y divide-blue-50 overflow-y-auto rounded-2xl border border-blue-100">{manageableReviews.map((review) => <AdminReviewItem key={review.id} review={review} locationName={locations.find((item) => item.id === review.locationId)?.name || review.locationId} onReply={async (reviewId, text) => { await replyToReview(reviewId, text); showNotice('Đã gửi phản hồi đánh giá.', 'success') }} onDelete={() => { if (window.confirm('Xóa đánh giá này?')) deleteReview(review.id).catch(e => showNotice(e?.response?.data?.detail || e.message, 'error')) }} />)}{!manageableReviews.length && <p className="p-6 text-center text-sm text-blue-400">Chưa có đánh giá trong phạm vi quản lý.</p>}</div>
        </section>}

        {tab === 'reports' && <div className="mt-6"><AdminReportsPanel allowedLocationIds={isAdmin ? null : manageableLocations.map((item) => item.id)} allowUserData={isAdmin} /></div>}
      </div>

      <AdminLocationModal open={editor.open} location={editor.location} allLocations={isAdmin ? locations : manageableLocations} allowedCategories={allowedCategories} onClose={() => setEditor({ open: false, location: null })} onSave={saveLocation} onDelete={removeLocation} />
      <AdminUserModal open={userEditor.open} user={userEditor.user} locations={locations} onClose={() => setUserEditor({ open: false, user: null })} onSave={async (username, patch) => { await updateUserAccount(username, patch); showNotice('Đã cập nhật tài khoản và phân quyền.', 'success') }} onResetPassword={async (username) => { const password = await resetUserPassword(username); showNotice(`Đã reset mật khẩu @${username}.`, 'success'); return password }} />
    </main>
  )
}






