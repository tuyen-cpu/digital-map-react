import { ImagePlus, LocateFixed, MapPinned, Plus, Save, Trash2, Upload, Video, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { uploadMedia } from '../services/mediaService'
import { getCurrentPosition } from '../services/routing'
import { useCategories } from '../hooks/useCategories'
import MediaImage from './MediaImage'
import MediaVideo from './MediaVideo'

const DEFAULT_CENTER = [13.8932, 109.058]

const EMPTY = {
  name: '', category: 'utility', group: '', subgroup: '', address: '', lat: '', lng: '',
  phone: '', zaloUrl: '', website: '', email: '', facebook: '', hours: '', keywords: '', heritageStatus: '', description: '', notes: '',
  image: '', imageAlt: '', gallery: [], panoramas: [], videos: []
}

function fromLocation(location) {
  if (!location) return { ...EMPTY, gallery: [], panoramas: [], videos: [] }
  const { oldArea: _oldArea, plusCode: _plusCode, ...rest } = location
  return {
    ...EMPTY,
    ...rest,
    lat: location.lat ?? '',
    lng: location.lng ?? '',
    gallery: Array.isArray(location.gallery) ? location.gallery : [],
    panoramas: Array.isArray(location.panoramas) ? location.panoramas : [],
    videos: Array.isArray(location.videos) ? location.videos : []
  }
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
}

function splitKeywords(value) {
  return unique(String(value || '').split(/[;,]/).map((item) => item.trim()))
}

function Field({ label, className = '', children }) {
  return <label className={`block ${className}`}><span className="text-xs font-black uppercase tracking-wide text-blue-600">{label}</span>{children}</label>
}

const inputClass = 'mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-blue-950 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50'

function OptionSelect({ label, value, onChange, options }) {
  const [customMode, setCustomMode] = useState(Boolean(value && !options.includes(value)))
  useEffect(() => {
    setCustomMode(Boolean(value && !options.includes(value)))
  }, [options, value])
  return (
    <Field label={label}>
      <select
        className={inputClass}
        value={customMode ? '__custom__' : (value || '')}
        onChange={(e) => {
          if (e.target.value === '__custom__') { setCustomMode(true); if (options.includes(value)) onChange('') }
          else { setCustomMode(false); onChange(e.target.value) }
        }}
      >
        <option value="">-- Chọn {label.toLowerCase()} --</option>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
        <option value="__custom__">Khác / nhập mới...</option>
      </select>
      {customMode && <input autoFocus className={inputClass} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={`Nhập ${label.toLowerCase()} mới...`} />}
    </Field>
  )
}

function KeywordPicker({ value, onChange, options }) {
  const selected = splitKeywords(value)
  const [custom, setCustom] = useState('')
  const toggle = (keyword) => {
    const next = selected.includes(keyword) ? selected.filter((item) => item !== keyword) : [...selected, keyword]
    onChange(next.join('; '))
  }
  const addCustom = () => {
    const text = custom.trim()
    if (!text) return
    onChange(unique([...selected, text]).join('; '))
    setCustom('')
  }
  return (
    <div className="md:col-span-2">
      <span className="text-xs font-black uppercase tracking-wide text-blue-600">Từ khóa</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.slice(0, 28).map((item) => <button key={item} type="button" onClick={() => toggle(item)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${selected.includes(item) ? 'border-brand-500 bg-brand-600 text-white' : 'border-blue-100 bg-white text-blue-700 hover:bg-blue-50'}`}>{item}</button>)}
      </div>
      <div className="mt-2 flex gap-2"><input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }} className="min-w-0 flex-1 rounded-xl border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" placeholder="Thêm từ khóa khác..." /><button type="button" onClick={addCustom} className="rounded-xl border border-blue-200 px-3 text-sm font-black text-brand-700 hover:bg-blue-50">Thêm</button></div>
      {selected.length > 0 && <p className="mt-2 text-xs text-blue-500">Đang chọn: {selected.join(' · ')}</p>}
    </div>
  )
}

function MapClick({ onPick }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) })
  return null
}

function PickerController({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.4 })
  }, [lat, lng, map])
  return null
}

function CoordinatePicker({ lat, lng, onPick }) {
  const latNumber = Number(lat)
  const lngNumber = Number(lng)
  const valid = Number.isFinite(latNumber) && Number.isFinite(lngNumber) && lat !== '' && lng !== ''
  const center = valid ? [latNumber, lngNumber] : DEFAULT_CENTER
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-blue-100">
      <div className="bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">Chạm/bấm trực tiếp lên bản đồ để lấy kinh độ và vĩ độ.</div>
      <div className="h-64 sm:h-72">
        <MapContainer center={center} zoom={valid ? 15 : 13} zoomControl className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClick onPick={onPick} />
          <PickerController lat={valid ? latNumber : null} lng={valid ? lngNumber : null} />
          {valid && <CircleMarker center={[latNumber, lngNumber]} radius={9} pathOptions={{ color: '#1d4ed8', fillColor: '#2563eb', fillOpacity: 0.9, weight: 3 }} />}
        </MapContainer>
      </div>
    </div>
  )
}

function MediaThumb({ item, kind, onRemove }) {
  const url = typeof item === 'string' ? item : item?.url
  if (!url) return null
  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-blue-50">
      {kind === 'video'
        ? <MediaVideo src={url} controls className="aspect-video h-full w-full bg-blue-950 object-cover" />
        : <MediaImage src={url} alt={item?.alt || ''} className="aspect-[4/3] h-full w-full object-cover" />}
      <button type="button" onClick={onRemove} className="absolute right-1.5 top-1.5 rounded-lg bg-white/95 p-1.5 text-blue-700 shadow hover:bg-blue-50" aria-label="Xóa media"><X size={14} /></button>
    </div>
  )
}

export default function AdminLocationModal({ open, location, allLocations = [], allowedCategories = [], onClose, onSave, onDelete }) {
  const { categories: liveCats, getCategory: getLiveCat } = useCategories()
  const [form, setForm] = useState(fromLocation(location))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    if (open) {
      const next = fromLocation(location)
      if (!location && allowedCategories.length && !allowedCategories.includes(next.category)) next.category = allowedCategories[0]
      setForm(next)
      setError('')
      setBusy('')
      setShowPicker(false)
    }
  }, [open, location, allowedCategories])

  const optionSets = useMemo(() => {
    // Live suggestions from DB (via context)
    const liveCat = liveCats.find((c) => c.key === form.category) || {}
    const dbGroups = liveCat.suggestedGroups || []
    const dbSubgroups = liveCat.suggestedSubgroups || []
    const dbKeywords = liveCat.suggestedKeywords || []

    // Also pull unique values already used by existing locations in same category
    const sameCategory = allLocations.filter((item) => item.category === form.category)

    return {
      groups: unique([...dbGroups, ...sameCategory.map((item) => item.group)]),
      subgroups: unique([...dbSubgroups, ...sameCategory.map((item) => item.subgroup)]),
      keywords: unique([...dbKeywords, ...sameCategory.flatMap((item) => splitKeywords(item.keywords))])
    }
  }, [allLocations, form.category, liveCats])

  if (!open) return null
  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const pickCoordinate = (lat, lng) => setForm((current) => ({ ...current, lat: Number(lat).toFixed(6), lng: Number(lng).toFixed(6) }))

  const useGps = async () => {
    setBusy('gps')
    setError('')
    try {
      const position = await getCurrentPosition({ timeout: 15000 })
      pickCoordinate(position.lat, position.lng)
      setShowPicker(true)
    } catch (e) {
      setError(e.message || 'Không lấy được vị trí GPS.')
    } finally {
      setBusy('')
    }
  }

  const saveFiles = async (files, kind) => {
    const list = Array.from(files || [])
    if (!list.length) return
    setError('')
    setBusy(kind)
    try {
      if (kind === 'image') {
        const url = await uploadMedia(list[0], { folder: 'locations' })
        patch('image', url)
      } else {
        const key = kind === 'gallery' ? 'gallery' : kind === 'panorama' ? 'panoramas' : 'videos'
        const urls = []
        for (const file of list) {
          const url = await uploadMedia(file, { folder: kind === 'video' ? 'videos' : kind === 'panorama' ? 'panoramas' : 'gallery' })
          urls.push({ url, name: file.name, alt: kind === 'video' ? '' : `${form.name || 'Địa điểm'} - ${file.name}` })
        }
        patch(key, [...(form[key] || []), ...urls])
      }
    } catch (e) {
      setError(e.message || 'Không tải được file lên server.')
    } finally {
      setBusy('')
    }
  }

  const addUrl = (key, url, setUrl) => {
    const value = url.trim()
    if (!value) return
    patch(key, [...(form[key] || []), { url: value, name: value.split('/').pop() || 'media', alt: `${form.name || 'Địa điểm'} - media` }])
    setUrl('')
  }

  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim()) return setError('Hãy nhập tên địa điểm.')
    try {
      onSave?.({ ...form, oldArea: null, plusCode: null })
    } catch (e) {
      setError(e.message || 'Không thể lưu địa điểm.')
    }
  }

  return (
    <div className="fixed inset-0 z-[2200] grid place-items-center overflow-y-auto bg-blue-950/55 p-2 backdrop-blur-sm sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <form onSubmit={submit} className="my-auto flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-2xl sm:max-h-[94dvh] sm:rounded-[1.75rem]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-blue-100 px-4 py-4 sm:px-6">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-600">Quản trị địa điểm</p><h2 className="mt-1 text-xl font-black text-blue-950 sm:text-2xl">{location ? `Sửa: ${location.name}` : 'Thêm địa điểm mới'}</h2></div>
          <button type="button" onClick={onClose} className="rounded-xl border border-blue-100 p-2 text-blue-500 hover:bg-blue-50"><X size={19} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {error && <p className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{error}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tên địa điểm" className="md:col-span-2"><input className={inputClass} value={form.name} onChange={(e) => patch('name', e.target.value)} required /></Field>
            <Field label="Danh mục"><select className={inputClass} value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value, group: '', subgroup: '', keywords: '' }))}>{liveCats.filter((item) => !allowedCategories.length || allowedCategories.includes(item.key) || item.key === form.category).map((item) => <option key={item.key} value={item.key}>{item.emoji} {item.label}</option>)}</select></Field>
            <OptionSelect label="Phân nhóm" value={form.group} onChange={(value) => patch('group', value)} options={optionSets.groups} />
            <OptionSelect label="Phân nhóm chi tiết" value={form.subgroup} onChange={(value) => patch('subgroup', value)} options={optionSets.subgroups} />
            <Field label="Giờ hoạt động"><input className={inputClass} value={form.hours || ''} onChange={(e) => patch('hours', e.target.value)} placeholder="06:00 - 22:00" /></Field>
            <Field label="Địa chỉ" className="md:col-span-2"><textarea rows="2" className={inputClass} value={form.address} onChange={(e) => patch('address', e.target.value)} /></Field>
            <Field label="Vĩ độ"><input inputMode="decimal" className={inputClass} value={form.lat} onChange={(e) => patch('lat', e.target.value)} placeholder="Có thể để trống và chọn trên bản đồ" /></Field>
            <Field label="Kinh độ"><input inputMode="decimal" className={inputClass} value={form.lng} onChange={(e) => patch('lng', e.target.value)} placeholder="Có thể để trống và chọn trên bản đồ" /></Field>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowPicker((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-black text-brand-700 hover:bg-blue-50"><MapPinned size={17} />{showPicker ? 'Ẩn bản đồ chọn vị trí' : 'Chọn vị trí trên bản đồ'}</button>
              <button type="button" onClick={useGps} disabled={busy === 'gps'} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-60"><LocateFixed size={17} />{busy === 'gps' ? 'Đang lấy GPS...' : 'Lấy vị trí GPS hiện tại'}</button>
              {(form.lat !== '' || form.lng !== '') && <button type="button" onClick={() => setForm((current) => ({ ...current, lat: '', lng: '' }))} className="inline-flex items-center gap-2 rounded-xl border border-blue-100 px-3 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50"><Trash2 size={16} />Xóa tọa độ</button>}
            </div>
            {showPicker && <div className="md:col-span-2"><CoordinatePicker lat={form.lat} lng={form.lng} onPick={pickCoordinate} /></div>}
            <Field label="Điện thoại"><input className={inputClass} value={form.phone || ''} onChange={(e) => patch('phone', e.target.value)} /></Field>
            <Field label="Link Zalo"><input className={inputClass} value={form.zaloUrl || ''} onChange={(e) => patch('zaloUrl', e.target.value)} /></Field>
            <Field label="Website"><input className={inputClass} value={form.website || ''} onChange={(e) => patch('website', e.target.value)} /></Field>
            <Field label="Email"><input type="email" className={inputClass} value={form.email || ''} onChange={(e) => patch('email', e.target.value)} /></Field>
            <Field label="Facebook"><input className={inputClass} value={form.facebook || ''} onChange={(e) => patch('facebook', e.target.value)} /></Field>
            <KeywordPicker value={form.keywords || ''} onChange={(value) => patch('keywords', value)} options={optionSets.keywords} />
            <Field label="Thông tin di tích" className="md:col-span-2"><textarea rows="2" className={inputClass} value={form.heritageStatus || ''} onChange={(e) => patch('heritageStatus', e.target.value)} /></Field>
            <Field label="Giới thiệu" className="md:col-span-2"><textarea rows="4" className={inputClass} value={form.description || ''} onChange={(e) => patch('description', e.target.value)} /></Field>
            <Field label="Thông tin thêm" className="md:col-span-2"><textarea rows="3" className={inputClass} value={form.notes || ''} onChange={(e) => patch('notes', e.target.value)} /></Field>
          </div>

          <div className="mt-7 border-t border-blue-100 pt-6">
            <div className="flex items-center gap-2"><ImagePlus size={19} className="text-brand-600" /><h3 className="font-black text-blue-950">Ảnh đại diện</h3></div>
            <div className="mt-3 grid gap-4 md:grid-cols-[260px_1fr]">
              <div className="grid aspect-[4/3] overflow-hidden rounded-2xl border border-blue-100 bg-blue-50">{form.image ? <MediaImage src={form.image} alt={form.imageAlt || form.name} className="h-full w-full object-cover" /> : <div className="grid place-items-center text-xs font-bold text-blue-300">Chưa có ảnh</div>}</div>
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700"><Upload size={17} />{busy === 'image' ? 'Đang lưu...' : 'Chọn ảnh từ máy'}<input type="file" accept="image/*" className="hidden" disabled={Boolean(busy)} onChange={(e) => saveFiles(e.target.files, 'image')} /></label>
                <p className="mt-2 text-xs leading-5 text-blue-500">Chỉ dùng ảnh chụp đúng địa điểm. Nếu chưa xác minh được ảnh thì để trống; không dùng một ảnh cho nhiều địa điểm. Ảnh từ máy được lưu trực tiếp trong trình duyệt, giới hạn 8 MB/ảnh.</p>
                <input className={inputClass} value={form.image || ''} onChange={(e) => patch('image', e.target.value)} placeholder="Hoặc dán URL ảnh..." />
                <input className={inputClass} value={form.imageAlt || ''} onChange={(e) => patch('imageAlt', e.target.value)} placeholder="Mô tả ảnh (alt)" />
              </div>
            </div>
          </div>

          <MediaManager title="Thư viện nhiều ảnh" hint="Có thể chọn nhiều ảnh cùng lúc." icon={ImagePlus} items={form.gallery} onFiles={(files) => saveFiles(files, 'gallery')} accept="image/*" busy={busy === 'gallery'} onChange={(items) => patch('gallery', items)} addUrl={addUrl} fieldKey="gallery" />
          <MediaManager title="Ảnh toàn cảnh 360°" hint="Nên dùng ảnh equirectangular 2:1. Trình xem hỗ trợ kéo ngang, dọc và zoom." icon={ImagePlus} items={form.panoramas} onFiles={(files) => saveFiles(files, 'panorama')} accept="image/*" busy={busy === 'panorama'} onChange={(items) => patch('panoramas', items)} addUrl={addUrl} fieldKey="panoramas" />
          <MediaManager title="Video ngắn" hint="Hỗ trợ MP4/WebM/Ogg; giới hạn 40 MB mỗi video." icon={Video} items={form.videos} onFiles={(files) => saveFiles(files, 'video')} accept="video/mp4,video/webm,video/ogg" busy={busy === 'video'} onChange={(items) => patch('videos', items)} addUrl={addUrl} fieldKey="videos" kind="video" />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-blue-100 bg-white px-4 py-3 sm:px-6">
          {location && onDelete ? <button type="button" onClick={() => onDelete(location)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-black text-blue-700 hover:bg-blue-50"><Trash2 size={17} />Xóa địa điểm</button> : <span />}
          <div className="ml-auto flex gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-blue-100 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50">Hủy</button><button type="submit" disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-50"><Save size={17} />Lưu thay đổi</button></div>
        </div>
      </form>
    </div>
  )
}

function MediaManager({ title, hint, icon: Icon, items = [], onFiles, accept, busy, onChange, addUrl, fieldKey, kind = 'image' }) {
  const [url, setUrl] = useState('')
  return (
    <div className="mt-7 border-t border-blue-100 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><Icon size={19} className="text-brand-600" /><h3 className="font-black text-blue-950">{title}</h3></div><p className="mt-1 text-xs text-blue-500">{hint}</p></div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-brand-700 hover:bg-blue-50"><Upload size={15} />{busy ? 'Đang tải...' : 'Chọn file từ máy'}<input type="file" multiple accept={accept} disabled={busy} className="hidden" onChange={(e) => onFiles(e.target.files)} /></label>
      </div>
      <div className="mt-3 flex gap-2"><input value={url} onChange={(e) => setUrl(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-blue-100 px-3 py-2.5 text-xs outline-none focus:border-brand-300" placeholder="Hoặc dán URL media..." /><button type="button" onClick={() => addUrl(fieldKey, url, setUrl)} className="inline-flex items-center gap-1 rounded-xl border border-blue-100 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"><Plus size={14} />Thêm</button></div>
      {items.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{items.map((item, index) => <MediaThumb key={`${item?.url || item}-${index}`} item={item} kind={kind} onRemove={() => onChange(items.filter((_, i) => i !== index))} />)}</div>}
    </div>
  )
}
