import { useEffect, useState } from 'react'
import { getMediaRecord, isMediaRef } from '../services/mediaDb'

export default function MediaImage({ src, fallback, alt = '', onLoadError, ...props }) {
  const [resolved, setResolved] = useState(isMediaRef(src) ? '' : (src || fallback || ''))

  useEffect(() => {
    let active = true
    let objectUrl = ''
    if (!isMediaRef(src)) {
      setResolved(src || fallback || '')
      return undefined
    }
    setResolved('')
    getMediaRecord(src)
      .then((record) => {
        if (!active) return
        if (!record?.blob) {
          setResolved(fallback || '')
          return
        }
        objectUrl = URL.createObjectURL(record.blob)
        setResolved(objectUrl)
      })
      .catch(() => active && setResolved(fallback || ''))
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fallback, src])

  // Không có ảnh đúng địa điểm thì để trống, không tự gán ảnh minh họa của nơi khác.
  if (!resolved && !fallback) return null

  return (
    <img
      {...props}
      src={resolved || fallback || ''}
      alt={alt}
      onError={(event) => {
        if (fallback && event.currentTarget.src !== fallback) {
          event.currentTarget.src = fallback
        } else {
          setResolved('')
        }
        onLoadError?.(event)
      }}
    />
  )
}
