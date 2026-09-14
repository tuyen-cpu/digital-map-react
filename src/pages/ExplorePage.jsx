import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import Footer from '../components/Footer'
import LocationCard from '../components/LocationCard'
import LocationDetailDrawer from '../components/LocationDetailDrawer'
import PanoramaModal from '../components/PanoramaModal'
import { useAppState } from '../context/AppStateContext'
import { useCategories } from '../hooks/useCategories'
import { locationMatches } from '../utils/text'

export default function ExplorePage() {
  const { locations, trackEvent } = useAppState()
  const { categories: CATEGORIES } = useCategories()
  const [params, setParams] = useSearchParams()
  const initialCategory = CATEGORIES.some((item) => item.key === params.get('category')) ? params.get('category') : 'all'
  const [search, setSearch] = useState(params.get('q') || '')
  const [category, setCategory] = useState(initialCategory)
  const [detail, setDetail] = useState(null)
  const [panorama, setPanorama] = useState(null)
  const navigate = useNavigate()

  const filtered = useMemo(() => locations.filter((item) => (category === 'all' || item.category === category) && locationMatches(item, search)), [category, locations, search])

  const selectCategory = (value) => {
    setCategory(value)
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete('category')
    else next.set('category', value)
    setParams(next, { replace: true })
    if (value !== 'all') trackEvent('category_filter', { category: value, section: 'Khám phá địa điểm' })
  }

  const navigateInsideWebsite = (location) => {
    setDetail(null)
    navigate(`/ban-do-du-lich?routeTo=${encodeURIComponent(location.id)}`)
  }

  return (
    <div className="min-h-screen bg-blue-50/40">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-[1400px] px-5 py-9 sm:py-12 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Danh bạ địa điểm</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950 sm:text-4xl">Khám phá địa điểm</h1>
          <p className="mt-3 max-w-2xl text-blue-700/70">Tìm du lịch, ẩm thực, lưu trú, tiện ích và các cơ quan hành chính của Phường Bình Định.</p>
          <div className="mt-7 grid gap-3 lg:grid-cols-[1fr_320px]">
            <label className="relative block"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={19} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, địa chỉ, số điện thoại, UBND, Công an..." className="w-full rounded-xl border border-blue-100 bg-blue-50/50 py-3.5 pl-12 pr-4 text-sm text-blue-950 outline-none focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100" /></label>
            <label className="relative block"><SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} /><select value={category} onChange={(e) => selectCategory(e.target.value)} className="w-full appearance-none rounded-xl border border-blue-100 bg-white py-3.5 pl-12 pr-4 text-sm font-semibold text-blue-900 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100"><option value="all">Tất cả danh mục</option>{CATEGORIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">{CATEGORIES.map((item) => <button key={item.key} type="button" onClick={() => selectCategory(category === item.key ? 'all' : item.key)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${category === item.key ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-blue-100 bg-white text-blue-700 hover:border-blue-200'}`}>{item.emoji} {item.shortLabel}</button>)}</div>
          <p className="mt-4 text-sm text-blue-700/60"><strong className="text-blue-950">{filtered.length}</strong> / {locations.length} địa điểm</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-5 sm:py-10 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((location) => <LocationCard key={location.id} location={location} onSelect={setDetail} />)}</div>
        {!filtered.length && <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-14 text-center text-blue-500">Không tìm thấy địa điểm phù hợp.</div>}
      </section>
      <Footer />
      <LocationDetailDrawer location={detail} onClose={() => setDetail(null)} onNavigate={navigateInsideWebsite} onPanorama={(location) => { setDetail(null); setPanorama(location) }} />
      <PanoramaModal location={panorama} onClose={() => setPanorama(null)} />
    </div>
  )
}
