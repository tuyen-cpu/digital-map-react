import { Bookmark, Map, Route, Sparkles } from 'lucide-react'

export default function AuthShell({ eyebrow, title, description, children, admin = false }) {
  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-gradient-to-br from-white via-blue-50/70 to-sky-100/60 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-soft lg:grid-cols-[1fr_.9fr]">
        <div className="p-6 sm:p-10 lg:p-12">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black text-blue-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-blue-700/70">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-blue-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-35 [background:radial-gradient(circle_at_80%_15%,#7dd3fc,transparent_32%),radial-gradient(circle_at_20%_80%,#60a5fa,transparent_40%)]" />
          <div className="relative">
            <div className="inline-flex rounded-full bg-white p-2 shadow-lg ring-1 ring-white/60">
              <img src="/logo-binh-dinh.png" alt="Logo Bình Định" className="h-20 w-20 rounded-full object-cover" />
            </div>
            <h2 className="mt-7 whitespace-pre-line text-3xl font-black">{admin ? 'Quản lý nội dung tập trung' : 'Phường Bình Định\nKhám phá điểm đến dễ hơn'}</h2>
            <p className="mt-4 text-sm leading-6 text-blue-100">{admin ? 'Quản lý địa điểm, hình ảnh, không gian 360° và nội dung giới thiệu trong một giao diện thống nhất.' : 'Lưu địa điểm yêu thích, mở bản đồ nhanh và chuẩn bị hành trình theo nhu cầu của bạn.'}</p>
          </div>
          <div className="relative mt-10 grid grid-cols-2 gap-3 text-xs font-bold text-blue-50">
            {(admin ? [[Map, 'Địa điểm'], [Sparkles, 'Hình ảnh'], [Route, 'Không gian 360°'], [Bookmark, 'Nội dung']] : [[Bookmark, 'Lưu yêu thích'], [Route, 'Dẫn đường nội bộ'], [Map, 'Địa điểm'], [Sparkles, 'Tour 360°']]).map(([Icon, label]) => <div key={label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 p-3"><Icon size={16} className="text-sky-200" />{label}</div>)}
          </div>
        </aside>
      </div>
    </div>
  )
}
