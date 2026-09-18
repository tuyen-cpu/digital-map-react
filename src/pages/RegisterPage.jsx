import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'
import { useAppState } from '../context/AppStateContext'
import { formatVietnamPhone, isValidVietnamMobilePhone, VIETNAM_PHONE_HELP } from '../utils/phone'

export default function RegisterPage() {
  const [form, setForm] = useState({ displayName: '', username: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const { register } = useAppState()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isValidVietnamMobilePhone(form.phone)) return setError(VIETNAM_PHONE_HELP)
    if (form.password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.')
    if (form.password !== form.confirm) return setError('Mật khẩu xác nhận không khớp.')
    try {
      await register(form)
      navigate('/trang-chu')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.values(data).flat().join(' ')
        setError(msgs || err.message)
      } else {
        setError(err.message || 'Đăng ký thất bại.')
      }
    }
  }

  const inputClass = 'mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-3 text-blue-950 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100'
  return (
    <AuthShell eyebrow="Tài khoản" title="Tạo tài khoản" description="Tài khoản cần số điện thoại hợp lệ để đánh giá địa điểm và sử dụng các tiện ích cá nhân.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="text-sm font-bold text-blue-950">Tên hiển thị</span><input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className={inputClass} /></label>
        <label className="block"><span className="text-sm font-bold text-blue-950">Tên đăng nhập</span><input required autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputClass} /></label>
        <label className="block"><span className="text-sm font-bold text-blue-950">Số điện thoại <span className="font-normal text-blue-400">(bắt buộc)</span></span><input required inputMode="tel" autoComplete="tel" maxLength={16} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+ .-]/g, '') })} onBlur={(e) => { if (isValidVietnamMobilePhone(e.target.value)) setForm((current) => ({ ...current, phone: formatVietnamPhone(e.target.value) })) }} placeholder="09xx xxx xxx" className={inputClass} /><span className="mt-1.5 block text-[11px] leading-5 text-blue-500">{VIETNAM_PHONE_HELP}</span></label>
        <label className="block"><span className="text-sm font-bold text-blue-950">Mật khẩu <span className="font-normal text-blue-400">(tối thiểu 6 ký tự)</span></span><PasswordInput required minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass.replace('mt-2 ', '')} /></label>
        <label className="block"><span className="text-sm font-bold text-blue-950">Xác nhận mật khẩu</span><PasswordInput required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={inputClass.replace('mt-2 ', '')} /></label>
        {error && <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200">Tạo tài khoản</button>
      </form>
      <p className="mt-5 text-sm text-blue-700/70">Đã có tài khoản? <Link to="/dang-nhap" className="font-bold text-brand-700 hover:underline">Đăng nhập</Link></p>
    </AuthShell>
  )
}
