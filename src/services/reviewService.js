/**
 * Review service
 */
import api from './api'

export async function apiGetReviews(locationId) {
  const res = await api.get(`/locations/${locationId}/reviews/`)
  return res.data.results
}

export async function apiGetAllReviews() {
  const res = await api.get('/reviews/')
  return res.data.results
}

export async function apiSubmitReview(locationId, { rating, comment }) {
  const res = await api.post(`/locations/${locationId}/reviews/`, { rating, comment })
  return res.data
}

export async function apiDeleteReview(reviewId) {
  await api.delete(`/reviews/${reviewId}/`)
}

export async function apiReplyToReview(reviewId, comment) {
  const res = await api.post(`/reviews/${reviewId}/replies/`, { comment })
  return res.data
}

export async function apiDeleteReviewReply(reviewId, replyId) {
  await api.delete(`/reviews/${reviewId}/replies/${replyId}/`)
}
