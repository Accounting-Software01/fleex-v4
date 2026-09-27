'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const COLLAGE_IMAGES = ['/collage-1.jpg', '/collage-4.jpg', '/collage-7.jpg']

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      // New user goes to signup success page
      router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const EyeOpen = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  const EyeOff = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ff-root {
          position: relative;
          min-height: 100dvh; background: #ffffff; display: flex;
          align-items: flex-start; justify-content: center;
          font-family: 'Nunito', sans-serif; padding: 40px 24px 32px;
          overflow: hidden;
        }
        .ff-faded-collage { position: absolute; inset: 0; pointer-events: none; }
        .ff-faded-card {
          position: absolute; border-radius: 18px; object-fit: cover;
          opacity: 0.07; filter: grayscale(60%);
        }
        .ff-faded-card--1 { top: -40px; left: -30px; width: 220px; height: 260px; transform: rotate(-10deg); }
        .ff-faded-card--2 { top: 8%; right: -50px; width: 200px; height: 240px; transform: rotate(12deg); }
        .ff-faded-card--3 { bottom: -50px; left: 22%; width: 240px; height: 220px; transform: rotate(-6deg); }

        .ff-container { position: relative; z-index: 1; width: 100%; max-width: 400px; display: flex; flex-direction: column; align-items: center; }
        .ff-logo-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 24px; }
        .ff-icon { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
        .ff-icon img { width: 60px; height: 60px; object-fit: contain; }
        .ff-tagline { font-size: 13.5px; color: #9ca3af; font-weight: 500; }
        .ff-welcome { text-align: center; margin-bottom: 26px; }
        .ff-welcome-title { font-size: 22px; font-weight: 900; color: #111111; letter-spacing: -0.3px; }
        .ff-welcome-sub { font-size: 13.5px; color: #9ca3af; font-weight: 500; margin-top: 4px; }
        .ff-form { width: 100%; display: flex; flex-direction: column; gap: 16px; }
        .ff-field { display: flex; flex-direction: column; gap: 6px; width: 100%; }
        .ff-label { font-size: 13px; font-weight: 700; color: #374151; }
        .ff-input-wrap { position: relative; width: 100%; }
        .ff-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #c4c9d4; display: flex; align-items: center; }
        .ff-input {
          width: 100%; height: 52px; border: 1.5px solid #e5e7eb; border-radius: 14px;
          background: #f9fafb; padding: 0 44px 0 42px; font-size: 14px;
          font-family: 'Nunito', sans-serif; font-weight: 500; color: #111111; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .ff-input::placeholder { color: #b5bbc6; }
        .ff-input:focus { border-color: #111111; background: #ffffff; box-shadow: 0 0 0 3px rgba(17,17,17,0.08); }
        .ff-eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #b5bbc6; display: flex; align-items: center; padding: 4px; transition: color 0.15s; }
        .ff-eye-btn:hover { color: #111111; }
        .ff-error { font-size: 12.5px; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-weight: 600; }
        .ff-btn-submit {
          width: 100%; height: 52px; background: #111111; color: #ffffff; font-size: 15px;
          font-weight: 800; font-family: 'Nunito', sans-serif; border: none; border-radius: 40px;
          cursor: pointer; letter-spacing: 0.3px; margin-top: 4px;
          transition: background 0.2s, transform 0.1s;
        }
        .ff-btn-submit:hover:not(:disabled) { background: #000000; }
        .ff-btn-submit:active:not(:disabled) { transform: scale(0.98); }
        .ff-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .ff-footer { font-size: 13.5px; color: #9ca3af; font-weight: 600; margin-top: 20px; text-align: center; }
        .ff-footer a { color: #111111; text-decoration: none; font-weight: 800; transition: opacity 0.15s; }
        .ff-footer a:hover { opacity: 0.75; }
      `}</style>

      <div className="ff-root">
        <div className="ff-faded-collage">
          {COLLAGE_IMAGES.map((src, i) => (
            <img key={src} src={src} alt="" className={`ff-faded-card ff-faded-card--${i + 1}`} />
          ))}
        </div>

        <div className="ff-container">

          <div className="ff-logo-wrap">
            <div className="ff-icon">
              <img src="/fleex-icon.png" alt="Fleex" />
            </div>
            <p className="ff-tagline">build your identity, shape your world.</p>
          </div>

          <div className="ff-welcome">
            <h1 className="ff-welcome-title">create account</h1>
            <p className="ff-welcome-sub">join Fleex and start building</p>
          </div>

          <form className="ff-form" onSubmit={handleSignUp}>

            <div className="ff-field">
              <label className="ff-label" htmlFor="email">email</label>
              <div className="ff-input-wrap">
                <span className="ff-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  id="email" className="ff-input" type="email"
                  placeholder="name@example.com" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="ff-field">
              <label className="ff-label" htmlFor="password">password</label>
              <div className="ff-input-wrap">
                <span className="ff-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="password" className="ff-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="create a password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="ff-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <div className="ff-field">
              <label className="ff-label" htmlFor="repeat-password">confirm password</label>
              <div className="ff-input-wrap">
                <span className="ff-input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="repeat-password" className="ff-input"
                  type={showRepeat ? 'text' : 'password'}
                  placeholder="repeat your password" required
                  value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)}
                />
                <button type="button" className="ff-eye-btn" onClick={() => setShowRepeat(!showRepeat)}>
                  {showRepeat ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {error && <div className="ff-error">{error}</div>}

            <button type="submit" className="ff-btn-submit" disabled={isLoading}>
              {isLoading ? 'creating account...' : 'create account'}
            </button>

          </form>

          <p className="ff-footer">
            already have an account?{' '}
            <Link href="/auth/login">sign in</Link>
          </p>

        </div>
      </div>
    </>
  )
}
