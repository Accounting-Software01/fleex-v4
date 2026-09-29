'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Send, MessageCircle, AlertCircle } from 'lucide-react'
import AvatarCircle from '@/components/dashboard/shared/avatar-circle'
import CommentItem from '@/components/dashboard/comments/comment-item'
import type { Comment } from '@/lib/dashboard/types'
import { useAuthGate } from '@/contexts/AuthGateContext'

export default function CommentPanel({
  articleId,
  forgeId,
  currentUser,
  onClose,
}: {
  articleId?: string
  forgeId?: string
  currentUser: any
  onClose: () => void
}) {
  const supabase = createClient()
  const { requireAuth } = useAuthGate()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const table = articleId ? 'news_comments' : 'forge_comments'
  const idCol = articleId ? 'article_id' : 'forge_id'
  const idValue = articleId || forgeId
  const likeTable = articleId ? 'news_comment_likes' : 'forge_comment_likes'

  const loadComments = useCallback(async () => {
    setLoadError(null)
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*, profiles:user_id(display_name, username, avatar_url)')
        .eq(idCol, idValue)
        .order('created_at', { ascending: true })

      if (error) throw error
      if (!data) {
        setComments([])
        return
      }

      const commentIds = data.map((c: any) => c.id)
      const { data: allLikes, error: likesError } = await supabase
        .from(likeTable)
        .select('comment_id, user_id')
        .in('comment_id', commentIds.length ? commentIds : [''])

      if (likesError) throw likesError

      const userLiked = new Set<string>(
        (allLikes || [])
          .filter((l: any) => l.user_id === currentUser?.id)
          .map((l: any) => l.comment_id)
      )

      const likeCounts: Record<string, number> = {}
      ;(allLikes || []).forEach((l: any) => {
        likeCounts[l.comment_id] = (likeCounts[l.comment_id] || 0) + 1
      })

      const map: Record<string, Comment> = {}
      const roots: Comment[] = []
      data.forEach((c: any) => {
        map[c.id] = {
          ...c,
          replies: [],
          like_count: likeCounts[c.id] || 0,
          liked_by_user: userLiked.has(c.id),
        }
      })
      data.forEach((c: any) => {
        if (c.parent_id && map[c.parent_id]) {
          map[c.parent_id].replies!.push(map[c.id])
        } else {
          roots.push(map[c.id])
        }
      })
      setComments(roots)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load comments')
    } finally {
      setLoading(false)
    }
  }, [supabase, table, idCol, idValue, likeTable, currentUser?.id])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  // Live updates — someone else's new comment (or a like) shows up without
  // needing to close and reopen the panel.
  useEffect(() => {
    if (!idValue) return
    const channel = supabase
      .channel(`comments-${table}-${idValue}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `${idCol}=eq.${idValue}` },
        () => loadComments()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: likeTable },
        () => loadComments()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, table, idCol, idValue, likeTable, loadComments])

  // Lock background scroll while the panel is open, and allow Escape to close.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Auto-grow the textarea as the person types, capped at ~5 lines.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [text])

  const handleLike = async (commentId: string) => {
    if (!requireAuth(currentUser, 'like this comment')) return
    setActionError(null)
    const target = findComment(comments, commentId)
    const isLiked = !!target?.liked_by_user

    setComments((prev) => applyLikeLocally(prev, commentId, isLiked))

    try {
      const { error } = isLiked
        ? await supabase.from(likeTable).delete().eq('comment_id', commentId).eq('user_id', currentUser.id)
        : await supabase.from(likeTable).insert({ comment_id: commentId, user_id: currentUser.id })
      if (error) throw error
    } catch (err) {
      // Roll back the optimistic update if the server rejected it.
      setComments((prev) => applyLikeLocally(prev, commentId, !isLiked))
      setActionError('Could not update like — try again')
    }
  }

  const handleReply = (id: string, username: string) => {
    setReplyTo({ id, username })
    setText(`@${username} `)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleDelete = async (commentId: string) => {
    setActionError(null)
    const snapshot = comments
    setComments((prev) => removeCommentLocally(prev, commentId))
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id)
      if (error) throw error
    } catch {
      setComments(snapshot)
      setActionError('Could not delete that comment — try again')
    }
  }

  const submit = async () => {
    if (!text.trim()) return
    if (!requireAuth(currentUser, 'comment')) return
    setSubmitting(true)
    setActionError(null)
    try {
      const { error } = await supabase.from(table).insert({
        [idCol]: idValue,
        user_id: currentUser.id,
        content: text.trim(),
        parent_id: replyTo?.id || null,
      })
      if (error) throw error
      setText('')
      setReplyTo(null)
      await loadComments()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not post your comment — try again')
    } finally {
      setSubmitting(false)
    }
  }

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-extrabold text-sm text-black">
            Comments
            {totalCount > 0 && <span className="text-gray-400 font-semibold ml-1">({totalCount})</span>}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : loadError ? (
            <div className="text-center py-10">
              <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 mb-3">{loadError}</p>
              <button
                onClick={loadComments}
                className="text-xs font-extrabold text-black underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Be the first to comment</p>
            </div>
          ) : (
            comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                currentUserId={currentUser?.id}
                onLike={handleLike}
                onReply={handleReply}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 px-3 py-3 bg-white flex-shrink-0">
          {actionError && (
            <p className="text-[11px] font-semibold text-red-600 mb-2 px-1">{actionError}</p>
          )}

          {replyTo && (
            <div className="flex items-center justify-between bg-gray-100 rounded-xl px-3 py-1.5 mb-2">
              <span className="text-xs text-black font-semibold">
                Replying to @{replyTo.username}
              </span>
              <button onClick={() => { setReplyTo(null); setText('') }}>
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <AvatarCircle
              src={currentUser?.user_metadata?.avatar_url}
              name={currentUser?.email}
              size={32}
            />
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder="Add a comment..."
                rows={1}
                disabled={submitting}
                className="w-full text-sm bg-gray-100 border border-gray-200 rounded-2xl px-4 py-2.5 pr-10 resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                style={{ minHeight: 40, maxHeight: 120 }}
              />
              <button
                onClick={submit}
                disabled={!text.trim() || submitting}
                aria-label="Post comment"
                className="absolute right-2.5 bottom-2.5 text-black disabled:text-gray-300 transition"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Local tree helpers (used for optimistic like/delete updates) ──────────

function findComment(list: Comment[], id: string): Comment | undefined {
  for (const c of list) {
    if (c.id === id) return c
    const found = findComment(c.replies || [], id)
    if (found) return found
  }
  return undefined
}

function applyLikeLocally(list: Comment[], id: string, wasLiked: boolean): Comment[] {
  return list.map((c) => ({
    ...c,
    like_count: c.id === id ? Math.max(0, (c.like_count || 0) + (wasLiked ? -1 : 1)) : c.like_count,
    liked_by_user: c.id === id ? !wasLiked : c.liked_by_user,
    replies: applyLikeLocally(c.replies || [], id, wasLiked),
  }))
}

function removeCommentLocally(list: Comment[], id: string): Comment[] {
  return list
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: removeCommentLocally(c.replies || [], id) }))
}
