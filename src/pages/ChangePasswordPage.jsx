import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import PasswordInput from '../components/PasswordInput'
import { useAppState } from '../context/AppStateContext'

export default function ChangePasswordPage() {
  const { session, changePassword } = useAppState()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')

  if (!session) return <Navigate to="/dang-nhap" replace state={{ from: '/doi-mat-khau' }} />
  if (session.role === 'admin') return <Navigate to="/admin" replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.newPassword !== form.confirm) return setError('Mật khẩu xác nhận không khớp.')
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      navigate('/tai-khoan', { replace: true })
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Không thể đổi mật khẩu.')
    }
  }

  return (
    <AuthShell eyebrow="Bảo mật" title={session.mustChangePassword ? 'Bắt buộc đổi mật khẩu' : 'Đổi mật khẩu'} description={session.mustChangePassword ? 'Mật khẩu vừa được quản trị viên đặt lại. Bạn phải tạo mật khẩu mới trước khi tiếp tục sử dụng tài khoản.' : 'Đổi mật khẩu đăng nhập của tài khoản.'}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="text-sm font-bold text-blue-950">Mật khẩu hiện tại</span><PasswordInput required autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="w-full rounded-xl border border-blue-100 bg-white px-3 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" /></label>
        <label className="block"><span className="text-sm font-bold text-blue-950">Mật khẩu mới</span><PasswordInput required minLength={8} autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="w-full rounded-xl border border-blue-100 bg-white px-3 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" /><span className="mt-1 block text-[11px] text-blue-500">Tối thiểu 8 ký tự.</span></label>
        <label className="block"><span className="text-sm font-bold text-blue-950">Xác nhận mật khẩu mới</span><PasswordInput required minLength={8} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className="w-full rounded-xl border border-blue-100 bg-white px-3 py-3 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" /></label>
        {error && <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-3 font-black text-white hover:bg-brand-700">Lưu mật khẩu mới</button>
      </form>
    </AuthShell>
  )
}
