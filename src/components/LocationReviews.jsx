import { MessageCircleReply, MessageSquare, Send, Star, Trash2, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppState } from '../context/AppStateContext'
import { isValidVietnamMobilePhone } from '../utils/phone'
import MediaImage from './MediaImage'

function Stars({ value = 0, size = 16 }) {
  return <span className="inline-flex items-center gap-0.5" aria-label={`${value} trên 5 sao`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={size} className={star <= Math.round(value) ? 'fill-sky-400 text-sky-400' : 'text-blue-100'} />)}</span>
}

function ReviewReplyBox({ review, autoOpen = false }) {
  const { session, replyToReview, deleteReviewReply } = useAppState()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (autoOpen && session) setOpen(true)
  }, [autoOpen, session?.username])

  const submit = (event) => {
    event.preventDefault()
    setNotice('')
    try {
      replyToReview(review.id, text)
      setText('')
      setOpen(false)
    } catch (e) {
      setNotice(e.message || 'Không thể gửi phản hồi.')
    }
  }

  return (
    <div className="mt-3 border-t border-blue-50 pt-3">
      {(review.replies || []).length > 0 && <div className="space-y-2">{review.replies.map((reply) => <div key={reply.id} className="ml-3 rounded-xl bg-blue-50/70 px-3 py-2.5 sm:ml-6"><div className="flex items-start gap-2"><MediaImage src={reply.avatar} alt="" className="h-8 w-8 rounded-full bg-white object-cover" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-blue-950">{reply.displayName || reply.username}</p>{reply.role === 'admin' && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-black text-white">QUẢN TRỊ</span>}{reply.role === 'manager' && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-black text-sky-700">QUẢN LÝ</span>}<span className="text-[9px] text-blue-400">{new Date(reply.createdAt).toLocaleString('vi-VN')}</span></div><p className="mt-1 text-xs leading-5 text-blue-900/75">{reply.comment}</p></div>{(session?.role === 'admin' || session?.username === reply.username) && <button type="button" onClick={() => deleteReviewReply(review.id, reply.id)} className="rounded-lg p-1.5 text-blue-300 hover:bg-white hover:text-blue-600" title="Xóa phản hồi"><Trash2 size={13} /></button>}</div></div>)}</div>}

      {!session ? <p className="mt-2 text-xs text-blue-500">Đăng nhập để phản hồi đánh giá này.</p> : <>
        <button type="button" onClick={() => setOpen((value) => !value)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-brand-700 hover:underline"><MessageCircleReply size={14} />{open ? 'Đóng phản hồi' : 'Phản hồi đánh giá'}</button>
        {open && <form onSubmit={submit} className="mt-2 flex gap-2"><input autoFocus value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder="Nhập phản hồi..." className="min-w-0 flex-1 rounded-xl border border-blue-100 px-3 py-2.5 text-xs outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" /><button type="submit" className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-black text-white"><Send size={13} />Gửi</button></form>}
        {notice && <p className="mt-2 text-xs font-semibold text-blue-700">{notice}</p>}
      </>}
    </div>
  )
}

export default function LocationReviews({ location }) {
  const { session, reviews, addReview } = useAppState()
  const route = useLocation()
  const targetReviewId = useMemo(() => new URLSearchParams(route.search).get('review') || '', [route.search])
  const locationReviews = useMemo(() => reviews.filter((review) => review.locationId === location.id).sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt))), [location.id, reviews])
  const mine = session?.username ? locationReviews.find((review) => review.username === session.username) : null
  const [rating, setRating] = useState(mine?.rating || 5)
  const [comment, setComment] = useState(mine?.comment || '')
  const [notice, setNotice] = useState('')
  const average = locationReviews.length ? locationReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / locationReviews.length : 0

  useEffect(() => {
    setRating(mine?.rating || 5)
    setComment(mine?.comment || '')
  }, [mine?.id, mine?.rating, mine?.comment])

  useEffect(() => {
    if (!targetReviewId || !locationReviews.some((review) => review.id === targetReviewId)) return undefined
    const timer = window.setTimeout(() => {
      document.getElementById(`review-${targetReviewId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 140)
    return () => window.clearTimeout(timer)
  }, [location.id, locationReviews, targetReviewId])

  const submit = (event) => {
    event.preventDefault()
    try {
      addReview(location.id, { rating, comment })
      setNotice(mine ? 'Đã cập nhật đánh giá của bạn.' : 'Cảm ơn bạn đã đánh giá địa điểm.')
    } catch (e) {
      setNotice(e.message || 'Không thể lưu đánh giá.')
    }
  }

  const canRate = ['user', 'manager'].includes(session?.role) && isValidVietnamMobilePhone(session?.phone)

  return (
    <section className="border-t border-blue-100 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-600">Đánh giá cộng đồng</p><h3 className="mt-1 text-xl font-black text-blue-950">Đánh giá & phản hồi</h3></div>
        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-2.5"><p className="text-2xl font-black text-blue-950">{locationReviews.length ? average.toFixed(1) : '—'}</p><div><Stars value={average} /><p className="mt-0.5 text-[10px] text-blue-500">{locationReviews.length} đánh giá</p></div></div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          {!session && <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-blue-800">Bạn cần <Link to="/dang-nhap" state={{ from: `${route.pathname}${route.search}` }} className="font-black text-brand-700 hover:underline">đăng nhập</Link> để gửi đánh giá hoặc phản hồi.</div>}
          {session?.role === 'admin' && <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-blue-800">Quản trị viên không chấm sao địa điểm nhưng có thể phản hồi trực tiếp từng đánh giá ở cột bên phải.</div>}
          {['user', 'manager'].includes(session?.role) && !isValidVietnamMobilePhone(session.phone) && <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-blue-800">Tài khoản của bạn chưa có số điện thoại hợp lệ. <Link to="/tai-khoan" className="font-black text-brand-700 hover:underline">Cập nhật tài khoản</Link> trước khi đánh giá.</div>}
          {canRate && (
            <form onSubmit={submit} className="rounded-2xl border border-blue-100 bg-blue-50/35 p-4">
              <p className="text-sm font-black text-blue-950">{mine ? 'Cập nhật đánh giá của bạn' : 'Viết đánh giá'}</p>
              <div className="mt-3 flex gap-1">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setRating(star)} className="rounded-lg p-1 hover:bg-blue-100" aria-label={`${star} sao`}><Star size={27} className={star <= rating ? 'fill-sky-400 text-sky-400' : 'text-blue-200'} /></button>)}</div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={800} rows="4" placeholder="Chia sẻ trải nghiệm của bạn..." className="mt-3 w-full rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm text-blue-950 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50" />
              <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-blue-400">{comment.length}/800</span><button type="submit" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700">{mine ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}</button></div>
              {notice && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-blue-700">{notice}</p>}
            </form>
          )}
        </div>

        <div className="space-y-3">
          {locationReviews.slice(0, 20).map((review) => <article id={`review-${review.id}`} key={review.id} className={`scroll-mt-28 rounded-2xl border p-4 transition ${targetReviewId === review.id ? 'border-sky-300 bg-sky-50/50 shadow-lg ring-4 ring-sky-100' : 'border-blue-100 bg-white'}`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-blue-50 text-brand-700"><UserRound size={17} /></span><div><p className="text-sm font-black text-blue-950">{review.displayName || review.username}</p><Stars value={review.rating} size={14} /></div></div><span className="text-[10px] text-blue-400">{new Date(review.updatedAt || review.createdAt).toLocaleDateString('vi-VN')}</span></div>{review.comment && <p className="mt-3 flex gap-2 text-sm leading-6 text-blue-900/75"><MessageSquare size={15} className="mt-1 shrink-0 text-blue-300" />{review.comment}</p>}<ReviewReplyBox review={review} autoOpen={targetReviewId === review.id} /></article>)}
          {!locationReviews.length && <div className="rounded-2xl border border-dashed border-blue-200 p-6 text-center text-sm text-blue-500">Chưa có đánh giá. Hãy là người đầu tiên chia sẻ trải nghiệm.</div>}
        </div>
      </div>
    </section>
  )
}
