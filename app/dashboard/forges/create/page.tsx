'use client'
import { Suspense, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Sparkles, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { BlogForgeForm } from '@/components/forges/create/BlogForgeForm'
import { CustomForgeForm } from '@/components/forges/create/CustomForgeForm'
import { DonationForgeForm } from '@/components/forges/create/DonationForgeForm'
import { GalleryForgeForm } from '@/components/forges/create/GalleryForgeForm'
import { GameForgeForm } from '@/components/forges/create/GameForgeForm'
import { PortfolioForgeForm } from '@/components/forges/create/PortfolioForgeForm'
import { ShopForgeForm } from '@/components/forges/create/ShopForgeForm'
import type { ForgeDraft, ForgeFormProps } from '@/components/forges/create/types'
import type { ForgeTemplate } from '@/lib/forge-templates'

const templates: Array<{
  key: ForgeTemplate
  name: string
  description: string
  image: string
  accent: string       // NEW: per-template accent for visual rhythm
  badge?: string       // NEW: e.g. "Popular"
}> = [
  { key: 'portfolio', name: 'Portfolio', description: 'Showcase your work and projects.', image: '/portfolio-3d.png', accent: 'from-[#e8f7b8] to-[#d4f088]', badge: 'Popular' },
  { key: 'blog', name: 'Blog', description: 'Write and share articles.', image: '/blog-3d.png', accent: 'from-[#d9ecff] to-[#b8daf7]' },
  { key: 'gallery', name: 'Gallery', description: 'Display images and artwork.', image: '/gallery-3d.png', accent: 'from-[#ffe8d9] to-[#ffc9b8]' },
  { key: 'shop', name: 'Shop', description: 'Sell products and services.', image: '/shop-3d.png', accent: 'from-[#e8e0ff] to-[#cfc4f7]' },
  { key: 'donation', name: 'Donation', description: 'Collect donations or tips.', image: '/donation-3d.png', accent: 'from-[#ffe0ec] to-[#f8bfd4]' },
  { key: 'game', name: 'Game', description: 'Create mini-games.', image: '/game-3d.png', accent: 'from-[#d9f5f0] to-[#b3e8de]' },
  { key: 'custom', name: 'Custom', description: 'Code your own forge.', image: '/custom-3d.png', accent: 'from-[#e2e8ed] to-[#c9d3db]' },
]

function ForgeTemplateSelectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selected = searchParams.get('template') as ForgeTemplate | null
  const [selecting, setSelecting] = useState<ForgeTemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.description.toLowerCase().includes(query.toLowerCase())
  )

  const selectTemplate = (template: ForgeTemplate) => {
    setSelecting(template)
    router.push(`/dashboard/forges/create?template=${template}`)
  }

  const onSubmit = async (draft: ForgeDraft) => {
    if (!draft.name.trim()) throw new Error('A name is required')
    if (draft.sourceMode === 'link' && !draft.sourceUrl?.trim()) throw new Error('Add the public project link')
    if (draft.sourceMode === 'zip' && !draft.zipFile) throw new Error('Choose a ZIP file first')
    setSubmitting(true)
    try {
      const response = await fetch('/api/forges', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft.name, description: draft.description, template_type: draft.template_type, config: draft.config, source_mode: draft.sourceMode, source_url: draft.sourceUrl || null, is_collaborative: false, is_public_preview: false }),
      })
      const created = await response.json()
      if (!response.ok) throw new Error(created.error || 'Could not create Forge')
      if (draft.sourceMode === 'zip' && draft.zipFile) {
        const formData = new FormData(); formData.append('file', draft.zipFile); formData.append('forgeId', created.id)
        const uploadResponse = await fetch('/api/forges/upload', { method: 'POST', body: formData })
        if (!uploadResponse.ok) throw new Error('Forge created, but ZIP upload failed')
      }
      window.location.assign(`/dashboard/forges/${created.id}/edit`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create Forge')
    } finally { setSubmitting(false) }
  }

  if (selected && templates.some((template) => template.key === selected)) {
    const props: ForgeFormProps = { onBack: () => router.push('/dashboard/forges/create'), onSubmit, submitting }
    switch (selected) {
      case 'portfolio': return <PortfolioForgeForm {...props} />
      case 'blog': return <BlogForgeForm {...props} />
      case 'gallery': return <GalleryForgeForm {...props} />
      case 'shop': return <ShopForgeForm {...props} />
      case 'donation': return <DonationForgeForm {...props} />
      case 'game': return <GameForgeForm {...props} />
      case 'custom': return <CustomForgeForm {...props} />
    }
  }

  return (
    <main className="relative min-h-[100dvh] bg-[#fbfcfa] text-[#121518] antialiased">
      {/* Sticky mobile-native top bar */}
      <header
        className="sticky top-0 z-30 border-b border-[#eef1ed]/80 bg-[#fbfcfa]/90 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex h-14 items-center justify-between px-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="grid h-11 w-11 place-items-center rounded-full text-[#121518] transition active:scale-95 active:bg-[#eef2ea]"
          >
            <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2.1} />
          </button>
          <div className="text-[15px] font-semibold tracking-[-0.01em]">Create</div>
          <div className="h-11 w-11" aria-hidden />
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 pt-6 pb-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 top-0 h-36 w-44 rotate-[-25deg] rounded-[45%] bg-[#f2fbd5] opacity-70 blur-[1px]"
        />
        <Sparkles
          aria-hidden
          className="pointer-events-none absolute right-8 top-10 h-7 w-7 rotate-12 fill-[#b7f23a] text-[#8dce00]"
          strokeWidth={1.5}
        />

        <div className="relative">
          <div className="text-[34px] font-black leading-none tracking-[-0.075em]">
            pull<span className="text-[#b7f23a]">.</span>
          </div>
          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.28em] text-[#85ad00]">
            Template Studio
          </p>
          <h1 className="mt-2 text-[34px] font-black leading-[0.98] tracking-[-0.06em]">
            Select a template
          </h1>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-[1.5] text-[#697278]">
            Pick a starting point. You can customize everything later.
          </p>
        </div>

        {/* Search */}
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#98a0a6]" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode="search"
            placeholder="Search templates"
            className="h-12 w-full rounded-2xl border border-[#e7ebe6] bg-white pl-11 pr-4 text-[16px] text-[#121518] placeholder:text-[#98a0a6] shadow-[0_2px_8px_rgba(28,42,29,0.04)] outline-none transition focus:border-[#b7f23a] focus:ring-4 focus:ring-[#b7f23a]/25"
          />
        </div>
      </section>

      {/* Template list — native mobile stacked cards */}
      <section className="px-4 pb-28">
        <ul className="flex flex-col gap-3">
          {filtered.map((template) => {
            const isSelecting = selecting === template.key
            const disabled = Boolean(selecting)
            return (
              <li key={template.key}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => selectTemplate(template.key)}
                  className={`group relative flex w-full items-center gap-4 rounded-[20px] border border-[#e7ebe6] bg-white p-3 pr-4 text-left shadow-[0_2px_10px_rgba(28,42,29,0.05)] transition active:scale-[0.985] active:bg-[#fafcf8] disabled:opacity-60 ${isSelecting ? 'ring-2 ring-[#b7f23a]/50' : ''}`}
                >
                  {/* Thumbnail */}
                  <div className={`relative grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${template.accent}`}>
                    <Image
                      src={template.image}
                      alt=""
                      width={64}
                      height={64}
                      className="h-14 w-14 object-contain transition duration-300 group-hover:scale-105"
                      priority={template.key === 'portfolio' || template.key === 'blog'}
                    />
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-[17px] font-bold tracking-[-0.02em] text-[#121518]">
                        {template.name}
                      </h2>
                      {template.badge && (
                        <span className="shrink-0 rounded-full bg-[#efffc0] px-2 py-[2px] text-[10px] font-black uppercase tracking-[0.08em] text-[#5a7a00]">
                          {template.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[14px] leading-[1.35] text-[#6d767b]">
                      {template.description}
                    </p>
                  </div>

                  {/* Chevron */}
                  <span
                    aria-hidden
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f4f7f0] text-[#121518] transition group-active:bg-[#efffc0]"
                  >
                    {isSelecting ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#121518] border-t-transparent" />
                    ) : (
                      <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.4} />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-[15px] text-[#6d767b]">
              No templates match "{query}"
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

export default function ForgeTemplateSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#fbfcfa]" />}>
      <ForgeTemplateSelectionContent />
    </Suspense>
  )
                    }
