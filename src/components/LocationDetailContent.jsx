import { CheckCircle2, ExternalLink, Facebook, Globe2, Mail, MapPinned, Navigation, Phone, PlayCircle, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppStateContext'
import { getCategory } from '../utils/categories'
import { externalHref, hasCoordinates, phoneHref, zaloHref } from '../utils/format'
import LocationReviews from './LocationReviews'
import MediaGallery from './MediaGallery'
import MediaVideo from './MediaVideo'


function DetailRow({ label, children }) {
  if (children == null || children === '') return null
  return (
    <div className="grid min-w-0 gap-1 border-b border-blue-50 py-3.5 sm:grid-cols-[145px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[11px] font-black uppercase tracking-[0.08em] text-blue-400">{label}</dt>
      <dd className="min-w-0 break-words text-sm leading-6 text-blue-950/80">{children}</dd>
    </div>
  )
}

function ActionLink({ href, icon: Icon, children, primary = false, onClick }) {
  if (!href) return null
  const external = href.startsWith('http')
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition sm:text-sm ${primary ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700' : 'border border-blue-200 bg-white text-blue-800 hover:bg-blue-50'}`}>
      <Icon size={16} />{children}
    </a>
  )
}

export default function LocationDetailContent({ location, onNavigate, onPanorama, showPageLink = true }) {
  const { session, trackEvent, recordTravel } = useAppState()
  const [travelNotice, setTravelNotice] = useState('')

  useEffect(() => {
    if (!location?.id || !['user', 'manager'].includes(session?.role)) return
    try {
      const key = `binh-dinh:history-view:${session.username}:${location.id}`
      if (!window.sessionStorage.getItem(key)) {
        recordTravel(location.id, 'view')
        window.sessionStorage.setItem(key, '1')
      }
    } catch {
      recordTravel(location.id, 'view')
    }
  }, [location?.id, recordTravel, session?.role, session?.username])

  if (!location) return null
  const category = getCategory(location.category)
  const phone = phoneHref(location.phone)
  const zalo = zaloHref(location)
  const website = location.website || externalHref(location.websiteEmail)
  const email = location.email || (String(location.websiteEmail || '').includes('@') ? String(location.websiteEmail).trim() : '')
  const hasGps = hasCoordinates(location)
  const videos = Array.isArray(location.videos) ? location.videos.filter((item) => (typeof item === 'string' ? item : item?.url)) : []

  return (
    <div>
      <div className="grid min-w-0 min-h-0 lg:grid-cols-[minmax(0,.96fr)_minmax(0,1.04fr)]">
        <div className="border-b border-blue-100 bg-blue-50/50 p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <MediaGallery location={location} />
          <span className="mt-3 inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-bold text-brand-700">{category.emoji} {category.label}</span>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => { trackEvent('navigation_click', { locationId: location.id, locationName: location.name }); onNavigate?.(location) }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-brand-700 sm:text-sm"><Navigation size={16} />Dẫn đường</button>
            <ActionLink href={phone} icon={Phone} onClick={() => trackEvent('contact_click', { locationId: location.id, locationName: location.name, channel: 'phone' })}>Gọi</ActionLink>
            <ActionLink href={zalo} icon={ExternalLink} onClick={() => trackEvent('contact_click', { locationId: location.id, locationName: location.name, channel: 'zalo' })}>Zalo</ActionLink>
            <button type="button" onClick={() => { trackEvent('panorama_open', { locationId: location.id, locationName: location.name }); onPanorama?.(location) }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-black text-blue-800 transition hover:bg-blue-50 sm:text-sm"><Sparkles size={16} />Ảnh 360°</button>
            {website && <ActionLink href={website} icon={Globe2} onClick={() => trackEvent('contact_click', { locationId: location.id, locationName: location.name, channel: 'website' })}>Website</ActionLink>}
            {location.facebook && <ActionLink href={location.facebook} icon={Facebook} onClick={() => trackEvent('contact_click', { locationId: location.id, locationName: location.name, channel: 'facebook' })}>Facebook</ActionLink>}
            {['user', 'manager'].includes(session?.role) && <button type="button" onClick={() => { recordTravel(location.id, 'visited'); setTravelNotice('Đã lưu địa điểm vào danh sách đã đến.') }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-black text-blue-800 transition hover:bg-blue-50 sm:text-sm"><CheckCircle2 size={16} />Đánh dấu đã đến</button>}
          </div>
          {travelNotice && <p className="mt-2 text-xs font-semibold text-emerald-700">{travelNotice}</p>}

          {location.description && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-600">Giới thiệu</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-blue-950/75">{location.description}</p>
            </div>
          )}

          {videos.length > 0 && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-brand-600"><PlayCircle size={15} />Video ngắn</p>
              <div className="mt-3 grid gap-3">
                {videos.map((item, index) => {
                  const src = typeof item === 'string' ? item : item.url
                  return <MediaVideo key={`${src}-${index}`} src={src} controls playsInline preload="metadata" onPlay={() => trackEvent('video_play', { locationId: location.id, locationName: location.name, videoIndex: index + 1 })} className="aspect-video w-full rounded-xl bg-blue-950 object-contain" />
                })}
              </div>
            </div>
          )}

          {showPageLink && (
            <Link to={`/place.html?id=${encodeURIComponent(location.id)}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-brand-700 hover:bg-blue-100">
              <MapPinned size={17} /> Mở trang chi tiết đầy đủ
            </Link>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-600">{location.group || category.label}</p>
            <h3 className="mt-1 text-xl font-black text-blue-950 sm:text-2xl">{location.name}</h3>
            {location.subgroup && <p className="mt-1 text-sm font-semibold text-blue-600">{location.subgroup}</p>}
          </div>

          <dl className="mt-4">
            <DetailRow label="Địa chỉ">{location.address}</DetailRow>
            <DetailRow label="Danh mục">{category.label}</DetailRow>
            <DetailRow label="Giờ hoạt động">{location.hours}</DetailRow>
            <DetailRow label="Điện thoại">{phone ? <a href={phone} className="font-bold text-brand-700 hover:underline">{location.phone}</a> : location.phone}</DetailRow>
            <DetailRow label="Zalo">{zalo ? <a href={zalo} target="_blank" rel="noreferrer" className="font-bold text-brand-700 hover:underline">{location.zaloLabel || 'Mở Zalo liên hệ'}</a> : null}</DetailRow>
            <DetailRow label="Email">{email ? <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"><Mail size={14} />{email}</a> : null}</DetailRow>
            <DetailRow label="Website">{website ? <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"><Globe2 size={14} />Mở website</a> : null}</DetailRow>
            <DetailRow label="Từ khóa">{location.keywords}</DetailRow>
            <DetailRow label="Thông tin di tích">{location.heritageStatus}</DetailRow>
            <DetailRow label="Thông tin thêm">{location.notes}</DetailRow>
            <DetailRow label="Tọa độ">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{hasGps ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Chưa có GPS cố định; website sẽ xác định từ địa chỉ khi dẫn đường.'}</span>
                <button type="button" onClick={() => { trackEvent('navigation_click', { locationId: location.id, locationName: location.name }); onNavigate?.(location) }} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-black text-white hover:bg-brand-700"><Navigation size={14} />Dẫn đường</button>
              </div>
            </DetailRow>
          </dl>
        </div>
      </div>
      <LocationReviews location={location} />
    </div>
  )
}

