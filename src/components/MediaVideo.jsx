import { useEffect, useState } from 'react'
import { getMediaRecord, isMediaRef } from '../services/mediaDb'

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
  return <video {...props} src={resolved} />
}
