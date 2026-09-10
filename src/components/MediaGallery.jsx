import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import MediaImage from './MediaImage'

export default function MediaGallery({ location, fallback }) {
  const items = useMemo(() => {
    const list = []
    if (location?.image) list.push({ url: location.image, alt: location.imageAlt || location.name })
    for (const item of location?.gallery || []) {
      const url = typeof item === 'string' ? item : item?.url
      if (url && !list.some((entry) => entry.url === url)) list.push({ url, alt: typeof item === 'object' ? item.alt : '' })
    }
    if (!list.length && fallback) list.push({ url: fallback, alt: location?.name || '' })
    return list
  }, [fallback, location])
  const [index, setIndex] = useState(0)
  const [full, setFull] = useState(false)
  useEffect(() => { setIndex(0); setFull(false) }, [location?.id])
  const current = items[Math.min(index, Math.max(0, items.length - 1))]

  if (!current) return null
  const move = (delta) => setIndex((value) => (value + delta + items.length) % items.length)

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-card">
        <div className="group relative aspect-[16/10] w-full overflow-hidden bg-blue-100 sm:aspect-[16/9]">
          <MediaImage src={current.url} fallback={fallback} alt={current.alt || location?.name || ''} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.015]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-950/55 to-transparent" />
          <button type="button" onClick={() => setFull(true)} className="absolute right-3 top-3 rounded-xl bg-white/90 p-2 text-blue-800 shadow hover:bg-white" aria-label="Xem ảnh lớn"><Maximize2 size={17} /></button>
          {items.length > 1 && <>
            <button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-blue-900 shadow hover:bg-white" aria-label="Ảnh trước"><ChevronLeft size={19} /></button>
            <button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-blue-900 shadow hover:bg-white" aria-label="Ảnh sau"><ChevronRight size={19} /></button>
          </>}
          <span className="absolute bottom-3 right-3 rounded-full bg-blue-950/55 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">{index + 1}/{items.length} ảnh</span>
        </div>
        {items.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-2">
            {items.map((item, itemIndex) => <button key={`${item.url}-${itemIndex}`} type="button" onClick={() => setIndex(itemIndex)} className={`shrink-0 overflow-hidden rounded-lg border-2 ${itemIndex === index ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'}`}><MediaImage src={item.url} fallback={fallback} alt="" className="h-14 w-20 object-cover" /></button>)}
          </div>
        )}
      </div>

      {full && (
        <div className="fixed inset-0 z-[2600] grid place-items-center bg-blue-950/95 p-3" onMouseDown={(e) => e.target === e.currentTarget && setFull(false)}>
          <button type="button" onClick={() => setFull(false)} className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-white hover:bg-white/20"><X /></button>
          <MediaImage src={current.url} fallback={fallback} alt={current.alt || location?.name || ''} className="max-h-[90dvh] max-w-[94vw] rounded-2xl object-contain" />
          {items.length > 1 && <>
            <button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronLeft /></button>
            <button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronRight /></button>
          </>}
        </div>
      )}
    </>
  )
}
