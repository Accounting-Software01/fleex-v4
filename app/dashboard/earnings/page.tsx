'use client'

import { ArrowDownToLine, ArrowLeft, BarChart3, CheckCircle2, Clock3, CreditCard, Info, WalletCards } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EarningsPage() {
  const router = useRouter()

  return (
    <main className="min-h-[100dvh] bg-[#f7f8f5] text-[#14181c]">
      <header className="sticky top-0 z-20 border-b border-[#dfe3dc] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-[#687074] transition hover:text-[#14181c]"><ArrowLeft className="h-4 w-4" /> Back</button>
          <div className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-[#779f00]" /><h1 className="text-sm font-bold tracking-tight">Earnings</h1></div>
          <button type="button" className="text-xs font-bold text-[#687074] transition hover:text-[#14181c]">Help</button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 pb-20 pt-7 sm:px-8">
        <section className="border border-[#dfe3dc] bg-[#14181c] px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b7f23a]">Creator earnings</p><h2 className="mt-3 text-3xl font-black tracking-[-0.07em] sm:text-4xl">Build value. Get rewarded.</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">Track what you earn from your work on Fleex and manage your payouts in one place.</p></div>
            <div className="flex h-12 w-12 items-center justify-center bg-[#b7f23a] text-[#14181c]"><BarChart3 className="h-5 w-5" /></div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {[{ label: 'Available balance', value: '—', detail: 'Ready to withdraw' }, { label: 'Pending', value: '—', detail: 'Processing earnings' }, { label: 'Lifetime earnings', value: '—', detail: 'All-time total' }].map((card) => <div key={card.label} className="border border-[#dfe3dc] bg-white px-4 py-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8a9092]">{card.label}</p><p className="mt-3 text-2xl font-black tracking-[-0.06em] text-[#14181c]">{card.value}</p><p className="mt-1 text-xs text-[#8a9092]">{card.detail}</p></div>)}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <section className="border border-[#dfe3dc] bg-white"><div className="flex items-center justify-between border-b border-[#e9ece6] px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#779f00]">Activity</p><h3 className="mt-1 text-base font-bold">Recent earnings</h3></div><Clock3 className="h-4 w-4 text-[#8a9092]" /></div><div className="px-5 py-12 text-center"><div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center bg-[#eef0ec] text-[#8a9092]"><BarChart3 className="h-5 w-5" /></div><h4 className="text-sm font-bold">No earnings yet</h4><p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[#8a9092]">When you start earning from eligible creator activity, your transactions will appear here.</p></div></section>

          <div className="space-y-4"><section className="border border-[#dfe3dc] bg-white p-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#f6faec] text-[#779f00]"><CreditCard className="h-4 w-4" /></div><div><h3 className="text-sm font-bold">Payout method</h3><p className="mt-1 text-xs leading-relaxed text-[#8a9092]">Connect a payout method when your account becomes eligible.</p></div></div><button type="button" disabled className="mt-4 flex w-full items-center justify-center gap-2 border border-[#dfe3dc] py-2.5 text-xs font-bold text-[#8a9092] disabled:cursor-not-allowed">Add payout method</button></section><section className="border border-[#dfe3dc] bg-white p-5"><div className="flex items-start gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#779f00]" /><p className="text-xs leading-relaxed text-[#687074]">Earnings features are being prepared for Fleex creators. Eligibility, rates, and payout timing will be shown here when available.</p></div></section></div>
        </div>

        <section className="mt-6 border border-[#dfe3dc] bg-white px-5 py-4"><div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-[#779f00]" /><p className="text-xs font-semibold text-[#687074]">Your creator activity is being tracked. Keep publishing work that helps people discover something new.</p><ArrowDownToLine className="ml-auto h-4 w-4 text-[#c0c5c0]" /></div></section>
      </div>
    </main>
  )
}
