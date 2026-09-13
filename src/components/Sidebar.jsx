import { ChevronDown, LocateFixed, RefreshCcw, Search, SlidersHorizontal } from 'lucide-react'
import { CATEGORIES } from '../utils/categories'
import LocationCard from './LocationCard'

export default function Sidebar({
  search, onSearchChange, category, onCategoryChange, locations, selectedLocation, onSelectLocation,
  onReset, onShowAll, onLocate, onShowInBounds, onOpenDetails, totalCount, mappableCount, compactMobile = false
}) {
  return (
    <aside className={`flex min-h-0 h-full w-full flex-col bg-slate-50 ${compactMobile ? '' : 'border-r border-slate-200'}`}>
      <div className="border-b border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Bản đồ số</p>
            <h1 className="mt-1 text-xl font-black text-blue-950">Du lịch Phường Bình Định</h1>
          </div>
          <button type="button" onClick={onLocate} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700" title="Dùng vị trí hiện tại"><LocateFixed size={18} /></button>
        </div>
        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Tìm điểm đến trong Phường Bình Định..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-50" />
        </label>
        <div className="relative mt-3">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50">
            <option value="all">Tất cả danh mục</option>
            {CATEGORIES.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onShowAll} className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-800 hover:bg-brand-100">Tất cả địa điểm</button>
          <button type="button" onClick={onShowInBounds} className="rounded-xl bg-brand-700 px-3 py-2 text-xs font-bold text-white hover:bg-brand-800">Dữ liệu vùng này</button>
          <button type="button" onClick={onReset} className="col-span-2 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCcw size={13} />Làm mới</button>
        </div>
        <p className="mt-3 text-xs text-slate-500"><strong className="text-slate-800">{locations.length}</strong> kết quả · {mappableCount}/{totalCount} địa điểm có tọa độ số</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {locations.length ? (
          <div className="space-y-3">
            {locations.map((location) => <LocationCard key={location.id} location={location} selected={selectedLocation?.id === location.id} onSelect={onSelectLocation} onOpenDetails={onOpenDetails} compact />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-500">Không có địa điểm phù hợp với bộ lọc hiện tại.</div>
        )}
      </div>
    </aside>
  )
}
