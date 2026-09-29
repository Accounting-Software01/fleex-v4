'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, MessageCircle, Send, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AvatarCircle from '@/components/dashboard/shared/avatar-circle'
import CommentItem from '@/components/dashboard/comments/comment-item'
import type { Comment } from '@/lib/dashboard/types'
import { useAuthGate } from '@/contexts/AuthGateContext'

type CommentPanelProps = {
  articleId?: string
  forgeId?: string
  feedId?: string
  currentUser: any
  onClose: () => void
}

type CommentRow = Comment & {
  parent_id?: string | null
  replies?: CommentRow[]
}

export default function CommentPanel({ articleId, forgeId, feedId, currentUser, onClose }: CommentPanelProps) {
  const supabase = useMemo(() => createClient(), [])
  const { requireAuth } = useAuthGate()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const requestId = useRef(0)

  const [comments, setComments] = useState<CommentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const target = useMemo(() => {
    if (articleId && !forgeId) {
      return {
        table: 'news_comments',
        idColumn: 'article_id',
        idValue: articleId,
        likeTable: 'news_comment_likes',
      } as const
    }
    if (forgeId && !articleId && !feedId) {
      return {
        table: 'forge_comments',
        idColumn: 'forge_id',
        idValue: forgeId,
        likeTable: 'forge_comment_likes',
      } as const
    }
    if (feedId && !articleId && !forgeId) {
      return {
        table: 'post_comments',
        idColumn: 'post_id',
        idValue: feedId,
        likeTable: 'comment_likes',
      } as const
    }
    return null
  }, [articleId, feedId, forgeId])

  const loadComments = useCallback(async () => {
    if (!target) {
      setComments([])
      setLoading(false)
      setLoadError(articleId && forgeId ? 'Choose one comment target.' : 'No comment target was provided.')
      return
    }

    const currentRequest = ++requestId.current
    setLoading(true)
    setLoadError(null)

    try {
      const { data, error } = await supabase
        .from(target.table)
        .select('*, profiles:user_id(id, display_name, username, avatar_url)')
        .eq(target.idColumn, target.idValue)
        .order('created_at', { ascending: true })

      if (error) throw error

      const rows = (data ?? []) as CommentRow[]
      const commentIds = rows.map((comment) => comment.id)
      const { data: likes, error: likesError } = commentIds.length
        ? await supabase
            .from(target.likeTable)
            .select('comment_id, user_id')
            .in('comment_id', commentIds)
        : { data: [], error: null }

      if (likesError) throw likesError
      if (currentRequest !== requestId.current) return

      const likeCounts: Record<string, number> = {}
      const likedIds = new Set<string>()
      for (const like of likes ?? []) {
        likeCounts[like.comment_id] = (likeCounts[like.comment_id] ?? 0) + 1
        if (like.user_id === currentUser?.id) likedIds.add(like.comment_id)
      }

      const byId = new Map<string, CommentRow>()
      for (const comment of rows) {
        byId.set(comment.id, {
          ...comment,
          replies: [],
          like_count: likeCounts[comment.id] ?? 0,
          liked_by_user: likedIds.has(comment.id),
        })
      }

      const roots: CommentRow[] = []
      for (const comment of byId.values()) {
        const parentId = comment.parent_id
        const parent = parentId ? byId.get(parentId) : undefined
        if (parent) parent.replies!.push(comment)
        else roots.push(comment)
      }

      setComments(roots)
    } catch (error) {
      if (currentRequest === requestId.current) {
        console.error('Error loading comments:', error)
        setLoadError(error instanceof Error ? error.message : 'Could not load comments')
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, [currentUser?.id, supabase, target])

  useEffect(() => {
    if (!target) return
    void loadComments()
  }, [loadComments, target])

  useEffect(() => {
    if (!target) return

    const channel = supabase
      .channel(`comments-${target.table}-${target.idValue}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: target.table,
          filter: `${target.idColumn}=eq.${target.idValue}`,
        },
        () => void loadComments(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: target.likeTable,
        },
        () => void loadComments(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadComments, supabase, target])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  useEffect(() => {
    const element = inputRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`
  }, [text])

  const handleLike = async (commentId: string) => {
    if (!requireAuth(currentUser, 'like this comment')) return
    if (!target) return

    setActionError(null)
    const targetComment = findComment(comments, commentId)
    if (!targetComment) return

    const wasLiked = Boolean(targetComment.liked_by_user)
    const snapshot = comments
    setComments((previous) => applyLikeLocally(previous, commentId, wasLiked))

    try {
      const result = wasLiked
        ? await supabase.from(target.likeTable).delete().eq('comment_id', commentId).eq('user_id', currentUser.id)
        : await supabase.from(target.likeTable).insert({ comment_id: commentId, user_id: currentUser.id })
      if (result.error) throw result.error
    } catch (error) {
      console.error('Error updating comment like:', error)
      setComments(snapshot)
      setActionError('Could not update like — try again')
    }
  }

  const handleReply = (id: string, username: string) => {
    if (!requireAuth(currentUser, 'reply to a comment')) return
    setReplyTo({ id, username })
    setText(`@${username} `)
    window.setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleDelete = async (commentId: string) => {
    if (!requireAuth(currentUser, 'delete this comment')) return
    if (!target) return

    const snapshot = comments
    setActionError(null)
    setComments((previous) => removeCommentLocally(previous, commentId))

    try {
      const { error } = await supabase
        .from(target.table)
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id)
      if (error) throw error
    } catch (error) {
      console.error('Error deleting comment:', error)
      setComments(snapshot)
      setActionError('Could not delete that comment — try again')
    }
  }

  const submit = async () => {
    const content = text.trim()
    if (!content || submitting || !target) return
    if (!requireAuth(currentUser, 'comment')) return

    setSubmitting(true)
    setActionError(null)
    try {
      const { error } = await supabase.from(target.table).insert({
        [target.idColumn]: target.idValue,
        user_id: currentUser.id,
        content,
        parent_id: replyTo?.id ?? null,
      })
      if (error) throw error

      setText('')
      setReplyTo(null)
      await loadComments()
    } catch (error) {
      console.error('Error posting comment:', error)
      setActionError(error instanceof Error ? error.message : 'Could not post your comment — try again')
    } finally {
      setSubmitting(false)
    }
  }

  const totalCount = countComments(comments)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-panel-title"
        className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:max-w-lg sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pb-1 pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 id="comment-panel-title" className="text-sm font-extrabold text-black">
            Comments{totalCount > 0 && <span className="ml-1 font-semibold text-gray-400">({totalCount})</span>}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close comments" className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : loadError ? (
            <div className="py-10 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="mb-3 text-xs text-gray-500">{loadError}</p>
              <button type="button" onClick={() => void loadComments()} className="text-xs font-extrabold text-black underline underline-offset-2">Try again</button>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-10 text-center">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-xs text-gray-500">Be the first to comment</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUser?.id}
                onLike={(id) => void handleLike(id)}
                onReply={handleReply}
                onDelete={(id) => void handleDelete(id)}
              />
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3">
          {actionError && <p className="mb-2 px-1 text-[11px] font-semibold text-red-600" role="alert">{actionError}</p>}
          {replyTo && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-gray-100 px-3 py-1.5">
              <span className="text-xs font-semibold text-black">Replying to @{replyTo.username}</span>
              <button type="button" aria-label="Cancel reply" onClick={() => { setReplyTo(null); setText('') }}>
                <X className="h-3 w-3 text-gray-500" aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <AvatarCircle src={currentUser?.user_metadata?.avatar_url} name={currentUser?.email} size={32} />
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void submit()
                  }
                }}
                placeholder="Add a comment..."
                rows={1}
                disabled={submitting}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-100 px-4 py-2.5 pr-10 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                style={{ minHeight: 40, maxHeight: 120 }}
              />
              <button type="button" onClick={() => void submit()} disabled={!text.trim() || submitting} aria-label="Post comment" className="absolute bottom-2.5 right-2.5 text-black transition disabled:text-gray-300">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function findComment(list: CommentRow[], id: string): CommentRow | undefined {
  for (const comment of list) {
    if (comment.id === id) return comment
    const nested = findComment(comment.replies ?? [], id)
    if (nested) return nested
  }
  return undefined
}

function applyLikeLocally(list: CommentRow[], id: string, wasLiked: boolean): CommentRow[] {
  return list.map((comment) => ({
    ...comment,
    like_count: comment.id === id ? Math.max(0, (comment.like_count ?? 0) + (wasLiked ? -1 : 1)) : comment.like_count,
    liked_by_user: comment.id === id ? !wasLiked : comment.liked_by_user,
    replies: applyLikeLocally(comment.replies ?? [], id, wasLiked),
  }))
}

function removeCommentLocally(list: CommentRow[], id: string): CommentRow[] {
  return list
    .filter((comment) => comment.id !== id)
    .map((comment) => ({ ...comment, replies: removeCommentLocally(comment.replies ?? [], id) }))
}

function countComments(list: CommentRow[]): number {
  return list.reduce((total, comment) => total + 1 + countComments(comment.replies ?? []), 0)
}
