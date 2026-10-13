"use client"

import { ArrowLeft, Loader2 } from 'lucide-react'
import type { ForgeDraft, ForgeFormProps } from './types'

export function ForgeCreationShell({
  title,
  onBack,
  onSubmit,
  submitting,
  children,
  draft,
}: ForgeFormProps & {
  title: string
  eyebrow?: string
  description?: string
  children: React.ReactNode
  draft: ForgeDraft
}) {
  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Sticky native nav bar */}
      <div
        className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/85 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="relative flex h-12 items-center justify-center px-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="absolute left-2 grid h-9 w-9 place-items-center rounded-full text-gray-900 transition active:scale-95 active:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <h1 className="max-w-[60%] truncate text-[16px] font-semibold tracking-[-0.01em] text-gray-900">
            {title}
          </h1>
        </div>
      </div>

      {/* Form body */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmit(draft)
        }}
        className="mx-auto max-w-2xl px-5 pb-32 pt-2"
      >
        {children}

        {/* Sticky bottom CTA */}
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200/70 bg-white/90 px-5 pt-3 backdrop-blur-xl"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#14181c] text-[15px] font-semibold text-white transition active:scale-[0.985] disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Creating…' : `Create ${title}`}
          </button>
        </div>
      </form>
    </div>
  )
}

/* Native iOS-style grouped form input */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-500">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-[16px] leading-[1.4] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#b7f23a] focus:bg-white"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#b7f23a] focus:bg-white"
        />
      )}
      {hint && <p className="mt-1.5 text-[12px] leading-[1.4] text-gray-500">{hint}</p>}
    </div>
  )
}

/* Native section card — flat, no shadow, hairline border */
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-gray-200/80 bg-white p-5">
      {children}
    </section>
  )
}
