"use client"

import { ArrowLeft, Loader2 } from 'lucide-react'
import type { ForgeDraft, ForgeFormProps } from './types'

export function ForgeCreationShell({ title, eyebrow, description, onBack, onSubmit, submitting, children, draft }: ForgeFormProps & { title: string; eyebrow: string; description: string; children: React.ReactNode; draft: ForgeDraft }) {
  return <div className="min-h-[100dvh] bg-[#f7f8f5]"><div className="mx-auto max-w-5xl px-4 py-5 pb-24 md:py-8">
    <button onClick={onBack} className="mb-5 flex items-center gap-1 text-sm font-semibold text-gray-600"><ArrowLeft className="h-4 w-4" />All Forge types</button>
    <header className="mb-6 rounded-3xl bg-[#14181c] p-5 text-white md:p-8"><p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#b7f23a]">{eyebrow}</p><h1 className="text-3xl font-black tracking-[-0.05em] md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{description}</p></header>
    <form onSubmit={e=>{e.preventDefault(); void onSubmit(draft)}} className="space-y-4">{children}<div className="sticky bottom-0 z-20 -mx-4 border-t border-gray-200 bg-white/95 p-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0"><button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14181c] px-5 py-3.5 font-bold text-white transition hover:bg-black disabled:opacity-50">{submitting && <Loader2 className="h-4 w-4 animate-spin" />} {submitting ? 'Creating Forge…' : `Create ${title}`}</button></div></form>
  </div></div>
}

export function TextField({label,value,onChange,placeholder,multiline=false}: {label:string;value:string;onChange:(v:string)=>void;placeholder?:string;multiline?:boolean}) { return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-gray-900">{label}</span>{multiline ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#b7f23a]" /> : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#b7f23a]" />}</label> }
export function Card({children}:{children:React.ReactNode}) { return <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">{children}</section> }
