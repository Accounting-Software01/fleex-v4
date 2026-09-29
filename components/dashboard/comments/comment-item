'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CornerDownRight, Heart, Trash2 } from 'lucide-react'
import AvatarCircle from '@/components/dashboard/shared/avatar-circle'
import { timeAgo } from '@/lib/dashboard/helpers'
import type { Comment } from '@/lib/dashboard/types'

type CommentItemProps = {
  comment: Comment
  depth?: number
  currentUserId?: string
  onLike: (id: string) => void
  onReply: (id: string, username: string) => void
  onDelete: (id: string) => void
}

export default function CommentItem({
  comment,
  depth = 0,
  currentUserId,
  onLike,
  onReply,
  onDelete,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(depth < 1)
  const replies = comment.replies ?? []
  const replyCount = replies.length
  const visualDepth = Math.min(Math.max(depth, 0), 1)
  const avatarSize = visualDepth > 0 ? 26 : 32
  const isOwnComment = Boolean(currentUserId && comment.user_id === currentUserId)
  const username = comment.profiles?.username || 'user'
  const displayName = comment.profiles?.display_name || 'User'
  const likeCount = Math.max(0, comment.like_count ?? 0)

  return (
    <div className={visualDepth > 0 ? 'ml-8 mt-2' : 'mt-3'}>
      <div className="flex min-w-0 gap-2.5">
        <AvatarCircle
          src={comment.profiles?.avatar_url}
          name={displayName}
          size={avatarSize}
        />

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-gray-100 px-3 py-2">
            <div className="mb-0.5 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="max-w-full truncate text-xs font-extrabold text-black">
                {displayName}
              </span>
              <span className="shrink-0 text-[10px] text-gray-500">
                @{username} · {timeAgo(comment.created_at)}
              </span>
            </div>
            <p className="break-words whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
              {comment.content}
            </p>
          </div>

          <div className="ml-2 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => onLike(comment.id)}
              aria-label={comment.liked_by_user ? 'Unlike comment' : 'Like comment'}
              aria-pressed={Boolean(comment.liked_by_user)}
              className={`inline-flex items-center gap-1 text-[11px] font-bold transition ${
                comment.liked_by_user ? 'text-black' : 'text-gray-400 hover:text-black'
              }`}
            >
              <Heart className={`h-3 w-3 ${comment.liked_by_user ? 'fill-current' : ''}`} aria-hidden="true" />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            <button
              type="button"
              onClick={() => onReply(comment.id, username)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 transition hover:text-black"
            >
              <CornerDownRight className="h-3 w-3" aria-hidden="true" />
              Reply
            </button>

            {isOwnComment && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 transition hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Delete
              </button>
            )}

            {replyCount > 0 && (
              <button
                type="button"
                onClick={() => setShowReplies((visible) => !visible)}
                aria-expanded={showReplies}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 transition hover:text-black"
              >
                {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showReplies ? 'Hide' : `${replyCount} repl${replyCount === 1 ? 'y' : 'ies'}`}
              </button>
            )}
          </div>

          {showReplies && replies.length > 0 && (
            <div aria-label={`Replies to ${displayName}`}>
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  currentUserId={currentUserId}
                  onLike={onLike}
                  onReply={onReply}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
