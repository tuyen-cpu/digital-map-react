import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'
import { getMediaRecord, isMediaRef } from '../services/mediaDb'
import MediaImage from './MediaImage'


function SphereViewer({ src, caption }) {
  const hostRef = useRef(null)
  const viewerRef = useRef(null)
  const objectUrlRef = useRef('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function mount() {
      setError('')
      let panorama = src
      try {
        if (isMediaRef(src)) {
          const record = await getMediaRecord(src)
          if (!record?.blob) throw new Error('Không đọc được ảnh 360° đã lưu.')
          objectUrlRef.current = URL.createObjectURL(record.blob)
          panorama = objectUrlRef.current
        }
        if (cancelled || !hostRef.current) return
        viewerRef.current?.destroy()
        viewerRef.current = new Viewer({
          container: hostRef.current,
          panorama,
          caption,
          navbar: ['zoom', 'move', 'caption', 'fullscreen'],
          defaultZoomLvl: 35,
          mousewheel: true,
          mousemove: true,
          touchmoveTwoFingers: false,
          mousewheelCtrlKey: false,
          keyboard: 'always',
          moveSpeed: 1.3,
          zoomSpeed: 1.2,
          fisheye: 0.25
        })
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Không mở được ảnh toàn cảnh 360°.')
      }
    }

    mount()
    return () => {
      cancelled = true
      viewerRef.current?.destroy()
      viewerRef.current = null
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = ''
    }
  }, [caption, src])

  return (
    <div className="relative h-full min-h-[340px] w-full overflow-hidden rounded-2xl border border-white/10 bg-blue-950/50 sm:min-h-[520px]">
      <div ref={hostRef} className="h-full w-full" />
      {error && <div className="absolute inset-0 grid place-items-center p-6 text-center"><div className="max-w-lg rounded-2xl bg-blue-950/85 p-5 text-sm leading-6 text-white shadow-2xl">{error}<p className="mt-2 text-xs text-blue-200">Ảnh 360° chuẩn nên là ảnh equirectangular tỉ lệ 2:1. Quản trị viên có thể thay ảnh trong phần sửa địa điểm.</p></div></div>}
    </div>
  )
}

export default function PanoramaModal({ location, onClose }) {
  const [index, setIndex] = useState(0)
  useEffect(() => setIndex(0), [location?.id])
  if (!location) return null

  const panoramas = Array.isArray(location.panoramas)
    ? location.panoramas.filter((item) => (typeof item === 'string' ? item : item?.url))
    : []
  const current = panoramas[index]
  const currentUrl = typeof current === 'string' ? current : current?.url
  const currentAlt = typeof current === 'object' ? current?.alt : ''

  return (
    <div className="fixed inset-0 z-[2800] flex flex-col bg-gradient-to-br from-brand-800 to-blue-950 text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">Không gian toàn cảnh 360°</p>
          <h2 className="mt-1 font-bold">{location.name}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X size={20} /></button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden p-3 sm:p-5">
        {currentUrl ? (
          <div className="mx-auto flex h-full max-w-7xl flex-col">
            <div className="mb-2 text-center text-xs text-blue-100/85">Giữ và kéo để xoay tròn 360° · cuộn/chụm hai ngón để zoom · có thể mở toàn màn hình.</div>
            <div className="min-h-0 flex-1"><SphereViewer src={currentUrl} caption={currentAlt || location.name} /></div>
          </div>
        ) : (
          <div className="grid h-full place-items-center">
            <div className="w-full max-w-3xl text-center">
              {location.image ? (
              <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-3 shadow-2xl"><MediaImage src={location.image} alt={location.imageAlt || location.name} className="mx-auto aspect-[16/9] w-full rounded-2xl object-cover" /></div>
            ) : (
              <div className="grid min-h-[280px] place-items-center rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-sm text-white/70">Địa điểm này chưa có ảnh 360° đã xác minh.</div>
            )}
              <div className="mx-auto mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><ImageOff size={26} className="text-white/70" /></div>
              <h3 className="mt-4 text-xl font-black">Chưa có ảnh 360° chuẩn</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-blue-100">Hãy tải ảnh equirectangular 2:1 trong quản trị. Website sẽ dựng ảnh thành hình cầu để người dùng xoay đủ 360°, thay vì chỉ kéo một ảnh phẳng sang trái/phải.</p>
            </div>
          </div>
        )}

        {panoramas.length > 1 && <>
          <button type="button" onClick={() => setIndex((value) => (value - 1 + panoramas.length) % panoramas.length)} className="absolute left-4 top-1/2 z-10 rounded-full bg-blue-950/60 p-3 hover:bg-blue-950/80"><ChevronLeft /></button>
          <button type="button" onClick={() => setIndex((value) => (value + 1) % panoramas.length)} className="absolute right-4 top-1/2 z-10 rounded-full bg-blue-950/60 p-3 hover:bg-blue-950/80"><ChevronRight /></button>
        </>}
      </div>
    </div>
  )
}
