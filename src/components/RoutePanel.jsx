import { ChevronUp, Crosshair, EyeOff, Route, Square, X } from 'lucide-react'
import { formatDistance, formatDuration } from '../utils/format'

export default function RoutePanel({
  route,
  destination,
  origin,
  loading,
  error,
  followUser,
  onToggleFollow,
  expanded = true,
  onToggleExpanded,
  onStop
}) {
  if (!route && !loading && !error) return null

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggleExpanded}
        className="absolute bottom-4 left-1/2 z-[700] flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-blue-100 bg-white/95 px-4 py-2.5 text-left shadow-2xl backdrop-blur sm:bottom-5 sm:left-auto sm:right-4 sm:translate-x-0"
        aria-label="Mở bảng chỉ dẫn"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-white"><Route size={16} /></span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-black text-blue-950">{destination?.name || 'Đang dẫn đường'}</span>
          <span className="block text-[10px] font-semibold text-blue-500">{route ? `${formatDistance(route.distanceMeters)} · ${formatDuration(route.durationSeconds)}` : loading ? 'Đang tìm tuyến đường...' : 'Mở lại chỉ dẫn'}</span>
        </span>
        <ChevronUp size={16} className="shrink-0 text-brand-600" />
      </button>
    )
  }

  return (
    <div className="absolute inset-x-2 bottom-2 z-[700] max-h-[72dvh] overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white/97 shadow-2xl backdrop-blur sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[min(390px,calc(100%-2rem))] lg:bottom-6 lg:right-6">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">Dẫn đường</p>
          <h3 className="truncate text-sm font-extrabold text-blue-950">{destination?.name || 'Lộ trình'}</h3>
          {origin?.label && <p className="mt-0.5 truncate text-[10px] text-slate-400">Từ: {origin.label}</p>}
        </div>
        <button type="button" onClick={onToggleExpanded} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Ẩn bảng chỉ dẫn nhưng vẫn giữ lộ trình" aria-label="Ẩn bảng chỉ dẫn"><X size={17} /></button>
      </div>

      <div className="max-h-[calc(72dvh-64px)] overflow-y-auto overscroll-contain">
        {loading && <div className="p-5 text-sm text-slate-600">Đang tìm tuyến đường phù hợp...</div>}
        {error && <div className="p-5 text-sm text-blue-700">{error}</div>}
        {!route && error && <div className="px-4 pb-4"><button type="button" onClick={onStop} className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 py-2.5 text-xs font-black text-blue-700 hover:bg-blue-50"><Square size={14} />Đóng lộ trình</button></div>}
        {route && (
          <>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-xl bg-brand-50 p-3"><p className="text-[10px] font-bold uppercase text-brand-600">Quãng đường</p><p className="mt-1 text-xl font-black text-brand-900">{formatDistance(route.distanceMeters)}</p></div>
              <div className="rounded-xl bg-sky-50 p-3"><p className="text-[10px] font-bold uppercase text-sky-700">Dự kiến</p><p className="mt-1 text-xl font-black text-sky-900">{formatDuration(route.durationSeconds)}</p></div>
            </div>
            <div className="grid gap-2 px-4 pb-3 sm:grid-cols-2">
              <button type="button" onClick={onToggleFollow} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${followUser ? 'bg-sky-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Crosshair size={15} />{followUser ? 'Đang bám GPS' : 'Bám theo GPS'}</button>
              <button type="button" onClick={onToggleExpanded} className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 px-3 py-2.5 text-xs font-bold text-brand-700 hover:bg-blue-50"><EyeOff size={15} />Ẩn để xem bản đồ</button>
            </div>
            <div className="border-t border-slate-100 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><Route size={14} />Chỉ dẫn từng chặng</div>
              <ol className="space-y-3">
                {route.steps.map((step, index) => (
                  <li key={step.id} className="flex gap-3 text-xs text-slate-700">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 font-black text-slate-500">{index + 1}</span>
                    <div className="min-w-0"><p className="font-semibold leading-5">{step.text}</p><p className="mt-0.5 text-[11px] text-slate-400">{formatDistance(step.distanceMeters)}</p></div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 p-3 backdrop-blur">
              <button type="button" onClick={onStop} className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 py-2.5 text-xs font-black text-blue-700 hover:bg-blue-50"><Square size={14} />Kết thúc dẫn đường</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
