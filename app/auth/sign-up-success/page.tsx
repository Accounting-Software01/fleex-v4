'use client'

import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

const COLLAGE_IMAGES = ['/collage-2.jpg', '/collage-5.jpg', '/collage-8.jpg']

export default function SignUpSuccess() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
      `}</style>

      <div className="ff-root">
        <div className="ff-faded-collage">
          {COLLAGE_IMAGES.map((src, i) => (
            <img key={src} src={src} alt="" className={`ff-faded-card ff-faded-card--${i + 1}`} />
          ))}
        </div>

        <div className="ff-container">
          <div className="ff-icon-badge">
            <CheckCircle2 size={40} />
          </div>

          <h1 className="ff-heading">You&apos;re in.</h1>
          <p className="ff-subtext">
            We&apos;ve sent a verification email — confirm it whenever you get a chance.
          </p>

          <div className="ff-card">
            <p className="ff-card-title">Next steps</p>
            <ol className="ff-steps">
              <li><span className="ff-step-num">1</span> Verify your email address</li>
              <li><span className="ff-step-num">2</span> Complete your onboarding</li>
              <li><span className="ff-step-num">3</span> Create your first forge</li>
            </ol>
          </div>

          <Link href="/onboarding" className="ff-btn-primary">
            Continue to onboarding
            <ArrowRight size={18} />
          </Link>

          <p className="ff-footer">
            Already verified?{' '}
            <Link href="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .ff-root {
          position: relative;
          min-height: 100dvh;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Nunito', sans-serif;
          padding: 32px 24px;
          overflow: hidden;
        }

        /* ── Faint background collage ── */
        .ff-faded-collage {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .ff-faded-card {
          position: absolute;
          border-radius: 18px;
          object-fit: cover;
          opacity: 0.08;
          filter: grayscale(60%);
        }

        .ff-faded-card--1 {
          top: -40px;
          left: -30px;
          width: 220px;
          height: 260px;
          transform: rotate(-10deg);
        }

        .ff-faded-card--2 {
          top: 10%;
          right: -50px;
          width: 200px;
          height: 240px;
          transform: rotate(12deg);
        }

        .ff-faded-card--3 {
          bottom: -50px;
          left: 20%;
          width: 240px;
          height: 220px;
          transform: rotate(-6deg);
        }

        /* ── Content ── */
        .ff-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .ff-icon-badge {
          width: 64px;
          height: 64px;
          border-radius: 9999px;
          background: #111111;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .ff-heading {
          font-size: 30px;
          font-weight: 900;
          color: #111111;
          letter-spacing: -0.6px;
          margin-bottom: 10px;
        }

        .ff-subtext {
          font-size: 14.5px;
          font-weight: 600;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 28px;
          max-width: 320px;
        }

        .ff-card {
          width: 100%;
          background: #f9fafb;
          border-radius: 16px;
          padding: 20px 22px;
          text-align: left;
          margin-bottom: 24px;
        }

        .ff-card-title {
          font-size: 13px;
          font-weight: 800;
          color: #111111;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 14px;
        }

        .ff-steps {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ff-steps li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14.5px;
          font-weight: 700;
          color: #111111;
        }

        .ff-step-num {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #ff5a1f;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ff-btn-primary {
          width: 100%;
          padding: 15px 0;
          background: #111111;
          color: #ffffff;
          font-size: 16px;
          font-weight: 800;
          font-family: 'Nunito', sans-serif;
          border: none;
          border-radius: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          margin-bottom: 20px;
        }

        .ff-btn-primary:active { transform: scale(0.97); }

        .ff-footer {
          font-size: 13.5px;
          font-weight: 600;
          color: #6b7280;
        }

        .ff-footer a {
          color: #111111;
          font-weight: 800;
          text-decoration: none;
        }
      `}</style>
    </>
  )
}
