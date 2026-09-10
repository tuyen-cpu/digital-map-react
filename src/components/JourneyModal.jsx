import { useEffect, useMemo, useRef, useState } from 'react'
import { Crosshair, LocateFixed, MapPin, Navigation, Search, X } from 'lucide-react'
import { geocodeAddress, getCurrentPosition } from '../services/routing'
import { hasCoordinates } from '../utils/format'
import { locationMatches } from '../utils/text'

export default function JourneyModal({ open, locations, initialDestination, onClose, onRoute }) {
  const [originMode, setOriginMode] = useState('gps')
  const [address, setAddress] = useState('')
  const [originSuggestions, setOriginSuggestions] = useState([])
  const [selectedOrigin, setSelectedOrigin] = useState(null)
  const [suggestBusy, setSuggestBusy] = useState(false)
  const [destinationQuery, setDestinationQuery] = useState(initialDestination?.name || '')
  const [destination, setDestination] = useState(initialDestination || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)

  const candidates = useMemo(() => locations
    .filter((item) => locationMatches(item, destinationQuery))
    .slice(0, 10), [locations, destinationQuery])

  useEffect(() => {
    if (!open || originMode !== 'address') return undefined
    const query = address.trim()
    if (query.length < 3 || selectedOrigin?.label === address) {
      if (query.length < 3) setOriginSuggestions([])
      return undefined
    }
    window.clearTimeout(debounceRef.current)
    const controller = new AbortController()
    debounceRef.current = window.setTimeout(async () => {
      setSuggestBusy(true)
      try {
        const results = await geocodeAddress(query, controller.signal, 6, { localBias: false })
        setOriginSuggestions(results)
      } catch (e) {
        if (e?.name !== 'AbortError') setOriginSuggestions([])
      } finally {
        setSuggestBusy(false)
      }
    }, 650)
    return () => {
      window.clearTimeout(debounceRef.current)
      controller.abort()
    }
  }, [address, open, originMode, selectedOrigin])

  if (!open) return null

  const searchOriginNow = async () => {
    if (address.trim().length < 3) {
      setError('Hãy nhập ít nhất 3 ký tự để tìm địa chỉ.')
      return
    }
    setSuggestBusy(true)
    setError('')
    try {
      const results = await geocodeAddress(address.trim(), undefined, 6, { localBias: false })
      setOriginSuggestions(results)
      if (!results.length) setError('Không tìm thấy địa chỉ phù hợp. Hãy thử nhập số nhà + tên đường.')
    } catch (e) {
      setError(e.message || 'Không thể tìm địa chỉ.')
    } finally {
      setSuggestBusy(false)
    }
  }

  const resolveDestination = async (item) => {
    if (hasCoordinates(item)) return item
    const results = await geocodeAddress(item.address || item.name, undefined, 5, { localBias: true })
    if (!results.length) throw new Error(`Chưa xác định được vị trí của “${item.name}”. Hãy bổ sung tọa độ trong trang Quản trị.`)
    return { ...item, lat: results[0].lat, lng: results[0].lng }
  }

  const submit = async () => {
    if (!destination) {
      setError('Hãy chọn một điểm đến trong danh sách gợi ý.')
      return
    }
    setBusy(true)
    setError('')
    try {
      let origin
      if (originMode === 'gps') {
        origin = { ...(await getCurrentPosition()), label: 'Vị trí hiện tại', source: 'gps' }
      } else {
        if (!address.trim()) throw new Error('Hãy nhập điểm xuất phát.')
        if (selectedOrigin && selectedOrigin.label === address) origin = { ...selectedOrigin, source: 'address' }
        else {
          const results = await geocodeAddress(address.trim(), undefined, 6, { localBias: false })
          if (!results.length) throw new Error('Không tìm thấy điểm xuất phát. Hãy nhập địa chỉ cụ thể hơn.')
          origin = { ...results[0], source: 'address' }
        }
      }
      const resolvedDestination = await resolveDestination(destination)
      await onRoute?.(origin, resolvedDestination)
      onClose?.()
    } catch (e) {
      setError(e.message || 'Không thể tạo lộ trình.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1700] grid place-items-center overflow-y-auto bg-blue-950/55 p-2 backdrop-blur-sm sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="my-auto w-full max-w-xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-brand-800 to-brand-600 p-5 text-white">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200">Dẫn đường trong website</p><h2 className="mt-1 text-2xl font-black">Bạn muốn đi đâu?</h2><p className="mt-1 text-sm text-white/80">Tìm điểm xuất phát, chọn địa điểm và xem lộ trình ngay trên bản đồ.</p></div>
          <button type="button" onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X size={20} /></button>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <label className="text-xs font-black uppercase tracking-wide text-blue-600">Điểm xuất phát</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setOriginMode('gps'); setError('') }} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold ${originMode === 'gps' ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-blue-100 text-blue-700'}`}><LocateFixed size={16} />Vị trí của tôi</button>
              <button type="button" onClick={() => { setOriginMode('address'); setError('') }} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold ${originMode === 'address' ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-blue-100 text-blue-700'}`}><MapPin size={16} />Nhập địa chỉ</button>
            </div>
            {originMode === 'address' && (
              <div className="relative mt-2">
                <p className="mb-2 text-xs leading-5 text-blue-500">Có thể nhập điểm xuất phát ở bất kỳ tỉnh/thành nào trong Việt Nam, không giới hạn trong Phường Bình Định.</p>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={17} />
                    <input
                      value={address}
                      onChange={(e) => { setAddress(e.target.value); setSelectedOrigin(null); setError('') }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchOriginNow() } }}
                      placeholder="Nhập số nhà, tên đường..."
                      autoComplete="off"
                      className="w-full rounded-xl border border-blue-100 py-3 pl-10 pr-3 text-sm text-blue-950 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                    />
                  </div>
                  <button type="button" onClick={searchOriginNow} disabled={suggestBusy} className="shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-60">{suggestBusy ? '...' : 'Tìm'}</button>
                </div>
                {(originSuggestions.length > 0 || suggestBusy) && (
                  <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-52 overflow-y-auto rounded-xl border border-blue-100 bg-white p-1 shadow-2xl">
                    {suggestBusy && <p className="px-3 py-2 text-xs text-blue-400">Đang tìm gợi ý địa chỉ...</p>}
                    {originSuggestions.map((item, index) => (
                      <button key={`${item.lat}-${item.lng}-${index}`} type="button" onClick={() => { setAddress(item.label); setSelectedOrigin(item); setOriginSuggestions([]); setError('') }} className="flex w-full gap-2 rounded-lg px-3 py-2.5 text-left text-xs leading-5 text-blue-900 hover:bg-blue-50">
                        <MapPin size={15} className="mt-0.5 shrink-0 text-brand-600" /><span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wide text-blue-600">Điểm đến</label>
            <div className="relative mt-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={17} /><input value={destinationQuery} onChange={(e) => { setDestinationQuery(e.target.value); setDestination(null); setError('') }} placeholder="UBND, Công an, chùa, quán ăn..." className="w-full rounded-xl border border-blue-100 py-3 pl-10 pr-3 text-sm text-blue-950 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" /></div>
            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-blue-100 p-1">
              {candidates.map((item) => <button key={item.id} type="button" onClick={() => { setDestination(item); setDestinationQuery(item.name); setError('') }} className={`flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm ${destination?.id === item.id ? 'bg-brand-50 font-bold text-brand-800' : 'text-blue-900 hover:bg-blue-50'}`}><Crosshair size={14} className="mt-0.5 shrink-0" /><span className="min-w-0"><span className="block truncate">{item.name}</span><span className="mt-0.5 block truncate text-[11px] font-normal text-blue-500">{item.address || 'Chưa có địa chỉ'}</span></span></button>)}
              {!candidates.length && <p className="px-3 py-4 text-center text-xs text-blue-400">Không tìm thấy địa điểm phù hợp.</p>}
            </div>
          </div>

          {error && <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-blue-100 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50">Đóng</button>
            <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"><Navigation size={17} />{busy ? 'Đang xử lý...' : 'Dẫn đường'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
