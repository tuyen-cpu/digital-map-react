import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useAppState } from '../context/AppStateContext'
import { getCategory } from '../utils/categories'
import LocationDetailContent from './LocationDetailContent'

export default function LocationDetailDrawer({ location, onClose, onNavigate, onPanorama }) {
  const { trackEvent } = useAppState()
  useEffect(() => {
    if (location) trackEvent('location_view', { locationId: location.id, locationName: location.name, section: 'Hộp chi tiết' })
  }, [location?.id, location?.name, trackEvent])
  if (!location) return null
  const category = getCategory(location.category)

  return (
    <div className="fixed inset-0 z-[1500] grid place-items-center overflow-x-hidden overflow-y-auto bg-blue-950/50 p-2 backdrop-blur-sm sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <section className="my-auto flex max-h-[96dvh] w-full max-w-5xl min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-[1.75rem]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-blue-100 bg-white px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-xl text-brand-700">{category.emoji}</div><div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-brand-600 sm:text-xs">{location.group || category.label}</p><h2 className="mt-0.5 line-clamp-2 text-lg font-black leading-tight text-blue-950 sm:text-2xl">{location.name}</h2></div></div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-xl border border-blue-100 bg-white p-2 text-blue-500 transition hover:bg-blue-50 hover:text-brand-700" aria-label="Đóng"><X size={20} /></button>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"><LocationDetailContent location={location} onNavigate={onNavigate} onPanorama={onPanorama} /></div>
      </section>
    </div>
  )
}
