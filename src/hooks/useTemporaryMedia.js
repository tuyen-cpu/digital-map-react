import { useEffect, useRef } from 'react'
import { discardPendingMedia, uploadMedia } from '../services/mediaService'

export function useTemporaryMedia(active = true) {
  const pending = useRef(new Set())
  const mounted = useRef(false)

  const discard = async (urls, { reportError = false } = {}) => {
    if (!urls.length) return
    try {
      await discardPendingMedia(urls)
      urls.forEach((url) => pending.current.delete(url))
    } catch (error) {
      if (reportError) throw error
      // The backend's scheduled cleanup retries pending uploads after 24 hours.
    }
  }

  useEffect(() => {
    mounted.current = active
    return () => {
      mounted.current = false
      const urls = [...pending.current]
      pending.current.clear()
      void discard(urls)
    }
  }, [active])

  const upload = async (file, options) => {
    const url = await uploadMedia(file, options)
    pending.current.add(url)
    if (!mounted.current) void discard([url])
    return url
  }

  const discardAll = () => discard([...pending.current], { reportError: true })

  return { upload, discard, discardAll }
}
