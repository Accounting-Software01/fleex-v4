'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Share2, Check, ExternalLink, MoreHorizontal, Copy, Download, Eye, MessageCircle, X } from 'lucide-react'
import { timeAgo } from '@/lib/dashboard/helpers'
import { getArticleImage } from '@/lib/dashboard/image-helper'
import { createClient } from '@/lib/supabase/client'
import CommentDrawer from '@/components/dashboard/CommentDrawer'

interface NewsArticle {
  id: string
  title: string
  description?: string
  url: string
  urlToImage?: string | null
  source: { name: string }
  publishedAt: string
  caption?: string
  media_url?: string
}

export default function NewsCard({
  article,
  isLiked,
  commentCount,
  shareCopied,
  onLike,
  onComment,
  onShare,
  onReadInside,
}: {
  article: NewsArticle
  isLiked: boolean
  commentCount: number
  shareCopied: boolean
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onReadInside: () => void
}) {
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [showImageMenu, setShowImageMenu] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const [showCommentDrawer, setShowCommentDrawer] = useState(false)
  const [localCommentCount, setLocalCommentCount] = useState(commentCount || 0)
  
  // Long press menu state
  const [showLongPressMenu, setShowLongPressMenu] = useState(false)
  const [longPressPosition, setLongPressPosition] = useState({ x: 0, y: 0 })
  const [longPressDownloading, setLongPressDownloading] = useState(false)
  const [longPressCopied, setLongPressCopied] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  
  const menuRef = useRef<HTMLDivElement>(null)

  const title = article.caption || article.title || "Untitled"
  const sourceName = article.source?.name || "News Source"
  const originalImage = article.media_url || article.urlToImage

  // Only show a summary when it adds something beyond the headline
  const rawSummary = (article.description || '').replace(/\s+/g, ' ').trim()
  const titleKey = title.toLowerCase().slice(0, 30)
  const summary =
    rawSummary.length >= 60 && !rawSummary.toLowerCase().startsWith(titleKey)
      ? rawSummary
      : null

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getUser()
  }, [supabase])

  // Load image
  useEffect(() => {
    const loadImage = async () => {
      setImageLoading(true)
      const url = await getArticleImage(title, originalImage)
      setImageUrl(url)
      setImageLoading(false)
    }
    loadImage()
  }, [title, originalImage])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowImageMenu(false)
        setShowLongPressMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ========== LONG PRESS HANDLERS ==========
  
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setLongPressPosition({ x: touch.clientX, y: touch.clientY })
    
    longPressTimer.current = setTimeout(() => {
      setShowLongPressMenu(true)
    }, 500) // 500ms long press
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setLongPressPosition({ x: e.clientX, y: e.clientY })
    
    longPressTimer.current = setTimeout(() => {
      setShowLongPressMenu(true)
    }, 500)
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // Download image via long press
  const handleLongPressDownload = async () => {
    if (!imageUrl || imageUrl.startsWith('data:')) return
    
    setLongPressDownloading(true)
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `news-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setShowLongPressMenu(false)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setLongPressDownloading(false)
    }
  }

  // Copy image via long press
  const handleLongPressCopy = async () => {
    if (!imageUrl || imageUrl.startsWith('data:')) return
    
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
      setLongPressCopied(true)
      setTimeout(() => setLongPressCopied(false), 2000)
      setTimeout(() => setShowLongPressMenu(false), 500)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  // Share image via long press
  const handleLongPressShare = async () => {
    if (!imageUrl || imageUrl.startsWith('data:')) return
    
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], `news-${Date.now()}.jpg`, { type: blob.type })
      
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: 'Check out this news image',
          files: [file]
        })
      } else {
        // Fallback: copy link
        await navigator.clipboard.writeText(imageUrl)
        setLongPressCopied(true)
        setTimeout(() => setLongPressCopied(false), 2000)
      }
      setShowLongPressMenu(false)
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  // Copy image to clipboard (existing three-dots menu)
  const handleCopyImage = async () => {
    if (imageUrl && !imageUrl.startsWith('data:')) {
      try {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ])
        setCopiedImage(true)
        setTimeout(() => setCopiedImage(false), 2000)
        setShowImageMenu(false)
      } catch (error) {
        console.error('Failed to copy image:', error)
      }
    }
  }

  // Download image (existing three-dots menu)
  const handleDownloadImage = () => {
    if (imageUrl && !imageUrl.startsWith('data:')) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `news-${Date.now()}.jpg`
      link.click()
      setShowImageMenu(false)
    }
  }

  const handleCommentAdded = () => {
    setLocalCommentCount(prev => prev + 1)
  }

  return (
    <>
      <article className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md w-full group">
        {/* Top Section: Large Image with Long Press Support */}
        <div 
          ref={imageContainerRef}
          className="relative w-full h-80 xs:h-96 sm:h-[28rem] bg-gray-100"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => {
            e.preventDefault()
            handleLongPressDownload()
          }}
        >
          {imageLoading ? (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          ) : imageUrl ? (
            imageUrl.startsWith('data:') ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={onReadInside}
              />
            ) : (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover cursor-pointer"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"
                priority
                unoptimized
                onClick={onReadInside}
              />
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer" onClick={onReadInside}>
              <div className="text-center">
                <div className="text-4xl mb-2">📰</div>
                <p className="text-gray-500 text-sm">News image</p>
              </div>
            </div>
          )}
          
          {/* Long Press Hint (appears briefly) */}
          {showLongPressMenu && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
              <div className="bg-white rounded-xl shadow-xl p-2 animate-pulse">
                <p className="text-xs text-gray-500">Release to save</p>
              </div>
            </div>
          )}
          
          {/* Three dots menu on image */}
          {imageUrl && !imageLoading && (
            <div className="absolute top-3 right-3" ref={menuRef}>
              <button
                onClick={() => setShowImageMenu(!showImageMenu)}
                className="bg-black p-2 rounded-full transition-colors hover:bg-gray-800"
              >
                <MoreHorizontal className="h-4 w-4 text-white" />
              </button>
              
              {showImageMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20 animate-fade-in">
                  <button
                    onClick={handleCopyImage}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                  >
                    {copiedImage ? <Check className="h-3.5 w-3.5 text-black" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedImage ? 'Copied!' : 'Copy image'}
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Save image
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Source Badge Overlay */}
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-extrabold text-white bg-black px-3 py-1.5 rounded-full uppercase tracking-wider">
              {sourceName}
            </span>
          </div>

          {/* Read in app overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={onReadInside}
              className="bg-white text-black px-4 py-2 rounded-full text-sm font-extrabold flex items-center gap-2 transform scale-95 group-hover:scale-100 transition"
            >
              <Eye className="h-4 w-4" />
              Read in app
            </button>
          </div>
        </div>

        {/* Bottom Section: Text & Actions */}
        <div className="p-5">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-2">
              <span className="uppercase tracking-wide text-black font-extrabold truncate max-w-[60%]">{sourceName}</span>
              <span>·</span>
              <span>{timeAgo(article.publishedAt || (article as any).created_at)} ago</span>
            </div>

            <button onClick={onReadInside} className="w-full text-left">
              <h3 className="text-lg font-extrabold text-black leading-snug line-clamp-3 hover:underline underline-offset-2">
                {title}
              </h3>
            </button>

            {summary && (
              <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">
                {summary}
              </p>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1 -ml-2">
              <button
                onClick={(e) => { e.preventDefault(); onLike(); }}
                aria-label="Like"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-black hover:bg-gray-100 active:scale-95 transition"
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-black' : ''}`} />
                <span className="text-[13px] font-bold">{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowCommentDrawer(true);
                }}
                aria-label="Comment"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-black hover:bg-gray-100 active:scale-95 transition"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-[13px] font-bold">{localCommentCount > 0 ? localCommentCount : 'Comment'}</span>
              </button>

              <button
                onClick={(e) => { e.preventDefault(); onShare(); }}
                aria-label="Share"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-black hover:bg-gray-100 active:scale-95 transition"
              >
                {shareCopied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                <span className="text-[13px] font-bold">{shareCopied ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            <button
              onClick={onReadInside}
              className="h-9 px-4 rounded-full bg-black text-white text-xs font-extrabold flex items-center gap-1.5 hover:bg-gray-800 active:scale-95 transition"
            >
              Read
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </article>

      {/* Long Press Context Menu */}
      {showLongPressMenu && imageUrl && !imageUrl.startsWith('data:') && (
        <div 
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in"
          style={{ 
            top: Math.min(longPressPosition.y, window.innerHeight - 200),
            left: Math.min(longPressPosition.x, window.innerWidth - 180),
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="py-1">
            <button
              onClick={handleLongPressDownload}
              disabled={longPressDownloading}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 min-w-[160px]"
            >
              <Download className="h-4 w-4" />
              {longPressDownloading ? 'Downloading...' : 'Save Image'}
            </button>
            
            <button
              onClick={handleLongPressCopy}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Copy className="h-4 w-4" />
              {longPressCopied ? 'Copied!' : 'Copy Image'}
            </button>
            
            {typeof navigator.share === 'function' && (
              <button
                onClick={handleLongPressShare}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            )}
            
            <div className="border-t border-gray-100 my-1" />
            
            <button
              onClick={() => setShowLongPressMenu(false)}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-3"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comment Drawer */}
      <CommentDrawer
        isOpen={showCommentDrawer}
        onClose={() => setShowCommentDrawer(false)}
        postId={article.id}
        postType="news"
        currentUserId={currentUserId || ''}
        onCommentAdded={handleCommentAdded}
      />

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.1s ease-out; }
      `}</style>
    </>
  )
}
