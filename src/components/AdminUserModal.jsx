import { KeyRound, Save, ShieldCheck, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import { formatVietnamPhone, isValidVietnamMobilePhone } from '../utils/phone'

function unique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
}

export default function AdminUserModal({ open, user, locations, onClose, onSave, onResetPassword }) {
  const { categories } = useCategories()
  const [form, setForm] = useState({ username: '', displayName: '', phone: '', role: 'user', categories: [], groups: [], subgroups: [] })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const groupOptions = useMemo(() => {
    const fromCategories = categories.flatMap((c) => c.suggestedGroups || [])
    const fromLocations = locations.map((item) => item.group)
    return unique([...fromCategories, ...fromLocations]).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [categories, locations])

  const subgroupOptions = useMemo(() => {
    const fromCategories = categories.flatMap((c) => c.suggestedSubgroups || [])
    const fromLocations = locations.map((item) => item.subgroup)
    return unique([...fromCategories, ...fromLocations]).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [categories, locations])

  useEffect(() => {
    if (!open || !user) return
    setForm({
      username: user.username || '',
      displayName: user.displayName || '',
      phone: formatVietnamPhone(user.phone || ''),
      role: user.role === 'manager' ? 'manager' : 'user',
      categories: user.permissions?.categories || [],
      groups: user.permissions?.groups || [],
      subgroups: user.permissions?.subgroups || []
    })
    setNotice('')
    setError('')
  }, [open, user])

  if (!open || !user) return null

  const toggle = (key, value) => setForm((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!isValidVietnamMobilePhone(form.phone)) return setError('Số điện thoại không đúng định dạng di động Việt Nam.')
    try {
      await onSave?.(user.username, {
        username: form.username,
        displayName: form.displayName,
        phone: form.phone,
        role: form.role,
        permissions: { categories: form.categories, groups: form.groups, subgroups: form.subgroups }
      })
      onClose?.()
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Không thể cập nhật tài khoản.')
    }
  }

  const resetPassword = async () => {
    if (!window.confirm(`Đặt lại mật khẩu cho @${user.username}? Người dùng sẽ bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo.`)) return
    try {
      const password = await onResetPassword?.(user.username)
      setNotice(`Đã đặt lại mật khẩu: ${password}`)
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Không thể đặt lại mật khẩu.')
    }
  }

  return (
    <div className="fixed inset-0 z-[2600] grid place-items-center bg-blue-950/45 p-3 backdrop-blur-sm">
      <form onSubmit={submit} className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.8rem] border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4 sm:px-6">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-600">Phân quyền tài khoản</p><h2 className="mt-1 text-xl font-black text-blue-950">{user.displayName || user.username} <span className="text-sm font-semibold text-blue-400">@{user.username}</span></h2></div>
          <button type="button" onClick={onClose} className="rounded-xl border border-blue-100 p-2 text-blue-500 hover:bg-blue-50"><X size={19} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {error && <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{error}</p>}
          {notice && <p className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">{notice}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Tên đăng nhập</span><input required minLength={3} maxLength={40} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9._-]/g, '') })} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" /><span className="mt-1.5 block text-[10px] text-blue-400">Có thể đổi tên đăng nhập; lịch sử, đánh giá và lịch nhắc sẽ được chuyển theo tài khoản.</span></label>
            <label className="block"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Tên hiển thị</span><input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" /></label>
            <label className="block"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Số điện thoại</span><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+ .-]/g, '') })} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" /></label>
            <label className="block md:col-span-2"><span className="text-xs font-black uppercase tracking-wide text-blue-600">Vai trò</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"><option value="user">Người dùng thường</option><option value="manager">Cộng tác viên / quản lý nhóm địa điểm</option></select></label>
          </div>

          {form.role === 'manager' && <div className="mt-6 space-y-5 rounded-2xl border border-blue-100 bg-blue-50/45 p-4 sm:p-5">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-brand-600" size={20} /><div><h3 className="font-black text-blue-950">Phạm vi được quản lý</h3><p className="mt-1 text-xs leading-5 text-blue-600">Chỉ những địa điểm khớp ít nhất một danh mục, phân nhóm hoặc phân nhóm chi tiết được chọn mới có thể sửa/xóa. Khi thêm mới, tài khoản chỉ được thêm vào danh mục đã cấp quyền.</p></div></div>

            <PermissionBlock title="Danh mục" values={categories.map((item) => ({ value: item.key, label: `${item.emoji} ${item.label}` }))} selected={form.categories} onToggle={(value) => toggle('categories', value)} />
            <PermissionBlock title="Phân nhóm" values={groupOptions.map((value) => ({ value, label: value }))} selected={form.groups} onToggle={(value) => toggle('groups', value)} />
            <PermissionBlock title="Phân nhóm chi tiết" values={subgroupOptions.map((value) => ({ value, label: value }))} selected={form.subgroups} onToggle={(value) => toggle('subgroups', value)} />
          </div>}

          <div className="mt-6 rounded-2xl border border-blue-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-blue-950">Đặt lại mật khẩu</p><p className="mt-1 text-xs leading-5 text-blue-500">Mật khẩu mặc định sau reset là <strong>PhuongBinhDinh@123</strong>. Lần đăng nhập tiếp theo bắt buộc đổi mật khẩu.</p></div><button type="button" onClick={resetPassword} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-black text-brand-700 hover:bg-blue-50"><KeyRound size={17} />Reset mật khẩu</button></div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-blue-100 px-5 py-4 sm:px-6"><button type="button" onClick={onClose} className="rounded-xl border border-blue-100 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50">Hủy</button><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700"><Save size={17} />Lưu tài khoản</button></div>
      </form>
    </div>
  )
}

function PermissionBlock({ title, values, selected, onToggle }) {
  const [search, setSearch] = useState('')
  const filtered = search.trim()
    ? values.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : values
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-black uppercase tracking-wide text-blue-600">{title}</p>
        <span className="text-[11px] text-blue-400">{selected.length} đã chọn / {values.length} tổng</span>
      </div>
      {values.length > 8 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Tìm ${title.toLowerCase()}...`}
          className="mb-2 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-50"
        />
      )}
      <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1">
        {filtered.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onToggle(item.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              selected.includes(item.value)
                ? 'border-brand-500 bg-brand-600 text-white'
                : 'border-blue-100 bg-white text-blue-700 hover:bg-blue-50'
            }`}
          >
            {item.label}
          </button>
        ))}
        {!filtered.length && <p className="text-xs text-blue-400">Không tìm thấy.</p>}
      </div>
    </div>
  )
}
