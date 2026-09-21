import { Heart, Info, MapPin, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppStateContext'
import MediaImage from './MediaImage'
import { getCategory } from '../utils/categories'
import { hasCoordinates } from '../utils/format'


export default function LocationCard({ location, selected = false, onSelect, onOpenDetails, compact = false }) {
  const category = getCategory(location.category)
  const { isFavorite, toggleFavorite } = useAppState()
  const favorite = isFavorite(location.id)
  const mappable = hasCoordinates(location)

  return (
    <article className={`group overflow-hidden rounded-2xl border bg-white transition ${selected ? 'border-brand-300 shadow-soft ring-2 ring-brand-100' : 'border-blue-100 shadow-card hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-soft'}`}>
      <button type="button" onClick={() => onSelect?.(location)} className="w-full text-left">
        {!compact && location.image && (
          <div className="relative aspect-[16/7] overflow-hidden bg-blue-50">
            <MediaImage
              src={location.image}
              alt={location.imageAlt || location.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-blue-950/50 to-transparent" />
            <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-brand-700 backdrop-blur">{category.emoji} {category.shortLabel}</span>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {compact && <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-lg text-brand-700" aria-hidden="true">{category.emoji}</div>}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 font-black leading-5 text-blue-950">{location.name}</h3>
              <p className="mt-1 text-xs font-semibold text-brand-600">{location.group || category.label}</p>
              {!compact && <p className="mt-2 line-clamp-2 text-sm leading-5 text-blue-800/70">{location.address || 'Chưa có địa chỉ mô tả'}</p>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-blue-700/65">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${mappable ? 'bg-sky-50 text-sky-700' : 'bg-blue-50 text-blue-500'}`}><MapPin size={12} />{mappable ? 'Có GPS' : 'Định vị theo địa chỉ'}</span>
          </div>
        </div>
      </button>
      <div className="flex items-center gap-1 border-t border-blue-50 px-3 py-2">
        <button type="button" onClick={() => toggleFavorite(location.id).catch(() => {})} className={`rounded-lg p-2 transition ${favorite ? 'bg-blue-100 text-brand-700' : 'text-blue-300 hover:bg-blue-50 hover:text-brand-700'}`} aria-label={favorite ? 'Bỏ yêu thích' : 'Lưu yêu thích'}>
          <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <button type="button" onClick={() => (onOpenDetails || onSelect)?.(location)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"><Info size={14} />Chi tiết</button>
        {mappable
          ? <Link to={`/ban-do-du-lich?routeTo=${encodeURIComponent(location.id)}`} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-brand-700 hover:bg-brand-50"><Navigation size={13} />Dẫn đường</Link>
          : <button type="button" disabled title="Địa điểm này chưa có tọa độ trên bản đồ" className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-blue-300 cursor-not-allowed opacity-60"><Navigation size={13} />Dẫn đường</button>
        }
      </div>
    </article>
  )
}

