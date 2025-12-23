import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useTripComments, useCreateTripComment, useUpdateTripComment, useDeleteTripComment } from '../hooks/useTripComments'
import { useAuth } from '../context/AuthContext'
import { TripComment } from '../types'

interface TripCommentsSectionProps {
  tripId: number
  tripOwnerId?: number
}

export default function TripCommentsSection({ tripId, tripOwnerId }: TripCommentsSectionProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: comments, isLoading } = useTripComments(tripId)
  const createComment = useCreateTripComment()
  const updateComment = useUpdateTripComment()
  const deleteComment = useDeleteTripComment()
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({ tripId, content: newComment.trim() })
      setNewComment('')
    } catch (error) {
      console.error('Failed to create comment:', error)
    }
  }

  const handleStartEdit = (comment: TripComment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async (commentId: number) => {
    if (!editContent.trim()) return

    try {
      await updateComment.mutateAsync({ commentId, content: editContent.trim(), tripId })
      setEditingId(null)
      setEditContent('')
    } catch (error) {
      console.error('Failed to update comment:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleDelete = async (commentId: number) => {
    if (confirm(t.feed.deleteCommentConfirm)) {
      try {
        await deleteComment.mutateAsync({ commentId, tripId })
      } catch (error) {
        console.error('Failed to delete comment:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Check if user can delete a comment (own comment or trip owner)
  const canDeleteComment = (comment: TripComment) => {
    if (!user) return false
    return comment.userId === user.id || (tripOwnerId && tripOwnerId === user.id)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-gray-500">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <span>💬</span>
        {t.feed.comments} ({comments?.length || 0})
      </h2>

      {/* Comment input form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t.feed.addCommentPlaceholder}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || createComment.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createComment.isPending ? t.common.loading : t.feed.postComment}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600 mb-2">
            {t.feed.loginToComment}
          </p>
          <button
            onClick={() => {
              const currentPath = location.pathname + location.search
              navigate(`/auth/login?return=${encodeURIComponent(currentPath)}`)
            }}
            className="text-indigo-600 hover:text-indigo-700 underline text-sm"
          >
            {t.nav.login || 'Login'}
          </button>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
              {comment.user.avatarUrl ? (
                <img
                  src={comment.user.avatarUrl}
                  alt={comment.user.name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {comment.user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{comment.user.name}</span>
                  <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={updateComment.isPending}
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {t.common?.save || 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        {t.common?.cancel || 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-xs text-gray-400 mt-1 block">(edited)</span>
                    )}
                    {user && (
                      <div className="flex gap-3 mt-2">
                        {comment.userId === user.id && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(comment)}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            {t.common?.edit || 'Edit'}
                          </button>
                        )}
                        {canDeleteComment(comment) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            {t.common?.delete || 'Delete'}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💭</div>
            <p>{t.feed.noComments}. {t.feed.beFirstToShare}</p>
          </div>
        )}
      </div>
    </div>
  )
}

