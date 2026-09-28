'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, 
  Check, ThumbsUp, MapPin, Flag, Bookmark,
  Edit2, Trash2, Volume2, VolumeX
} from 'lucide-react'
import { timeAgo } from '@/lib/dashboard/helpers'
import CommentDrawer from '@/components/dashboard/CommentDrawer'

interface FeedPost {
  id: string
  user_id: string
  content: string
  title?: string
  media_url?: string
  media_type?: 'image' | 'video'
  category?: string
  tags?: string[]
  feeling?: string
  feeling_emoji?: string
  location?: string
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  profiles?: {
    id: string
    username: string
    display_name: string
    avatar_url: string
  }
}

export default function FeedCard({
  post,
  isFollowing,
  isLiked,
  currentUserId,
  commentCount,
  onFollow,
  onLike,
  onComment,
  onShare,
  onTagClick,
}: {
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
}) {
  const supabase = createClient()
  const creator = post?.profiles || null
  const isOwner = currentUserId === post?.user_id
  const contentLength = post?.content?.length || 0
  const shouldTruncate = contentLength > 200
  const [showFullContent, setShowFullContent] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showCommentDrawer, setShowCommentDrawer] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [localCommentCount, setLocalCommentCount] = useState(commentCount || 0)
  const [localLikesCount, setLocalLikesCount] = useState(post?.likes_count || 0)
  const [localIsLiked, setLocalIsLiked] = useState(isLiked || false)
  const [currentUserAvatar, setCurrentUserAvatar] = useState('')
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState('')
  const [videoMuted, setVideoMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)

  const displayContent = shouldTruncate && !showFullContent 
    ? post?.content?.slice(0, 200) + '...' 
    : post?.content || ''

  // Sync like state with database on mount
  useEffect(() => {
    const syncLikeState = async () => {
      if (!post?.id || !currentUserId) return;
      
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
        .maybeSingle();
      
      if (!error) {
        const isActuallyLiked = !!data;
        if (isActuallyLiked !== localIsLiked) {
          setLocalIsLiked(isActuallyLiked);
        }
      }
    };
    
    syncLikeState();
  }, [post?.id, currentUserId]);

  // Fetch current user's info
  useEffect(() => {
    const getCurrentUserInfo = async () => {
      if (currentUserId) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('id', currentUserId)
          .single()
        if (data) {
          setCurrentUserAvatar(data.avatar_url || '')
          setCurrentUserDisplayName(data.display_name || 'User')
        }
      }
    }
    getCurrentUserInfo()
  }, [currentUserId, supabase])

  // Auto-play video
  useEffect(() => {
    if (post?.media_type === 'video' && videoRef.current && post?.media_url) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              videoRef.current?.play().catch(e => console.log('Video play error:', e))
            } else {
              videoRef.current?.pause()
            }
          })
        },
        { threshold: 0.3 }
      )
      observer.observe(videoRef.current)
      return () => observer.disconnect()
    }
  }, [post?.media_type, post?.media_url])

  // Handle share
  const handleSharePost = async () => {
    const shareUrl = `${window.location.origin}/post/${post?.id}`
    await navigator.clipboard.writeText(shareUrl)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
    
    if (post?.id) {
      await supabase
        .from('user_feeds')
        .update({ shares_count: (post.shares_count || 0) + 1 })
        .eq('id', post.id)
    }
    
    setShowShareMenu(false)
    onShare()
  }

  // Handle like with duplicate protection
  const handleLikeClick = async () => {
    if (!post?.id || !currentUserId) return;
    
    const newLikedState = !localIsLiked;
    
    try {
      if (newLikedState) {
        const { error } = await supabase
          .from('post_likes')
          .insert({ 
            post_id: post.id, 
            user_id: currentUserId 
          });
        
        if (error && error.code === '23505') {
          setLocalIsLiked(true);
          return;
        }
        
        if (error) throw error;
        
        await supabase
          .from('user_feeds')
          .update({ likes_count: localLikesCount + 1 })
          .eq('id', post.id);
          
        setLocalIsLiked(true);
        setLocalLikesCount(prev => prev + 1);
        
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
        
        if (error) throw error;
        
        await supabase
          .from('user_feeds')
          .update({ likes_count: localLikesCount - 1 })
          .eq('id', post.id);
          
        setLocalIsLiked(false);
        setLocalLikesCount(prev => prev - 1);
      }
      
      onLike();
      
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Handle delete post
  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return
    if (!post?.id) return
    
    const { error } = await supabase
      .from('user_feeds')
      .delete()
      .eq('id', post.id)
    
    if (!error) {
      window.location.reload()
    }
  }

  // Toggle video mute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !videoMuted
      setVideoMuted(!videoMuted)
    }
  }

  // Close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.transform = 'scale(0.98)'
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.transform = 'scale(1)'
  }

  const tags = post?.tags || []

  const handleCommentAdded = () => {
    setLocalCommentCount(prev => prev + 1)
  }

  if (!post) return null

  return (
    <>
      <article className="bg-white rounded-3xl border border-gray-200 shadow-sm mb-4 w-full max-w-2xl mx-auto overflow-hidden">
        
        {/* Header */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <Link href={`/profile/${creator?.username || '#'}`}>
              <div className="relative flex-shrink-0">
                {creator?.avatar_url ? (
                  <Image 
                    src={creator.avatar_url} 
                    alt="" 
                    width={40} 
                    height={40} 
                    className="rounded-full object-cover cursor-pointer hover:opacity-90 transition" 
                    unoptimized 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold">
                    {creator?.display_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </Link>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                <Link href={`/profile/${creator?.username || '#'}`}>
                  <p className="font-extrabold text-black hover:underline text-sm truncate">
                    {creator?.display_name || 'User'}
                  </p>
                </Link>
                
                {post.feeling && (
                  <span className="text-xs text-gray-500 inline-flex items-center gap-0.5">
                    <span>is feeling</span>
                    <span className="font-medium text-gray-700">{post.feeling}</span>
                    <span>{post.feeling_emoji || '😊'}</span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <span>{timeAgo(post.created_at)}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{post.location}</span>
                  </>
                )}
                <span>•</span>
                <span>🌐</span>
              </div>
            </div>
            
            {/* Menu Button */}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-gray-100 transition active:scale-95"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
                  {isOwner ? (
                    <>
                      <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        <Edit2 className="h-4 w-4" />
                        Edit Post
                      </button>
                      <button 
                        onClick={handleDeletePost}
                        className="w-full px-4 py-2.5 text-left text-sm text-black font-semibold hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Post
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        <Bookmark className="h-4 w-4" />
                        Save Post
                      </button>
                      <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        <Flag className="h-4 w-4" />
                        Report
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 mb-4">
          {post.title && (
            <h3 className="text-xl font-extrabold text-black mb-2 leading-snug">{post.title}</h3>
          )}
          <p className="text-gray-900 text-[15px] leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-sm text-gray-500 hover:text-black font-bold mt-1"
            >
              {showFullContent ? 'See less' : 'See more'}
            </button>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="px-5 mb-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className="text-xs font-bold text-black hover:underline transition"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Media */}
        {post.media_url && (
          <div className="mb-2 bg-gray-100">
            {post.media_type === 'image' ? (
              <img
                src={post.media_url}
                alt="Post"
                className="w-full max-h-[600px] min-h-[280px] object-contain cursor-pointer"
                onClick={() => window.open(post.media_url, '_blank')}
              />
            ) : post.media_type === 'video' ? (
              <div className="relative w-full max-h-[600px] min-h-[280px] flex items-center justify-center bg-gray-100">
                <video
                  ref={videoRef}
                  src={post.media_url}
                  className="w-full max-h-[600px] object-contain"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <button
                  onClick={toggleMute}
                  className="absolute bottom-3 right-3 p-2 bg-black rounded-full text-white hover:bg-gray-800 transition"
                >
                  {videoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Stats */}
        <div className="px-5 py-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <ThumbsUp className="h-3 w-3 fill-black text-black" />
              <Heart className="h-3 w-3 fill-black text-black -ml-1" />
            </div>
            <span>{localLikesCount}</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCommentDrawer(true)}
              className="hover:text-black transition"
            >
              {localCommentCount} comments
            </button>
            <button 
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="hover:text-black transition"
            >
              {post.shares_count || 0} shares
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-around px-2 py-1.5 border-t border-gray-200">
          <button
            onClick={handleLikeClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition active:scale-95 ${
              localIsLiked ? 'text-black bg-gray-100' : 'text-gray-700 hover:bg-gray-100'
            }`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {localIsLiked ? (
              <ThumbsUp className="h-5 w-5 fill-black" />
            ) : (
              <ThumbsUp className="h-5 w-5" />
            )}
            <span>Like</span>
          </button>

          <button
            onClick={() => setShowCommentDrawer(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition active:scale-95"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <MessageCircle className="h-5 w-5" />
            Comment
          </button>

          <div className="relative flex-1" ref={shareRef}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition active:scale-95"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Share2 className="h-5 w-5" />
              Share
            </button>
            {showShareMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
                <button
                  onClick={handleSharePost}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  {shareCopied ? (
                    <Check className="h-4 w-4 text-black" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {shareCopied ? 'Copied!' : 'Copy link'}
                </button>
                <button className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  Share to Feed
                </button>
                <button className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  Share to Messenger
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Comment Drawer */}
      <CommentDrawer
        isOpen={showCommentDrawer}
        onClose={() => setShowCommentDrawer(false)}
        postId={post.id}
        postType="feed"
        currentUserId={currentUserId}
        onCommentAdded={handleCommentAdded}
      />
    </>
  )
}
