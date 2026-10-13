'use client'
import { Suspense, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight } from 'lucide-react'
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
  accent: string
}> = [
  { key: 'portfolio', name: 'Portfolio', description: 'Showcase your work and projects.', image: '/portfolio-3d.png', accent: 'bg-[#e8f7b8]' },
  { key: 'blog', name: 'Blog', description: 'Write and share articles.', image: '/blog-3d.png', accent: 'bg-[#d9ecff]' },
  { key: 'gallery', name: 'Gallery', description: 'Display images and artwork.', image: '/gallery-3d.png', accent: 'bg-[#ffe8d9]' },
  { key: 'shop', name: 'Shop', description: 'Sell products and services.', image: '/shop-3d.png', accent: 'bg-[#e8e0ff]' },
  { key: 'donation', name: 'Donation', description: 'Collect donations or tips.', image: '/donation-3d.png', accent: 'bg-[#ffe0ec]' },
  { key: 'game', name: 'Game', description: 'Create mini-games.', image: '/game-3d.png', accent: 'bg-[#d9f5f0]' },
  { key: 'custom', name: 'Custom', description: 'Code your own forge.', image: '/custom-3d.png', accent: 'bg-[#e2e8ed]' },
]

function ForgeTemplateSelectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selected = searchParams.get('template') as ForgeTemplate | null
  const [selecting, setSelecting] = useState<ForgeTemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description,
          template_type: draft.template_type,
          config: draft.config,
          source_mode: draft.sourceMode,
          source_url: draft.sourceUrl || null,
          is_collaborative: false,
          is_public_preview: false,
        }),
      })
      const created = await response.json()
      if (!response.ok) throw new Error(created.error || 'Could not create Forge')
      if (draft.sourceMode === 'zip' && draft.zipFile) {
        const formData = new FormData()
        formData.append('file', draft.zipFile)
        formData.append('forgeId', created.id)
        const uploadResponse = await fetch('/api/forges/upload', { method: 'POST', body: formData })
        if (!uploadResponse.ok) throw new Error('Forge created, but ZIP upload failed')
      }
      window.location.assign(`/dashboard/forges/${created.id}/edit`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create Forge')
    } finally {
      setSubmitting(false)
    }
  }

  if (selected && templates.some((template) => template.key === selected)) {
    const props: ForgeFormProps = {
      onBack: () => router.push('/dashboard/forges/create'),
      onSubmit,
      submitting,
    }
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
    <main
      className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#fbfcfa] text-[#121518] antialiased"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Top bar — arrow back only */}
      <div className="flex h-14 items-center px-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full text-[#121518] transition active:scale-95 active:bg-[#eef2ea]"
        >
          <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2.1} />
        </button>
      </div>

      {/* Header */}
      <div className="w-full px-5 pt-2">
        <Image
          src="/pull-wordmark.png"
          alt="Pull"
          width={120}
          height={40}
          priority
          className="h-8 w-auto"
        />
        <h1 className="mt-5 text-[30px] font-black leading-[1.05] tracking-[-0.04em]">
          Select a forge type
        </h1>
        <p className="mt-2 text-[15px] leading-[1.5] text-[#697278]">
          Pick a starting point. You can customize everything later.
        </p>
      </div>

      {/* Template list */}
      <ul className="mt-6 flex w-full flex-col gap-3 px-4 pb-10">
        {templates.map((template) => {
          const isSelecting = selecting === template.key
          const disabled = Boolean(selecting)
          return (
            <li key={template.key} className="w-full">
              <button
                type="button"
                disabled={disabled}
                onClick={() => selectTemplate(template.key)}
                className={`group flex w-full items-center gap-3.5 overflow-hidden rounded-[18px] border border-[#e7ebe6] bg-white p-3 text-left shadow-[0_2px_10px_rgba(28,42,29,0.05)] transition active:scale-[0.985] active:bg-[#fafcf8] disabled:opacity-60 ${
                  isSelecting ? 'ring-2 ring-[#b7f23a]/50' : ''
                }`}
              >
                {/* Thumbnail */}
                <div
                  className={`grid h-[60px] w-[60px] shrink-0 place-items-center overflow-hidden rounded-2xl ${template.accent}`}
                >
                  <Image
                    src={template.image}
                    alt=""
                    width={52}
                    height={52}
                    className="h-12 w-12 object-contain transition duration-300 group-hover:scale-105"
                    priority={template.key === 'portfolio' || template.key === 'blog'}
                  />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[16px] font-bold tracking-[-0.01em] text-[#121518]">
                    {template.name}
                  </h2>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-[1.35] text-[#6d767b]">
                    {template.description}
                  </p>
                </div>

                {/* Chevron */}
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f4f7f0] text-[#121518] transition group-active:bg-[#efffc0]"
                >
                  {isSelecting ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#121518] border-t-transparent" />
                  ) : (
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
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
