import { Clock3, Mail, MapPin, Phone } from 'lucide-react'
import { useAppState } from '../context/AppStateContext'

const DEFAULT_FOOTER_CONFIG = {
  orgName: 'BÌNH ĐỊNH',
  description: 'Khám phá điểm đến, ẩm thực, lưu trú và tiện ích trong Phường Bình Định trên một bản đồ số thống nhất.',
  address: '78 Lê Hồng Phong, phường Bình Định, tỉnh Gia Lai',
  phone: '0914.1178.00',
  email: 'datnt.bdh@vnpt.vn',
  workingHours: 'Thứ Hai – Thứ Sáu · 07:30–17:00',
  copyright: '© 2026 · Bản đồ du lịch số Phường Bình Định',
  logoUrl: '',
}

export default function Footer() {
  const { siteSettings } = useAppState()
  const raw = siteSettings?.footer || {}
  // Per-field fallback: use stored value if non-empty, else use default
  const f = Object.fromEntries(
    Object.entries(DEFAULT_FOOTER_CONFIG).map(([key, def]) => [
      key,
      raw[key] != null && raw[key] !== '' ? raw[key] : def,
    ])
  )
  const logoSrc = f.logoUrl || '/logo-binh-dinh.png'

  return (
    <footer className="border-t border-slate-200 bg-blue-950 text-slate-300">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-12 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt={`Logo ${f.orgName}`} className="h-14 w-14 rounded-full object-cover ring-1 ring-sky-300" />
            <div><p className="font-black text-white">{f.orgName}</p><p className="text-xs uppercase tracking-[0.18em] text-sky-300">Bản đồ du lịch số</p></div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">{f.description}</p>
        </div>
        <div>
          <h2 className="font-bold text-white">Liên hệ</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex gap-2"><MapPin className="mt-0.5 shrink-0" size={16} />{f.address}</p>
            <p className="flex gap-2"><Phone size={16} />{f.phone}</p>
            <p className="flex gap-2"><Mail size={16} />{f.email}</p>
            <p className="flex gap-2"><Clock3 size={16} />{f.workingHours}</p>
          </div>
        </div>
        <div>
          <h2 className="font-bold text-white">Tiện ích</h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">Tìm kiếm địa điểm, xem thông tin liên hệ, đánh giá và dẫn đường trực tiếp trong website trên cả điện thoại và máy tính.</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-slate-500">{f.copyright}</div>
    </footer>
  )
}
