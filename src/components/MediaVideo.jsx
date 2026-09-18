import { useEffect, useState } from 'react'
import { getMediaRecord, isMediaRef } from '../services/mediaDb'

/**
 * Chuyển URL YouTube dạng watch/share thành embed URL.
 * Trả về embed URL nếu là YouTube, null nếu không phải.
 */
function toYouTubeEmbed(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    // https://www.youtube.com/watch?v=ID
    if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname === '/watch') {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    // https://youtu.be/ID
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    // https://www.youtube.com/embed/ID — đã là embed rồi
    if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname.startsWith('/embed/')) {
      return url
    }
  } catch {
    // không phải URL hợp lệ
  }
  return null
}

export default function MediaVideo({ src, ...props }) {
  const [resolved, setResolved] = useState(isMediaRef(src) ? '' : (src || ''))

  useEffect(() => {
    let active = true
    let objectUrl = ''
    if (!isMediaRef(src)) {
      setResolved(src || '')
      return undefined
    }
    setResolved('')
    getMediaRecord(src)
      .then((record) => {
        if (!active || !record?.blob) return
        objectUrl = URL.createObjectURL(record.blob)
        setResolved(objectUrl)
      })
      .catch(() => {})
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  if (!resolved) return <div className={props.className || ''} aria-label="Đang tải video" />

  const embedUrl = toYouTubeEmbed(resolved)
  if (embedUrl) {
    const { controls: _c, ...iframeProps } = props
    return (
      <iframe
        {...iframeProps}
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
        className={props.className || ''}
      />
    )
  }

  return <video {...props} src={resolved} />
}
