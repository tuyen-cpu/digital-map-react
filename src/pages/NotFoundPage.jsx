import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <main className="grid min-h-[calc(100dvh-5rem)] place-items-center bg-slate-50 p-6 text-center"><div><p className="text-sm font-black uppercase tracking-[0.2em] text-brand-700">404</p><h1 className="mt-3 text-4xl font-black text-blue-950">Không tìm thấy trang</h1><p className="mt-3 text-slate-500">Đường dẫn này không tồn tại trong bản đồ du lịch.</p><Link to="/trang-chu" className="mt-6 inline-block rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white">Về trang chủ</Link></div></main>
}
