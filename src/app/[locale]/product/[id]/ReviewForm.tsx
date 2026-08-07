'use client'

import { useState, useEffect } from 'react'
import { Star, Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Review } from '@/types'

interface Props {
  partId: string
  vendorId: string
}

export default function ReviewForm({ partId, vendorId }: Props) {
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })

    // Load reviews
    loadReviews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partId])

  async function loadReviews() {
    setLoadingReviews(true)
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('part_id', partId)
      .order('created_at', { ascending: false })
    setReviews((data as Review[]) ?? [])
    setLoadingReviews(false)
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    if (rating === 0) { setSubmitError('Please select a star rating.'); return }
    if (!comment.trim()) { setSubmitError('Please write a review comment.'); return }

    setSubmitting(true)
    setSubmitError('')

    const { error } = await supabase.from('reviews').insert({
      part_id: partId,
      vendor_id: vendorId,
      customer_id: userId,
      rating,
      title: title.trim() || null,
      comment: comment.trim(),
    })

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }

    setRating(0)
    setTitle('')
    setComment('')
    setSubmitSuccess(true)
    setSubmitting(false)
    setTimeout(() => setSubmitSuccess(false), 3000)
    loadReviews()
  }

  return (
    <div className="space-y-8">
      {/* Average rating summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-gold-50 rounded-xl border border-gold-100">
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-gold-700">{avgRating.toFixed(1)}</p>
            <div className="flex gap-0.5 mt-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-gold-500 text-gold-500' : 'text-gray-300'}`} />
              ))}
            </div>
            <p className="text-xs text-midnight-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
          {/* Rating distribution bars */}
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map(star => {
              const count = reviews.filter(r => r.rating === star).length
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-midnight-500 w-3">{star}</span>
                  <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-midnight-400 w-4">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit form — only for logged-in users */}
      {userId ? (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-heading font-semibold text-midnight-900">Write a Review</h3>

          {submitSuccess && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              ✓ Thank you for your review!
            </div>
          )}
          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{submitError}</div>
          )}

          {/* Star selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-midnight-700">Rating *</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="focus:outline-none"
                >
                  <Star className={`w-7 h-7 transition-colors ${
                    s <= (hoverRating || rating)
                      ? 'fill-gold-500 text-gold-500'
                      : 'text-gray-300 hover:text-gold-300'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-midnight-700">Review Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Great quality, fast delivery"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-midnight-700">Review *</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience with this product..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
            Submit Review
          </button>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-midnight-500 text-center">
          <a href="#" className="text-gold-600 font-medium hover:underline">Sign in</a> to write a review.
        </div>
      )}

      {/* Review list */}
      <div className="space-y-4">
        {loadingReviews ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-midnight-400 text-sm italic">No reviews yet. Be the first to review!</p>
        ) : reviews.map(review => (
          <div key={review.id} className="border border-gray-100 rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-white font-bold text-sm">
                  {(review.profiles?.full_name?.[0] ?? 'U').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-midnight-900">
                    {review.profiles?.full_name ?? 'Anonymous'}
                  </p>
                  <p className="text-xs text-midnight-400">{formatDate(review.created_at)}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-gold-500 text-gold-500' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
            {review.title && (
              <p className="font-semibold text-sm text-midnight-800 mb-1">{review.title}</p>
            )}
            <p className="text-sm text-midnight-600 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
