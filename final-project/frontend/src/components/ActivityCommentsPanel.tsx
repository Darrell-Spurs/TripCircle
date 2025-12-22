import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useActivityComments, useCreateActivityComment, useUpdateActivityComment, useDeleteActivityComment } from '../hooks/useActivityComments'
import { useAuth } from '../context/AuthContext'
import { ActivityComment } from '../types'

interface ActivityCommentsPanelProps {
  activityId: number
}

export default function ActivityCommentsPanel({ activityId }: ActivityCommentsPanelProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { data: comments, isLoading } = useActivityComments(activityId)
  const createComment = useCreateActivityComment()
  const updateComment = useUpdateActivityComment()
  const deleteComment = useDeleteActivityComment()
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({ activityId, content: newComment.trim() })
      setNewComment('')
    } catch (error) {
      console.error('Failed to create comment:', error)
    }
  }

  const handleStartEdit = (comment: ActivityComment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async (commentId: number) => {
    if (!editContent.trim()) return

    try {
      await updateComment.mutateAsync({ commentId, content: editContent.trim() })
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
    if (confirm(t.activity.deleteCommentConfirm || 'Are you sure you want to delete this comment?')) {
      try {
        await deleteComment.mutateAsync({ commentId, activityId })
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

  if (isLoading) {
    return <div className="text-sm text-gray-500">{t.common.loading}</div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">
        {t.activity.comments || 'Comments'} ({comments?.length || 0})
      </h3>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              {comment.user.avatarUrl ? (
                <img
                  src={comment.user.avatarUrl}
                  alt={comment.user.name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {comment.user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{comment.user.name}</span>
                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        {t.common.save}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    {user && comment.userId === user.id && (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(comment)}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          {t.common.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          {t.common.delete}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">{t.activity.noComments || 'No comments yet'}</p>
        )}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.activity.addComment || 'Add a comment...'}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || createComment.isPending}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.activity.addComment || 'Add Comment'}
          </button>
        </form>
      )}
    </div>
  )
}

