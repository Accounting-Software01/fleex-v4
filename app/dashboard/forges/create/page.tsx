'use client'
import { Suspense, useState } from 'react'
import Image from 'next/image'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  FilePenLine,
  Image as ImageIcon,
  ShoppingBag,
  HeartHandshake,
  Gamepad2,
  Info,
  Check,
  Home,
  Search,
  Clapperboard,
  MessageCircle,
  User,
} from 'lucide-react'
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
  subtitle: string
  Icon: typeof Briefcase
  bg: string
  iconColor: string
}> = [
  { key: 'portfolio', name: 'Portfolio', subtitle: 'Show your work', Icon: Briefcase, bg: 'bg-[#eaf7c0]', iconColor: 'text-[#121518]' },
  { key: 'blog', name: 'Blog', subtitle: 'Publish stories', Icon: FilePenLine, bg: 'bg-[#eceff1]', iconColor: 'text-[#121518]' },
  { key: 'gallery', name: 'Gallery', subtitle: 'Share your visuals', Icon: ImageIcon, bg: 'bg-[#dde7ff]', iconColor: 'text-[#121518]' },
  { key: 'shop', name: 'Shop', subtitle: 'Sell products', Icon: ShoppingBag, bg: 'bg-[#dff3e3]', iconColor: 'text-[#121518]' },
  { key: 'donation', name: 'Fundraiser', subtitle: 'Collect support', Icon: HeartHandshake, bg: 'bg-[#ffe1dc]', iconColor: 'text-[#121518]' },
  { key: 'game', name: 'Mini-game', subtitle: 'Build a game', Icon: Gamepad2, bg: 'bg-[#e6ddff]', iconColor: 'text-[#121518]' },
  { key: 'custom', name: 'Custom', subtitle: 'Code your own', Icon: FilePenLine, bg: 'bg-[#e2e8ed]', iconColor: 'text-[#121518]' },
]

function ForgeTemplateSelectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlSelected = searchParams.get('template') as ForgeTemplate | null
  const [selected, setSelected] = useState<ForgeTemplate | null>(urlSelected)
  const [submitting, setSubmitting] = useState(false)

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

  const handleContinue = () => {
    if (!selected) return
    router.push(`/dashboard/forges/create?template=${selected}`)
  }

  if (urlSelected && templates.some((t) => t.key === urlSelected)) {
    const props: ForgeFormProps = {
      onBack: () => router.push('/dashboard/forges/create'),
      onSubmit,
      submitting,
    }
    switch (urlSelected) {
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
      className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-white text-[#121518] antialiased"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Top bar: back arrow + wordmark + skip */}
      <div className="flex h-16 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full text-[#121518] transition active:scale-95 active:bg-[#f1f3ef]"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={2.1} />
          </button>
          <Image
            src="/pull-wordmark.png"
            alt="Pull"
            width={100}
            height={32}
            priority
            className="h-7 w-auto"
          />
        </div>
        <button
          type="button"
          className="px-3 text-[14px] font-medium text-[#7b8286] transition active:opacity-60"
        >
          Skip for now
        </button>
      </div>

      {/* Heading */}
      <div className="px-5 pt-4">
        <h1 className="text-[34px] font-black leading-[1.02] tracking-[-0.045em] text-[#121518]">
          What do you want to create?
        </h1>
        <p className="mt-3 text-[15px] leading-[1.45] text-[#7b8286]">
          Choose a starting point. You can change it anytime.
        </p>
      </div>

      {/* Template grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 px-4 pb-6">
        {templates.map((t) => {
          const isSelected = selected === t.key
          const { Icon } = t
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSelected(t.key)}
              className={`relative flex aspect-[1/0.95] flex-col items-start justify-between rounded-2xl border bg-white p-4 text-left transition active:scale-[0.985] ${
                isSelected ? 'border-[#b7f23a] ring-2 ring-[#b7f23a]/25' : 'border-[#eceff0]'
              }`}
            >
              {/* Icon badge */}
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${t.bg}`}>
                <Icon className={`h-5 w-5 ${t.iconColor}`} strokeWidth={2} />
              </div>

              {/* Text */}
              <div className="w-full">
                <h2 className="text-[17px] font-bold leading-[1.15] tracking-[-0.01em] text-[#121518]">
                  {t.name}
                </h2>
                <p className="mt-1 text-[13px] leading-[1.3] text-[#7b8286]">
                  {t.subtitle}
                </p>
              </div>

              {/* Arrow / Check */}
              {isSelected ? (
                <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#b7f23a]">
                  <Check className="h-3.5 w-3.5 text-[#121518]" strokeWidth={3} />
                </span>
              ) : (
                <ArrowRight
                  className="absolute bottom-3.5 right-3.5 h-4 w-4 text-[#121518]"
                  strokeWidth={2.4}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Info note */}
      <div className="mx-4 mb-4 flex items-start gap-2 rounded-2xl bg-[#f6f8f4] px-3.5 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#7b8286]" strokeWidth={2} />
        <p className="text-[13px] leading-[1.4] text-[#7b8286]">
          Your choice won't limit what you can do on Pull.
        </p>
      </div>

      {/* Continue button */}
      <div
        className="px-4 pb-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected}
          className={`h-14 w-full rounded-2xl text-[16px] font-bold transition active:scale-[0.99] ${
            selected
              ? 'bg-[#b7f23a] text-[#121518] shadow-[0_4px_14px_rgba(183,242,58,0.35)]'
              : 'bg-[#eef2ea] text-[#a9b2a0]'
          }`}
        >
          Continue
        </button>
      </div>

      {/* Bottom nav */}
      <nav
        className="sticky bottom-0 mt-1 flex items-center justify-around border-t border-[#eef1ed] bg-white/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <NavItem icon={Home} label="Feed" active />
        <NavItem icon={Search} label="Discover" />
        <NavItem icon={Clapperboard} label="Clips" />
        <NavItem icon={MessageCircle} label="Messages" dot />
        <NavItem icon={User} label="Profile" />
      </nav>
    </main>
  )
}

function NavItem({
  icon: Icon,
  label,
  active,
  dot,
}: {
  icon: typeof Home
  label: string
  active?: boolean
  dot?: boolean
}) {
  return (
    <button
      type="button"
      className="relative flex flex-1 flex-col items-center gap-1 py-2.5"
    >
      <div className="relative">
        <Icon
          className={`h-6 w-6 ${active ? 'text-[#121518]' : 'text-[#98a0a6]'}`}
          strokeWidth={active ? 2.4 : 1.9}
        />
        {dot && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#b7f23a]" />
        )}
      </div>
      <span
        className={`text-[11px] ${
          active ? 'font-semibold text-[#121518]' : 'font-medium text-[#98a0a6]'
        }`}
      >
        {label}
      </span>
      {active && (
        <span className="absolute bottom-0 h-[2px] w-8 rounded-full bg-[#b7f23a]" />
      )}
    </button>
  )
}

export default function ForgeTemplateSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-white" />}>
      <ForgeTemplateSelectionContent />
    </Suspense>
  )
                  }
