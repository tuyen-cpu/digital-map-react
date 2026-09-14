import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { useAppState } from '../context/AppStateContext'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const { login } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const account = await login(form)
      if (account.mustChangePassword) navigate('/doi-mat-khau', { replace: true })
      else if (account.role === 'admin') navigate('/admin')
      else navigate(location.state?.from || '/trang-chu')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Đăng nhập thất bại.')
    }
  }

  return (
    <AuthShell eyebrow="Tài khoản" title="Đăng nhập" description="Đăng nhập để lưu địa điểm yêu thích, hành trình và sử dụng các tiện ích cá nhân.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-blue-950">Tên đăng nhập</span>
          <input autoComplete="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-3 text-blue-950 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-blue-950">Mật khẩu</span>
          <input type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-3 text-blue-950 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
        </label>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200">Đăng nhập</button>
      </form>
      <p className="mt-5 text-sm text-blue-700/70">Chưa có tài khoản? <Link to="/dang-ky" className="font-bold text-brand-700 hover:underline">Đăng ký</Link></p>
    </AuthShell>
  )
}
