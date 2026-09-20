/**
 * AdminCategoriesTab — Quản lý danh mục địa điểm (CRUD từ DB)
 */
import { ChevronDown, ChevronUp, Layers, Plus, Save, Smile, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../context/AppStateContext'

const inputClass = 'mt-1.5 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-blue-950 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50'

const EMPTY_FORM = { key: '', label: '', shortLabel: '', emoji: '📍', description: '', marker: '#1d4ed8', order: 99, suggestedGroups: '', suggestedSubgroups: '', suggestedKeywords: '' }
const CATEGORY_EMOJIS = [
  '📍', '🗺️', '🧭', '🌐', '🏖️', '🏝️', '🏜️', '🏕️', '⛺', '🏞️', '🌄', '🌅', '🌇', '🌉',
  '⛰️', '🌋', '🗻', '🏔️', '🌊', '💧', '🏞️', '🌲', '🌳', '🌴', '🌵', '🌺', '🌸', '🌼',
  '🌻', '🍀', '🌿', '🍃', '🪴', '🐚', '🦋', '🐠', '🐬', '🐢', '🦜', '🐘', '🦁', '🐒',
  '🏛️', '🏰', '🏯', '🕌', '🛕', '⛪', '🕍', '🗿', '⛩️', '🛖', '🏠', '🏡', '🏢', '🗼',
  '🗽', '⛲', '🎡', '🎢', '🎠', '🏟️', '🎪', '🎭', '🎨', '🖼️', '🎬', '🎤', '🎶', '🎼',
  '🏄', '🏊', '🚣', '🚤', '⛵', '🛶', '🚲', '🛵', '🏍️', '🚗', '🚕', '🚌', '🚆', '🚉',
  '✈️', '🛫', '🛬', '🚁', '🚡', '🚠', '🛣️', '🚏', '🅿️', '🧳', '🎒', '👣', '🥾', '🧗',
  '🏨', '🏩', '🏢', '🛏️', '🛎️', '🛁', '🍜', '🍲', '🍛', '🍣', '🍱', '🍔', '🍕', '🌮',
  '🍗', '🍖', '🥘', '🥗', '🍤', '🦐', '🦀', '🐟', '🍉', '🥭', '🍍', '🥥', '🍹', '🍸',
  '☕', '🧋', '🍵', '🍰', '🧁', '🍩', '🍪', '🍽️', '🥢', '🛍️', '🛒', '🎁', '💎', '📸',
  '📷', '🎥', '🔭', '🎯', '⭐', '🌟', '❤️', '👍', '✅', '🔔', 'ℹ️', '💡', '🔥', '📅'
]

function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const pickerRef = useRef(null)

  useEffect(() => {
    const handleOutsidePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [])

  return (
    <div ref={pickerRef} className="relative mt-1.5">
      <div className="flex gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-0`} placeholder="🎯" maxLength={4} />
        <button type="button" onClick={() => setOpen((current) => !current)} aria-label="Chọn emoji" aria-expanded={open}
          className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-blue-100 bg-white text-brand-600 hover:bg-blue-50">
          <Smile size={19} />
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 grid max-h-64 w-[min(280px,calc(100vw-3rem))] grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-blue-100 bg-white p-2 shadow-2xl">
          {CATEGORY_EMOJIS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => { onChange(emoji); setOpen(false) }} aria-label={`Chọn ${emoji}`}
              className="grid aspect-square place-items-center rounded-lg text-xl hover:bg-blue-50">
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminCategoriesTab({ locations = [], setNotice }) {
  const { categories, addCategory, updateCategory, deleteCategory, refreshCategories } = useAppState()
  const [expanded, setExpanded] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ ...EMPTY_FORM })
  const [busy, setBusy] = useState(false)

  // Count per category
  const countByCategory = locations.reduce((acc, loc) => {
    acc[loc.category] = (acc[loc.category] || 0) + 1
    return acc
  }, {})

  // Groups/subgroups per category
  const statsByCategory = locations.reduce((acc, loc) => {
    if (!acc[loc.category]) acc[loc.category] = { groups: new Set(), subgroups: new Set() }
    if (loc.group) acc[loc.category].groups.add(loc.group)
    if (loc.subgroup) acc[loc.category].subgroups.add(loc.subgroup)
    return acc
  }, {})

  const toggle = (key) => {
    if (expanded === key) { setExpanded(null); return }
    setExpanded(key)
    const cat = categories.find((c) => c.key === key) || {}
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        label: cat.label, shortLabel: cat.shortLabel, emoji: cat.emoji,
        description: cat.description, marker: cat.marker, order: cat.order,
        suggestedGroups: (cat.suggestedGroups || []).join('\n'),
        suggestedSubgroups: (cat.suggestedSubgroups || []).join('\n'),
        suggestedKeywords: (cat.suggestedKeywords || []).join(', '),
      }
    }))
  }

  const setDraft = (key, field, value) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))

  const saveDraft = async (key) => {
    setBusy(true)
    try {
      const d = drafts[key]
      const payload = {
        ...d,
        suggestedGroups: d.suggestedGroups ? d.suggestedGroups.split('\n').map(s => s.trim()).filter(Boolean) : [],
        suggestedSubgroups: d.suggestedSubgroups ? d.suggestedSubgroups.split('\n').map(s => s.trim()).filter(Boolean) : [],
        suggestedKeywords: d.suggestedKeywords ? d.suggestedKeywords.split(',').map(s => s.trim()).filter(Boolean) : [],
      }
      await updateCategory(key, payload)
      setNotice?.(`Đã lưu danh mục "${d?.label || key}".`, 'success')
      setExpanded(null)
    } catch (e) {
      setNotice?.(e?.response?.data?.detail || e.message || 'Lỗi khi lưu danh mục.', 'error')
    } finally { setBusy(false) }
  }

  const handleDelete = async (key) => {
    const count = countByCategory[key] || 0
    if (count > 0) {
      setNotice?.(`Không thể xóa — có ${count} địa điểm đang dùng danh mục này.`, 'error')
      return
    }
    if (!window.confirm(`Xóa danh mục "${key}"?`)) return
    setBusy(true)
    try {
      await deleteCategory(key)
      setNotice?.(`Đã xóa danh mục "${key}".`, 'success')
      if (expanded === key) setExpanded(null)
    } catch (e) {
      setNotice?.(e?.response?.data?.detail || e.message || 'Lỗi khi xóa.', 'error')
    } finally { setBusy(false) }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newForm.key.trim() || !newForm.label.trim()) {
      setNotice?.('Hãy nhập key và tên danh mục.', 'error')
      return
    }
    setBusy(true)
    try {
      await addCategory({
        ...newForm,
        suggestedGroups: newForm.suggestedGroups ? newForm.suggestedGroups.split('\n').map(s => s.trim()).filter(Boolean) : [],
        suggestedSubgroups: newForm.suggestedSubgroups ? newForm.suggestedSubgroups.split('\n').map(s => s.trim()).filter(Boolean) : [],
        suggestedKeywords: newForm.suggestedKeywords ? newForm.suggestedKeywords.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      setNotice?.(`Đã thêm danh mục "${newForm.label}".`, 'success')
      setNewForm({ ...EMPTY_FORM })
      setAdding(false)
    } catch (e) {
      setNotice?.(e?.response?.data?.detail || e.message || 'Lỗi khi thêm danh mục.', 'error')
    } finally { setBusy(false) }
  }

  return (
    <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-card sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-600">Danh mục</p>
          <h2 className="mt-1 text-2xl font-black text-blue-950">Quản lý danh mục địa điểm</h2>
          <p className="mt-1 text-sm text-blue-600/70">Thêm, sửa, xóa danh mục. Thay đổi phản ánh ngay trên toàn bộ website.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setAdding(true); setExpanded(null) }} disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-50">
            <Plus size={16} />Thêm danh mục
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {categories.map((cat) => (
          <button key={cat.key} type="button" onClick={() => { setAdding(false); toggle(cat.key) }}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition hover:border-brand-200 hover:bg-brand-50/60 ${expanded === cat.key ? 'border-brand-300 bg-brand-50' : 'border-blue-100 bg-blue-50/40'}`}>
            <span className="text-2xl">{cat.emoji}</span>
            <span className="text-xs font-black text-blue-950 leading-tight">{cat.shortLabel}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-700 shadow-sm">{countByCategory[cat.key] || 0}</span>
          </button>
        ))}
        {categories.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-blue-200 p-6 text-center text-sm text-blue-400">
            Chưa có danh mục. Nhấn "Thêm danh mục" để tạo danh mục mới.
          </p>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-blue-950">Thêm danh mục mới</h3>
            <button type="button" onClick={() => setAdding(false)} className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-100"><X size={16} /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Key <span className="text-red-500">*</span></span>
              <input required value={newForm.key} onChange={(e) => setNewForm({ ...newForm, key: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
                className={inputClass} placeholder="vd: sport, shopping" />
              <span className="mt-1 block text-[11px] text-blue-400">Chỉ chữ thường, số, dấu gạch dưới</span>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Emoji</span>
              <EmojiPicker value={newForm.emoji} onChange={(emoji) => setNewForm({ ...newForm, emoji })} />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Màu marker</span>
              <div className="mt-1.5 flex items-center gap-2">
                <input type="color" value={newForm.marker} onChange={(e) => setNewForm({ ...newForm, marker: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-blue-100 p-1" />
                <input value={newForm.marker} onChange={(e) => setNewForm({ ...newForm, marker: e.target.value })} className="flex-1 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-mono outline-none focus:border-brand-300" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Tên đầy đủ <span className="text-red-500">*</span></span>
              <input required value={newForm.label} onChange={(e) => setNewForm({ ...newForm, label: e.target.value })} className={inputClass} placeholder="Khu/điểm du lịch" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Tên rút gọn</span>
              <input value={newForm.shortLabel} onChange={(e) => setNewForm({ ...newForm, shortLabel: e.target.value })} className={inputClass} placeholder="Du lịch" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Thứ tự hiển thị</span>
              <input type="number" min={0} max={999} value={newForm.order} onChange={(e) => setNewForm({ ...newForm, order: Number(e.target.value) })} className={inputClass} />
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Mô tả</span>
              <input value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} className={inputClass} placeholder="Mô tả ngắn về danh mục này" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Phân nhóm gợi ý</span>
              <span className="mt-0.5 block text-[11px] text-blue-400">Mỗi dòng một phân nhóm</span>
              <textarea rows={4} value={newForm.suggestedGroups} onChange={(e) => setNewForm({ ...newForm, suggestedGroups: e.target.value })}
                className={`${inputClass} font-mono`} placeholder={'Nhóm A\nNhóm B'} />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Phân nhóm chi tiết gợi ý</span>
              <span className="mt-0.5 block text-[11px] text-blue-400">Mỗi dòng một mục</span>
              <textarea rows={4} value={newForm.suggestedSubgroups} onChange={(e) => setNewForm({ ...newForm, suggestedSubgroups: e.target.value })}
                className={`${inputClass} font-mono`} placeholder={'Chi tiết A\nChi tiết B'} />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-blue-600">Từ khoá gợi ý</span>
              <span className="mt-0.5 block text-[11px] text-blue-400">Phân cách bằng dấu phẩy</span>
              <textarea rows={4} value={newForm.suggestedKeywords} onChange={(e) => setNewForm({ ...newForm, suggestedKeywords: e.target.value })}
                className={`${inputClass} font-mono`} placeholder={'từ khoá 1, từ khoá 2'} />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="rounded-xl border border-blue-100 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50">Hủy</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-50">
              <Plus size={16} />{busy ? 'Đang lưu...' : 'Thêm danh mục'}
            </button>
          </div>
        </form>
      )}

      {/* Edit form */}
      {expanded && !adding && (() => {
        const cat = categories.find((c) => c.key === expanded)
        if (!cat) return null
        const draft = drafts[expanded] || {}
        const stats = statsByCategory[expanded] || { groups: new Set(), subgroups: new Set() }
        return (
          <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-black text-blue-950 flex items-center gap-2">
                <span>{draft.emoji}</span>
                <span>{draft.label}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">key: {expanded}</span>
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleDelete(expanded)} disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">
                  <Trash2 size={13} />Xóa
                </button>
                <button type="button" onClick={() => setExpanded(null)} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50">
                  <X size={13} />
                </button>
                <button type="button" onClick={() => saveDraft(expanded)} disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-black text-white hover:bg-brand-700 disabled:opacity-50">
                  <Save size={13} />{busy ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-600">Emoji</span>
                <EmojiPicker value={draft.emoji || ''} onChange={(emoji) => setDraft(expanded, 'emoji', emoji)} />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-600">Tên đầy đủ</span>
                <input value={draft.label || ''} onChange={(e) => setDraft(expanded, 'label', e.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-600">Tên rút gọn</span>
                <input value={draft.shortLabel || ''} onChange={(e) => setDraft(expanded, 'shortLabel', e.target.value)} className={inputClass} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-black uppercase tracking-wide text-blue-600">Mô tả</span>
                <input value={draft.description || ''} onChange={(e) => setDraft(expanded, 'description', e.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-600">Màu marker</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input type="color" value={draft.marker || '#1d4ed8'} onChange={(e) => setDraft(expanded, 'marker', e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-blue-100 p-1" />
                  <input value={draft.marker || ''} onChange={(e) => setDraft(expanded, 'marker', e.target.value)} className="flex-1 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-mono outline-none focus:border-brand-300" />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-600">Thứ tự</span>
                <input type="number" min={0} max={999} value={draft.order ?? 0} onChange={(e) => setDraft(expanded, 'order', Number(e.target.value))} className={inputClass} />
              </label>
            </div>
            {/* Groups / Subgroups / Keywords editors */}
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-600">Phân nhóm gợi ý</span>
                <span className="mt-0.5 block text-[11px] text-blue-400">Mỗi dòng một phân nhóm</span>
                <textarea
                  rows={6}
                  value={draft.suggestedGroups || ''}
                  onChange={(e) => setDraft(expanded, 'suggestedGroups', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-blue-950 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50 font-mono"
                  placeholder={'Nhóm A\nNhóm B\nNhóm C'}
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-600">Phân nhóm chi tiết gợi ý</span>
                <span className="mt-0.5 block text-[11px] text-blue-400">Mỗi dòng một phân nhóm chi tiết</span>
                <textarea
                  rows={6}
                  value={draft.suggestedSubgroups || ''}
                  onChange={(e) => setDraft(expanded, 'suggestedSubgroups', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-blue-950 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50 font-mono"
                  placeholder={'Chi tiết A\nChi tiết B\nChi tiết C'}
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-blue-600">Từ khoá gợi ý</span>
                <span className="mt-0.5 block text-[11px] text-blue-400">Phân cách bằng dấu phẩy</span>
                <textarea
                  rows={6}
                  value={draft.suggestedKeywords || ''}
                  onChange={(e) => setDraft(expanded, 'suggestedKeywords', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-blue-950 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50 font-mono"
                  placeholder={'từ khoá 1, từ khoá 2'}
                />
              </label>
            </div>

            {/* Stats — actual values used by locations */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600 mb-2">Phân nhóm ({stats.groups.size})</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {[...stats.groups].sort().map((g) => <span key={g} className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{g}</span>)}
                  {!stats.groups.size && <p className="text-xs text-blue-400">Chưa có.</p>}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600 mb-2">Phân nhóm chi tiết ({stats.subgroups.size})</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {[...stats.subgroups].sort().map((s) => <span key={s} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-700">{s}</span>)}
                  {!stats.subgroups.size && <p className="text-xs text-blue-400">Chưa có.</p>}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Full table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100">
        <div className="hidden grid-cols-[36px_1fr_1fr_80px_24px_80px] gap-3 bg-blue-50 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-blue-500 sm:grid">
          <span></span><span>Danh mục</span><span>Mô tả</span><span className="text-center">Địa điểm</span><span></span><span className="text-center">Thao tác</span>
        </div>
        <div className="divide-y divide-blue-50">
          {categories.map((cat) => {
            const count = countByCategory[cat.key] || 0
            return (
              <div key={cat.key} className="grid gap-2 px-4 py-3 sm:grid-cols-[36px_1fr_1fr_80px_24px_80px] sm:items-center">
                <span className="text-xl">{cat.emoji}</span>
                <div>
                  <p className="font-black text-sm text-blue-950">{cat.label}</p>
                  <p className="text-[11px] text-blue-400">{cat.key} · thứ tự {cat.order}</p>
                </div>
                <p className="text-sm text-blue-700/70 sm:line-clamp-2">{cat.description}</p>
                <p className="text-center text-xl font-black text-brand-700">{count}</p>
                <div className="h-3 w-3 rounded-full mx-auto" style={{ backgroundColor: cat.marker }} title={cat.marker} />
                <div className="flex justify-center gap-1">
                  <button type="button" onClick={() => { setAdding(false); toggle(cat.key) }} className="rounded-lg p-2 text-brand-700 hover:bg-blue-100" title="Sửa">
                    {expanded === cat.key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button type="button" onClick={() => handleDelete(cat.key)} disabled={busy} className="rounded-lg p-2 text-blue-300 hover:bg-blue-100 hover:text-red-500 disabled:opacity-40" title="Xóa">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
          {categories.length === 0 && <p className="p-8 text-center text-sm text-blue-400">Chưa có danh mục nào.</p>}
        </div>
      </div>
    </section>
  )
}
