import { useMemo, useState } from 'react'
import { BarChart3, CalendarClock, Download, FileSpreadsheet, Filter, MapPin, Navigation, Star, Users } from 'lucide-react'
import { useAppState } from '../context/AppStateContext'
import { useCategories } from '../hooks/useCategories'
import { downloadExcelWorkbook } from '../utils/excelExport'
import { formatVietnamPhone } from '../utils/phone'
import { hasCoordinates } from '../utils/format'

function localInputValue(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function dateTime(value) {
  if (!value) return ''
  try { return new Date(value).toLocaleString('vi-VN') } catch { return value }
}

function safeDate(value, fallback) {
  const date = value ? new Date(value) : fallback
  return Number.isNaN(date.getTime()) ? fallback : date
}

export default function AdminReportsPanel({ allowedLocationIds = null, allowUserData = true }) {
  const { analyticsEvents, locations, reviews, users } = useAppState()
  const { categories, getCategory: getLiveCat } = useCategories()
  const categoryLabel = (key) => getLiveCat(key)?.label || key || ''
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const [from, setFrom] = useState(localInputValue(monthAgo))
  const [to, setTo] = useState(localInputValue(now))
  const [category, setCategory] = useState('all')
  const [reportType, setReportType] = useState('all')
  const [notice, setNotice] = useState('')

  const fromDate = safeDate(from, new Date(0))
  const toDate = safeDate(to, new Date())
  const locationById = useMemo(() => new Map(locations.map((item) => [item.id, item])), [locations])
  const scopeSet = useMemo(() => Array.isArray(allowedLocationIds) ? new Set(allowedLocationIds) : null, [allowedLocationIds])
  const locationScopeMatch = (locationId) => !scopeSet || (locationId && scopeSet.has(locationId))
  const inRange = (value) => {
    if (!value) return false
    const time = new Date(value).getTime()
    return Number.isFinite(time) && time >= fromDate.getTime() && time <= toDate.getTime()
  }
  const eventCategory = (event) => event.category || locationById.get(event.locationId)?.category || ''
  const categoryMatch = (key) => category === 'all' || key === category

  const filteredEvents = useMemo(() => analyticsEvents.filter((event) => event.role !== 'admin' && inRange(event.createdAt) && locationScopeMatch(event.locationId) && categoryMatch(eventCategory(event))), [analyticsEvents, category, from, to, locationById, scopeSet])
  const pageViews = useMemo(() => filteredEvents.filter((event) => event.type === 'page_view'), [filteredEvents])
  const locationViews = useMemo(() => filteredEvents.filter((event) => event.type === 'location_view'), [filteredEvents])
  const routes = useMemo(() => filteredEvents.filter((event) => event.type === 'route_start'), [filteredEvents])
  const filteredReviews = useMemo(() => reviews.filter((review) => locationScopeMatch(review.locationId) && inRange(review.updatedAt || review.createdAt) && categoryMatch(locationById.get(review.locationId)?.category || '')), [reviews, category, from, to, locationById, scopeSet])
  const filteredUsers = useMemo(() => allowUserData ? users.filter((user) => inRange(user.createdAt)) : [], [users, from, to, allowUserData])
  const scopedLocations = useMemo(() => locations.filter((item) => locationScopeMatch(item.id)), [locations, scopeSet])
  const filteredLocations = useMemo(() => scopedLocations.filter((item) => categoryMatch(item.category)), [scopedLocations, category])
  const availableCategories = useMemo(() => new Set(scopedLocations.map((item) => item.category)), [scopedLocations])
  const uniqueSessions = useMemo(() => new Set(filteredEvents.map((event) => event.sessionId).filter(Boolean)).size, [filteredEvents])

  const exportReport = () => {
    if (fromDate.getTime() > toDate.getTime()) {
      setNotice('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.')
      return
    }
    const rangeLabel = `${dateTime(fromDate)} - ${dateTime(toDate)}`
    const scopeLabel = category === 'all' ? 'Tất cả danh mục' : categoryLabel(category)
    const sheets = [{
      name: 'Tong quan',
      rows: [
        ['BÁO CÁO BẢN ĐỒ DU LỊCH PHƯỜNG BÌNH ĐỊNH'],
        ['Xuất lúc', dateTime(new Date())],
        ['Khoảng thời gian', rangeLabel],
        ['Danh mục', scopeLabel],
        ['Loại báo cáo', reportType],
        ['Sự kiện ghi nhận', filteredEvents.length],
        ['Phiên truy cập', uniqueSessions],
        ['Lượt xem trang', pageViews.length],
        ['Lượt xem địa điểm', locationViews.length],
        ['Lượt dẫn đường', routes.length],
        ['Đánh giá', filteredReviews.length],
        ['Tài khoản đăng ký', filteredUsers.length],
        ['Địa điểm thuộc danh mục', filteredLocations.length]
      ]
    }]

    if (reportType === 'all' || reportType === 'traffic') {
      sheets.push({ name: 'Su kien truy cap', rows: [['Thời gian', 'Loại sự kiện', 'Mục', 'Địa điểm', 'Danh mục', 'Đường dẫn', 'Tài khoản', 'Vai trò', 'Visitor ID', 'Session ID'], ...filteredEvents.map((event) => [dateTime(event.createdAt), event.type || '', event.section || '', event.locationName || '', categoryLabel(eventCategory(event)), event.path || '', event.account || '', event.role || '', event.visitorId || '', event.sessionId || ''])] })
      sheets.push({ name: 'Luot xem dia diem', rows: [['Thời gian', 'Địa điểm', 'ID', 'Danh mục', 'Mục', 'Tài khoản'], ...locationViews.map((event) => [dateTime(event.createdAt), event.locationName || '', event.locationId || '', categoryLabel(eventCategory(event)), event.section || '', event.account || ''])] })
    }
    if (reportType === 'all' || reportType === 'routes') sheets.push({ name: 'Dan duong', rows: [['Thời gian', 'Điểm đến', 'Danh mục', 'Điểm xuất phát', 'Quãng đường (m)', 'Thời gian (giây)', 'Tài khoản'], ...routes.map((event) => [dateTime(event.createdAt), event.locationName || '', categoryLabel(eventCategory(event)), event.originLabel || '', event.distanceMeters || '', event.durationSeconds || '', event.account || ''])] })
    if (reportType === 'all' || reportType === 'reviews') sheets.push({ name: 'Danh gia', rows: [['Thời gian', 'Địa điểm', 'Danh mục', 'Người dùng', 'Tên hiển thị', 'Số sao', 'Nội dung', 'Số phản hồi'], ...filteredReviews.map((review) => { const loc = locationById.get(review.locationId); return [dateTime(review.updatedAt || review.createdAt), loc?.name || review.locationId, categoryLabel(loc?.category), review.username || '', review.displayName || '', review.rating || '', review.comment || '', review.replies?.length || 0] })] })
    if (allowUserData && (reportType === 'all' || reportType === 'users')) sheets.push({ name: 'Tai khoan', rows: [['Tên hiển thị', 'Tên đăng nhập', 'Số điện thoại', 'Vai trò', 'Phạm vi quản lý', 'Ngày tạo'], ...filteredUsers.map((user) => [user.displayName || '', user.username || '', formatVietnamPhone(user.phone), user.role || 'user', [...(user.permissions?.categories || []), ...(user.permissions?.groups || []), ...(user.permissions?.subgroups || [])].join('; '), dateTime(user.createdAt)])] })
    if (reportType === 'all' || reportType === 'catalog') sheets.push({ name: 'Danh muc dia diem', rows: [['STT', 'ID', 'Tên địa điểm', 'Danh mục', 'Phân nhóm', 'Phân nhóm chi tiết', 'Địa chỉ', 'Vĩ độ', 'Kinh độ', 'Điện thoại', 'Zalo', 'Email', 'Website', 'Facebook', 'Giờ hoạt động', 'Từ khóa', 'Thông tin di tích', 'Giới thiệu', 'Thông tin thêm', 'Số ảnh', 'Số ảnh 360', 'Số video'], ...filteredLocations.map((item, index) => [index + 1, item.id, item.name, categoryLabel(item.category), item.group || '', item.subgroup || '', item.address || '', item.lat ?? '', item.lng ?? '', item.phone || '', item.zaloUrl || '', item.email || '', item.website || '', item.facebook || '', item.hours || '', item.keywords || '', item.heritageStatus || '', item.description || '', item.notes || '', item.gallery?.length || 0, item.panoramas?.length || 0, item.videos?.length || 0])] })

    const suffix = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadExcelWorkbook(`bao-cao-binh-dinh-${suffix}.xls`, sheets)
    setNotice(`Đã xuất báo cáo: ${scopeLabel} · ${rangeLabel}.`)
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Báo cáo Excel</p>
          <h2 className="mt-2 text-2xl font-black text-blue-950 sm:text-3xl">Xuất báo cáo theo thời gian & danh mục</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-700/70">Chọn khoảng ngày giờ, danh mục và loại dữ liệu trước khi xuất Excel. Tài khoản quản lý nhóm chỉ xuất dữ liệu thuộc phạm vi được cấp.</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white"><FileSpreadsheet size={23} /></div>
      </div>

      <div className="mt-6 flex items-center gap-2"><Filter size={18} className="text-brand-600" /><h3 className="font-black text-blue-950">Bộ lọc báo cáo</h3></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Từ ngày giờ</span><input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" /></label>
        <label className="block"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Đến ngày giờ</span><input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" /></label>
        <label className="block"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Danh mục</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"><option value="all">Tất cả danh mục</option>{categories.filter((item) => availableCategories.has(item.key)).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
        <label className="block"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Nội dung xuất</span><select value={reportType} onChange={(e) => setReportType(e.target.value)} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"><option value="all">Báo cáo đầy đủ</option><option value="traffic">Truy cập & lượt xem</option><option value="routes">Dẫn đường</option><option value="reviews">Đánh giá</option>{allowUserData && <option value="users">Tài khoản đăng ký</option>}<option value="catalog">Danh mục địa điểm</option></select></label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50/70 p-4">
        <div className="flex max-w-3xl items-start gap-3"><CalendarClock size={20} className="mt-0.5 shrink-0 text-brand-600" /><p className="text-sm leading-6 text-blue-900/75">Khoảng thời gian áp dụng cho truy cập, dẫn đường, đánh giá và tài khoản. Danh mục địa điểm được lọc theo nhóm đang chọn.</p></div>
        <button type="button" onClick={exportReport} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-brand-700"><Download size={18} />Xuất Excel báo cáo</button>
      </div>
      {notice && <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{notice}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[[BarChart3, filteredEvents.length, 'Sự kiện'], [Users, uniqueSessions, 'Phiên truy cập'], [MapPin, locationViews.length, 'Lượt xem địa điểm'], [Navigation, routes.length, 'Lượt dẫn đường'], [Star, filteredReviews.length, 'Đánh giá'], [Users, filteredUsers.length, 'Tài khoản mới'], [MapPin, filteredLocations.length, 'Địa điểm trong danh mục'], [MapPin, filteredLocations.filter(hasCoordinates).length, 'Địa điểm có GPS']].map(([Icon, value, label]) => <div key={label} className="rounded-2xl border border-blue-100 bg-blue-50/35 p-4"><Icon size={18} className="text-brand-600" /><p className="mt-2 text-2xl font-black text-blue-950">{value}</p><p className="text-xs text-blue-600">{label}</p></div>)}
      </div>
    </section>
  )
}
