'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Bookmark,
  Check,
  ChevronLeft,
  Crown,
  Flame,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Music,
  Play,
  RefreshCw,
  Share2,
  Sparkles,
  TrendingUp,
  User,
  Verified,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuthGate } from '@/contexts/AuthGateContext'

const VIDEO_CATEGORIES = [
  'For You',
  'Trending',
  'Technology',
  'Health',
  'Entertainment',
  'Gaming',
  'Sports',
  'Business',
  'Music',
  'Lifestyle',
  'Fitness',
  'Comedy',
  'Education',
  'Travel',
  'Food',
  'Art',
  'Nature',
]

interface Fleex {
  id: string
  user_id: string
  video_url: string
  thumbnail_url: string
  caption: string
  music_name: string
  music_artist: string
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  duration: number
  created_at: string
  display_name?: string | null
  username?: string | null
  avatar_url?: string | null
  is_official?: boolean
  is_verified?: boolean
  profiles?: {
    display_name: string
    username: string
    avatar_url: string
    is_official: boolean
    is_verified: boolean
  } | null
}

export default function FleexPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { requireAuth } = useAuthGate()

  const [fleex, setFleex] = useState<Fleex[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedFleex, setSavedFleex] = useState<Set<string>>(new Set())
  const [likedFleex, setLikedFleex] = useState<Set<string>>(new Set())
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('For You')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [tempCategory, setTempCategory] = useState('For You')
  const [hasSetInterest, setHasSetInterest] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [shareCopied, setShareCopied] = useState<string | null>(null)

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const observerTarget = useRef<HTMLDivElement>(null)
  const ITEMS_PER_PAGE = 10

  const fetchFleex = useCallback(
    async (pageNum: number, category: string, refresh = false) => {
      if (refresh) setRefreshing(true)
      if (pageNum === 1) setLoading(true)
      if (pageNum > 1) setIsLoadingMore(true)

      try {
        const { data: officialAccounts } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_official', true)

        const officialIds = officialAccounts?.map((account) => account.id) || []

        let query = supabase
          .from('user_fleex')
          .select(
            `
              *,
              profiles:user_id (
                display_name,
                username,
                avatar_url,
                is_official,
                is_verified
              )
            `,
          )
          .eq('is_private', false)
          .range((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE - 1)

        if (category === 'Trending') {
          query = query.order('view_count', { ascending: false })
        } else {
          query = query.order('created_at', { ascending: false })
        }

        if (category !== 'For You' && category !== 'Trending') {
          query = query.ilike('caption', `%${category}%`)
        }

        const { data: videosData, error } = await query
        if (error) throw error

        if (!videosData || videosData.length === 0) {
          if (pageNum === 1) setFleex([])
          setHasMore(false)
          return
        }

        const transformedVideos: Fleex[] = videosData.map((video: any) => ({
          ...video,
          display_name: video.profiles?.display_name,
          username: video.profiles?.username,
          avatar_url: video.profiles?.avatar_url,
          is_official: video.profiles?.is_official,
          is_verified: video.profiles?.is_verified,
        }))

        const sortedVideos = transformedVideos.sort((a, b) => {
          const aIsOfficial = officialIds.includes(a.user_id)
          const bIsOfficial = officialIds.includes(b.user_id)
          if (aIsOfficial && !bIsOfficial) return -1
          if (!aIsOfficial && bIsOfficial) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        if (pageNum === 1 || refresh) {
          setFleex(sortedVideos)
          setPage(1)
          setCurrentIndex(0)
          if (containerRef.current && refresh) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
          }
        } else {
          setFleex((previous) => [...previous, ...sortedVideos])
        }

        setHasMore(videosData.length === ITEMS_PER_PAGE)

        if (currentUser && sortedVideos.length) {
          const videoIds = sortedVideos.map((video) => video.id)
          const [{ data: likes }, { data: saves }] = await Promise.all([
            supabase
              .from('fleex_likes')
              .select('fleex_id')
              .eq('user_id', currentUser.id)
              .in('fleex_id', videoIds),
            supabase
              .from('fleex_saves')
              .select('fleex_id')
              .eq('user_id', currentUser.id)
              .in('fleex_id', videoIds),
          ])

          setLikedFleex(new Set(likes?.map((like) => like.fleex_id) || []))
          setSavedFleex(new Set(saves?.map((save) => save.fleex_id) || []))
        }
      } catch (error) {
        console.error('Error fetching fleex:', error)
      } finally {
        setLoading(false)
        setRefreshing(false)
        setIsLoadingMore(false)
      }
    },
    [currentUser, supabase],
  )

  useEffect(() => {
    let cancelled = false

    const initialize = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return

      if (!user) {
        setCurrentUser(null)
        setSelectedCategory('For You')
        setHasSetInterest(true)
        await fetchFleex(1, 'For You')
        return
      }

      setCurrentUser(user)

      const { data: interests } = await supabase
        .from('user_interests')
        .select('category')
        .eq('user_id', user.id)
        .single()

      if (interests?.category) {
        setSelectedCategory(interests.category)
        setHasSetInterest(true)
        await fetchFleex(1, interests.category)
      } else {
        setShowCategoryModal(true)
        setLoading(false)
      }
    }

    initialize()
    return () => {
      cancelled = true
    }
  }, [fetchFleex, supabase])

  const saveUserInterest = async () => {
    if (!currentUser) return

    await supabase.from('user_interests').upsert({
      user_id: currentUser.id,
      category: tempCategory,
      updated_at: new Date().toISOString(),
    })

    setSelectedCategory(tempCategory)
    setHasSetInterest(true)
    setShowCategoryModal(false)
    await fetchFleex(1, tempCategory)
  }

  useEffect(() => {
    if (!hasSetInterest) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          !refreshing &&
          !isLoadingMore &&
          fleex.length > 0
        ) {
          const nextPage = page + 1
          setPage(nextPage)
          await fetchFleex(nextPage, selectedCategory)
        }
      },
      { threshold: 0.1, rootMargin: '200px' },
    )

    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [fetchFleex, fleex.length, hasMore, hasSetInterest, isLoadingMore, loading, page, refreshing, selectedCategory])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const videoHeight = window.innerHeight
    const newIndex = Math.round(containerRef.current.scrollTop / videoHeight)

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < fleex.length) {
      videoRefs.current[currentIndex]?.pause()
      setCurrentIndex(newIndex)
    }
  }, [currentIndex, fleex.length])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex]
    if (currentVideo && currentVideo.readyState >= 2) {
      currentVideo.play().catch(() => undefined)
    }
  }, [currentIndex])

  const toggleLike = async (fleexId: string) => {
    if (!requireAuth(currentUser, 'like this video')) return

    const isLiked = likedFleex.has(fleexId)
    if (isLiked) {
      await supabase.from('fleex_likes').delete().eq('fleex_id', fleexId).eq('user_id', currentUser.id)
      setLikedFleex((previous) => {
        const next = new Set(previous)
        next.delete(fleexId)
        return next
      })
      setFleex((previous) => previous.map((video) => video.id === fleexId ? { ...video, like_count: Math.max(0, video.like_count - 1) } : video))
    } else {
      await supabase.from('fleex_likes').insert({ fleex_id: fleexId, user_id: currentUser.id })
      setLikedFleex((previous) => new Set(previous).add(fleexId))
      setFleex((previous) => previous.map((video) => video.id === fleexId ? { ...video, like_count: video.like_count + 1 } : video))
    }
  }

  const toggleSave = async (fleexId: string) => {
    if (!requireAuth(currentUser, 'save this video')) return

    const isSaved = savedFleex.has(fleexId)
    if (isSaved) {
      await supabase.from('fleex_saves').delete().eq('fleex_id', fleexId).eq('user_id', currentUser.id)
      setSavedFleex((previous) => {
        const next = new Set(previous)
        next.delete(fleexId)
        return next
      })
    } else {
      await supabase.from('fleex_saves').insert({ fleex_id: fleexId, user_id: currentUser.id })
      setSavedFleex((previous) => new Set(previous).add(fleexId))
    }
  }

  const fetchComments = async (fleexId: string) => {
    const { data } = await supabase
      .from('fleex_comments')
      .select('*, profiles:user_id (display_name, avatar_url)')
      .eq('fleex_id', fleexId)
      .order('created_at', { ascending: false })
      .limit(50)

    setComments(data || [])
  }

  const addComment = async () => {
    if (!requireAuth(currentUser, 'comment')) return
    if (!commentText.trim()) return

    const currentFleex = fleex[currentIndex]
    if (!currentFleex) return

    await supabase.from('fleex_comments').insert({
      fleex_id: currentFleex.id,
      user_id: currentUser.id,
      comment: commentText.trim(),
    })

    setCommentText('')
    await fetchComments(currentFleex.id)
    setFleex((previous) => previous.map((video) => video.id === currentFleex.id ? { ...video, comment_count: video.comment_count + 1 } : video))
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return String(num)
  }

  const shareVideo = async (video: Fleex) => {
    const url = `${window.location.origin}/fleex/${video.id}`
    await navigator.clipboard.writeText(url).catch(() => undefined)
    setShareCopied(video.id)
    window.setTimeout(() => setShareCopied(null), 2000)
  }

  const handleVideoEnded = (index: number) => {
    const video = videoRefs.current[index]
    if (!video) return
    video.currentTime = 0
    video.play().catch(() => undefined)
  }

  const handleRefresh = async () => {
    await fetchFleex(1, selectedCategory, true)
  }

  if (showCategoryModal) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-white px-5 py-10 text-[#14181c]">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1f2326] text-[#b7f23a]">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold tracking-[-0.04em]">Choose your interests</h1>
            <p className="text-sm text-[#7d8387]">Select a category to shape your video feed.</p>
          </div>

          <div className="mb-8 flex max-h-96 flex-wrap justify-center gap-2 overflow-y-auto">
            {VIDEO_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setTempCategory(category)}
                className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
                  tempCategory === category
                    ? 'border-[#1f2326] bg-[#1f2326] text-white'
                    : 'border-[#d9d9d4] bg-[#fbfaf6] text-[#14181c] hover:bg-[#efefea]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={saveUserInterest}
            className="w-full rounded-full bg-[#1f2326] px-5 py-3 font-semibold text-white transition hover:bg-black active:scale-[0.99]"
          >
            Start watching
          </button>
        </div>
      </div>
    )
  }

  if (loading && fleex.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#14181c]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#d9d9d4] border-t-[#1f2326]" />
          <p className="text-sm text-[#7d8387]">Loading videos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-white text-[#14181c]">
      <header className="sticky top-0 z-30 border-b border-[#e5e5e0] bg-white/95 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="shrink-0 rounded-full p-2 text-[#14181c] transition hover:bg-[#efefea] active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-[-0.02em]">Fleex Videos</p>
            <p className="truncate text-xs text-[#7d8387]">Discover creators and ideas</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setTempCategory(selectedCategory)
              setShowCategoryModal(true)
            }}
            className="max-w-[38%] shrink-0 truncate rounded-full border border-[#d9d9d4] bg-[#fbfaf6] px-3 py-2 text-xs font-semibold text-[#14181c] transition hover:bg-[#efefea]"
          >
            {selectedCategory}
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh videos"
            className="shrink-0 rounded-full p-2 text-[#14181c] transition hover:bg-[#efefea] disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main
        ref={containerRef}
        className="mx-auto w-full max-w-3xl min-w-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8"
      >
        {fleex.length === 0 && !loading ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#efefea]">
              <Flame className="h-8 w-8 text-[#7d8387]" />
            </div>
            <h2 className="mb-2 text-xl font-semibold tracking-[-0.03em]">No videos found</h2>
            <p className="mb-6 text-sm text-[#7d8387]">Try a different category.</p>
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="rounded-full bg-[#1f2326] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              Change category
            </button>
          </div>
        ) : (
          fleex.map((item, index) => (
            <article
              key={item.id}
              className="mb-8 w-full min-w-0 overflow-hidden rounded-[28px] border border-[#deded9] bg-[#fbfaf6] text-[#14181c] shadow-[0_14px_35px_rgba(31,35,38,0.08)]"
            >
              <div className="relative aspect-[9/14] w-full overflow-hidden bg-[#1f2326] sm:aspect-[9/13]">
                <video
                  ref={(element) => {
                    videoRefs.current[index] = element
                  }}
                  src={item.video_url}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted={isMuted}
                  playsInline
                  poster={item.thumbnail_url}
                  onEnded={() => handleVideoEnded(index)}
                  preload="metadata"
                />

                {index === currentIndex && videoRefs.current[currentIndex]?.readyState < 2 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

                {item.view_count > 50000 && (
                  <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#14181c] shadow-sm">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Trending
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsMuted((muted) => !muted)}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  className="absolute right-4 top-4 z-10 rounded-full bg-black/55 p-2.5 text-white backdrop-blur-md transition hover:bg-black/75 active:scale-95"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>

                <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Watch
                </div>
              </div>

              <div className="px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1f2326] text-[#b7f23a]">
                    {item.avatar_url ? (
                      <Image
                        src={item.avatar_url}
                        alt={item.display_name || 'Creator'}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-[1.05rem] font-semibold tracking-[-0.02em]">
                        {item.display_name || 'Creator'}
                      </p>
                      {item.is_official && <Crown className="h-4 w-4 shrink-0 text-[#9ac500]" aria-label="Official creator" />}
                      {item.is_verified && !item.is_official && <Verified className="h-4 w-4 shrink-0 text-[#7d8387]" aria-label="Verified creator" />}
                    </div>
                    <p className="text-sm text-[#7d8387]">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <button type="button" aria-label="More creator options" className="shrink-0 rounded-full p-2 text-[#7d8387] transition hover:bg-[#efefea]">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                {item.caption && (
                  <p className="mt-4 line-clamp-3 break-words text-base leading-relaxed tracking-[-0.01em]">
                    {item.caption}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2 text-sm text-[#7d8387]">
                  <Music className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.music_name || 'Original Sound'}</span>
                  {item.music_artist && <span className="truncate">· {item.music_artist}</span>}
                </div>

                <div className="mt-5 flex min-w-0 items-center border-t border-[#d9d9d4] pt-4">
                  <VideoActionButton
                    active={likedFleex.has(item.id)}
                    label="Appreciate this video"
                    onClick={() => toggleLike(item.id)}
                  >
                    <Heart className="h-6 w-6" fill={likedFleex.has(item.id) ? 'currentColor' : 'none'} />
                    <span className="min-w-0 truncate">Appreciate</span>
                  </VideoActionButton>

                  <VideoActionButton
                    label="Comment on this video"
                    onClick={() => {
                      setCurrentIndex(index)
                      setShowComments(true)
                      fetchComments(item.id)
                    }}
                  >
                    <MessageCircle className="h-6 w-6" />
                    <span className="min-w-0 truncate">Comment</span>
                  </VideoActionButton>

                  <VideoActionButton
                    active={savedFleex.has(item.id)}
                    label="Save this video"
                    onClick={() => toggleSave(item.id)}
                  >
                    <Bookmark className="h-6 w-6" fill={savedFleex.has(item.id) ? 'currentColor' : 'none'} />
                    <span className="min-w-0 truncate">Save</span>
                  </VideoActionButton>

                  <VideoActionButton label="Share this video" onClick={() => shareVideo(item)}>
                    {shareCopied === item.id ? <Check className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
                    <span className="min-w-0 truncate">{shareCopied === item.id ? 'Copied' : 'Share'}</span>
                  </VideoActionButton>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-[#7d8387]">
                  <span>{formatNumber(item.view_count)} views</span>
                  <span aria-hidden="true">•</span>
                  <span>{formatNumber(item.like_count)} appreciates</span>
                  <span aria-hidden="true">•</span>
                  <span>{formatNumber(item.comment_count)} comments</span>
                </div>
              </div>
            </article>
          ))
        )}

        {hasMore && !loading && fleex.length > 0 && (
          <div ref={observerTarget} className="flex h-20 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-[#7d8387]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d9d9d4] border-t-[#1f2326]" />
              <span>Loading more...</span>
            </div>
          </div>
        )}
      </main>

      {showComments && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowComments(false)}>
          <div className="absolute inset-0 bg-black/35" />
          <div
            className="relative max-h-[80vh] w-full overflow-y-auto rounded-t-[28px] border-t border-[#deded9] bg-white text-[#14181c] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[#e5e5e0] bg-white px-5 py-4 sm:px-7">
              <div>
                <h3 className="font-semibold tracking-[-0.02em]">Comments</h3>
                <p className="mt-0.5 text-xs text-[#7d8387]">Join the conversation</p>
              </div>
              <button type="button" onClick={() => setShowComments(false)} aria-label="Close comments" className="rounded-full p-2 text-[#7d8387] transition hover:bg-[#efefea]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[58vh] space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
              {comments.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageCircle className="mx-auto mb-3 h-10 w-10 text-[#d9d9d4]" />
                  <p className="text-sm text-[#7d8387]">No comments yet.</p>
                  <p className="mt-1 text-xs text-[#a0a4a6]">Be the first to comment.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1f2326] text-[#b7f23a]">
                      {comment.profiles?.avatar_url ? (
                        <Image src={comment.profiles.avatar_url} alt="" width={36} height={36} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{comment.profiles?.display_name || 'User'}</p>
                      <p className="mt-0.5 break-words text-sm text-[#535a5e]">{comment.comment}</p>
                      <p className="mt-1 text-xs text-[#a0a4a6]">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sticky bottom-0 border-t border-[#e5e5e0] bg-white px-5 py-4 sm:px-7">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addComment()
                  }}
                  placeholder="Add a comment..."
                  className="min-w-0 flex-1 rounded-full border border-[#d9d9d4] bg-[#fbfaf6] px-4 py-2.5 text-sm text-[#14181c] outline-none placeholder:text-[#a0a4a6] focus:border-[#1f2326]"
                />
                <button
                  type="button"
                  onClick={addComment}
                  disabled={!commentText.trim()}
                  className="shrink-0 rounded-full bg-[#1f2326] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-40"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VideoActionButton({
  active = false,
  label,
  onClick,
  children,
}: {
  active?: boolean
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden border-r border-[#d9d9d4] px-1 text-[0.78rem] font-semibold transition-colors last:border-r-0 sm:text-[0.95rem] ${
        active ? 'text-[#9ac500]' : 'text-[#14181c] hover:bg-[#efefea]'
      }`}
    >
      {children}
    </button>
  )
}
