import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Compass, Heart, MapPin } from 'lucide-react'
import Footer from '../components/Footer'
import LocationCard from '../components/LocationCard'
import { useAppState } from '../context/AppStateContext'

export default function FavoritesPage() {
  const { session, favorites, locations, locationsLoaded } = useAppState()

  // Auth guard
  if (!session) {
    return <Navigate to="/dang-nhap" state={{ from: '/yeu-thich' }} replace />
  }

  // Compute favorite locations
  const favoriteLocations = useMemo(
    () => locations.filter((l) => favorites.includes(l.id)),
    [locations, favorites]
  )

  return (
    <div className="min-h-screen bg-blue-50/40">
      {/* Hero header */}
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-[1400px] px-5 py-9 sm:py-12 lg:px-8">
          <Link
            to="/tai-khoan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-brand-700 mb-4"
          >
            <ArrowLeft size={14} />
            Quay lại tài khoản
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Yêu thích</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-blue-950 sm:text-4xl">Địa điểm yêu thích</h1>
            {locationsLoaded && (
              <span className="rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-sm font-black text-brand-700">
                {favoriteLocations.length} địa điểm
              </span>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-blue-700/70">
            Những địa điểm bạn đã đánh dấu yêu thích — truy cập nhanh và dẫn đường chỉ với một cú click.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-5 sm:py-10 lg:px-8">
        {/* Loading skeleton */}
        {!locationsLoaded && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-blue-100 h-64 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {locationsLoaded && favoriteLocations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-pink-50 border border-pink-100 mb-5">
              <Heart size={36} className="text-pink-400" />
            </div>
            <h2 className="text-xl font-black text-blue-950 mb-2">Chưa có địa điểm yêu thích</h2>
            <p className="max-w-sm text-sm text-blue-600/70 mb-7">
              Khi bạn nhấn vào biểu tượng trái tim trên một địa điểm, nó sẽ xuất hiện ở đây để bạn truy cập nhanh.
            </p>
            <Link
              to="/kham-pha-dia-diem"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-black text-white hover:bg-brand-700 transition"
            >
              <Compass size={17} />
              Khám phá địa điểm
            </Link>
          </div>
        )}

        {/* Location grid */}
        {locationsLoaded && favoriteLocations.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteLocations.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
