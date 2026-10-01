'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Flame, Sparkles, Users, Zap } from 'lucide-react'

const slides = [
  {
    eyebrow: 'A new kind of social space',
    title: 'Welcome to Fleex.',
    description: 'A place to express what moves you, discover what matters, and build a digital identity that feels like yours.',
    icon: Flame,
    accent: 'bg-[#b7f23a]',
    glow: 'bg-[#b7f23a]/20',
  },
  {
    eyebrow: 'Make something worth watching',
    title: 'Turn ideas into Forges.',
    description: 'Create, publish, and shape interactive experiences that show the world what you can do.',
    icon: Zap,
    accent: 'bg-[#d8ff72]',
    glow: 'bg-[#8dc400]/20',
  },
  {
    eyebrow: 'Find your people',
    title: 'Build your circle.',
    description: 'Follow creators, discover new perspectives, and grow alongside the people who inspire you.',
    icon: Users,
    accent: 'bg-[#b7f23a]',
    glow: 'bg-[#b7f23a]/20',
  },
]

const interests = [
  'Technology', 'Art & Design', 'Music', 'Gaming', 'Fitness', 'Food',
  'Travel', 'Fashion', 'Education', 'Business', 'Comedy', 'Sports',
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [step, setStep] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.replace('/auth/login')
        return
      }
      const { data: profile } = await supabase.from('profiles').select('onboarding_completed, interests').eq('id', authUser.id).single()
      if (profile?.onboarding_completed) {
        router.replace('/dashboard')
        return
      }
      setUser(authUser)
      if (Array.isArray(profile?.interests)) setSelectedInterests(profile.interests)
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  const goToStep = (nextStep: number) => {
    setDirection(nextStep >= step ? 'forward' : 'back')
    setStep(nextStep)
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) => current.includes(interest)
      ? current.filter((item) => item !== interest)
      : current.length < 6 ? [...current, interest] : current)
  }

  const handleComplete = async () => {
    if (!user || !selectedInterests.length || saving) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ onboarding_completed: true, interests: selectedInterests }).eq('id', user.id)
    if (error) {
      console.error('Onboarding error:', error)
      setSaving(false)
      return
    }
    router.replace('/dashboard')
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#dfe3dc] border-t-[#14181c]" /></div>
  }

  const isInterestStep = step === slides.length
  const currentSlide = slides[Math.min(step, slides.length - 1)]
  const CurrentIcon = currentSlide.icon
  const progress = isInterestStep ? 100 : ((step + 1) / (slides.length + 1)) * 100

  return (
    <main className="relative flex min-h-[100dvh] overflow-hidden bg-[#f7f8f5] text-[#14181c]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#b7f23a]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#dfeeb5]/60 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <header className="flex items-center justify-between">
          <button type="button" onClick={() => step > 0 && goToStep(step - 1)} className={`inline-flex items-center gap-2 text-sm font-bold transition ${step > 0 ? 'text-[#14181c] hover:opacity-60' : 'pointer-events-none opacity-0'}`}><ChevronLeft className="h-4 w-4" /> Back</button>
          <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14181c] text-[#b7f23a] shadow-lg"><Sparkles className="h-4 w-4" /></div><span className="text-lg font-black tracking-[-0.06em]">fleex<span className="text-[#8dbb00]">.</span></span></div>
          <button type="button" onClick={() => router.replace('/dashboard')} className="text-xs font-bold text-[#7d8387] transition hover:text-[#14181c]">Skip</button>
        </header>

        <div className="mx-auto mt-8 w-full max-w-xl">
          <div className="mb-3 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8a9092]"><span>{isInterestStep ? 'Personalise your feed' : `Step ${step + 1} of ${slides.length + 1}`}</span><span className="text-[#779f00]">{Math.round(progress)}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e1e4de]"><div className="h-full rounded-full bg-[#14181c] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        </div>

        <section key={step} className={`mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10 ${direction === 'forward' ? 'animate-onboard-forward' : 'animate-onboard-back'}`}>
          {!isInterestStep ? (
            <div className="text-center">
              <div className="relative mx-auto mb-9 flex h-36 w-36 items-center justify-center rounded-[38px] bg-[#14181c] shadow-[0_24px_55px_rgba(20,24,28,0.18)] sm:h-44 sm:w-44">
                <div className={`absolute inset-4 rounded-[28px] ${currentSlide.glow} blur-xl`} />
                <div className={`relative flex h-20 w-20 items-center justify-center rounded-3xl ${currentSlide.accent} rotate-[-6deg] transition-transform duration-500`}><CurrentIcon className="h-10 w-10 text-[#14181c]" strokeWidth={2.2} /></div>
                <span className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#f7f8f5] bg-white text-xs font-black">{step + 1}</span>
              </div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#779f00]">{currentSlide.eyebrow}</p>
              <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.07em] sm:text-6xl">{currentSlide.title}</h1>
              <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-[#687074] sm:text-lg">{currentSlide.description}</p>
              <div className="mx-auto mt-8 flex items-center justify-center gap-2">{slides.map((_, index) => <button key={index} type="button" aria-label={`Go to step ${index + 1}`} onClick={() => goToStep(index)} className={`h-2 rounded-full transition-all ${index === step ? 'w-8 bg-[#14181c]' : 'w-2 bg-[#cbd0ca]'}`} />)}</div>
            </div>
          ) : (
            <div>
              <div className="mb-8 text-center"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#14181c] text-[#b7f23a]"><Sparkles className="h-6 w-6" /></div><p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#779f00]">One last touch</p><h1 className="text-4xl font-black leading-none tracking-[-0.07em] sm:text-5xl">What pulls you in?</h1><p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[#687074]">Choose up to six interests. We’ll use them to make Fleex feel more like yours.</p></div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">{interests.map((interest) => { const selected = selectedInterests.includes(interest); return <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left text-sm font-bold transition-all active:scale-[0.98] ${selected ? 'border-[#14181c] bg-[#14181c] text-white shadow-lg' : 'border-[#e0e4dc] bg-white text-[#535a5e] hover:-translate-y-0.5 hover:border-[#b7f23a]'}`}><span>{interest}</span>{selected && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#b7f23a] text-[#14181c]"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>}</button> })}</div><div className="mt-5 flex items-center justify-between text-xs font-bold text-[#8a9092]"><span>{selectedInterests.length} of 6 selected</span>{selectedInterests.length === 6 && <span className="text-[#779f00]">Great mix.</span>}</div>
            </div>
          )}
        </section>

        <footer className="mx-auto w-full max-w-xl pb-2">
          {!isInterestStep ? <button type="button" onClick={() => goToStep(step < slides.length - 1 ? step + 1 : slides.length)} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#14181c] py-4 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(20,24,28,0.16)] transition hover:bg-[#b7f23a] hover:text-[#14181c] active:scale-[0.99]">{step === slides.length - 1 ? 'Choose my interests' : 'Continue'}<ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={handleComplete} disabled={!selectedInterests.length || saving} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#b7f23a] py-4 text-sm font-extrabold text-[#14181c] shadow-[0_12px_24px_rgba(141,196,0,0.2)] transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Setting up your Fleex...' : 'Enter Fleex'}<ArrowRight className="h-4 w-4" /></button>}
        </footer>
      </div>

      <style jsx global>{`@keyframes onboard-forward{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}@keyframes onboard-back{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}.animate-onboard-forward{animation:onboard-forward .36s ease-out}.animate-onboard-back{animation:onboard-back .36s ease-out}`}</style>
    </main>
  )
}
