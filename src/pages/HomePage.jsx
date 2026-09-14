import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, Compass, Map, MapPin, Navigation } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import LocationCard from '../components/LocationCard'
import MediaImage from '../components/MediaImage'
import { useAppState } from '../context/AppStateContext'
import { CATEGORIES } from '../utils/categories'
import { hasCoordinates } from '../utils/format'

export default function HomePage() {
  const navigate = useNavigate()
  const { locations, siteSettings, trackEvent } = useAppState()
  const slides = siteSettings?.heroSlides?.filter((item) => item.image) || []
  const [activeSlide, setActiveSlide] = useState(0)
  const featured = useMemo(() => locations.filter(hasCoordinates).slice(0, 6), [locations])
  const mappable = useMemo(() => locations.filter(hasCoordinates).length, [locations])
  const administrative = useMemo(() => locations.filter((item) => item.category === 'administration').length, [locations])

  useEffect(() => {
    if (slides.length < 2) return undefined
    const timer = window.setInterval(() => setActiveSlide((index) => (index + 1) % slides.length), Number(siteSettings?.heroIntervalMs) || 5200)
    return () => window.clearInterval(timer)
  }, [slides.length, siteSettings?.heroIntervalMs])

  useEffect(() => {
    if (activeSlide >= slides.length && slides.length) setActiveSlide(0)
  }, [activeSlide, slides.length])

  return (
    <div className="bg-blue-50/30">
      <section className="relative isolate min-h-[650px] overflow-hidden bg-blue-900 text-white sm:min-h-[690px]">
        <div className="absolute inset-0 overflow-hidden">
          {slides.length === 0 && (
            <div className="absolute inset-0 bg-blue-900" />
          )}
          {slides.map((slide, index) => (
            <MediaImage
              key={slide.id || slide.image}
              src={slide.image}
              alt={slide.title || 'Phường Bình Định'}
              className={`absolute inset-0 h-full w-full scale-[1.035] object-cover transition-opacity duration-[1400ms] ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-blue-950/16" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/62 via-blue-900/34 to-sky-800/5" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-blue-950/42 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-[1400px] items-end gap-8 px-5 py-16 sm:py-20 md:min-h-[650px] md:grid-cols-[1.1fr_.9fr] md:items-center lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100/40 bg-blue-950/25 px-3 py-1.5 text-xs font-bold text-white backdrop-blur"><MapPin size={14} />Phường Bình Định · Gia Lai</div>
            <h1 className="mt-6 text-4xl font-black leading-[1.03] drop-shadow-[0_4px_18px_rgba(3,23,64,.45)] sm:text-5xl lg:text-7xl">Khám phá <span className="text-sky-200">Phường Bình Định</span></h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-white drop-shadow-md sm:text-lg">Du lịch, văn hóa, ẩm thực, lưu trú, tiện ích và cơ quan hành chính — tìm kiếm và dẫn đường trực tiếp ngay trong website.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/kham-pha-dia-diem" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-950/20 hover:bg-brand-500">Khám phá địa điểm <ArrowRight size={17} /></Link>
              <Link to="/ban-do-du-lich" className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/15 px-5 py-3.5 text-sm font-black text-white backdrop-blur hover:bg-white/25"><Map size={17} />Xem bản đồ</Link>
            </div>
          </div>

          <div className="md:justify-self-end">
            <div className="max-w-md rounded-[1.75rem] border border-white/25 bg-blue-950/25 p-5 shadow-2xl backdrop-blur-md sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Ảnh đang hiển thị</p>
              <p className="mt-2 text-xl font-black drop-shadow">{slides[activeSlide]?.title || 'Phường Bình Định'}</p>
              <p className="mt-2 text-sm leading-6 text-white/90">{slides[activeSlide]?.caption || 'Khám phá địa phương qua bản đồ du lịch số.'}</p>
              <div className="mt-5 flex items-center gap-2">{slides.map((slide, index) => <button key={slide.id || index} type="button" aria-label={`Ảnh ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-sky-200' : 'w-2.5 bg-white/55 hover:bg-white/80'}`} />)}</div>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/15 p-3"><p className="text-xl font-black text-sky-100">{locations.length}</p><p className="mt-1 text-[10px] text-white/80">địa điểm</p></div>
                <div className="rounded-xl bg-white/15 p-3"><p className="text-xl font-black text-sky-100">{mappable}</p><p className="mt-1 text-[10px] text-white/80">có GPS</p></div>
                <div className="rounded-xl bg-white/15 p-3"><p className="text-xl font-black text-sky-100">{administrative}</p><p className="mt-1 text-[10px] text-white/80">hành chính</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-14 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[[locations.length, 'Địa điểm đang hiển thị', MapPin], [CATEGORIES.length, 'Nhóm danh mục', Compass], [administrative, 'Cơ quan hành chính', Building2], ['GPS', 'Dẫn đường ngay trong website', Navigation]].map(([value, label, Icon]) => <div key={label} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-card"><Icon className="text-brand-600" size={22} /><p className="mt-4 text-3xl font-black text-blue-950">{value}</p><p className="mt-1 text-sm text-blue-700/65">{label}</p></div>)}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-10 px-5 py-12 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Giới thiệu</p>
          <h2 className="mt-3 text-3xl font-black text-blue-950 sm:text-4xl">Phường Bình Định — Tỉnh Gia Lai</h2>
          <p className="mt-5 leading-7 text-blue-900/70">Bản đồ du lịch số tập trung các địa điểm tham quan, ẩm thực, lưu trú, chăm sóc sức khỏe, tiện ích và cơ quan hành chính trong cùng một giao diện. Người dùng có thể tìm địa điểm, xem thông tin liên hệ và tạo lộ trình mà không phải rời khỏi website.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 font-bold text-brand-700 hover:text-brand-900">Mở bản đồ tương tác <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <Link key={category.key} to={`/kham-pha-dia-diem?category=${encodeURIComponent(category.key)}`} onClick={() => trackEvent('category_click', { category: category.key, categoryLabel: category.label, section: 'Trang chủ' })} className="group rounded-2xl border border-blue-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-brand-100">
              <div className="grid h-11 w-11 place-items-center rounded-xl text-xl" style={{ backgroundColor: `${category.marker}15` }}>{category.emoji}</div>
              <div className="mt-4 flex items-center justify-between gap-2"><h3 className="font-black text-blue-950">{category.label}</h3><ArrowRight size={16} className="text-blue-300 transition group-hover:translate-x-1 group-hover:text-brand-600" /></div>
              <p className="mt-2 text-sm leading-6 text-blue-700/60">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Gợi ý khám phá</p><h2 className="mt-2 text-3xl font-black text-blue-950">Địa điểm có thể dẫn đường</h2></div><Link to="/kham-pha-dia-diem" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700">Xem tất cả <ArrowRight size={16} /></Link></div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{featured.map((location) => <LocationCard key={location.id} location={location} onSelect={(item) => navigate(`/place.html?id=${encodeURIComponent(item.id)}`)} />)}</div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
