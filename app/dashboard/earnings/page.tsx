'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, Check, CheckCircle2, Clock3, CreditCard, Info, Loader2, RefreshCw, WalletCards } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type EarningsStats = {
  followers_count: number
  allies_count: number
  videos_count: number
  likes_count: number
  eligible: boolean
  earnings_active: boolean
  activated_at: string | null
  balance_usd: number
  rate_per_like_usd: number
  withdrawal_minimum_usd: number
}

const emptyStats: EarningsStats = {
  followers_count: 0,
  allies_count: 0,
  videos_count: 0,
  likes_count: 0,
  eligible: false,
  earnings_active: false,
  activated_at: null,
  balance_usd: 0,
  rate_per_like_usd: 0.0001,
  withdrawal_minimum_usd: 100,
}

export default function EarningsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [stats, setStats] = useState<EarningsStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/auth/login')
      return
    }

    const { data, error: statsError } = await supabase.rpc('get_creator_earnings_stats')
    if (statsError) {
      console.error('[Earnings] Could not load stats:', statsError)
      setError('Earnings is not connected yet. Run the creator earnings SQL migration first.')
    } else if (data) {
      setStats({ ...emptyStats, ...data, balance_usd: Number(data.balance_usd) || 0 })
    }
    setLoading(false)
  }, [router, supabase])

  useEffect(() => { loadStats() }, [loadStats])

  const activateEarnings = async () => {
    setWorking(true)
    setError('')
    setNotice('')
    const { data, error: activationError } = await supabase.rpc('activate_creator_earnings')
    if (activationError) {
      setError(activationError.message.includes('not eligible') ? 'You have not reached every eligibility requirement yet.' : activationError.message)
    } else {
      setStats({ ...emptyStats, ...data, balance_usd: Number(data?.balance_usd) || 0 })
      setNotice('Earnings setup is now active. New eligible likes will be recorded automatically.')
    }
    setWorking(false)
  }

  const requirements = [
    { label: 'Followers', value: stats.followers_count, target: 50 },
    { label: 'Allies', value: stats.allies_count, target: 50 },
    { label: 'Fleex videos uploaded', value: stats.videos_count, target: 50 },
    { label: 'Likes received', value: stats.likes_count, target: 100 },
  ]
  const progress = (value: number, target: number) => Math.min(100, Math.round((value / target) * 100))
  const money = (value: number) => `$${value.toFixed(4)}`
  const canWithdraw = stats.earnings_active && stats.balance_usd >= stats.withdrawal_minimum_usd

  return (
    <main className="min-h-[100dvh] bg-[#f7f8f5] text-[#14181c]">
      <header className="sticky top-0 z-20 border-b border-[#dfe3dc] bg-white/95 backdrop-blur-xl"><div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8"><button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-[#687074] hover:text-[#14181c]"><ArrowLeft className="h-4 w-4" /> Back</button><div className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-[#779f00]" /><h1 className="text-sm font-bold">Earnings</h1></div><button type="button" onClick={loadStats} disabled={loading} aria-label="Refresh earnings" className="p-1 text-[#687074] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div></header>

      <div className="mx-auto max-w-4xl px-5 pb-20 pt-7 sm:px-8"><section className="border border-[#dfe3dc] bg-[#14181c] px-5 py-6 text-white sm:px-7"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b7f23a]">Creator earnings</p><h2 className="mt-3 text-3xl font-black tracking-[-0.07em] sm:text-4xl">Build value. Get rewarded.</h2><p className="mt-2 max-w-lg text-sm leading-relaxed text-white/60">Reach the creator milestones, activate earnings, and earn {money(stats.rate_per_like_usd)} for every eligible like received on your content.</p></div><div className="flex h-12 w-12 items-center justify-center bg-[#b7f23a] text-[#14181c]"><BarChart3 className="h-5 w-5" /></div></div></section>

        {error && <div className="mt-4 flex items-start justify-between gap-3 border-l-4 border-[#b33b3b] bg-[#fff7f7] px-4 py-3 text-xs font-semibold text-[#8c2e2e]"><span>{error}</span><button type="button" onClick={loadStats} className="shrink-0 underline">Retry</button></div>}
        {notice && <div className="mt-4 flex items-center gap-2 border-l-4 border-[#b7f23a] bg-[#f6faec] px-4 py-3 text-xs font-semibold text-[#557500]"><Check className="h-4 w-4" />{notice}</div>}

        <section className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Available balance" value={`$${stats.balance_usd.toFixed(4)}`} detail={canWithdraw ? 'Withdrawal available' : `Withdraw at $${stats.withdrawal_minimum_usd}`} /><Metric label="Earning rate" value={money(stats.rate_per_like_usd)} detail="Per eligible like" /><Metric label="Status" value={stats.earnings_active ? 'Active' : 'Locked'} detail={stats.earnings_active ? 'Earnings are recording' : 'Complete milestones first'} /></section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]"><section className="border border-[#dfe3dc] bg-white"><div className="flex items-center justify-between border-b border-[#e9ece6] px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#779f00]">Eligibility</p><h3 className="mt-1 text-base font-bold">Creator milestones</h3></div><span className={`text-xs font-bold ${stats.eligible ? 'text-[#557500]' : 'text-[#8a9092]'}`}>{stats.eligible ? 'Complete' : 'In progress'}</span></div><div className="space-y-5 px-5 py-5">{requirements.map((requirement) => <div key={requirement.label}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold">{requirement.label}</span><span className="text-[#687074]"><strong className="text-[#14181c]">{Math.min(requirement.value, requirement.target)}</strong> / {requirement.target}</span></div><div className="h-2 bg-[#edf0eb]"><div className="h-full bg-[#b7f23a] transition-all" style={{ width: `${progress(requirement.value, requirement.target)}%` }} /></div></div>)}</div></section>

          <div className="space-y-4"><section className="border border-[#dfe3dc] bg-white p-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#f6faec] text-[#779f00]"><CreditCard className="h-4 w-4" /></div><div><h3 className="text-sm font-bold">Earnings setup</h3><p className="mt-1 text-xs leading-relaxed text-[#8a9092]">{stats.earnings_active ? 'Your earnings account is active.' : stats.eligible ? 'You meet the requirements. Activate earnings to begin recording new likes.' : 'Complete every milestone to unlock earnings setup.'}</p></div></div><button type="button" onClick={activateEarnings} disabled={!stats.eligible || stats.earnings_active || working} className="mt-4 flex h-10 w-full items-center justify-center gap-2 bg-[#14181c] text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-[#e7ebe4] disabled:text-[#8a9092]">{working ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.earnings_active ? <><Check className="h-4 w-4" />Earnings active</> : 'Set up earnings'}</button></section><section className="border border-[#dfe3dc] bg-white p-5"><div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#779f00]" /><div><h3 className="text-sm font-bold">Withdrawal threshold</h3><p className="mt-1 text-xs leading-relaxed text-[#8a9092]">Withdrawals unlock when your balance reaches <strong className="text-[#14181c]">$100</strong>. Current balance: <strong className="text-[#14181c]">${stats.balance_usd.toFixed(4)}</strong>.</p></div></div><button type="button" disabled={!canWithdraw} className="mt-4 flex h-10 w-full items-center justify-center border border-[#dfe3dc] text-xs font-bold text-[#8a9092] disabled:cursor-not-allowed">{canWithdraw ? 'Request withdrawal' : 'Withdrawal locked'}</button></section></div></div>

        <section className="mt-6 border border-[#dfe3dc] bg-white px-5 py-4"><div className="flex items-start gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#779f00]" /><p className="text-xs leading-relaxed text-[#687074]">Eligibility can continue growing after activation. Likes from your Fleex videos and feed posts are recorded at {money(stats.rate_per_like_usd)} each after earnings setup is activated. Likes before activation are not paid retroactively.</p></div></section>
      </div>
    </main>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="border border-[#dfe3dc] bg-white px-4 py-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8a9092]">{label}</p><p className="mt-3 text-2xl font-black tracking-[-0.06em] text-[#14181c]">{value}</p><p className="mt-1 text-xs text-[#8a9092]">{detail}</p></div> }
