import { ArrowLeft, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../components/Footer'
import LocationDetailContent from '../components/LocationDetailContent'
import PanoramaModal from '../components/PanoramaModal'
import { useAppState } from '../context/AppStateContext'
import { getCategory } from '../utils/categories'

export default function PlacePage() {
  const { locations, trackEvent } = useAppState()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [panorama, setPanorama] = useState(null)
  const id = params.get('id') || ''
  const location = locations.find((item) => item.id === id)

  useEffect(() => {
    if (location) trackEvent('location_view', { locationId: location.id, locationName: location.name, section: 'Trang chi tiết' })
  }, [location?.id, location?.name, trackEvent])

  if (!location) {
    return <div className="min-h-[calc(100dvh-5rem)] bg-blue-50/40"><main className="mx-auto max-w-3xl px-5 py-20 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-brand-700"><MapPin size={28} /></div><h1 className="mt-5 text-3xl font-black text-blue-950">Không tìm thấy địa điểm</h1><p className="mt-3 text-blue-700/70">Địa điểm có thể đã được đổi mã hoặc xóa trong trang quản trị.</p><Link to="/kham-pha-dia-diem" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-black text-white hover:bg-brand-700"><ArrowLeft size={17} />Quay lại khám phá</Link></main><Footer /></div>
  }

  const category = getCategory(location.category)
  const navigateInside = () => navigate(`/ban-do-du-lich?routeTo=${encodeURIComponent(location.id)}`)

  return (
    <div className="min-h-screen bg-blue-50/40">
      <section className="border-b border-blue-100 bg-white"><div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8"><Link to="/kham-pha-dia-diem" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-900"><ArrowLeft size={16} />Danh sách địa điểm</Link><div className="mt-5 flex items-start gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-2xl">{category.emoji}</div><div><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-600">{location.group || category.label}</p><h1 className="mt-1 text-3xl font-black leading-tight text-blue-950 sm:text-4xl">{location.name}</h1>{location.address && <p className="mt-2 flex items-start gap-1.5 text-sm leading-6 text-blue-700/70"><MapPin size={16} className="mt-1 shrink-0" />{location.address}</p>}</div></div></div></section>
      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8"><div className="overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-card sm:rounded-3xl"><LocationDetailContent location={location} onNavigate={navigateInside} onPanorama={setPanorama} showPageLink={false} /></div></main>
      <Footer />
      <PanoramaModal location={panorama} onClose={() => setPanorama(null)} />
    </div>
  )
}
