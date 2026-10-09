'use client'
import { Suspense, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
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
  wide?: boolean
}> = [
  { key: 'portfolio', name: 'Portfolio', description: 'Showcase your work and projects.', image: '/portfolio-3d.png' },
  { key: 'blog', name: 'Blog', description: 'Write and share articles.', image: '/blog-3d.png' },
  { key: 'gallery', name: 'Gallery', description: 'Display images and artwork.', image: '/gallery-3d.png' },
  { key: 'shop', name: 'Shop', description: 'Sell products and services.', image: '/shop-3d.png' },
  { key: 'donation', name: 'Donation', description: 'Collect donations or tips.', image: '/donation-3d.png' },
  { key: 'game', name: 'Game', description: 'Create mini-games.', image: '/game-3d.png' },
  { key: 'custom', name: 'Custom', description: 'Code your own forge.', image: '/custom-3d.png', wide: true },
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
    <main className="min-h-[100dvh] overflow-hidden bg-[#fbfcfa] text-[#121518]">
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-4 sm:px-8 sm:pt-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-[17px] font-medium text-[#1e2427] transition hover:bg-[#f0f4ec] focus:outline-none focus:ring-2 focus:ring-[#b7f23a]"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          Back
        </button>

        <div className="relative mt-5">
          <div className="pointer-events-none absolute -right-20 -top-12 h-44 w-52 rotate-[-28deg] rounded-[45%] bg-[#f2fbd5] opacity-80 blur-[1px] sm:-right-10" />
          <Sparkles className="pointer-events-none absolute right-10 top-28 h-9 w-9 rotate-12 fill-[#b7f23a] text-[#8dce00] sm:right-24" strokeWidth={1.5} />

          <div className="relative">
            <div className="text-[40px] font-black tracking-[-0.08em] text-[#111518] sm:text-[48px]">pull<span className="text-[#b7f23a]">.</span></div>
            <p className="mt-4 text-[12px] font-black uppercase tracking-[0.27em] text-[#85ad00]">Pull · Template Studio</p>
            <h1 className="mt-2 max-w-[620px] text-[41px] font-black leading-[0.96] tracking-[-0.075em] sm:text-[58px]">Select a Template</h1>
            <p className="mt-4 max-w-[650px] text-[17px] leading-[1.45] text-[#697278] sm:text-[20px]">Choose a template to get started. Each one is designed for a specific type of content.</p>
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3.5 sm:gap-5">
          {templates.map((template) => {
            const isSelecting = selecting === template.key
            return (
              <button
                key={template.key}
                type="button"
                disabled={Boolean(selecting)}
                onClick={() => selectTemplate(template.key)}
                className={`group relative min-h-[202px] overflow-hidden rounded-[22px] border border-[#e7ebe6] bg-white p-3 text-left shadow-[0_5px_18px_rgba(28,42,29,0.06)] transition active:scale-[0.985] hover:-translate-y-0.5 hover:shadow-[0_9px_25px_rgba(28,42,29,0.1)] focus:outline-none focus:ring-2 focus:ring-[#b7f23a] sm:min-h-[260px] sm:rounded-[28px] sm:p-5 ${template.wide ? 'col-span-2 min-h-[146px] sm:min-h-[174px]' : ''} ${isSelecting ? 'opacity-60' : ''}`}
              >
                <div className={`${template.wide ? 'flex items-center gap-4 sm:gap-8' : ''}`}>
                  <div className={`${template.wide ? 'h-[94px] w-[132px] shrink-0 sm:h-[118px] sm:w-[180px]' : 'h-[112px] w-full sm:h-[145px]'} relative`}>
                    <Image src={template.image} alt="" fill sizes={template.wide ? '(max-width: 640px) 132px, 180px' : '(max-width: 640px) 45vw, 300px'} className="object-contain object-center transition duration-300 group-hover:scale-105" priority={template.key === 'portfolio' || template.key === 'blog'} />
                  </div>
                  <div className={template.wide ? 'min-w-0 flex-1' : ''}>
                    <h2 className="text-[20px] font-black tracking-[-0.055em] sm:text-[25px]">{template.name}</h2>
                    <p className="mt-1 max-w-[230px] text-[13px] leading-[1.25] text-[#6d767b] sm:text-[16px]">{template.description}</p>
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-[#efffc0] text-[#121518] shadow-sm sm:bottom-5 sm:right-5 sm:h-11 sm:w-11" aria-hidden="true">
                  {isSelecting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#121518] border-t-transparent" /> : <ArrowRight className="h-5 w-5" strokeWidth={2.3} />}
                </span>
              </button>
            )
          })}
        </div>
      </div>
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
