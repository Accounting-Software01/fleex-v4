'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthGate } from '@/contexts/AuthGateContext'
import {
  Search, Plus, X, ChevronRight, Settings, LogOut,
  User, Bookmark, CreditCard, HelpCircle, Shield, Gem,
} from 'lucide-react'

// Rendered once from the root layout, like MobileBottomNav — mounted for
// every route, but only actually shows its content on the dashboard.
export default function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { requireAuth } = useAuthGate()

  const [user, setUser] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  // Read directly off the URL via plain browser APIs, not next/navigation's
  // useSearchParams — that hook forces every route sharing this (global)
  // layout component into a Suspense-gated client bailout during static
  // generation, which broke prerendering on unrelated pages like
  // /dashboard/premium. window.location is just as accurate here since
  // this only ever matters on the client.
  const [activeTab, setActiveTabState] = useState<'forYou' | 'following'>('forYou')
  const profileRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const isGuest = !user

  useEffect(() => {
    if (pathname !== '/dashboard' || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setActiveTabState(params.get('tab') === 'following' ? 'following' : 'forYou')
  }, [pathname])

  const onTabChange = (tab: 'forYou' | 'following') => {
    if (tab === 'following' && !requireAuth(user, 'see posts from people you follow')) return
    setActiveTabState(tab)
    router.push(tab === 'following' ? '/dashboard?tab=following' : '/dashboard')
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Load profile for avatar
  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      return
    }
    supabase
      .from('profiles')
      .select('avatar_url, display_name, username, email')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }, [user?.id, supabase])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false)
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node) && showDrawer) setShowDrawer(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDrawer])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = showDrawer ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDrawer])

  // Only the dashboard has a header — everywhere else this renders nothing,
  // same as how MobileBottomNav only shows on its own set of pages.
  if (pathname !== '/dashboard') return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const drawerMenuItems = [
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: CreditCard, label: 'Subscription', href: '/dashboard/subscription', badge: 'Pro' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
    { icon: Gem, label: 'Premium Features', href: '/dashboard/premium' },
    { icon: Bookmark, label: 'Saved', href: '/dashboard/saved' },
    { icon: HelpCircle, label: 'Help & Support', href: '/dashboard/support' },
    { icon: Shield, label: 'Privacy & Security', href: '/dashboard/privacy' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-shadow duration-200 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 lg:h-16 gap-4">
            {/* Left – menu */}
            <button
              onClick={() => setShowDrawer(true)}
              className="flex-shrink-0 flex flex-col gap-1.5 p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
              aria-label="Open menu"
            >
              <div className="w-5 h-0.5 bg-black rounded-full" />
              <div className="w-5 h-0.5 bg-black rounded-full" />
              <div className="w-5 h-0.5 bg-black rounded-full" />
            </button>

            {/* Search – desktop only */}
            <div className="hidden lg:block flex-1 max-w-md">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 transition-colors ${searchFocused ? 'text-black' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent focus:border-black focus:outline-none transition text-sm placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Right – actions + X logo in the corner */}
            <div className="flex items-center gap-3">
              {isGuest ? (
                <Link
                  href="/auth/login"
                  className="hidden lg:flex items-center h-9 px-5 rounded-full text-xs font-extrabold bg-black text-white hover:bg-gray-800 transition"
                >
                  Log in
                </Link>
              ) : (
                <div className="hidden lg:flex items-center gap-3">
                  <Link
                    href="/create-fleex"
                    className="flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-extrabold bg-black text-white hover:bg-gray-800 active:scale-95 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create
                  </Link>

                  <div ref={profileRef} className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-black transition"
                    >
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="avatar" width={36} height={36} className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold text-sm">
                          {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </button>

                    {showProfileMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
                        <div className="p-3 border-b border-gray-100">
                          <p className="font-bold text-sm text-black">{profile?.display_name || 'User'}</p>
                          <p className="text-xs text-gray-500">@{profile?.username || 'username'}</p>
                        </div>
                        <div className="py-1">
                          <Link href={`/profile/${profile?.username}`} onClick={() => setShowProfileMenu(false)}>
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition">
                              <User className="h-4 w-4 text-gray-600" />
                              <span className="text-sm text-gray-800">Profile</span>
                            </div>
                          </Link>
                          <Link href="/settings" onClick={() => setShowProfileMenu(false)}>
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition">
                              <Settings className="h-4 w-4 text-gray-600" />
                              <span className="text-sm text-gray-800">Settings</span>
                            </div>
                          </Link>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition"
                          >
                            <LogOut className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-800">Log out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* X logo – right corner */}
              <Link href="/dashboard" aria-label="Home" className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/fleex-icon.png" alt="" className="h-8 w-8 object-contain" />
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center">
            {(['forYou', 'following'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`relative flex-1 lg:flex-none lg:px-6 py-3 text-sm font-extrabold transition-colors ${
                  activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab === 'forYou' ? 'For You' : 'Following'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-12 bg-black rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Drawer overlay */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowDrawer(false)} />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          showDrawer ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fleex-icon.png" alt="" className="h-9 w-9 object-contain" />
          <button
            onClick={() => setShowDrawer(false)}
            aria-label="Close menu"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-black" />
          </button>
        </div>

        {profile && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="avatar"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-semibold text-lg">
                  {profile?.display_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-black truncate">
                  {profile?.display_name || profile?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">@{profile?.username || 'username'}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2">
          {drawerMenuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setShowDrawer(false)}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-black" />
                <span className="text-black font-semibold">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="text-[10px] font-extrabold bg-black text-white px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4 space-y-3">
          {isGuest ? (
            <div className="flex flex-col gap-2">
              <Link
                href="/auth/sign-up"
                className="w-full h-11 rounded-full bg-black text-white text-sm font-extrabold flex items-center justify-center"
              >
                Create account
              </Link>
              <Link
                href="/auth/login"
                className="w-full h-11 rounded-full bg-gray-100 text-black text-sm font-extrabold flex items-center justify-center"
              >
                Log in
              </Link>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-5 w-5 text-black" />
              <span className="text-black font-semibold">Sign out</span>
            </button>
          )}
          <p className="text-[10px] text-gray-400 text-center pt-1">© 2026</p>
        </div>
      </div>
    </>
  )
}
