'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bookmark,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Users,
} from 'lucide-react'

export type FeedPost = {
  id: string
  user_id: string
  content?: string | null
  image_url?: string | null
  image?: string | null
  media_url?: string | null
  media_type?: 'image' | 'video' | null
  media_urls?: string[] | null
  attachments?: unknown
  media?: unknown
  created_at: string
  likes_count?: number | null
  shares_count?: number | null
  profiles?: Profile | Profile[] | null
}

type Profile = {
  id: string
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
}

type FeedCardProps = {
  post: FeedPost
  isFollowing: boolean
  isLiked: boolean
  currentUserId: string
  commentCount: number
  onFollow: () => void
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onTagClick?: (tag: string) => void
  isLikePending?: boolean
  isFollowPending?: boolean
}

const formatRelativeTime = (value: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
    new Date(value),
  )
}

const formatCount = (value: number) => {
  if (value < 1000) return String(value)
  if (value < 1000000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return `${(value / 1000000).toFixed(1)}m`
}

const getProfile = (profiles: FeedPost['profiles'], userId: string): Profile => {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles
  return (
    profile ?? {
      id: userId,
      display_name: 'Fleex member',
      username: null,
      avatar_url: null,
    }
  )
}

const getInitials = (profile: Profile) => {
  const label = profile.display_name || profile.username || 'F'
  return label
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const isUsableImageUrl = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

const getPostImageUrl = (post: FeedPost): string | null => {
  const candidate = post as FeedPost & Record<string, unknown>
  const directUrl = [candidate.image_url, candidate.image, candidate.media_url].find(isUsableImageUrl)
  if (directUrl) return directUrl

  if (Array.isArray(candidate.media_urls)) {
    const firstUrl = candidate.media_urls.find(isUsableImageUrl)
    if (firstUrl) return firstUrl
  }

  const attachmentSource = candidate.attachments ?? candidate.media
  if (Array.isArray(attachmentSource)) {
    for (const attachment of attachmentSource) {
      if (isUsableImageUrl(attachment)) return attachment
      if (attachment && typeof attachment === 'object') {
        const record = attachment as Record<string, unknown>
        const url = [record.url, record.publicUrl, record.public_url, record.path].find(isUsableImageUrl)
        if (url) return url
      }
    }
  }

  if (attachmentSource && typeof attachmentSource === 'object') {
    const record = attachmentSource as Record<string, unknown>
    const url = [record.url, record.publicUrl, record.public_url, record.path].find(isUsableImageUrl)
    if (url) return url
  }

  return null
}

export default function FeedCard({
  post,
  isFollowing,
  isLiked,
  commentCount,
  onFollow,
  onLike,
  onComment,
  onShare,
  isLikePending = false,
  isFollowPending = false,
}: FeedCardProps) {
  const profile = getProfile(post.profiles, post.user_id)
  const authorName = profile.display_name || profile.username || 'Fleex member'
  const likesCount = Math.max(0, post.likes_count ?? 0)
  const sharesCount = Math.max(0, post.shares_count ?? 0)
  const postImageUrl = getPostImageUrl(post)
  const mediaUrl = post.media_url || postImageUrl
  const mediaType = post.media_type || (mediaUrl ? 'image' : null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoMuted, setVideoMuted] = useState(true)

  useEffect(() => {
    if (mediaType !== 'video' || !mediaUrl || !videoRef.current) return

    const video = videoRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => undefined)
        else video.pause()
      },
      { threshold: 0.3 },
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [mediaType, mediaUrl])

  return (
    <article className="relative isolate box-border mx-auto mb-4 block w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#deded9] bg-[#fbfaf6] text-[#14181c] shadow-[0_14px_35px_rgba(31,35,38,0.08)]">
      <div className="px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7">
        <div className="flex items-start gap-4">
          <Avatar profile={profile} />

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="truncate text-[1.06rem] font-semibold leading-tight tracking-[-0.02em]">
              {authorName}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[0.98rem] text-[#7d8387]">
              <span>{formatRelativeTime(post.created_at)}</span>
              <span aria-hidden="true">•</span>
              <Users className="h-5 w-5" aria-hidden="true" />
              <span>Friends</span>
            </div>
          </div>

          {!isFollowing && profile.id !== '' && (
            <button
              type="button"
              onClick={onFollow}
              disabled={isFollowPending}
              className="mr-1 mt-1 hidden rounded-full px-3 py-1.5 text-sm font-semibold text-[#8aae00] transition-colors hover:bg-[#efffc8] disabled:opacity-50 sm:block"
            >
              {isFollowPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Follow'}
            </button>
          )}

          <button
            type="button"
            aria-label="More post options"
            className="rounded-full p-1.5 text-[#7d8387] transition-colors hover:bg-[#efefea]"
          >
            <MoreHorizontal className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {post.content && (
          <p className="mt-8 text-[clamp(1.7rem,4.3vw,2.55rem)] font-normal leading-[1.12] tracking-[-0.045em]">
            {post.content}
          </p>
        )}
      </div>

      {mediaUrl && mediaType === 'image' && (
        <div className="relative mx-5 overflow-hidden rounded-[22px] sm:mx-7">
          <img
            src={mediaUrl}
            alt=""
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />

          {/* Fleex signature frame: quiet and partial, so it supports rather than covers the image. */}
          <div className="pointer-events-none absolute -right-3 top-0 h-full w-[29%] opacity-85" aria-hidden="true">
            <span className="absolute left-1/2 top-[-9%] h-[61%] w-[10px] -translate-x-1/2 rotate-[43deg] rounded-full bg-[#fbfaf6]" />
            <span className="absolute left-1/2 bottom-[-9%] h-[61%] w-[10px] -translate-x-1/2 -rotate-[43deg] rounded-full bg-[#fbfaf6]" />
            <span className="absolute right-4 top-[11%] h-5 w-5 rounded-full bg-[#b7f23a] shadow-[0_0_0_5px_rgba(183,242,58,0.16)]" />
          </div>

          <div className="pointer-events-none absolute bottom-5 left-5 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            <span className="mb-3 block h-0.5 w-8 bg-white" />
            A brighter
            <br />
            forward
          </div>
        </div>
      )}

      {mediaUrl && mediaType === 'video' && (
        <div className="relative mx-5 overflow-hidden rounded-[22px] bg-[#1f2326] sm:mx-7">
          <video
            ref={videoRef}
            src={mediaUrl}
            className="max-h-[600px] min-h-[280px] w-full object-contain"
            autoPlay
            muted={videoMuted}
            loop
            playsInline
          />
          <button
            type="button"
            onClick={() => setVideoMuted((muted) => !muted)}
            className="absolute bottom-3 right-3 rounded-full bg-[#1f2326] px-3 py-1.5 text-xs font-semibold text-white"
          >
            {videoMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      )}

      <div className="px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
        <div className="flex items-center gap-2 text-[0.98rem] text-[#7d8387]">
          <span>{formatCount(likesCount)} appreciates</span>
          <span aria-hidden="true">•</span>
          <span>{formatCount(commentCount)} comments</span>
          <span aria-hidden="true">•</span>
          <span>{formatCount(sharesCount)} shares</span>
        </div>

        <div className="mt-5 flex min-w-0 items-center border-t border-[#d9d9d4] pt-4">
          <ActionButton
            active={isLiked}
            disabled={isLikePending}
            label={isLiked ? 'Remove appreciation' : 'Appreciate this post'}
            onClick={onLike}
          >
            {isLikePending ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : (
              <Heart className="h-6 w-6" fill={isLiked ? 'currentColor' : 'none'} aria-hidden="true" />
            )}
            <span className="min-w-0 truncate">Appreciate</span>
          </ActionButton>

          <ActionButton label="Comment on this post" onClick={onComment}>
            <MessageCircle className="h-6 w-6" aria-hidden="true" />
            <span className="min-w-0 truncate">Comment</span>
          </ActionButton>

          <ActionButton label="Share this post" onClick={onShare}>
            <Share2 className="h-6 w-6" aria-hidden="true" />
            <span className="min-w-0 truncate">Share</span>
          </ActionButton>

          <button
            type="button"
            aria-label="Save post"
            className="ml-1 shrink-0 rounded-xl p-2.5 text-[#14181c] transition-colors hover:bg-[#efefea]"
          >
            <Bookmark className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}

function Avatar({ profile }: { profile: Profile }) {
  if (profile.avatar_url) {
    return <img src={profile.avatar_url} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1f2326] text-sm font-semibold text-[#b7f23a]" aria-hidden="true">
      {getInitials(profile)}
    </div>
  )
}

function ActionButton({
  active = false,
  disabled = false,
  label,
  onClick,
  children,
}: {
  active?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden border-r border-[#d9d9d4] px-1 text-[0.95rem] font-semibold transition-colors last:border-r-0 disabled:opacity-50 ${
        active ? 'text-[#9ac500]' : 'text-[#14181c] hover:bg-[#efefea]'
      }`}
    >
      {children}
    </button>
  )}
