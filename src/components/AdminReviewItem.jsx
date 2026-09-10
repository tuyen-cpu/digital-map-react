import { ExternalLink, MessageCircleReply, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function dateTime(value) {
  if (!value) return ''
  try { return new Date(value).toLocaleString('vi-VN') } catch { return value }
}

export default function AdminReviewItem({ review, locationName, onDelete, onReply }) {
  const placeHref = `/place.html?id=${encodeURIComponent(review.locationId)}&review=${encodeURIComponent(review.id)}#review-${review.id}`
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    setError('')
    try {
      onReply?.(review.id, text)
      setText('')
    } catch (e) {
      setError(e.message || 'Không gửi được phản hồi.')
    }
  }

  return (
    <article className="px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link to={placeHref} className="inline-flex items-center gap-1.5 text-sm font-black text-blue-950 hover:text-brand-700 hover:underline">{locationName || review.locationId}<ExternalLink size={13} /></Link>
          <p className="mt-1 text-xs text-blue-500">{review.displayName || review.username} · {review.rating}/5 sao · {dateTime(review.updatedAt || review.createdAt)} · {(review.replies || []).length} phản hồi</p>
          {review.comment && <p className="mt-2 text-sm leading-6 text-blue-900/75">{review.comment}</p>}
        </div>
        <button type="button" onClick={onDelete} className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 hover:text-brand-700" title="Xóa đánh giá"><Trash2 size={16} /></button>
      </div>

      {(review.replies || []).length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-blue-100 pl-3">
          {(review.replies || []).map((reply) => (
            <div key={reply.id} className="rounded-xl bg-blue-50/60 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-blue-950">{reply.displayName || reply.username}</strong><span className="text-[10px] uppercase text-blue-400">{reply.role === 'admin' ? 'Quản trị' : reply.role === 'manager' ? 'Quản lý' : 'Người dùng'} · {dateTime(reply.createdAt)}</span></div>
              <p className="mt-1 text-xs leading-5 text-blue-800/75">{reply.comment}</p>
            </div>
          ))}
        </div>
      )}

      <Link to={placeHref} className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs font-black text-brand-700 hover:bg-blue-50"><ExternalLink size={13} />Mở đúng trang địa điểm để xem và phản hồi</Link>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <div className="relative min-w-0 flex-1"><MessageCircleReply size={15} className="absolute left-3 top-3 text-blue-300" /><input value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder="Phản hồi đánh giá ngay tại quản trị..." className="w-full rounded-xl border border-blue-100 bg-white py-2.5 pl-9 pr-3 text-xs text-blue-950 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" /></div>
        <button type="submit" disabled={!text.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-black text-white disabled:opacity-40"><Send size={14} />Gửi</button>
      </form>
      {error && <p className="mt-2 text-xs font-semibold text-blue-700">{error}</p>}
    </article>
  )
}
