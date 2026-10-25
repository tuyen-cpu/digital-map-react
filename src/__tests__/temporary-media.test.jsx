import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useTemporaryMedia } from '../hooks/useTemporaryMedia'
import { uploadMedia, discardPendingMedia } from '../services/mediaService'

vi.mock('../services/mediaService', () => ({
  uploadMedia: vi.fn(),
  discardPendingMedia: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  uploadMedia.mockResolvedValue('https://cdn.example.com/new.jpg')
  discardPendingMedia.mockResolvedValue({ deleted: 1 })
})

it('discards session uploads when the form closes', async () => {
  const { result, rerender } = renderHook(({ open }) => useTemporaryMedia(open), { initialProps: { open: true } })
  await act(async () => { await result.current.upload(new File(['x'], 'new.jpg'), { folder: 'gallery' }) })
  expect(discardPendingMedia).not.toHaveBeenCalled()
  rerender({ open: false })
  await waitFor(() => expect(discardPendingMedia).toHaveBeenCalledWith(['https://cdn.example.com/new.jpg']))
})

it('discards uploads on navigation away', async () => {
  const { result, unmount } = renderHook(() => useTemporaryMedia())
  await act(async () => { await result.current.upload(new File(['x'], 'new.jpg')) })
  unmount()
  expect(discardPendingMedia).toHaveBeenCalledWith(['https://cdn.example.com/new.jpg'])
})

it('discards late upload results after navigation', async () => {
  let resolveUpload
  uploadMedia.mockReturnValue(new Promise((resolve) => { resolveUpload = resolve }))
  const { result, unmount } = renderHook(() => useTemporaryMedia())
  const upload = result.current.upload(new File(['x'], 'new.jpg'))
  unmount()
  await act(async () => { resolveUpload('https://cdn.example.com/late.jpg'); await upload })
  expect(discardPendingMedia).toHaveBeenCalledWith(['https://cdn.example.com/late.jpg'])
})

it('keeps cleanup failures from blocking form closure', async () => {
  discardPendingMedia.mockRejectedValue(new Error('offline'))
  const { result, unmount } = renderHook(() => useTemporaryMedia())
  await act(async () => { await result.current.upload(new File(['x'], 'new.jpg')) })
  await act(async () => { unmount() })
  expect(discardPendingMedia).toHaveBeenCalledOnce()
})

it('does not discard pasted or existing URLs', () => {
  const { unmount } = renderHook(() => useTemporaryMedia())
  unmount()
  expect(discardPendingMedia).not.toHaveBeenCalled()
})


it('explicit cancellation waits for cleanup and keeps URLs for retry on failure', async () => {
  discardPendingMedia.mockRejectedValueOnce(new Error('R2 unavailable'))
  const { result } = renderHook(() => useTemporaryMedia())
  await act(async () => { await result.current.upload(new File(['x'], 'new.jpg')) })
  await expect(result.current.discardAll()).rejects.toThrow('R2 unavailable')
  await result.current.discardAll()
  expect(discardPendingMedia).toHaveBeenCalledTimes(2)
  expect(discardPendingMedia).toHaveBeenLastCalledWith(['https://cdn.example.com/new.jpg'])
})
