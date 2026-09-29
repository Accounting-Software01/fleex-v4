'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import AvatarCircle from '@/components/dashboard/shared/avatar-circle'

type SuggestedUser = {
  id: string
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
}

type SidebarProps = {
  suggestedUsers: SuggestedUser[]
  followingSet: Set<string>
  onFollow: (userId: string) => void
  savedCount?: number
}

export default function Sidebar({
  suggestedUsers,
  followingSet,
  onFollow,
  savedCount = 0,
}: SidebarProps) {
  return (
    <aside className="hidden w-full max-w-[310px] flex-col gap-4 lg:flex">
      {suggestedUsers.length > 0 && (
        <section className="relative overflow-hidden rounded-[26px] border border-[#deded9] bg-white shadow-[0_14px_40px_rgba(31,35,38,0.06)]">
          <div className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-[#efffc8] blur-2xl" />
          <div className="relative border-b border-[#efefea] px-5 pb-4 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1f2326] text-[#b7f23a]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8aae00]">For you</span>
                </div>
                <h3 className="text-base font-semibold tracking-[-0.03em] text-[#14181c]">Creators to discover</h3>
                <p className="mt-1 text-xs text-[#7d8387]">Fresh voices worth knowing.</p>
              </div>
              <Link href="/search" className="group inline-flex items-center gap-1 rounded-full border border-[#d9d9d4] px-3 py-1.5 text-[11px] font-semibold text-[#535a5e] transition hover:border-[#b7f23a] hover:bg-[#efffc8] hover:text-[#14181c]">
                See all
                <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          <div className="relative space-y-1 p-3">
            {suggestedUsers.slice(0, 5).map((user, index) => {
              const isFollowing = followingSet.has(user.id)
              const name = user.display_name || user.username || 'Fleex creator'

              return (
                <div key={user.id} className="group flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-[#fbfaf6]">
                  <Link href={`/profile/${user.username || user.id}`} className="relative shrink-0">
                    <div className="rounded-full p-0.5" style={{ background: index === 0 ? '#b7f23a' : '#e5e5e0' }}>
                      <div className="rounded-full bg-white p-0.5">
                        <AvatarCircle src={user.avatar_url} name={name} size={38} />
                      </div>
                    </div>
                    {index === 0 && <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#1f2326] text-[#b7f23a]"><Sparkles className="h-2 w-2" /></span>}
                  </Link>

                  <Link href={`/profile/${user.username || user.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#14181c] transition group-hover:text-[#8aae00]">{name}</p>
                    <p className="truncate text-[11px] text-[#7d8387]">@{user.username || 'creator'}</p>
                  </Link>

                  <button
                    type="button"
                    onClick={() => onFollow(user.id)}
                    aria-label={isFollowing ? `Following ${name}` : `Follow ${name}`}
                    className={`flex h-8 shrink-0 items-center justify-center rounded-full px-3 text-[11px] font-bold transition active:scale-95 ${isFollowing ? 'border border-[#d9d9d4] bg-white text-[#535a5e] hover:border-[#b7f23a]' : 'bg-[#1f2326] text-white hover:bg-black'}`}
                  >
                    {isFollowing ? <Check className="h-3.5 w-3.5 text-[#8aae00]" /> : 'Follow'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="rounded-[26px] border border-[#deded9] bg-[#fbfaf6] p-5 shadow-[0_14px_40px_rgba(31,35,38,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8aae00]">Your space</p>
            <h3 className="mt-1 text-base font-semibold tracking-[-0.03em] text-[#14181c]">Activity overview</h3>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#7d8387] shadow-sm"><Users className="h-4 w-4" /></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-[#e5e5e0] bg-white p-3">
            <p className="text-2xl font-semibold tracking-[-0.05em] text-[#14181c]">{followingSet.size}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#7d8387]"><Users className="h-3 w-3" />Following</div>
          </div>
          <div className="rounded-2xl border border-[#e5e5e0] bg-white p-3">
            <p className="text-2xl font-semibold tracking-[-0.05em] text-[#14181c]">{savedCount}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#7d8387]"><Bookmark className="h-3 w-3" />Saved</div>
          </div>
        </div>
      </section>

      <Link href="/spark" className="group relative overflow-hidden rounded-[26px] bg-[#1f2326] p-5 text-white shadow-[0_18px_44px_rgba(31,35,38,0.16)] transition hover:-translate-y-0.5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#b7f23a]/20 blur-2xl transition duration-500 group-hover:bg-[#b7f23a]/35" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-[#b7f23a]/10 blur-2xl" />
        <div className="relative">
          <div className="mb-7 flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b7f23a] text-[#14181c] shadow-[0_0_28px_rgba(183,242,58,0.28)]"><Zap className="h-5 w-5 fill-current" /></div>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#b7f23a]">Discover</span>
          </div>
          <h3 className="text-lg font-semibold tracking-[-0.04em]">Explore Spark</h3>
          <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-white/60">Find rising forges, sharp ideas, and creators shaping what comes next.</p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#b7f23a]">Browse Spark <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></div>
        </div>
      </Link>

      <footer className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 text-[10px] font-medium text-[#a0a4a6]">
        <span>© 2026 Fleex</span>
        <a href="#" className="transition hover:text-[#14181c]">Terms</a>
        <a href="#" className="transition hover:text-[#14181c]">Privacy</a>
        <span className="inline-flex items-center gap-1 text-[#8aae00]"><span className="h-1.5 w-1.5 rounded-full bg-[#b7f23a]" />Built for discovery</span>
      </footer>
    </aside>
  )
}
